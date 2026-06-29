"use server";

import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { requireAppSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { appUrl, getOrCreateStripeCustomer, isStripeConfigured } from "@/lib/billing/customer";
import { type BillingInterval, getPlan, getStripePriceId } from "@/lib/billing/plans";
import { sendEmail } from "@/lib/email/send";
import { depositReleaseEmail, refundNoticeEmail } from "@/lib/email/templates";

async function assertBilling() {
  const session = await requireAppSession();
  if (!can(session.role, "payments:write")) {
    throw new Error("You do not have access to billing.");
  }
  return session;
}

type ActionResult = { ok: boolean; url?: string; message?: string; demo?: boolean; clientSecret?: string; paymentIntentId?: string };

export async function startFreeTrialAction(): Promise<ActionResult> {
  const session = await assertBilling();
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 30 * 86_400_000);

  if (isDatabaseConfigured()) {
    await prisma.subscription.upsert({
      where: { organizationId: session.organization.id },
      update: {
        planId: "trial",
        status: "trialing",
        interval: "monthly",
        trialStartedAt: now,
        trialEndsAt,
        currentPeriodEnd: trialEndsAt,
        cancelAtPeriodEnd: false
      },
      create: {
        organizationId: session.organization.id,
        stripeSubscriptionId: `trial_${session.organization.id}`,
        planId: "trial",
        status: "trialing",
        interval: "monthly",
        trialStartedAt: now,
        trialEndsAt,
        currentPeriodEnd: trialEndsAt
      }
    });
  }

  return { ok: true, message: "Free trial activated. No credit card required." };
}

/**
 * Start a subscription via a Stripe Checkout Session in subscription mode.
 * Falls back to a demo acknowledgement when Stripe or the plan price is unset.
 */
export async function startSubscriptionAction(planId: string, interval: BillingInterval = "monthly"): Promise<ActionResult> {
  const session = await assertBilling();
  const plan = getPlan(planId);
  const priceId = plan ? getStripePriceId(plan, interval) : undefined;

  if (!plan || plan.id === "trial") {
    return { ok: false, message: "Unknown plan." };
  }

  if (!isStripeConfigured() || !priceId) {
    return {
      ok: true,
      demo: true,
      message: `Demo mode: ${plan.name} ${interval} plan selected. Add Stripe price ids to enable live checkout.`
    };
  }

  const stripe = getStripe();
  const customer = await getOrCreateStripeCustomer({
    organizationId: session.organization.id,
    name: session.organization.name,
    email: session.user.email
  });

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    customer_update: { address: "auto", name: "auto" },
    subscription_data: {
      metadata: { organizationId: session.organization.id, planId: plan.id, interval }
    },
    metadata: { organizationId: session.organization.id, planId: plan.id, interval, kind: "subscription" },
    success_url: `${appUrl()}/dashboard?billing=subscribed`,
    cancel_url: `${appUrl()}/dashboard?billing=cancelled`
  });

  return { ok: true, url: checkout.url ?? undefined };
}

