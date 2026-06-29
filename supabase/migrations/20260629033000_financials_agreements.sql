CREATE TABLE IF NOT EXISTS "bank_accounts" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "stripeConnectAccountId" TEXT,
  "stripeExternalAccountId" TEXT,
  "accountHolderName" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "accountType" TEXT NOT NULL,
  "taxStatus" TEXT NOT NULL DEFAULT 'pending',
  "bankName" TEXT,
  "last4" TEXT,
  "routingLast4" TEXT,
  "verificationStatus" TEXT NOT NULL DEFAULT 'not_started',
  "payoutSchedule" TEXT NOT NULL DEFAULT 'automatic_daily',
  "nextPayoutAt" TIMESTAMP(3),
  "estimatedPayoutCents" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "payouts" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "stripePayoutId" TEXT,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "status" TEXT NOT NULL,
  "arrivalDate" TIMESTAMP(3),
  "failureCode" TEXT,
  "failureMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "reservationId" TEXT,
  "customerName" TEXT NOT NULL,
  "vehicleLabel" TEXT NOT NULL,
  "grossAmountCents" INTEGER NOT NULL,
  "platformFeeCents" INTEGER NOT NULL,
  "processingFeeCents" INTEGER NOT NULL,
  "insuranceRevenueCents" INTEGER NOT NULL DEFAULT 0,
  "taxesCents" INTEGER NOT NULL,
  "netPayoutCents" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "stripePaymentIntentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "agreement_templates" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "businessAddress" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "terms" TEXT NOT NULL,
  "mileagePolicy" TEXT NOT NULL,
  "fuelPolicy" TEXT NOT NULL,
  "smokingPolicy" TEXT NOT NULL,
  "petPolicy" TEXT NOT NULL,
  "lateReturnPolicy" TEXT NOT NULL,
  "cleaningFee" TEXT NOT NULL,
  "damagePolicy" TEXT NOT NULL,
  "insuranceTerms" TEXT NOT NULL,
  "roadsideAssistance" TEXT NOT NULL,
  "securityDeposit" TEXT NOT NULL,
  "cancellationPolicy" TEXT NOT NULL,
  "prohibitedUses" TEXT NOT NULL,
  "stateClauses" TEXT NOT NULL,
  "signatureDisclosure" TEXT NOT NULL,
  "activeVersion" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agreement_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "agreement_versions" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "content" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agreement_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "rental_agreements" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "templateId" TEXT,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'signed',
  "legalName" TEXT NOT NULL,
  "signatureMethod" TEXT NOT NULL,
  "signatureData" TEXT NOT NULL,
  "initialsData" TEXT,
  "agreedAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "device" TEXT,
  "location" TEXT,
  "pdfUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rental_agreements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "signature_logs" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "browser" TEXT,
  "device" TEXT,
  "location" TEXT,
  "agreementVersion" INTEGER NOT NULL,
  "signatureMethod" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "signature_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "signature_certificates" (
  "id" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "certificateNumber" TEXT NOT NULL,
  "signerName" TEXT NOT NULL,
  "signedAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "browser" TEXT,
  "device" TEXT,
  "signatureHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "signature_certificates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bank_accounts_organizationId_verificationStatus_idx" ON "bank_accounts"("organizationId", "verificationStatus");
CREATE INDEX IF NOT EXISTS "payouts_organizationId_status_createdAt_idx" ON "payouts"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "transactions_organizationId_status_createdAt_idx" ON "transactions"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "agreement_templates_organizationId_activeVersion_idx" ON "agreement_templates"("organizationId", "activeVersion");
CREATE UNIQUE INDEX IF NOT EXISTS "agreement_versions_templateId_version_key" ON "agreement_versions"("templateId", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "rental_agreements_reservationId_key" ON "rental_agreements"("reservationId");
CREATE INDEX IF NOT EXISTS "rental_agreements_organizationId_status_createdAt_idx" ON "rental_agreements"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "signature_logs_organizationId_agreementId_createdAt_idx" ON "signature_logs"("organizationId", "agreementId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "signature_certificates_agreementId_key" ON "signature_certificates"("agreementId");
CREATE UNIQUE INDEX IF NOT EXISTS "signature_certificates_certificateNumber_key" ON "signature_certificates"("certificateNumber");

ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agreement_templates" ADD CONSTRAINT "agreement_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agreement_versions" ADD CONSTRAINT "agreement_versions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agreement_versions" ADD CONSTRAINT "agreement_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "agreement_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_agreements" ADD CONSTRAINT "rental_agreements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_agreements" ADD CONSTRAINT "rental_agreements_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_agreements" ADD CONSTRAINT "rental_agreements_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_agreements" ADD CONSTRAINT "rental_agreements_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "agreement_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "signature_logs" ADD CONSTRAINT "signature_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "signature_logs" ADD CONSTRAINT "signature_logs_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "rental_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "signature_certificates" ADD CONSTRAINT "signature_certificates_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "rental_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
