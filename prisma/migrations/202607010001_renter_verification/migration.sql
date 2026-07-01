-- Renter account address for the required booking profile.
ALTER TABLE "Customer" ADD COLUMN "address" TEXT;

-- Government ID uploaded at booking for host review.
ALTER TABLE "Driver" ADD COLUMN "idFrontPath" TEXT;
ALTER TABLE "Driver" ADD COLUMN "idFrontName" TEXT;
ALTER TABLE "Driver" ADD COLUMN "idBackPath" TEXT;
ALTER TABLE "Driver" ADD COLUMN "idBackName" TEXT;

-- Host approval workflow for public bookings.
ALTER TABLE "Reservation" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED';
