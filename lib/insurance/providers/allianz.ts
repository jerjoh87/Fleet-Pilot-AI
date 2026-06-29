import type { InsuranceProvider, PurchaseRequest, QuoteRequest } from "@/lib/insurance/types";
import { buildQuote, stubPurchase, type PlanBlueprint } from "@/lib/insurance/providers/base";

const PLAN: PlanBlueprint = {
  planId: "allianz-premier",
  planName: "Premier Coverage",
  coverageSummary: "Comprehensive collision, liability, and medical coverage backed by Allianz, including 24/7 roadside assistance.",
  baseDailyCents: 1299,
  ratePct: 0.08,
  deductibleCents: 25_000,
  coverageLimits: { liabilityCents: 5_000_000, collisionCents: 5_000_000, theftCents: 5_000_000, medicalCents: 1_000_000 },
  roadsideAssistance: true,
  highlights: ["24/7 roadside assistance", "Medical coverage included", "Trip interruption support"]
};

/** Allianz Travel Insurance provider. Architected for a future Allianz Partners API. */
export const allianzProvider: InsuranceProvider = {
  key: "allianz",
  name: "Allianz Travel Insurance",
  isLiveConfigured() {
    return Boolean(process.env.ALLIANZ_API_KEY);
  },
  quote(request: QuoteRequest) {
    return [buildQuote("allianz", "Allianz Travel Insurance", PLAN, request)];
  },
  async purchase(request: PurchaseRequest) {
    // TODO: integrate the Allianz Partners policy issuance API when credentials exist.
    return stubPurchase("AZ", request);
  }
};
