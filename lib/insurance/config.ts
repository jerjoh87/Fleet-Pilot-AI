import type { InsuranceProviderKey } from "@/lib/insurance/types";

/** Business-owner controlled insurance policy for an organization. */
export type InsuranceSettings = {
  /** Coverage is mandatory — customers cannot complete a booking without it. */
  requireInsurance: boolean;
  /** Customers may upload proof of their own policy instead of buying coverage. */
  allowOwnInsurance: boolean;
  /** Customers may decline coverage entirely (ignored when requireInsurance). */
  allowDecline: boolean;
  /** Uploaded own-insurance must be approved by the owner before the booking finalizes. */
  manualApproval: boolean;
  /** Providers offered to customers, in display order. */
  enabledProviders: InsuranceProviderKey[];
  minLiabilityCents: number;
  requiredCoverageLimitsCents: number;
  customTerms: string;
  /** Security deposit applied per insurance selection. */
  depositThirdPartyCents: number;
  depositOwnInsuranceCents: number;
  depositDeclinedCents: number;
};

export function defaultInsuranceSettings(): InsuranceSettings {
  return {
    requireInsurance: false,
    allowOwnInsurance: true,
    allowDecline: true,
    manualApproval: true,
    enabledProviders: ["rentalcover", "allianz", "bonzah"],
    minLiabilityCents: 5_000_000,
    requiredCoverageLimitsCents: 3_500_000,
    customTerms: "",
    depositThirdPartyCents: 20_000,
    depositOwnInsuranceCents: 35_000,
    depositDeclinedCents: 75_000
  };
}

/** The deposit a given selection incurs, per the owner's deposit rules. */
export function depositForSelection(
  settings: InsuranceSettings,
  selection: "third_party" | "own" | "declined"
): number {
  if (selection === "third_party") return settings.depositThirdPartyCents;
  if (selection === "own") return settings.depositOwnInsuranceCents;
  return settings.depositDeclinedCents;
}

/** Mask a policy number for display (keep last 4). */
export function maskPolicyNumber(policyNumber: string | null | undefined): string {
  if (!policyNumber) return "—";
  const trimmed = policyNumber.trim();
  if (trimmed.length <= 4) return trimmed;
  return `${"•".repeat(Math.min(8, trimmed.length - 4))}${trimmed.slice(-4)}`;
}
