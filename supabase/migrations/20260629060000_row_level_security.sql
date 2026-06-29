-- ============================================================================
-- Row Level Security (RLS) — defense-in-depth
--
-- The app uses Prisma with the Supabase SERVICE ROLE key, which bypasses RLS.
-- These policies protect against anon key exposure: if the public anon key
-- leaks, no data is accessible. Authenticated Supabase users (via auth.uid())
-- get scoped read access to their own data only.
-- ============================================================================

-- Helper: resolve the current Supabase auth user's email
-- (used to scope customer-facing policies)
CREATE OR REPLACE FUNCTION public.auth_email()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'email',
    ''
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- Core business tables
-- ============================================================================

-- Organization
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY;

-- User
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;

-- Membership
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- Vehicle tables
-- ============================================================================

ALTER TABLE "Vehicle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vehicle" FORCE ROW LEVEL SECURITY;

-- Public read access to vehicles (needed for the booking site via anon key if
-- you ever switch from service role to anon for public reads)
CREATE POLICY "vehicles_public_read" ON "Vehicle"
  FOR SELECT USING (status NOT IN ('RETIRED', 'OUT_OF_SERVICE'));

ALTER TABLE "VehicleImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VehicleImage" FORCE ROW LEVEL SECURITY;

CREATE POLICY "vehicle_images_public_read" ON "VehicleImage"
  FOR SELECT USING (true);

ALTER TABLE "VehicleAvailabilityBlock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VehicleAvailabilityBlock" FORCE ROW LEVEL SECURITY;

ALTER TABLE "VehicleDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VehicleDocument" FORCE ROW LEVEL SECURITY;

ALTER TABLE "VehicleLocation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VehicleLocation" FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- Customer & reservation tables
-- ============================================================================

ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" FORCE ROW LEVEL SECURITY;

-- Customers can read their own record (matched by email from JWT)
CREATE POLICY "customers_own_read" ON "Customer"
  FOR SELECT
  USING (email = public.auth_email());

ALTER TABLE "Driver" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Driver" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Reservation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reservation" FORCE ROW LEVEL SECURITY;

-- Customers can see their own reservations
CREATE POLICY "reservations_own_read" ON "Reservation"
  FOR SELECT
  USING (
    "customerId" IN (
      SELECT id FROM "Customer" WHERE email = public.auth_email()
    )
  );

ALTER TABLE "ReservationPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReservationPayment" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Contract" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contract" FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- Rental agreement & signature tables
-- ============================================================================

ALTER TABLE "agreement_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agreement_templates" FORCE ROW LEVEL SECURITY;

ALTER TABLE "agreement_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agreement_versions" FORCE ROW LEVEL SECURITY;

ALTER TABLE "rental_agreements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rental_agreements" FORCE ROW LEVEL SECURITY;

-- Customers can read their own signed agreements
CREATE POLICY "rental_agreements_own_read" ON "rental_agreements"
  FOR SELECT
  USING (
    "customerId" IN (
      SELECT id FROM "Customer" WHERE email = public.auth_email()
    )
  );

ALTER TABLE "signature_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "signature_logs" FORCE ROW LEVEL SECURITY;

ALTER TABLE "signature_certificates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "signature_certificates" FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- Insurance tables
-- ============================================================================

ALTER TABLE "insurance_providers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "insurance_providers" FORCE ROW LEVEL SECURITY;

ALTER TABLE "insurance_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "insurance_policies" FORCE ROW LEVEL SECURITY;

-- Customers can read their own insurance purchases
CREATE POLICY "insurance_purchases_own_read" ON "insurance_policies"
  FOR SELECT
  USING (
    "customerId" IN (
      SELECT id FROM "Customer" WHERE email = public.auth_email()
    )
  );

ALTER TABLE "customer_insurance_uploads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customer_insurance_uploads" FORCE ROW LEVEL SECURITY;

CREATE POLICY "insurance_uploads_own_read" ON "customer_insurance_uploads"
  FOR SELECT
  USING (
    "customerId" IN (
      SELECT id FROM "Customer" WHERE email = public.auth_email()
    )
  );

ALTER TABLE "insurance_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "insurance_documents" FORCE ROW LEVEL SECURITY;

ALTER TABLE "reservation_insurance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reservation_insurance" FORCE ROW LEVEL SECURITY;

CREATE POLICY "reservation_insurance_own_read" ON "reservation_insurance"
  FOR SELECT
  USING (
    "customerId" IN (
      SELECT id FROM "Customer" WHERE email = public.auth_email()
    )
  );

ALTER TABLE "insurance_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "insurance_verifications" FORCE ROW LEVEL SECURITY;

ALTER TABLE "insurance_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "insurance_settings" FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- Financial tables
-- ============================================================================

ALTER TABLE "bank_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bank_accounts" FORCE ROW LEVEL SECURITY;

ALTER TABLE "payouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payouts" FORCE ROW LEVEL SECURITY;

ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" FORCE ROW LEVEL SECURITY;

ALTER TABLE "SubscriptionPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubscriptionPlan" FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- Website & settings
-- ============================================================================

ALTER TABLE "WebsiteSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebsiteSetting" FORCE ROW LEVEL SECURITY;

-- Public read for website settings (needed for booking site theming)
CREATE POLICY "website_settings_public_read" ON "WebsiteSetting"
  FOR SELECT USING (true);

-- ============================================================================
-- Supporting tables
-- ============================================================================

ALTER TABLE "Maintenance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Maintenance" FORCE ROW LEVEL SECURITY;

ALTER TABLE "DamageReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DamageReport" FORCE ROW LEVEL SECURITY;

ALTER TABLE "GpsDevice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GpsDevice" FORCE ROW LEVEL SECURITY;

ALTER TABLE "InsurancePolicy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InsurancePolicy" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" FORCE ROW LEVEL SECURITY;

-- Public read for reviews (shown on booking site)
CREATE POLICY "reviews_public_read" ON "Review"
  FOR SELECT USING (true);

ALTER TABLE "MarketingCampaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketingCampaign" FORCE ROW LEVEL SECURITY;

ALTER TABLE "CrmContact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrmContact" FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- Audit & activity logs
-- ============================================================================

ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLog" FORCE ROW LEVEL SECURITY;

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
