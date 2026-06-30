/**
 * Provision a complete, REAL tenant in the database — organization, host
 * profile (website settings), a starter fleet with images, and availability.
 *
 * This is the clean path to turn the hardcoded "luxedrive" demo into a real
 * DB-backed booking site, and it doubles as a template for spinning up any new
 * tenant. It is idempotent: re-running updates existing rows instead of
 * duplicating them.
 *
 * Usage (Prisma reads .env, not .env.local — pass the URLs explicitly):
 *   DATABASE_URL=... DIRECT_URL=... node prisma/seed.mjs
 *   npm run db:seed
 *
 * Optional overrides (env):
 *   SEED_SLUG          public slug / subdomain        (default "luxedrive")
 *   SEED_NAME          business name                  (default "LuxeDrive Rentals")
 *   SEED_OWNER_USER_ID Supabase auth user id to make OWNER (optional)
 *   SEED_OWNER_EMAIL   owner email, required if OWNER_USER_ID is set
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SLUG = process.env.SEED_SLUG ?? "luxedrive";
const NAME = process.env.SEED_NAME ?? "LuxeDrive Rentals";
const DOMAIN = `${SLUG}.fleetpilot.ai`;
const OWNER_USER_ID = process.env.SEED_OWNER_USER_ID ?? null;
const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? null;

const website = {
  brandColor: "#166534",
  backgroundStyle: "cover",
  coverImageUrl:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
  heroTitle: "Premium vehicles, booked in minutes.",
  about:
    "LuxeDrive is a boutique rental host offering meticulously maintained premium vehicles with flexible pickup and digital check-in.",
  serviceArea: "Atlanta metro · airport pickup available",
  contactEmail: "hello@luxedrive.example",
  contactPhone: "(404) 555-0100",
  businessHours: "Mon–Sun · 7am–9pm by appointment",
  pickupInstructions:
    "Pickup at our downtown garage or airport lot. We'll text exact directions and a gate code the morning of your trip.",
  depositPolicy:
    "A refundable security deposit is authorized at booking and released after a return inspection.",
  cancellationPolicy:
    "Free cancellation up to 24 hours before pickup. Late cancellations may be charged one rental day.",
  trustBadges: ["Verified fleet", "Secure checkout", "Responsive host"],
  seoTitle: `${NAME} — premium car rentals`,
  depositFeeCents: 25000,
  taxRatePct: 8.0,
  platformFeePct: 10.0
};

/** Starter fleet. status maps to the VehicleStatus enum. */
const fleet = [
  {
    vin: "7SAYGDEE8RF000001",
    make: "Tesla",
    model: "Model Y",
    year: 2024,
    licensePlate: "FP-2401",
    mileage: 18420,
    fuelLevel: 84,
    dailyRate: 128,
    status: "AVAILABLE",
    location: "Downtown garage",
    publicDescription:
      "All-electric performance SUV with Autopilot, panoramic glass roof, and 330-mile range. Effortless and quiet.",
    features: ["Electric", "Autopilot", "Panoramic roof", "Heated seats", "Supercharging"],
    rules: ["No smoking", "Return charged above 20%", "Valid driver's license required"],
    image: "https://images.unsplash.com/photo-1617704548623-340376564e68?auto=format&fit=crop&w=900&q=80"
  },
  {
    vin: "5UXCR6C03P9000002",
    make: "BMW",
    model: "X5",
    year: 2023,
    licensePlate: "FP-2308",
    mileage: 32610,
    fuelLevel: 61,
    dailyRate: 155,
    status: "AVAILABLE",
    location: "Airport lot",
    publicDescription:
      "Luxury midsize SUV with a twin-turbo inline-six, premium leather, and a smooth, commanding ride for any trip.",
    features: ["AWD", "Leather", "Apple CarPlay", "Heated seats", "Premium audio"],
    rules: ["No smoking", "Return with same fuel level", "Valid driver's license required"],
    image: "https://images.unsplash.com/photo-1607853554439-0069ec0f29b6?auto=format&fit=crop&w=900&q=80"
  },
  {
    vin: "55SWF8DB2NU000003",
    make: "Mercedes-Benz",
    model: "C300",
    year: 2022,
    licensePlate: "FP-2217",
    mileage: 41192,
    fuelLevel: 70,
    dailyRate: 119,
    status: "AVAILABLE",
    location: "Downtown garage",
    publicDescription:
      "Elegant sport sedan with a refined cabin, agile handling, and the polished comfort Mercedes is known for.",
    features: ["Leather", "Sunroof", "Apple CarPlay", "Adaptive cruise", "Ambient lighting"],
    rules: ["No smoking", "Return with same fuel level", "Valid driver's license required"],
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=80"
  },
  {
    vin: "5TDYSKFC1RS000004",
    make: "Toyota",
    model: "Sienna",
    year: 2024,
    licensePlate: "FP-2414",
    mileage: 12088,
    fuelLevel: 72,
    dailyRate: 92,
    status: "AVAILABLE",
    location: "North branch",
    publicDescription:
      "Hybrid minivan that seats eight with room to spare — the easy, economical pick for families and group trips.",
    features: ["Hybrid", "Seats 8", "Sliding doors", "Apple CarPlay", "Rear climate"],
    rules: ["No smoking", "Return with same fuel level", "Valid driver's license required"],
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=900&q=80"
  }
];

