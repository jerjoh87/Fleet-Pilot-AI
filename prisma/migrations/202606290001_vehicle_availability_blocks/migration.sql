CREATE TABLE "VehicleAvailabilityBlock" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleAvailabilityBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VehicleAvailabilityBlock_organizationId_vehicleId_startsAt_endsAt_idx" ON "VehicleAvailabilityBlock"("organizationId", "vehicleId", "startsAt", "endsAt");

ALTER TABLE "VehicleAvailabilityBlock" ADD CONSTRAINT "VehicleAvailabilityBlock_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
