import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const org = {
  id: "org_luxe_drive",
  name: "LuxeDrive Rentals",
  slug: "luxedrive",
  domain: "luxedrive.fleetpilot.ai"
};

const vehicles = [
  {
    id: "veh_001",
    make: "Tesla",
    model: "Model Y",
    year: 2024,
    vin: "7SAYGDEE8RF000001",
    licensePlate: "FP-2401",
    mileage: 18420,
    fuelLevel: 84,
    status: "AVAILABLE",
    location: "Downtown garage",
    dailyRate: 128,
    image: "https://images.unsplash.com/photo-1617704548623-340376564e68?auto=format&fit=crop&w=900&q=80",
    description: "A quiet, quick electric SUV with premium tech, glass roof, and room for weekend luggage.",
    features: ["Autopilot", "Panoramic roof", "Heated seats", "Fast charging"],
    rules: ["No smoking", "No pets without approval", "Return with 80% charge"]
  },
  {
    id: "veh_002",
    make: "BMW",
    model: "X5",
    year: 2023,
    vin: "5UXCR6C03P9000002",
    licensePlate: "FP-2308",
    mileage: 32610,
    fuelLevel: 61,
    status: "AVAILABLE",
    location: "Airport lot",
    dailyRate: 155,
    image: "https://images.unsplash.com/photo-1607853554439-0069ec0f29b6?auto=format&fit=crop&w=900&q=80",
    description: "Luxury SUV with confident handling, spacious seating, and premium cabin comfort.",
    features: ["All-wheel drive", "Leather interior", "Apple CarPlay", "Navigation"],
    rules: ["No smoking", "Premium fuel only", "Return clean"]
  },
  {
    id: "veh_003",
    make: "Mercedes-Benz",
    model: "C300",
    year: 2022,
    vin: "55SWF8DB2NU000003",
    licensePlate: "FP-2217",
    mileage: 41192,
    fuelLevel: 38,
    status: "MAINTENANCE",
    location: "Service bay 2",
    dailyRate: 119,
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=80",
    description: "Elegant sport sedan with a smooth ride, refined interior, and business-ready presence.",
    features: ["Bluetooth", "Sunroof", "Backup camera", "Blind spot assist"],
    rules: ["No smoking", "No track use", "Return with same fuel level"]
  },
  {
    id: "veh_004",
    make: "Toyota",
    model: "Sienna",
    year: 2024,
    vin: "5TDYSKFC1RS000004",
    licensePlate: "FP-2414",
    mileage: 12088,
    fuelLevel: 72,
    status: "AVAILABLE",
    location: "North branch",
    dailyRate: 92,
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=900&q=80",
    description: "Comfortable hybrid minivan for families, groups, airport runs, and longer trips.",
    features: ["7 seats", "Hybrid efficiency", "Power sliding doors", "Large cargo space"],
    rules: ["No smoking", "Pets by approval", "Return reasonably clean"]
  }
];

const customers = [
  { id: "cus_001", name: "Avery Johnson", email: "avery@example.com", phone: "(404) 555-0192", licenseStatus: "Verified", customerType: "VIP" },
  { id: "cus_002", name: "Northstar Productions", email: "ops@northstar.example", phone: "(404) 555-0171", licenseStatus: "Verified", customerType: "Corporate" },
  { id: "cus_003", name: "Mia Chen", email: "mia@example.com", phone: "(404) 555-0128", licenseStatus: "Pending", customerType: "Retail" }
];