/** Open the Stripe Customer Portal for self-service subscription management. */
export async function openBillingPortalAction(): Promise<ActionResult> {
  const session = await assertBilling();

  if (!isStripeConfigured() || !isDatabaseConfigured()) {
    return { ok: true, demo: true, message: "Connect Stripe and a database to manage subscriptions in the portal." };
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.organization.id },
    select: { stripeCustomerId: true }
  });

  if (!org?.stripeCustomerId) {
    return { ok: false, message: "No Stripe customer on file yet. Start a subscription first." };
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${appUrl()}/dashboard?billing=portal`
  });

  return { ok: true, url: portal.url };
}

const depositSchema = z.object({
  reservationId: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  customerEmail: z.string().email(),
  description: z.string().min(1)
});

/**
 * Place a refundable security-deposit authorization hold using a PaymentIntent
 * with manual capture. The funds are authorized but not captured.
 */
export async function createDepositHoldAction(input: z.input<typeof depositSchema>): Promise<ActionResult> {
  const session = await assertBilling();
  const parsed = depositSchema.parse(input);

  if (!isStripeConfigured()) {
    return { ok: true, demo: true, message: "Demo mode: deposit hold simulated." };
  }

  const stripe = getStripe();
  const customer = await getOrCreateStripeCustomer({
    organizationId: session.organization.id,
    name: session.organization.name,
    email: parsed.customerEmail
  });

  const intent = await stripe.paymentIntents.create({
    amount: parsed.amount,
    currency: "usd",
    customer,
    capture_method: "manual",
    description: parsed.description,
    receipt_email: parsed.customerEmail,
    metadata: {
      organizationId: session.organization.id,
      reservationId: parsed.reservationId,
      kind: "deposit"
    }
  });

  if (isDatabaseConfigured()) {
    await prisma.reservationPayment.create({
      data: {
        reservationId: parsed.reservationId,
        stripePaymentIntentId: intent.id,
        amountCents: parsed.amount,
        kind: "deposit",
        status: intent.status
      }
    });
  }

  return {
    ok: true,
    clientSecret: intent.client_secret ?? undefined,
    paymentIntentId: intent.id,
    message: "Card authorization ready."
  };
}

const captureSchema = z.object({
  paymentIntentId: z.string().min(1),
  amountToCapture: z.coerce.number().int().positive().optional()
});

/** Capture (charge) a previously authorized deposit hold, optionally partial. */
export async function captureDepositAction(input: z.input<typeof captureSchema>): Promise<ActionResult> {
  await assertBilling();
  const parsed = captureSchema.parse(input);

  if (!isStripeConfigured()) {
    return { ok: true, demo: true, message: "Demo mode: deposit captured." };
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.capture(
    parsed.paymentIntentId,
    parsed.amountToCapture ? { amount_to_capture: parsed.amountToCapture } : undefined
  );

  if (isDatabaseConfigured()) {
    await prisma.reservationPayment.updateMany({
      where: { stripePaymentIntentId: intent.id },
      data: { status: intent.status }
    });
  }

  return { ok: true, message: `Deposit captured (${intent.status}).` };
}

/** Release a deposit authorization without charging the customer. */
export async function releaseDepositAction(paymentIntentId: string): Promise<ActionResult> {
  const session = await assertBilling();

  if (!isStripeConfigured()) {
    return { ok: true, demo: true, message: "Demo mode: deposit released." };
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.cancel(paymentIntentId);

  if (isDatabaseConfigured()) {
    await prisma.reservationPayment.updateMany({
      where: { stripePaymentIntentId: intent.id },
      data: { status: "released" }
    });

    // Notify customer that their hold was released
    const payment = await prisma.reservationPayment.findFirst({
      where: { stripePaymentIntentId: intent.id },
      include: { reservation: { include: { customer: true, organization: { include: { websiteSettings: true } } } } }
    });
    if (payment?.reservation) {
      const { customer, organization } = payment.reservation;
      const tpl = depositReleaseEmail({
        customerName: customer.name,
        amountCents: payment.amountCents,
        organizationName: organization.name,
        brandColor: organization.websiteSettings?.brandColor
      });
      void sendEmail({ to: customer.email, ...tpl });
    }
  }

  return { ok: true, message: "Deposit hold released." };
}

const refundSchema = z.object({
  paymentIntentId: z.string().min(1),
  amount: z.coerce.number().int().positive().optional(),
  reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).optional()
});

/** Refund a captured payment, fully or partially. */
export async function refundPaymentAction(input: z.input<typeof refundSchema>): Promise<ActionResult> {
  await assertBilling();
  const parsed = refundSchema.parse(input);

  if (!isStripeConfigured()) {
    return { ok: true, demo: true, message: "Demo mode: refund simulated." };
  }

  const stripe = getStripe();
  const refund = await stripe.refunds.create({
    payment_intent: parsed.paymentIntentId,
    amount: parsed.amount,
    reason: parsed.reason
  });

  if (isDatabaseConfigured()) {
    await prisma.reservationPayment.updateMany({
      where: { stripePaymentIntentId: parsed.paymentIntentId },
      data: { status: `refunded:${refund.status}` }
    });

    // Notify customer of refund
    const payment = await prisma.reservationPayment.findFirst({
      where: { stripePaymentIntentId: parsed.paymentIntentId },
      include: { reservation: { include: { customer: true, organization: { include: { websiteSettings: true } } } } }
    });
    if (payment?.reservation) {
      const { customer, organization } = payment.reservation;
      const tpl = refundNoticeEmail({
        customerName: customer.name,
        amountCents: refund.amount ?? payment.amountCents,
        reason: parsed.reason === "requested_by_customer" ? "Requested by customer" : parsed.reason === "duplicate" ? "Duplicate charge" : parsed.reason === "fraudulent" ? "Fraud prevention" : "Refund issued",
        organizationName: organization.name,
        brandColor: organization.websiteSettings?.brandColor
      });
      void sendEmail({ to: customer.email, ...tpl });
    }
  }

  return { ok: true, message: `Refund ${refund.status} for ${((refund.amount ?? 0) / 100).toFixed(2)} USD.` };
}

const invoiceSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  description: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  daysUntilDue: z.coerce.number().int().min(0).max(120).default(7)
});

/**
 * Create and finalize a Stripe invoice for ad-hoc charges (damage, fuel,
 * extra mileage, corporate accounts). Sends it to the customer when live.
 */
export async function createInvoiceAction(input: z.input<typeof invoiceSchema>): Promise<ActionResult> {
  const session = await assertBilling();
  const parsed = invoiceSchema.parse(input);

  if (!isStripeConfigured()) {
    return { ok: true, demo: true, message: `Demo mode: invoice drafted for ${parsed.customerName}.` };
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: parsed.customerName,
    email: parsed.customerEmail,
    metadata: { organizationId: session.organization.id }
  });

  await stripe.invoiceItems.create({
    customer: customer.id,
    amount: parsed.amount,
    currency: "usd",
    description: parsed.description
  });

  const invoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: "send_invoice",
    days_until_due: parsed.daysUntilDue,
    description: parsed.description,
    metadata: { organizationId: session.organization.id, kind: "invoice" }
  });

  if (invoice.id) {
    await stripe.invoices.finalizeInvoice(invoice.id);
    await stripe.invoices.sendInvoice(invoice.id);
  }

  return { ok: true, message: `Invoice sent to ${parsed.customerEmail}.`, url: invoice.hosted_invoice_url ?? undefined };
}
