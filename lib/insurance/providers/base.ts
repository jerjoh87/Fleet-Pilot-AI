import type {
  CoverageLimits,
  CoverageLine,
  InsuranceProviderKey,
  InsuranceQuote,
  PurchaseRequest,
  PurchaseResult,
  QuoteRequest
} from "@/lib/insurance/types";
import { currencyFromCents } from "@/lib/insurance/types";

/** Static description of a single provider plan, before booking-specific pricing. */
export type PlanBlueprint = {
  planId: string;
  planName: string;
  coverageSummary: string;
  /** Flat daily price in cents before the rate-based component. */
  baseDailyCents: number;
  /** Fraction of the daily rental rate added to the daily price (e.g. 0.06). */
  ratePct: number;
  deductibleCents: number;
  coverageLimits: CoverageLimits;
  roadsideAssistance: boolean;
  highlights: string[];
};

function limitLines(limits: CoverageLimits, deductibleCents: number): CoverageLine[] {
  const lines: CoverageLine[] = [];
  if (limits.liabilityCents) lines.push({ label: "Liability", value: `${currencyFromCents(limits.liabilityCents)}` });
  if (limits.collisionCents) lines.push({ label: "Collision & damage", value: `Up to ${currencyFromCents(limits.collisionCents)}` });
  if (limits.theftCents) lines.push({ label: "Theft protection", value: `Up to ${currencyFromCents(limits.theftCents)}` });
  if (limits.medicalCents) lines.push({ label: "Medical", value: `${currencyFromCents(limits.medicalCents)}` });
  lines.push({ label: "Deductible", value: deductibleCents === 0 ? "$0" : currencyFromCents(deductibleCents) });
  return lines;
}

/** Turn a plan blueprint into a booking-specific quote. */
export function buildQuote(
  providerKey: InsuranceProviderKey,
  providerName: string,
  plan: PlanBlueprint,
  request: QuoteRequest
): InsuranceQuote {
  const days = Math.max(1, request.days);
  const dailyPriceCents = Math.round(plan.baseDailyCents + request.dailyRateCents * plan.ratePct);
  return {
    providerKey,
    providerName,
    planId: plan.planId,
    planName: plan.planName,
    coverageSummary: plan.coverageSummary,
    coverageLimits: plan.coverageLimits,
    coverageLines: limitLines(plan.coverageLimits, plan.deductibleCents),
    deductibleCents: plan.deductibleCents,
    dailyPriceCents,
    days,
    totalPriceCents: dailyPriceCents * days,
    roadsideAssistance: plan.roadsideAssistance,
    highlights: plan.highlights
  };
}

/**
 * Stub purchase used until a provider's real API is wired up. Generates a
 * deterministic policy number so reservations and receipts are fully populated.
 */
export async function stubPurchase(prefix: string, request: PurchaseRequest): Promise<PurchaseResult> {
  const policyNumber = `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  return {
    ok: true,
    demo: true,
    policyNumber,
    externalRef: policyNumber,
    message: `Coverage reserved with ${request.quote.providerName}. Connect the ${request.quote.providerName} API to issue a live policy.`
  };
}
