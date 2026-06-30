/** Shared selection type used by the booking UI, checkout, and validation. */

export type OwnInsuranceForm = {
  insuranceCompany: string;
  policyNumber: string;
  policyHolderName: string;
  expirationDate: string;
  additionalNotes: string;
  // The *Name fields hold the Storage path returned by the upload endpoint
  // (empty until the file has finished uploading). The *Label fields hold the
  // original filename — shown in the UI and persisted as the document name.
  cardFrontName: string;
  cardFrontLabel: string;
  cardBackName: string;
  cardBackLabel: string;
  declarationName: string;
  declarationLabel: string;
};

export type InsuranceSelectionValue =
  | { type: "none" }
  | { type: "third_party"; providerKey: string; planId: string }
  | { type: "own"; ownInsurance: OwnInsuranceForm }
  | { type: "declined" };

export const emptyOwnInsurance = (): OwnInsuranceForm => ({
  insuranceCompany: "",
  policyNumber: "",
  policyHolderName: "",
  expirationDate: "",
  additionalNotes: "",
  cardFrontName: "",
  cardFrontLabel: "",
  cardBackName: "",
  cardBackLabel: "",
  declarationName: "",
  declarationLabel: ""
});

/** Whether a selection is complete enough to proceed to payment, given the owner policy. */
export function isInsuranceComplete(
  value: InsuranceSelectionValue,
  opts: { requireInsurance: boolean; allowOwnInsurance: boolean; allowDecline: boolean }
): boolean {
  switch (value.type) {
    case "third_party":
      return true;
    case "own": {
      if (!opts.allowOwnInsurance) return false;
      const o = value.ownInsurance;
      return Boolean(o.insuranceCompany && o.policyNumber && o.policyHolderName && o.expirationDate && o.cardFrontName && o.cardBackName);
    }
    case "declined":
      return opts.allowDecline && !opts.requireInsurance;
    case "none":
    default:
      return false;
  }
}
