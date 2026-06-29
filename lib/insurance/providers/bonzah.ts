import type { InsuranceProvider, PurchaseRequest, QuoteRequest } from "@/lib/insurance/types";
import { buildQuote, stubPurchase, type PlanBlueprint } from "@/lib/insurance/providers/base";

const PLAN: PlanBlueprint = {
  planId: "bonzah-cdw",
  planName: "Collision Damage Waiver",
  coverageSummary: "Affordable collision and damage waiver — a budget-friendly way to protect against repair costs.",
  baseDailyCents: 799,
  ratePct: 0.05,
  deductibleCents: 50_000,
  coverageLimits: { collisionCents: 3_500_000, theftCents: 3_500_000 },
  roadsideAssistance: false,
  highlights: ["Lowest daily price", "Collision & damage waiver", "Activate in minutes"]
};

/** Bonzah provider. Architected for a future Bonzah API integration. */
export const bonzahProvider: InsuranceProvider = {
  key: "bonzah",
  name: "Bonzah",
  isLiveConfigured() {
    return Boolean(process.env.BONZAH_API_KEY);
  },
  quote(request: QuoteRequest) {
    return [buildQuote("bonzah", "Bonzah", PLAN, request)];
  },
  async purchase(request: PurchaseRequest) {
    // TODO: integrate the Bonzah API when credentials exist.
    return stubPurchase("BZ", request);
  }
};
