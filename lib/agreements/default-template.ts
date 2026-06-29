import type { AgreementTemplateData } from "@/lib/types";

export function defaultAgreementTemplate(businessName: string): AgreementTemplateData {
  return {
    businessName,
    businessAddress: "",
    phone: "",
    email: "",
    terms: "Renter agrees to operate the vehicle lawfully, safely, and only during the confirmed reservation period. Renter accepts financial responsibility for tolls, citations, cleaning charges, fuel differences, late returns, damage, loss, and other charges permitted by this agreement and applicable law.",
    mileagePolicy: "Included mileage is disclosed at booking. Additional mileage may be charged at the business's posted rate.",
    fuelPolicy: "Vehicle must be returned with the same fuel or charge level provided at pickup unless prepaid fuel is selected.",
    smokingPolicy: "Smoking and vaping are prohibited. Evidence of smoke odor, ash, or burn marks may result in cleaning or damage fees.",
    petPolicy: "Pets are not permitted unless approved in writing before pickup. Unauthorized pets may result in cleaning fees.",
    lateReturnPolicy: "Late returns may be charged additional rental time, administrative fees, and costs caused by delay to subsequent reservations.",
    cleaningFee: "Vehicle must be returned reasonably clean. Excessive dirt, stains, odor, biohazards, or trash may result in cleaning fees.",
    damagePolicy: "Renter must report accidents, theft, vandalism, mechanical issues, and damage immediately. Renter is responsible for damage not covered by insurance or protection products.",
    insuranceTerms: "Renter must maintain valid insurance or purchase/accept an offered protection option where available. Insurance coverage is subject to policy terms, exclusions, deductibles, and verification.",
    roadsideAssistance: "Roadside assistance instructions will be provided after booking. Unauthorized repairs, towing, or abandonment may result in additional charges.",
    securityDeposit: "A refundable security deposit may be collected or authorized before pickup and released after inspection, less approved charges.",
    cancellationPolicy: "Cancellation terms are disclosed during booking. No-shows, late cancellations, and shortened trips may be charged according to the posted policy.",
    prohibitedUses: "Vehicle may not be used for racing, rideshare, delivery, towing, off-road driving, illegal activity, subleasing, driver training, or operation by an unauthorized driver.",
    eligibilityRequirements: "Renter must be at least 21 years of age (25 for certain vehicle classes), hold a valid, unrestricted driver's license issued in the country of rental, and present a matching credit or debit card at pickup. Renter represents that all identity, license, and insurance information provided is accurate and current.",
    liabilityWaiver: "Renter acknowledges that operating a motor vehicle involves inherent risks including accident, injury, death, and property damage. Renter voluntarily assumes all such risks and releases the vehicle owner and FleetPilot AI from any and all claims, demands, and causes of action arising from the rental, except to the extent caused by the owner's willful misconduct or gross negligence. This release applies to the fullest extent permitted by applicable law.",
    disputeResolution: "Any dispute arising out of or related to this rental agreement shall be resolved by binding arbitration under the rules of the American Arbitration Association. Each party waives any right to a jury trial or to participate in a class action. The prevailing party may recover reasonable attorney's fees. This clause survives termination of the rental agreement.",
    governingLaw: "This agreement is governed by the laws of the state where the rental vehicle is picked up, without regard to conflict of law principles. If arbitration does not apply, the parties consent to exclusive jurisdiction in the courts of that state.",
    forceMajeure: "Neither party is liable for failure to perform due to causes beyond reasonable control, including natural disasters, government orders, pandemics, severe weather, or civil unrest. The affected party must notify the other promptly. Rental charges may be prorated or refunded at the business's discretion for force-majeure cancellations.",
    platformDisclaimer: "This rental is facilitated by FleetPilot AI, a technology platform. FleetPilot AI is not a party to this agreement, does not own or inspect any vehicle, and is not liable for any aspect of the rental transaction. By signing, renter acknowledges that any claims related to the vehicle or rental are solely between renter and the vehicle owner/business.",
    stateClauses: "State-specific rights, notices, insurance rules, and consumer protections apply where required by law. If any clause conflicts with applicable law, the lawful minimum requirement controls.",
    signatureDisclosure: "By signing electronically, renter consents to use electronic records and signatures under applicable e-signature laws (including the federal ESIGN Act and state UETA) and agrees the electronic signature has the same legal effect as a handwritten signature.",
    activeVersion: 1
  };
}

export function agreementTemplateToContent(template: AgreementTemplateData) {
  return {
    businessName: template.businessName,
    businessAddress: template.businessAddress,
    phone: template.phone,
    email: template.email,
    sections: [
      ["Terms & Conditions", template.terms],
      ["Mileage Policy", template.mileagePolicy],
      ["Fuel Policy", template.fuelPolicy],
      ["Smoking Policy", template.smokingPolicy],
      ["Pet Policy", template.petPolicy],
      ["Late Return Policy", template.lateReturnPolicy],
      ["Cleaning Fee", template.cleaningFee],
      ["Damage Policy", template.damagePolicy],
      ["Insurance Terms", template.insuranceTerms],
      ["Roadside Assistance", template.roadsideAssistance],
      ["Security Deposit", template.securityDeposit],
      ["Cancellation Policy", template.cancellationPolicy],
      ["Prohibited Uses", template.prohibitedUses],
      ["Eligibility Requirements", template.eligibilityRequirements ?? ""],
      ["Liability Waiver & Assumption of Risk", template.liabilityWaiver ?? ""],
      ["Dispute Resolution & Arbitration", template.disputeResolution ?? ""],
      ["Governing Law", template.governingLaw ?? ""],
      ["Force Majeure", template.forceMajeure ?? ""],
      ["Platform Disclaimer", template.platformDisclaimer ?? ""],
      ["State-Specific Legal Clauses", template.stateClauses],
      ["Digital Signature Disclosure", template.signatureDisclosure]
    ],
    version: template.activeVersion
  };
}
