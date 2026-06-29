-- Add ToS acceptance tracking for host onboarding
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "tosAcceptedAt" TIMESTAMPTZ;

-- Add configurable tax rate and platform fee per organization
ALTER TABLE "WebsiteSetting" ADD COLUMN IF NOT EXISTS "taxRatePct" DECIMAL(5,3) NOT NULL DEFAULT 8.0;
ALTER TABLE "WebsiteSetting" ADD COLUMN IF NOT EXISTS "platformFeePct" DECIMAL(5,3) NOT NULL DEFAULT 10.0;

-- Add new agreement template fields for legal compliance
ALTER TABLE "agreement_templates" ADD COLUMN IF NOT EXISTS "eligibilityRequirements" TEXT;
ALTER TABLE "agreement_templates" ADD COLUMN IF NOT EXISTS "liabilityWaiver" TEXT;
ALTER TABLE "agreement_templates" ADD COLUMN IF NOT EXISTS "disputeResolution" TEXT;
ALTER TABLE "agreement_templates" ADD COLUMN IF NOT EXISTS "governingLaw" TEXT;
ALTER TABLE "agreement_templates" ADD COLUMN IF NOT EXISTS "forceMajeure" TEXT;
ALTER TABLE "agreement_templates" ADD COLUMN IF NOT EXISTS "platformDisclaimer" TEXT;
