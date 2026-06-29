"use server";

import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { requireAppSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { appUrl, isStripeConfigured } from "@/lib/billing/customer";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { agreementTemplateToContent, defaultAgreementTemplate } from "@/lib/agreements/default-template";

type ActionResult = { ok: boolean; url?: string; message?: string; demo?: boolean };

async function assertFinancials() {
  const session = await requireAppSession();
  if (!can(session.role, "payments:write")) {
    throw new Error("You do not have access to financial settings.");
  }
  return session;
}

async function getOrCreateConnectAccount() {
  const session = await assertFinancials();
  if (!isStripeConfigured()) {
    return { session, accountId: "", demo: true };
  }

  const existing = isDatabaseConfigured()
    ? await prisma.bankAccount.findFirst({
        where: { organizationId: session.organization.id, stripeConnectAccountId: { not: null } },
        orderBy: { updatedAt: "desc" }
      })
    : null;

  if (existing?.stripeConnectAccountId) {
    return { session, accountId: existing.stripeConnectAccountId, demo: false };
  }

  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: session.user.email,
    business_type: "company",
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true }
    },
    controller: {
      fees: { payer: "application" },
      losses: { payments: "application" },
      stripe_dashboard: { type: "express" }
    },
    business_profile: {
      name: session.organization.name,
      product_description: "Vehicle rentals and security deposit processing"
    },
    metadata: { organizationId: session.organization.id }
  });

  if (isDatabaseConfigured()) {
    await prisma.bankAccount.create({
      data: {
        organizationId: session.organization.id,
        stripeConnectAccountId: account.id,
        accountHolderName: session.user.fullName,
        businessName: session.organization.name,
        accountType: "checking",
        verificationStatus: account.details_submitted ? "verified" : "requires_onboarding",
        payoutSchedule: "automatic_daily"
      }
    });
  }

  return { session, accountId: account.id, demo: false };
}

export async function startConnectOnboardingAction(): Promise<ActionResult> {
  const { accountId, demo } = await getOrCreateConnectAccount();
  if (demo) {
    return { ok: true, demo: true, message: "Add STRIPE_SECRET_KEY to start Stripe Connect onboarding." };
  }

  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${appUrl()}/dashboard?financials=refresh`,
    return_url: `${appUrl()}/dashboard?financials=connected`
  });

  return { ok: true, url: link.url };
}

export async function openConnectDashboardAction(): Promise<ActionResult> {
  const { accountId, demo } = await getOrCreateConnectAccount();
  if (demo) {
    return { ok: true, demo: true, message: "Connect Stripe first to open the Express dashboard." };
  }

  const stripe = getStripe();
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return { ok: true, url: loginLink.url };
}

const bankInfoSchema = z.object({
  accountHolderName: z.string().min(2),
  businessName: z.string().min(2),
  accountType: z.enum(["checking", "savings"]),
  routingNumber: z.string().min(4),
  accountNumber: z.string().min(4),
  taxStatus: z.string().min(2).default("pending")
});

export async function saveBankingInfoAction(input: z.input<typeof bankInfoSchema>): Promise<ActionResult> {
  const session = await assertFinancials();
  const parsed = bankInfoSchema.parse(input);
  const routingLast4 = parsed.routingNumber.slice(-4);
  const last4 = parsed.accountNumber.slice(-4);

  let accountId = "";
  let externalAccountId = "";

  if (isStripeConfigured()) {
    const result = await getOrCreateConnectAccount();
    accountId = result.accountId;
    if (accountId) {
      const stripe = getStripe();
      const token = await stripe.tokens.create({
        bank_account: {
          country: "US",
          currency: "usd",
          account_holder_name: parsed.accountHolderName,
          account_holder_type: "company",
          routing_number: parsed.routingNumber,
          account_number: parsed.accountNumber
        }
      });
      const external = await stripe.accounts.createExternalAccount(accountId, { external_account: token.id });
      externalAccountId = external.id;
    }
  }

  if (isDatabaseConfigured()) {
    await prisma.bankAccount.create({
      data: {
        organizationId: session.organization.id,
        stripeConnectAccountId: accountId || null,
        stripeExternalAccountId: externalAccountId || null,
        accountHolderName: parsed.accountHolderName,
        businessName: parsed.businessName,
        accountType: parsed.accountType,
        taxStatus: parsed.taxStatus,
        last4,
        routingLast4,
        verificationStatus: accountId ? "pending_verification" : "saved_pending_stripe",
        payoutSchedule: "automatic_daily",
        nextPayoutAt: new Date(Date.now() + 2 * 86_400_000)
      }
    });
  }

  return { ok: true, message: "Banking profile saved securely. Raw account numbers were not stored." };
}

export async function removeBankAccountAction(): Promise<ActionResult> {
  const session = await assertFinancials();
  if (isDatabaseConfigured()) {
    await prisma.bankAccount.deleteMany({ where: { organizationId: session.organization.id } });
  }
  return { ok: true, message: "Bank account removed from FleetPilot records. Manage Stripe external accounts in Express if needed." };
}

const agreementTemplateSchema = z.object({
  businessName: z.string().min(2),
  businessAddress: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  terms: z.string().min(20),
  mileagePolicy: z.string().min(5),
  fuelPolicy: z.string().min(5),
  smokingPolicy: z.string().min(5),
  petPolicy: z.string().min(5),
  lateReturnPolicy: z.string().min(5),
  cleaningFee: z.string().min(5),
  damagePolicy: z.string().min(5),
  insuranceTerms: z.string().min(5),
  roadsideAssistance: z.string().min(5),
  securityDeposit: z.string().min(5),
  cancellationPolicy: z.string().min(5),
  prohibitedUses: z.string().min(5),
  eligibilityRequirements: z.string().optional(),
  liabilityWaiver: z.string().optional(),
  disputeResolution: z.string().optional(),
  governingLaw: z.string().optional(),
  forceMajeure: z.string().optional(),
  platformDisclaimer: z.string().optional(),
  stateClauses: z.string().min(5),
  signatureDisclosure: z.string().min(5)
});

export async function saveAgreementTemplateAction(formData: FormData): Promise<ActionResult> {
  const session = await assertFinancials();
  const parsed = agreementTemplateSchema.parse(Object.fromEntries(formData));

  if (!isDatabaseConfigured()) {
    return { ok: true, demo: true, message: "Demo mode: agreement template preview saved locally." };
  }

  const existing = await prisma.agreementTemplate.findFirst({
    where: { organizationId: session.organization.id },
    orderBy: { activeVersion: "desc" }
  });
  const nextVersion = (existing?.activeVersion ?? 0) + 1;
  const defaults = defaultAgreementTemplate(session.organization.name);
  const templateData = { ...defaults, ...parsed, activeVersion: nextVersion };

  const template = existing
    ? await prisma.agreementTemplate.update({
        where: { id: existing.id },
        data: { ...parsed, activeVersion: nextVersion }
      })
    : await prisma.agreementTemplate.create({
        data: { organizationId: session.organization.id, ...templateData }
      });

  await prisma.agreementVersion.create({
    data: {
      organizationId: session.organization.id,
      templateId: template.id,
      version: nextVersion,
      content: agreementTemplateToContent(templateData)
    }
  });

  return { ok: true, message: `Agreement template saved as version ${nextVersion}.` };
}
