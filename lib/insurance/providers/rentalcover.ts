import type { InsuranceProvider, PurchaseRequest, QuoteRequest } from "@/lib/insurance/types";
import { buildQuote, stubPurchase, type PlanBlueprint } from "@/lib/insurance/providers/base";

const PLAN: PlanBlueprint = {
  planId: "rentalcover-standard",
  planName: "Standard Protection",
  coverageSummary: "Damage and theft protection with zero deductible — pay nothing out of pocket on a covered claim.",
  baseDailyCents: 999,
  ratePct: 0.06,
  deductibleCents: 0,
  coverageLimits: { liabilityCents: 3_500_000, collisionCents: 4_000_000, theftCents: 4_000_000 },
  roadsideAssistance: false,
  highlights: ["Zero deductible", "Covers damage & theft", "Instant digital policy"]
};

/** RentalCover provider. Swap `isLiveConfigured`/`purchase` for the RentalCover API later. */
export const rentalCoverProvider: InsuranceProvider = {
  key: "rentalcover",
  name: "RentalCover",
  isLiveConfigured() {
    return Boolean(process.env.RENTALCOVER_API_KEY);
  },
  quote(request: QuoteRequest) {
    return [buildQuote("rentalcover", "RentalCover", PLAN, request)];
  },
  async purchase(request: PurchaseRequest) {
    // TODO: when RENTALCOVER_API_KEY is present, call the RentalCover bind API here.
    return stubPurchase("RC", request);
  }
};
