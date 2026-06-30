import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { appUrl, isStripeConfigured } from "@/lib/billing/customer";
import { getPublicTenant, getPublicVehicle } from "@/lib/data/public-data";
import { agreementTemplateToContent, defaultAgreementTemplate } from "@/lib/agreements/default-template";
import { getInsuranceSettings, persistInsuranceSelection } from "@/lib/insurance/data";
import { depositForSelection } from "@/lib/insurance/config";
import { getProvider, isProviderKey } from "@/lib/insurance/providers";
import { sendEmail } from "@/lib/email/send";
import { insurancePurchasedEmail, insuranceUploadedEmail } from "@/lib/email/templates";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const ownInsuranceSchema = z.object({
  insuranceCompany: z.string().min(1),
  policyNumber: z.string().min(1),
  policyHolderName: z.string().min(1),
  expirationDate: z.string().optional().default(""),
  additionalNotes: z.string().optional().default(""),
  // *Name fields carry the uploaded Storage path; *Label the original filename.
  cardFrontName: z.string().optional().default(""),
  cardFrontLabel: z.string().optional().default(""),
  cardBackName: z.string().optional().default(""),
  cardBackLabel: z.string().optional().default(""),
  declarationName: z.string().optional().default(""),
  declarationLabel: z.string().optional().default("")
});

const insuranceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("third_party"), providerKey: z.string().min(1), planId: z.string().min(1) }),
  z.object({ type: z.literal("own"), ownInsurance: ownInsuranceSchema }),
  z.object({ type: z.literal("declined") })
]);

const bookingSchema = z.object({
  slug: z.string().min(1),
  vehicleId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7),
  dob: z.string().min(8),
  licenseNumber: z.string().min(4),
  licenseState: z.string().min(2),
  amountCents: z.number().int().positive(),
  depositCents: z.number().int().nonnegative(),
  insurance: insuranceSchema.optional(),
  insuranceCostCents: z.number().int().nonnegative().optional(),
  agreement: z.object({
    agreed: z.literal(true),
    legalName: z.string().min(2),
    signatureMethod: z.enum(["typed", "drawn"]),
    signatureData: z.string().min(2),
    initialsData: z.string().optional(),
    device: z.string().optional(),
    browser: z.string().optional(),
    location: z.string().optional(),
    scrolledToBottom: z.literal(true)
  })
});

/** Build document metadata from the uploaded own-insurance files (Storage paths). */
function ownInsuranceDocs(own: {
  cardFrontName?: string;
  cardFrontLabel?: string;
  cardBackName?: string;
  cardBackLabel?: string;
  declarationName?: string;
  declarationLabel?: string;
}) {
  const docs: { kind: "CARD_FRONT" | "CARD_BACK" | "DECLARATION_PAGE"; storagePath: string; fileName: string }[] = [];
  if (own.cardFrontName) docs.push({ kind: "CARD_FRONT", storagePath: own.cardFrontName, fileName: own.cardFrontLabel || "insurance-card-front" });
  if (own.cardBackName) docs.push({ kind: "CARD_BACK", storagePath: own.cardBackName, fileName: own.cardBackLabel || "insurance-card-back" });
  if (own.declarationName) docs.push({ kind: "DECLARATION_PAGE", storagePath: own.declarationName, fileName: own.declarationLabel || "declaration-page" });
  return docs;
}

