import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { bookingConfirmationEmail, paymentReceiptEmail, subscriptionConfirmEmail } from "@/lib/email/templates";
import { getPlan } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!process.env.STRIPE_SECRET_KEY || !secret || !signature) {
    return NextResponse.json({ received: true, demo: true });
  }

  const stripe = getStripe();
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  const stripe = getStripe();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const reservationId = session.metadata?.reservationId;

      if (session.mode === "payment" && reservationId && isDatabaseConfigured()) {
        await prisma.reservationPayment.create({
          data: {
            reservationId,
            stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
            amountCents: session.amount_total ?? 0,
            kind: session.metadata?.kind ?? "checkout",
            status: "paid"
          }
        });

        await prisma.reservation.updateMany({
          where: { id: reservationId },
          data: { status: "CONFIRMED" }
        });

        // Payment receipt email
        const reservation = await prisma.reservation.findUnique({
          where: { id: reservationId },
          include: { customer: true, vehicle: true, organization: { include: { websiteSettings: true } } }
        });
        if (reservation) {
          const bookingTpl = bookingConfirmationEmail({
            customerName: reservation.customer.name,
            vehicleName: `${reservation.vehicle.year} ${reservation.vehicle.make} ${reservation.vehicle.model}`,
            startDate: reservation.startsAt.toISOString().slice(0, 10),
            endDate: reservation.endsAt.toISOString().slice(0, 10),
            totalCents: reservation.totalCents,
            depositCents: reservation.depositCents,
            reservationId,
            organizationName: reservation.organization.name,
            brandColor: reservation.organization.websiteSettings?.brandColor
          });
          const tpl = paymentReceiptEmail({
            customerName: reservation.customer.name,
            amountCents: session.amount_total ?? 0,
            description: `${reservation.organization.name} rental`,
            reservationId,
            organizationName: reservation.organization.name,
            brandColor: reservation.organization.websiteSettings?.brandColor
          });
          void sendEmail({ to: reservation.customer.email, ...bookingTpl });
          void sendEmail({ to: reservation.customer.email, ...tpl });
        }
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata?.organizationId;
      const planId = subscription.metadata?.planId;
      if (!organizationId) break;

      const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
      const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : new Date();

      if (isDatabaseConfigured()) {
        await prisma.subscription.upsert({
          where: { organizationId },
          update: { status: subscription.status, currentPeriodEnd, stripeSubscriptionId: subscription.id },
          create: { organizationId, stripeSubscriptionId: subscription.id, status: subscription.status, currentPeriodEnd }
        });

        // Subscription confirm email on creation
        if (event.type === "customer.subscription.created" && subscription.status === "active") {
          const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: { members: { include: { user: true }, where: { role: "OWNER" }, take: 1 } }
          });
          const owner = org?.members[0]?.user;
          const plan = getPlan(planId ?? "growth");
          if (owner && plan) {
            const stripeCustomer = await stripe.customers.retrieve(String(subscription.customer));
            const tpl = subscriptionConfirmEmail({
              operatorName: owner.fullName ?? owner.email,
              planName: plan.name,
              nextBillingDate: currentPeriodEnd.toLocaleDateString("en-US", { dateStyle: "long" }),
              amountCents: plan.monthlyCents,
              organizationName: org?.name ?? "your workspace"
            });
            const email = "email" in stripeCustomer && stripeCustomer.email ? stripeCustomer.email : owner.email;
            void sendEmail({ to: email, ...tpl });
          }
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata?.organizationId;
      if (!organizationId || !isDatabaseConfigured()) break;

      const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
      await prisma.subscription.upsert({
        where: { organizationId },
        update: { status: "canceled", currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : new Date() },
        create: { organizationId, stripeSubscriptionId: subscription.id, status: "canceled", currentPeriodEnd: new Date() }
      });
      break;
    }

    case "payment_intent.succeeded":
    case "payment_intent.amount_capturable_updated":
    case "payment_intent.canceled": {
      const intent = event.data.object as Stripe.PaymentIntent;
      if (isDatabaseConfigured()) {
        await prisma.reservationPayment.updateMany({
          where: { stripePaymentIntentId: intent.id },
          data: { status: intent.status }
        });
      }
      break;
    }

    case "invoice.paid": {
      // Stripe handles sending the hosted invoice PDF. No additional email needed.
      break;
    }

    case "invoice.payment_failed": {
      // Future: send dunning email to operator.
      break;
    }

    default:
      break;
  }
}