function futureBlocks(daysOut, length) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysOut);
  const end = new Date(start);
  end.setDate(start.getDate() + length);
  return { startsAt: start, endsAt: end };
}

async function main() {
  console.log(`Seeding tenant "${NAME}" (/${SLUG})…`);

  const organization = await prisma.organization.upsert({
    where: { slug: SLUG },
    update: { name: NAME, domain: DOMAIN },
    create: { name: NAME, slug: SLUG, domain: DOMAIN }
  });

  await prisma.websiteSetting.upsert({
    where: { organizationId: organization.id },
    update: website,
    create: { organizationId: organization.id, ...website }
  });
  console.log("  ✓ organization + host profile");

  for (const v of fleet) {
    const vehicle = await prisma.vehicle.upsert({
      where: { organizationId_vin: { organizationId: organization.id, vin: v.vin } },
      update: {
        make: v.make,
        model: v.model,
        year: v.year,
        licensePlate: v.licensePlate,
        mileage: v.mileage,
        fuelLevel: v.fuelLevel,
        dailyRate: v.dailyRate,
        status: v.status,
        location: v.location,
        publicDescription: v.publicDescription,
        features: v.features,
        rules: v.rules
      },
      create: {
        organizationId: organization.id,
        vin: v.vin,
        make: v.make,
        model: v.model,
        year: v.year,
        licensePlate: v.licensePlate,
        mileage: v.mileage,
        fuelLevel: v.fuelLevel,
        dailyRate: v.dailyRate,
        status: v.status,
        location: v.location,
        publicDescription: v.publicDescription,
        features: v.features,
        rules: v.rules
      }
    });

    // One cover image per vehicle — replace rather than stack on re-runs.
    await prisma.vehicleImage.deleteMany({ where: { vehicleId: vehicle.id } });
    await prisma.vehicleImage.create({
      data: { vehicleId: vehicle.id, url: v.image, alt: `${v.year} ${v.make} ${v.model}`, sortOrder: 0 }
    });

    // A couple of upcoming "booked" windows so the calendar looks alive.
    await prisma.vehicleAvailabilityBlock.deleteMany({ where: { vehicleId: vehicle.id } });
    const b1 = futureBlocks(6, 3);
    const b2 = futureBlocks(20, 2);
    await prisma.vehicleAvailabilityBlock.createMany({
      data: [
        { organizationId: organization.id, vehicleId: vehicle.id, reason: "Reserved", ...b1 },
        { organizationId: organization.id, vehicleId: vehicle.id, reason: "Unavailable", ...b2 }
      ]
    });
  }
  console.log(`  ✓ ${fleet.length} vehicles with images + availability`);

  if (OWNER_USER_ID) {
    if (!OWNER_EMAIL) throw new Error("SEED_OWNER_EMAIL is required when SEED_OWNER_USER_ID is set.");
    await prisma.user.upsert({
      where: { id: OWNER_USER_ID },
      update: { email: OWNER_EMAIL },
      create: { id: OWNER_USER_ID, email: OWNER_EMAIL, fullName: OWNER_EMAIL.split("@")[0] }
    });
    await prisma.membership.upsert({
      where: { organizationId_userId: { organizationId: organization.id, userId: OWNER_USER_ID } },
      update: { role: "OWNER" },
      create: { organizationId: organization.id, userId: OWNER_USER_ID, role: "OWNER", tosAcceptedAt: new Date() }
    });
    console.log(`  ✓ linked owner ${OWNER_EMAIL}`);
  } else {
    console.log("  • no owner linked (set SEED_OWNER_USER_ID + SEED_OWNER_EMAIL to grant dashboard access)");
  }

  console.log(`\nDone. Booking site live at /${SLUG} (or https://${DOMAIN}).`);
  console.log("With a real org now in the DB, set ALLOW_DEMO_TENANT=false in production to retire the sample fallback.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
