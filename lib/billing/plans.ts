export type PlanId = "trial" | "starter" | "growth" | "pro";
export type BillingInterval = "monthly" | "annual";

export type PlanLimits = {
  vehicles: number | null;
  staff: number | null;
  locations: number | null;
  aiRequests: number | null;
  storageGb: number;
  apiRequests: number | null;
  gps: boolean;
  marketingStudio: boolean;
  whiteLabel: boolean;
  advancedAnalytics: boolean;
  apiAccess: boolean;
  premiumAi: boolean;
};

export type BillingPlan = {
  id: PlanId;
  name: string;
  monthlyCents: number;
  annualCents: number;
  priceLabel: string;
  annualLabel: string;
  cadence: string;
  trialDays?: number;
  featured?: boolean;
  limits: PlanLimits;
  features: string[];
  upgradeBenefits: string[];
  stripeMonthlyPriceId?: string;
  stripeAnnualPriceId?: string;
};

const commonStarter = [
  "Booking website",
  "Reservation management",
  "Customer management",
  "Stripe payments",
  "Digital rental agreements",
  "Insurance module",
  "Basic analytics",
  "Email notifications"
];

export const billingPlans: BillingPlan[] = [
  {
    id: "trial",
    name: "Free Trial",
    monthlyCents: 0,
    annualCents: 0,
    priceLabel: "$0",
    annualLabel: "$0",
    cadence: "30 days",
    trialDays: 30,
    limits: {
      vehicles: 10,
      staff: 5,
      locations: 1,
      aiRequests: 2500,
      storageGb: 10,
      apiRequests: 0,
      gps: true,
      marketingStudio: true,
      whiteLabel: true,
      advancedAnalytics: true,
      apiAccess: false,
      premiumAi: true
    },
    features: ["30-day trial", "Full platform access", "No credit card required", "Upgrade prompts before expiration"],
    upgradeBenefits: ["Keep your booking site live", "Preserve customer and vehicle data", "Unlock production billing"]
  },
  {
    id: "starter",
    name: "Starter",
    monthlyCents: 9900,
    annualCents: 99000,
    priceLabel: "$99",
    annualLabel: "$990",
    cadence: "/mo",
    limits: {
      vehicles: 10,
      staff: 1,
      locations: 1,
      aiRequests: 250,
      storageGb: 25,
      apiRequests: 0,
      gps: false,
      marketingStudio: false,
      whiteLabel: false,
      advancedAnalytics: false,
      apiAccess: false,
      premiumAi: false
    },
    features: ["Up to 10 vehicles", "1 business location", ...commonStarter, "250 AI requests per month"],
    upgradeBenefits: ["Launch online bookings", "Collect Stripe payments", "Use e-sign rental agreements"],
    stripeMonthlyPriceId: process.env.STRIPE_PRICE_STARTER,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_STARTER_ANNUAL
  },
  {
    id: "growth",
    name: "Growth",
    monthlyCents: 24900,
    annualCents: 249000,
    priceLabel: "$249",
    annualLabel: "$2,490",
    cadence: "/mo",
    featured: true,
    limits: {
      vehicles: 50,
      staff: 5,
      locations: 1,
      aiRequests: 2500,
      storageGb: 100,
      apiRequests: 0,
      gps: true,
      marketingStudio: true,
      whiteLabel: false,
      advancedAnalytics: true,
      apiAccess: false,
      premiumAi: true
    },
    features: [
      "Everything in Starter",
      "Up to 50 vehicles",
      "Up to 5 staff users",
      "GPS integrations",
      "Maintenance management",
      "CRM",
      "Marketing Studio",
      "Advanced analytics",
      "AI pricing recommendations",
      "AI marketing tools",
      "2,500 AI requests per month",
      "Priority support"
    ],
    upgradeBenefits: ["Scale operations", "Use GPS and maintenance workflows", "Unlock AI marketing and pricing"],
    stripeMonthlyPriceId: process.env.STRIPE_PRICE_GROWTH,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_GROWTH_ANNUAL
  },
  {
    id: "pro",
    name: "Pro",
    monthlyCents: 49900,
    annualCents: 499000,
    priceLabel: "$499",
    annualLabel: "$4,990",
    cadence: "/mo",
    limits: {
      vehicles: null,
      staff: null,
      locations: null,
      aiRequests: null,
      storageGb: 500,
      apiRequests: null,
      gps: true,
      marketingStudio: true,
      whiteLabel: true,
      advancedAnalytics: true,
      apiAccess: true,
      premiumAi: true
    },
    features: [
      "Everything in Growth",
      "Unlimited vehicles",
      "Unlimited staff",
      "Unlimited locations",
      "White-label branding",
      "Custom domain",
      "AI damage detection",
      "Predictive maintenance",
      "Premium analytics",
      "API access",
      "Unlimited AI requests",
      "Premium support"
    ],
    upgradeBenefits: ["Remove fleet limits", "Launch white-label experiences", "Unlock premium AI and API access"],
    stripeMonthlyPriceId: process.env.STRIPE_PRICE_PRO,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_PRO_ANNUAL
  }
];

export function getPlan(id: string): BillingPlan | undefined {
  return billingPlans.find((plan) => plan.id === id);
}

export function getPaidPlans() {
  return billingPlans.filter((plan) => plan.id !== "trial");
}

export function getStripePriceId(plan: BillingPlan, interval: BillingInterval) {
  return interval === "annual" ? plan.stripeAnnualPriceId : plan.stripeMonthlyPriceId;
}
