/**
 * Rental Insurance — core types and the provider abstraction interface.
 *
 * Every insurance provider (RentalCover, Allianz, Bonzah, and any future one)
 * implements `InsuranceProvider`. The booking flow only ever talks to this
 * interface and the registry, so new providers can be added without touching
 * any UI or checkout code.
 */

export type InsuranceProviderKey = "rentalcover" | "allianz" | "bonzah";

/** Coverage limits in cents, keyed by coverage type. Display labels live on the quote. */
export type CoverageLimits = {
  liabilityCents?: number;
  collisionCents?: number;
  theftCents?: number;
  medicalCents?: number;
};

export type CoverageLine = { label: string; value: string };

/** A purchasable insurance plan priced for a specific booking. */
export type InsuranceQuote = {
  providerKey: InsuranceProviderKey;
  providerName: string;
  planId: string;
  planName: string;
  coverageSummary: string;
  coverageLimits: CoverageLimits;
  /** Human-readable coverage limit / deductible rows for the option card. */
  coverageLines: CoverageLine[];
  deductibleCents: number;
  dailyPriceCents: number;
  days: number;
  totalPriceCents: number;
  roadsideAssistance: boolean;
  highlights: string[];
  demo?: boolean;
};

/** Inputs needed to price coverage for a booking. */
export type QuoteRequest = {
  days: number;
  dailyRateCents: number;
  vehicleValueCents?: number;
  vehicleClass?: string;
};

export type PurchaseRequest = {
  quote: InsuranceQuote;
  customer: { name: string; email: string };
  reservationId?: string;
};

export type PurchaseResult = {
  ok: boolean;
  policyNumber?: string;
  externalRef?: string;
  message?: string;
  /** True when fulfilled by the built-in stub rather than a live provider API. */
  demo?: boolean;
};

/**
 * The contract every insurance provider implements. Keep this stable — the
 * booking flow, checkout, and dashboards depend only on this shape.
 */
export interface InsuranceProvider {
  readonly key: InsuranceProviderKey;
  readonly name: string;

  /** Whether real provider API credentials are configured (vs. catalog pricing). */
  isLiveConfigured(): boolean;

  /** Purchasable plans for a booking. Most providers return a single plan. */
  quote(request: QuoteRequest): InsuranceQuote[];

  /**
   * Bind/purchase a quoted plan. Until a provider's API is integrated this
   * returns a stub policy number so the booking flow is fully functional.
   */
  purchase(request: PurchaseRequest): Promise<PurchaseResult>;
}

export const currencyFromCents = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