const agreement = {
  businessName: "LuxeDrive Rentals",
  businessAddress: "Austin, TX",
  phone: "(512) 555-0148",
  email: "reservations@luxedrive.fleetpilot.ai",
  terms: "Renter agrees to operate the vehicle lawfully, safely, and only during the confirmed reservation period.",
  mileagePolicy: "Daily mileage limits are shown at booking. Extra mileage may be charged after return.",
  fuelPolicy: "Vehicle must be returned with the same fuel or charge level provided at pickup unless prepaid fuel is selected.",
  smokingPolicy: "Smoking and vaping are prohibited. Evidence of smoke odor, ash, or burn marks may result in cleaning or damage fees.",
  petPolicy: "Pets are not permitted unless approved in writing before pickup.",
  lateReturnPolicy: "Late returns may be charged additional rental time and fees.",
  cleaningFee: "Excessive dirt, stains, odor, biohazards, or trash may result in cleaning fees.",
  damagePolicy: "Renter must report accidents, theft, vandalism, mechanical issues, and damage immediately.",
  insuranceTerms: "Renter must maintain valid insurance or purchase/accept an offered protection option where available.",
  roadsideAssistance: "Roadside assistance instructions are provided after booking.",
  securityDeposit: "A refundable security deposit may be authorized before pickup and released after inspection.",
  cancellationPolicy: "Free cancellation up to 24 hours before pickup. Late cancellations may be charged one rental day.",
  prohibitedUses: "Vehicle may not be used for racing, rideshare, delivery, towing, off-road driving, illegal activity, or operation by an unauthorized driver.",
  eligibilityRequirements: "Renter must be at least 21 years old, hold a valid driver's license, and present a matching payment card.",
  liabilityWaiver: "Renter acknowledges that operating a motor vehicle involves inherent risks and accepts responsibility as permitted by law.",
  disputeResolution: "Disputes will be handled under the laws and procedures applicable in the pickup state.",
  governingLaw: "This agreement is governed by the laws of the state where the vehicle is picked up.",
  forceMajeure: "Neither party is liable for failure to perform due to causes beyond reasonable control.",
  platformDisclaimer: "FleetPilot AI is a technology platform and is not a party to the rental agreement.",
  stateClauses: "State-specific rights, notices, insurance rules, and consumer protections apply where required by law.",
  signatureDisclosure: "By signing electronically, renter consents to electronic records and signatures under applicable e-signature laws.",
  activeVersion: 1
};

function dateAt(date, time) {
  return new Date(`${date}T${time}:00.000Z`);
}

