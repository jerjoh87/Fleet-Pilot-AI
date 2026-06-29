import { getStripe } from "@/lib/stripe";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * Returns a Stripe customer id for the organization, creating one (and
 * persisting it when a database is configured) if it does not yet exist.
 */
export async function getOrCreateStripeCustomer(input: {
  organizationId: string;
  name: string;
  email: string;
}): Promise<string> {
  const stripe = getStripe();

  if (isDatabaseConfigured()) {
    const org = await prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: { stripeCustomerId: true, name: true }
    });

    if (org?.stripeCustomerId) {
      return org.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
      name: input.name,
      email: input.email,
      metadata: { organizationId: input.organizationId }
    });

    await prisma.organization.update({
      where: { id: input.organizationId },
      data: { stripeCustomerId: customer.id }
    });

    return customer.id;
  }

  // Demo / no-DB mode: create an ephemeral customer so flows still work in test mode.
  const customer = await stripe.customers.create({
    name: input.name,
    email: input.email,
    metadata: { organizationId: input.organizationId, demo: "true" }
  });

  return customer.id;
}
