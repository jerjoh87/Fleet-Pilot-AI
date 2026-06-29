export type BillingPlan = {
  id: "starter" | "growth" | "scale" | "enterprise";
  name: string;
  monthlyCents: number;
  priceLabel: string;
  cadence: string;
  vehicleLimit: number | null;
  featured?: boolean;
  features: string[];
  /** Stripe Price ID, supplied via env so the catalog stays code-stable. */
  stripePriceId?: string;
};

/**
 * Subscription catalog for the FleetPilot AI platform. Stripe Price IDs are
 * resolved from environment variables so the same code works across test and
 * live modes. When a price ID is absent we fall back to demo behaviour.
 */
export const billingPlans: BillingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyCents: 9900,
    priceLabel: "$99",
    cadence: "/mo",
    vehicleLimit: 10,
    features: ["Up to 10 vehicles", "Online booking site", "Deposit holds & checkout", "Email support"],
    stripePriceId: process.env.STRIPE_PRICE_STARTER
  },
  {
    id: "growth",
    name: "Growth",
    monthlyCents: 29900,
    priceLabel: "$299",
    cadence: "/mo",
    vehicleLimit: 25,
    featured: true,
    features: ["Up to 25 vehicles", "Real-time tracking", "AI workspace & insights", "Automated invoicing"],
    stripePriceId: process.env.STRIPE_PRICE_GROWTH
  },
  {
    id: "scale",
    name: "Scale",
    monthlyCents: 59900,
    priceLabel: "$599",
    cadence: "/mo",
    vehicleLimit: 100,
    features: ["Up to 100 vehicles", "Priority telematics sync", "Custom AI campaigns", "Dedicated success manager"],
    stripePriceId: process.env.STRIPE_PRICE_SCALE
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyCents: 0,
    priceLabel: "Custom",
    cadence: "",
    vehicleLimit: null,
    features: ["Unlimited vehicles", "Custom AI model training", "API & webhook access", "White-glove onboarding"],
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE
  }
];

export function getPlan(id: string): BillingPlan | undefined {
  return billingPlans.find((plan) => plan.id === id);
}