async function main() {
  await prisma.organization.upsert({
    where: { slug: org.slug },
    update: { name: org.name, domain: org.domain },
    create: org
  });

  await prisma.websiteSetting.upsert({
    where: { organizationId: org.id },
    update: {
      brandColor: "#166534",
      heroTitle: "Premium vehicles, booked in minutes.",
      about: "LuxeDrive Rentals is a local premium car rental host with a curated fleet, fast digital booking, and responsive pickup support.",
      serviceArea: "Austin, TX",
      contactEmail: "reservations@luxedrive.fleetpilot.ai",
      contactPhone: "(512) 555-0148",
      pickupInstructions: "Pickup details are sent after checkout. Bring a valid driver's license and matching payment card.",
      cancellationPolicy: "Free cancellation up to 24 hours before pickup. Late cancellations may be charged one rental day.",
      depositPolicy: "A refundable security deposit is authorized at booking and released after return inspection.",
      businessHours: "Mon-Sat 8:00 AM-7:00 PM, Sun 10:00 AM-4:00 PM",
      trustBadges: ["Verified fleet", "Roadside support", "Contactless booking"],
      seoTitle: "LuxeDrive Rentals",
      depositFeeCents: 25000,
      taxRatePct: 8,
      platformFeePct: 10
    },
    create: {
      organizationId: org.id,
      brandColor: "#166534",
      heroTitle: "Premium vehicles, booked in minutes.",
      about: "LuxeDrive Rentals is a local premium car rental host with a curated fleet, fast digital booking, and responsive pickup support.",
      serviceArea: "Austin, TX",
      contactEmail: "reservations@luxedrive.fleetpilot.ai",
      contactPhone: "(512) 555-0148",
      pickupInstructions: "Pickup details are sent after checkout. Bring a valid driver's license and matching payment card.",
      cancellationPolicy: "Free cancellation up to 24 hours before pickup. Late cancellations may be charged one rental day.",
      depositPolicy: "A refundable security deposit is authorized at booking and released after return inspection.",
      businessHours: "Mon-Sat 8:00 AM-7:00 PM, Sun 10:00 AM-4:00 PM",
      trustBadges: ["Verified fleet", "Roadside support", "Contactless booking"],
      seoTitle: "LuxeDrive Rentals",
      depositFeeCents: 25000,
      taxRatePct: 8,
      platformFeePct: 10
    }
  });

  for (const vehicle of vehicles) {
    const saved = await prisma.vehicle.upsert({
      where: { organizationId_vin: { organizationId: org.id, vin: vehicle.vin } },
      update: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        mileage: vehicle.mileage,
        fuelLevel: vehicle.fuelLevel,
        dailyRate: vehicle.dailyRate,
        publicDescription: vehicle.description,
        features: vehicle.features,
        rules: vehicle.rules,
        status: vehicle.status,
        location: vehicle.location
      },
      create: {
        id: vehicle.id,
        organizationId: org.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        licensePlate: vehicle.licensePlate,
        mileage: vehicle.mileage,
        fuelLevel: vehicle.fuelLevel,
        dailyRate: vehicle.dailyRate,
        publicDescription: vehicle.description,
        features: vehicle.features,
        rules: vehicle.rules,
        status: vehicle.status,
        location: vehicle.location
      }
    });

    await prisma.vehicleImage.deleteMany({ where: { vehicleId: saved.id } });
    await prisma.vehicleImage.create({
      data: {
        vehicleId: saved.id,
        url: vehicle.image,
        alt: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        sortOrder: 0
      }
    });
  }

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { organizationId_email: { organizationId: org.id, email: customer.email } },
      update: {
        name: customer.name,
        phone: customer.phone,
        licenseStatus: customer.licenseStatus,
        customerType: customer.customerType
      },
      create: {
        ...customer,
        organizationId: org.id
      }
    });
  }

  await prisma.reservation.upsert({
    where: { id: "res_001" },
    update: {},
    create: {
      id: "res_001",
      organizationId: org.id,
      customerId: "cus_001",
      vehicleId: "veh_001",
      startsAt: dateAt("2026-07-03", "09:00"),
      endsAt: dateAt("2026-07-05", "10:00"),
      status: "CONFIRMED",
      totalCents: 38400,
      depositCents: 25000,
      signedAt: new Date()
    }
  });

  await prisma.insuranceSetting.upsert({
    where: { organizationId: org.id },
    update: {
      requireInsurance: true,
      allowOwnInsurance: true,
      allowDecline: false,
      manualApproval: true
    },
    create: {
      organizationId: org.id,
      requireInsurance: true,
      allowOwnInsurance: true,
      allowDecline: false,
      manualApproval: true
    }
  });

  const existingTemplate = await prisma.agreementTemplate.findFirst({ where: { organizationId: org.id } });
  if (existingTemplate) {
    await prisma.agreementTemplate.update({ where: { id: existingTemplate.id }, data: agreement });
  } else {
    await prisma.agreementTemplate.create({ data: { organizationId: org.id, ...agreement } });
  }

  await prisma.message.create({
    data: {
      organizationId: org.id,
      channel: "Support",
      subject: "Pickup question",
      customerName: "Demo Customer",
      customerEmail: "guest@example.com",
      reservationRef: "res_001",
      status: "open",
      body: "Can I pick up the vehicle 30 minutes earlier than my scheduled reservation time?"
    }
  });

  const counts = await Promise.all([
    prisma.organization.count({ where: { slug: org.slug } }),
    prisma.vehicle.count({ where: { organizationId: org.id } }),
    prisma.customer.count({ where: { organizationId: org.id } }),
    prisma.reservation.count({ where: { organizationId: org.id } }),
    prisma.message.count({ where: { organizationId: org.id, channel: "Support" } })
  ]);

  console.log(JSON.stringify({
    organization: counts[0],
    vehicles: counts[1],
    customers: counts[2],
    reservations: counts[3],
    supportMessages: counts[4]
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
