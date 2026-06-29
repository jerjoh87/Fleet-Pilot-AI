/**
 * Insurance provider registry.
 *
 * The booking flow, checkout, settings, and dashboards resolve providers only
 * through this registry. To add a new provider: implement `InsuranceProvider`
 * and add it to `PROVIDERS` — nothing else needs to change.
 */
import type { InsuranceProvider, InsuranceProviderKey, InsuranceQuote, QuoteRequest } from "@/lib/insurance/types";
import { rentalCoverProvider } from "@/lib/insurance/providers/rentalcover";
import { allianzProvider } from "@/lib/insurance/providers/allianz";
import { bonzahProvider } from "@/lib/insurance/providers/bonzah";

const PROVIDERS: Record<InsuranceProviderKey, InsuranceProvider> = {
  rentalcover: rentalCoverProvider,
  allianz: allianzProvider,
  bonzah: bonzahProvider
};

/** Display order of providers in the selection UI. */
export const PROVIDER_ORDER: InsuranceProviderKey[] = ["rentalcover", "allianz", "bonzah"];

export function getProvider(key: string): InsuranceProvider | null {
  return (PROVIDERS as Record<string, InsuranceProvider | undefined>)[key] ?? null;
}

export function allProviders(): InsuranceProvider[] {
  return PROVIDER_ORDER.map((key) => PROVIDERS[key]);
}

export function isProviderKey(value: string): value is InsuranceProviderKey {
  return value in PROVIDERS;
}

/**
 * Build quotes for a booking across the given enabled providers (defaults to all),
 * in display order. Returns the first plan from each provider.
 */
export function quotesForBooking(request: QuoteRequest, enabledKeys?: InsuranceProviderKey[]): InsuranceQuote[] {
  const keys = enabledKeys?.length ? PROVIDER_ORDER.filter((key) => enabledKeys.includes(key)) : PROVIDER_ORDER;
  return keys
    .map((key) => {
      const provider = PROVIDERS[key];
      const quote = provider.quote(request)[0];
      if (quote && !provider.isLiveConfigured()) {
        return { ...quote, demo: true };
      }
      return quote;
    })
    .filter((quote): quote is InsuranceQuote => Boolean(quote));
}