async function getActiveAgreementTemplate(organizationId: string, businessName: string) {
  const existing = await prisma.agreementTemplate.findFirst({
    where: { organizationId },
    orderBy: { activeVersion: "desc" }
  });
  if (existing) return existing;

  const data = defaultAgreementTemplate(businessName);
  const template = await prisma.agreementTemplate.create({
    data: { organizationId, ...data }
  });
  await prisma.agreementVersion.create({
    data: {
      organizationId,
      templateId: template.id,
      version: template.activeVersion,
      content: agreementTemplateToContent(data)
    }
  });
  return template;
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers) || "unknown";
  const limit = await rateLimit(`checkout:${ip}`, { limit: 5, windowSec: 60 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limit.resetSeconds) } }
    );
  }

  const parsed = bookingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your booking details." }, { status: 400 });
  }
  const input = parsed.data;

  const [tenant, vehicle] = await Promise.all([
    getPublicTenant(input.slug),
    getPublicVehicle(input.slug, input.vehicleId)
  ]);
  if (!tenant || !vehicle) {
    return NextResponse.json({ error: "Vehicle is no longer available." }, { status: 404 });
  }

  // Server-side age verification — must be 21+.
  const dobDate = new Date(`${input.dob}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) age--;
  if (age < 21) {
    return NextResponse.json({ error: "You must be at least 21 years of age to rent a vehicle." }, { status: 400 });
  }

  // Server-authoritative price calculation — never trust client-supplied amounts.
  const startsAt = new Date(`${input.startDate}T10:00:00`);
  const endsAt = new Date(`${input.endDate}T10:00:00`);
  const rentalDays = Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 86_400_000));
  const serverSubtotalCents = Math.round(rentalDays * vehicle.dailyRate * 100);
  const taxRate = (tenant.taxRatePct ?? 8) / 100;
  const serverTaxCents = Math.round(serverSubtotalCents * taxRate);

  // Insurance selection drives the security deposit (server is authoritative — never trust the client).
  const insurance = input.insurance ?? { type: "none" as const };
  const insuranceSettings = await getInsuranceSettings(tenant.id);
  if (insuranceSettings.requireInsurance && (insurance.type === "none" || insurance.type === "declined")) {
    return NextResponse.json({ error: "Insurance is required for this rental." }, { status: 400 });
  }
  if (insurance.type === "third_party" && !isProviderKey(insurance.providerKey)) {
    return NextResponse.json({ error: "Unknown insurance provider." }, { status: 400 });
  }
  const depositSelection =
    insurance.type === "third_party" ? "third_party" : insurance.type === "own" ? "own" : insurance.type === "declined" ? "declined" : null;
  const configuredDepositCents = depositSelection
    ? depositForSelection(insuranceSettings, depositSelection)
    : Math.round(tenant.depositFee * 100);

  // Compute server-authoritative insurance cost for third-party quotes.
  let serverInsuranceCents = 0;
  if (insurance.type === "third_party" && isProviderKey(insurance.providerKey)) {
    const quote = getProvider(insurance.providerKey)?.quote({
      days: rentalDays,
      dailyRateCents: serverSubtotalCents / rentalDays
    })[0];
    serverInsuranceCents = quote ? quote.dailyPriceCents * rentalDays : 0;
  }
  const platformFeeRate = (tenant.platformFeePct ?? 10) / 100;
  const serverPlatformFeeCents = Math.round(serverSubtotalCents * platformFeeRate);
  const serverTotalCents = serverSubtotalCents + serverTaxCents + serverPlatformFeeCents + serverInsuranceCents;

  // Persist a reservation when a database is configured.
  let reservationId = `pending_${Date.now()}`;
  let agreementId = "";
  if (isDatabaseConfigured()) {
    const org = await prisma.organization.findUnique({ where: { slug: input.slug }, select: { id: true, name: true } });
    if (!org) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    const [overlappingReservation, availabilityBlock] = await Promise.all([
      prisma.reservation.findFirst({
        where: {
          organizationId: org.id,
          vehicleId: input.vehicleId,
          status: { in: ["QUOTE", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "LATE"] },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt }
        }
      }),
      prisma.vehicleAvailabilityBlock.findFirst({
        where: {
          organizationId: org.id,
          vehicleId: input.vehicleId,
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt }
        }
      })
    ]);

    if (overlappingReservation || availabilityBlock) {
      return NextResponse.json({ error: "This vehicle is not available for the selected dates." }, { status: 409 });
    }

    const customer = await prisma.customer.upsert({
      where: { organizationId_email: { organizationId: org.id, email: input.customerEmail } },
      update: { name: input.customerName, phone: input.customerPhone },
      create: {
        organizationId: org.id,
        name: input.customerName,
        email: input.customerEmail,
        phone: input.customerPhone
      }
    });

    // Persist driver verification info.
    await prisma.driver.create({
      data: {
        organizationId: org.id,
        customerId: customer.id,
        fullName: input.customerName,
        licenseNumber: input.licenseNumber,
        licenseState: input.licenseState,
        verified: false
      }
    });

    const reservation = await prisma.reservation.create({
      data: {
        organizationId: org.id,
        customerId: customer.id,
        vehicleId: input.vehicleId,
        startsAt,
        endsAt,
        status: "QUOTE",
        totalCents: serverTotalCents,
        depositCents: configuredDepositCents
      }
    });
    reservationId = reservation.id;

    // Persist the insurance choice (purchase / own-policy upload / declined) for this reservation.
    let insuranceRevenueCents = 0;
    if (insurance.type !== "none") {
      const insuranceResult = await persistInsuranceSelection({
        organizationId: org.id,
        reservationId: reservation.id,
        customerId: customer.id,
        days: rentalDays,
        settings: insuranceSettings,
        selection:
          insurance.type === "third_party" && isProviderKey(insurance.providerKey)
            ? {
                type: "third_party",
                providerKey: insurance.providerKey,
                planId: insurance.planId,
                customerName: customer.name,
                customerEmail: customer.email
              }
            : insurance.type === "own"
              ? {
                  type: "own",
                  ownInsurance: {
                    insuranceCompany: insurance.ownInsurance.insuranceCompany,
                    policyNumber: insurance.ownInsurance.policyNumber,
                    policyHolderName: insurance.ownInsurance.policyHolderName,
                    expirationDate: insurance.ownInsurance.expirationDate || null,
                    additionalNotes: insurance.ownInsurance.additionalNotes || null
                  },
                  documents: ownInsuranceDocs(insurance.ownInsurance)
                }
              : { type: "declined" }
      });
      insuranceRevenueCents = insuranceResult.coverageCostCents;

      // Notify the customer (fire-and-forget — never blocks checkout).
      if (insurance.type === "third_party" && isProviderKey(insurance.providerKey)) {
        const quote = getProvider(insurance.providerKey)?.quote({
          days: rentalDays,
          dailyRateCents: Math.round(vehicle.dailyRate * 100)
        })[0];
        if (quote) {
          void sendEmail({
            to: input.customerEmail,
            ...insurancePurchasedEmail({
              customerName: input.customerName,
              organizationName: tenant.name,
              providerName: quote.providerName,
              planName: quote.planName,
              coverageSummary: quote.coverageSummary,
              totalCents: insuranceResult.coverageCostCents,
              policyNumber: insuranceResult.policyNumber,
              vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              brandColor: tenant.brandColor
            })
          });
        }
      } else if (insurance.type === "own") {
        void sendEmail({
          to: input.customerEmail,
          ...insuranceUploadedEmail({
            customerName: input.customerName,
            organizationName: tenant.name,
            insuranceCompany: insurance.ownInsurance.insuranceCompany,
            manualApproval: insuranceSettings.manualApproval,
            brandColor: tenant.brandColor
          })
        });
      }
    }

    const template = await getActiveAgreementTemplate(org.id, org.name);
    const ipAddress = ip;
    const userAgent = request.headers.get("user-agent") ?? "";
    const signatureHash = crypto
      .createHash("sha256")
      .update(`${reservation.id}:${input.agreement.legalName}:${input.agreement.signatureData}:${Date.now()}`)
      .digest("hex");

    const agreement = await prisma.rentalAgreement.create({
      data: {
        organizationId: org.id,
        reservationId: reservation.id,
        customerId: customer.id,
        templateId: template.id,
        version: template.activeVersion,
        status: "signed",
        legalName: input.agreement.legalName,
        signatureMethod: input.agreement.signatureMethod,
        signatureData: input.agreement.signatureData,
        initialsData: input.agreement.initialsData || null,
        agreedAt: new Date(),
        ipAddress,
        userAgent,
        device: input.agreement.device || input.agreement.browser || userAgent,
        location: input.agreement.location || null,
        pdfUrl: "",
        signatureLogs: {
          create: {
            organizationId: org.id,
            event: "agreement_signed_before_payment",
            ipAddress,
            userAgent,
            browser: input.agreement.browser || null,
            device: input.agreement.device || null,
            location: input.agreement.location || null,
            agreementVersion: template.activeVersion,
            signatureMethod: input.agreement.signatureMethod
          }
        },
        certificate: {
          create: {
            certificateNumber: `CERT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            signerName: input.agreement.legalName,
            signedAt: new Date(),
            ipAddress,
            userAgent,
            browser: input.agreement.browser || null,
            device: input.agreement.device || null,
            signatureHash
          }
        }
      }
    });
    agreementId = agreement.id;
    await prisma.rentalAgreement.update({
      where: { id: agreement.id },
      data: { pdfUrl: `/api/agreements/${agreement.id}/pdf` }
    });

    const platformFeeCents = serverPlatformFeeCents;
    const processingFeeCents = Math.round(serverTotalCents * 0.029 + 30);
    const taxesCents = serverTaxCents;
    await prisma.transaction.create({
      data: {
        organizationId: org.id,
        reservationId: reservation.id,
        customerName: customer.name,
        vehicleLabel: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        grossAmountCents: serverTotalCents + configuredDepositCents,
        platformFeeCents,
        processingFeeCents,
        insuranceRevenueCents,
        taxesCents,
        netPayoutCents: Math.max(0, serverTotalCents - platformFeeCents - processingFeeCents),
        status: "pending"
      }
    });
  }

  const successUrl = `${appUrl()}/${input.slug}/booking/success?reservation=${reservationId}`;
  const cancelUrl = `${appUrl()}/${input.slug}/vehicles/${input.vehicleId}`;

  // Demo mode: no Stripe key — skip straight to the confirmation screen.
  if (!isStripeConfigured()) {
    return NextResponse.json({ url: `${successUrl}&demo=1` });
  }

  const stripe = getStripe();
  const connectAccount = isDatabaseConfigured()
    ? await prisma.bankAccount.findFirst({
        where: { stripeConnectAccountId: { not: null }, organization: { slug: input.slug } },
        orderBy: { updatedAt: "desc" }
      })
    : null;
  const stripePlatformFeeCents = serverPlatformFeeCents;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: serverTotalCents,
          product_data: {
            name: `${vehicle.year} ${vehicle.make} ${vehicle.model} rental`,
            description: `${input.startDate} → ${input.endDate}`
          }
        }
      },
      ...(configuredDepositCents > 0
        ? [{
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: configuredDepositCents,
              product_data: {
                name: "Refundable security deposit",
                description: "Collected with checkout and refunded after return inspection."
              }
            }
          }]
        : [])
    ],
    payment_intent_data: {
      ...(connectAccount?.stripeConnectAccountId
        ? {
            application_fee_amount: stripePlatformFeeCents,
            transfer_data: { destination: connectAccount.stripeConnectAccountId }
          }
        : {}),
      metadata: { slug: input.slug, reservationId, agreementId, kind: "public_booking" }
    },
    metadata: { slug: input.slug, reservationId, agreementId, vehicleId: input.vehicleId, kind: "public_booking" },
    success_url: successUrl,
    cancel_url: cancelUrl
  });

  return NextResponse.json({ url: session.url });
}
