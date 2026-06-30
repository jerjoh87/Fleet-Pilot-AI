import type { Vehicle, VehicleStatus } from "@/lib/types";
import { organization as demoOrg, vehicles as demoVehicles } from "@/lib/demo-data";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export type PublicTenant = {
  id: string;
  name: string;
  slug: string;
  domain: string;
  brandColor: string;
  heroTitle: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  backgroundStyle: "soft" | "solid" | "cover";
  about: string;
  serviceArea: string;
  contactEmail: string;
  contactPhone: string;
  instagramUrl: string;
  facebookUrl: string;
  pickupInstructions: string;
  cancellationPolicy: string;
  depositPolicy: string;
  businessHours: string;
  trustBadges: string[];
  depositFee: number;
  taxRatePct: number;
  platformFeePct: number;
};

/** Public-facing vehicle shape — omits VIN / plate and other internal fields. */
export type PublicVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  dailyRate: number;
  status: VehicleStatus;
  location: string;
  image: string;
  seats: number;
  transmission: string;
  fuelType: string;
  publicDescription: string;
  features: string[];
  rules: string[];
  /** Marketplace social proof — derived deterministically so it stays stable per vehicle. */
  rating: number;
  trips: number;
  host: string;
  hostInitials: string;
  hostAllStar: boolean;
};

export type AvailabilityBlock = {
  startsAt: string;
  endsAt: string;
  reason: string;
};

export type PortalReservation = {
  id: string;
  customerName: string;
  customerEmail: string;
  vehicleName: string;
  vehicleImage: string;
  startsAt: string;
  endsAt: string;
  status: string;
  totalCents: number;
  depositCents: number;
  paymentStatus: string;
  contractSigned: boolean;
};

export type PortalProfile = {
  name: string;
  email: string;
  phone: string | null;
  licenseStatus: string;
  memberSince: string;
};

export type PortalPayment = {
  id: string;
  reservationId: string;
  vehicleName: string;
  amountCents: number;
  kind: string;
  status: string;
  date: string;
};

export type PortalAgreement = {
  reservationId: string;
  vehicleName: string;
  legalName: string;
  agreedAt: string;
  status: string;
  downloadHref: string;
};

export type PortalInsuranceUpload = {
  id: string;
  insuranceCompany: string;
  policyNumber: string;
  policyHolderName: string;
  expirationDate: string | null;
  status: string;
  documentCount: number;
};

export type PortalInsurancePurchase = {
  id: string;
  planName: string;
  coverageSummary: string;
  totalPriceCents: number;
  policyNumber: string | null;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
};

export type PortalAccount = {
  profile: PortalProfile | null;
  reservations: PortalReservation[];
  payments: PortalPayment[];
  agreements: PortalAgreement[];
  insuranceUploads: PortalInsuranceUpload[];
  insurancePurchases: PortalInsurancePurchase[];
};

const vehicleStatusMap: Record<string, VehicleStatus> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  RENTED: "Rented",
  CLEANING: "Cleaning",
  MAINTENANCE: "Maintenance",
  OUT_OF_SERVICE: "Out of Service",
  RETIRED: "Retired"
};

function prettifySlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function deriveSpecs(vehicle: Pick<Vehicle, "make" | "model">) {
  const isVan = /sienna|odyssey|transit|sprinter/i.test(vehicle.model);
  const isEv = /tesla|model|ev|ioniq|lucid/i.test(`${vehicle.make} ${vehicle.model}`);
  return {
    seats: isVan ? 7 : 5,
    transmission: "Automatic",
    fuelType: isEv ? "Electric" : "Gasoline"
  };
}

const HOST_NAMES = ["Marcus T.", "Elena R.", "David K.", "Sophia L.", "James W.", "Aisha M.", "Carlos D.", "Nina P."];

/** FNV-1a — good avalanche so ids differing by one char (veh_001 vs veh_002) spread widely. */
function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Derive Turo-style marketplace social proof (rating, trip count, host) from the
 * vehicle id so the same vehicle always shows the same numbers without storing them.
 * Each field uses a salted hash so they vary independently across the fleet.
 */
function deriveMarketplace(id: string) {
  const ratingHash = hashString(`${id}:rating`);
  const tripsHash = hashString(`${id}:trips`);
  const hostHash = hashString(`${id}:host`);
  const host = HOST_NAMES[hostHash % HOST_NAMES.length];
  return {
    // 4.5–5.0 in 0.1 steps
    rating: Math.round((4.5 + (ratingHash % 6) * 0.1) * 10) / 10,
    trips: 24 + (tripsHash % 286),
    host,
    hostInitials: host.split(" ").map((part) => part[0]).join(""),
    hostAllStar: hostHash % 4 !== 0
  };
}

function toPublicVehicle(vehicle: Vehicle): PublicVehicle {
  const specs = deriveSpecs(vehicle);
  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    dailyRate: vehicle.dailyRate,
    status: vehicle.status,
    location: vehicle.location,
    image: vehicle.image,
    publicDescription: vehicle.publicDescription ?? `A well-maintained ${vehicle.year} ${vehicle.make} ${vehicle.model} ready for your next trip.`,
    features: vehicle.features?.length ? vehicle.features : ["Automatic transmission", "Clean interior", "Flexible pickup"],
    rules: vehicle.rules?.length ? vehicle.rules : ["No smoking", "Return with same fuel level", "Valid driver's license required"],
    ...specs,
    ...deriveMarketplace(vehicle.id)
  };
}

function demoTenant(slug: string): PublicTenant {
  const isDemoOrg = slug === demoOrg.slug;
  return {
    id: demoOrg.id,
    name: isDemoOrg ? demoOrg.name : prettifySlug(slug),
    slug,
    domain: `${slug}.fleetpilot.ai`,
    brandColor: "#166534",
    heroTitle: "Premium vehicles, booked in minutes.",
    logoUrl: null,
    coverImageUrl: null,
    backgroundStyle: "soft",
    about: "LuxeDrive Rentals is a local premium car rental host with a curated fleet, fast digital booking, and responsive pickup support.",
    serviceArea: "Austin, TX",
    contactEmail: "reservations@luxedrive.fleetpilot.ai",
    contactPhone: "(512) 555-0148",
    instagramUrl: "",
    facebookUrl: "",
    pickupInstructions: "Pickup details are sent after checkout. Please bring a valid driver's license and matching payment card.",
    cancellationPolicy: "Free cancellation up to 24 hours before pickup. Late cancellations may be charged one rental day.",
    depositPolicy: "A refundable security deposit is authorized at booking and released after return inspection.",
    businessHours: "Mon-Sat 8:00 AM-7:00 PM, Sun 10:00 AM-4:00 PM",
    trustBadges: ["Verified fleet", "Roadside support", "Contactless booking"],
    depositFee: 250,
    taxRatePct: 8,
    platformFeePct: 10
  };
}

/**
 * Whether the hardcoded "luxedrive" demo tenant may be served as a fallback.
 * Always on without a database (local dev). With a database, it powers the
 * marketing site's "see a live booking site" link — set ALLOW_DEMO_TENANT=false
 * in production once you have real tenants (or have seeded LuxeDrive for real)
 * so the sample data never shadows a live booking site.
 */
function demoFallbackEnabled(): boolean {
  if (!isDatabaseConfigured()) return true;
  return process.env.ALLOW_DEMO_TENANT !== "false";
}

async function isDemoFallback(slug: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return true;
  if (!demoFallbackEnabled() || slug !== demoOrg.slug) return false;
  const org = await prisma.organization.findFirst({
    where: { OR: [{ slug }, { domain: slug }] },
    select: { id: true }
  });
  return !org;
}

export async function getPublicTenant(slug: string): Promise<PublicTenant | null> {
  if (!isDatabaseConfigured()) {
    return demoTenant(slug);
  }

  // `slug` may be a real slug (path / subdomain) or a custom domain hostname.
  const org = await prisma.organization.findFirst({
    where: { OR: [{ slug }, { domain: slug }] },
    include: { websiteSettings: true }
  });

  if (!org) {
    return demoFallbackEnabled() && slug === demoOrg.slug ? demoTenant(slug) : null;
  }

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    domain: org.domain ?? `${org.slug}.fleetpilot.ai`,
    brandColor: org.websiteSettings?.brandColor ?? "#166534",
    heroTitle: org.websiteSettings?.heroTitle ?? "Premium vehicles, booked in minutes.",
    logoUrl: org.websiteSettings?.logoUrl ?? null,
    coverImageUrl: org.websiteSettings?.coverImageUrl ?? null,
    backgroundStyle: (org.websiteSettings?.backgroundStyle as PublicTenant["backgroundStyle"] | null) ?? "soft",
    about: org.websiteSettings?.about ?? "",
    serviceArea: org.websiteSettings?.serviceArea ?? "",
    contactEmail: org.websiteSettings?.contactEmail ?? "",
    contactPhone: org.websiteSettings?.contactPhone ?? "",
    instagramUrl: org.websiteSettings?.instagramUrl ?? "",
    facebookUrl: org.websiteSettings?.facebookUrl ?? "",
    pickupInstructions: org.websiteSettings?.pickupInstructions ?? "",
    cancellationPolicy: org.websiteSettings?.cancellationPolicy ?? "",
    depositPolicy: org.websiteSettings?.depositPolicy ?? "",
    businessHours: org.websiteSettings?.businessHours ?? "",
    trustBadges: org.websiteSettings?.trustBadges ?? [],
    depositFee: (org.websiteSettings?.depositFeeCents ?? 25000) / 100,
    taxRatePct: Number(org.websiteSettings?.taxRatePct ?? 8),
    platformFeePct: Number(org.websiteSettings?.platformFeePct ?? 10)
  };
}

export type FleetFilters = {
  query?: string;
  maxRate?: number;
  fuelType?: string;
};

export async function getPublicFleet(slug: string, filters: FleetFilters = {}): Promise<PublicVehicle[]> {
  let fleet: PublicVehicle[];

  if (!isDatabaseConfigured() || await isDemoFallback(slug)) {
    fleet = demoVehicles.map(toPublicVehicle);
  } else {
    const org = await prisma.organization.findFirst({
      where: { OR: [{ slug }, { domain: slug }] },
      select: { id: true }
    });
    if (!org) return [];

    const dbVehicles = await prisma.vehicle.findMany({
      where: { organizationId: org.id, status: { notIn: ["RETIRED", "OUT_OF_SERVICE"] } },
      include: { images: true },
      orderBy: { dailyRate: "asc" }
    });

    fleet = dbVehicles.map((vehicle) =>
      toPublicVehicle({
        id: vehicle.id,
        organizationId: vehicle.organizationId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        licensePlate: vehicle.licensePlate,
        mileage: vehicle.mileage,
        fuelLevel: Number(vehicle.fuelLevel),
        status: vehicleStatusMap[vehicle.status] ?? "Available",
        location: vehicle.location ?? "Main branch",
        dailyRate: Number(vehicle.dailyRate),
        publicDescription: vehicle.publicDescription ?? "",
        features: vehicle.features,
        rules: vehicle.rules,
        revenueMtd: 0,
        profitMtd: 0,
        nextMaintenance: "",
        registrationExpires: "",
        insuranceExpires: "",
        image:
          vehicle.images[0]?.url ??
          "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80",
        documents: [],
        damageReports: 0
      })
    );
  }

  const query = filters.query?.toLowerCase().trim();
  return fleet.filter((vehicle) => {
    if (query && !`${vehicle.make} ${vehicle.model} ${vehicle.location}`.toLowerCase().includes(query)) {
      return false;
    }
    if (filters.maxRate && vehicle.dailyRate > filters.maxRate) {
      return false;
    }
    if (filters.fuelType && filters.fuelType !== "Any" && vehicle.fuelType !== filters.fuelType) {
      return false;
    }
    return true;
  });
}

export async function getPublicVehicle(slug: string, vehicleId: string): Promise<PublicVehicle | null> {
  const fleet = await getPublicFleet(slug);
  return fleet.find((vehicle) => vehicle.id === vehicleId) ?? null;
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function demoAvailabilityBlocks(vehicleId: string): AvailabilityBlock[] {
  const seed = hashString(`${vehicleId}:availability`);
  const today = new Date();
  return Array.from({ length: 5 }).map((_, index) => {
    const start = new Date(today);
    start.setDate(today.getDate() + 5 + index * 9 + (seed % 4));
    const end = new Date(start);
    end.setDate(start.getDate() + 2 + ((seed + index) % 3));
    return {
      startsAt: toDateOnly(start),
      endsAt: toDateOnly(end),
      reason: index % 2 === 0 ? "Reserved" : "Unavailable"
    };
  });
}

export async function getVehicleAvailability(slug: string, vehicleId: string): Promise<AvailabilityBlock[]> {
  if (!isDatabaseConfigured() || await isDemoFallback(slug)) {
    return demoAvailabilityBlocks(vehicleId);
  }

  const org = await prisma.organization.findFirst({
    where: { OR: [{ slug }, { domain: slug }] },
    select: { id: true }
  });
  if (!org) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setMonth(horizon.getMonth() + 8);

  const [reservations, blocks] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        organizationId: org.id,
        vehicleId,
        status: { in: ["QUOTE", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "LATE"] },
        endsAt: { gte: today },
        startsAt: { lte: horizon }
      },
      select: { startsAt: true, endsAt: true, status: true }
    }),
    prisma.vehicleAvailabilityBlock.findMany({
      where: {
        organizationId: org.id,
        vehicleId,
        endsAt: { gte: today },
        startsAt: { lte: horizon }
      },
      select: { startsAt: true, endsAt: true, reason: true }
    })
  ]);

  return [
    ...reservations.map((reservation) => ({
      startsAt: toDateOnly(reservation.startsAt),
      endsAt: toDateOnly(reservation.endsAt),
      reason: reservation.status === "QUOTE" ? "Held" : "Reserved"
    })),
    ...blocks.map((block) => ({
      startsAt: toDateOnly(block.startsAt),
      endsAt: toDateOnly(block.endsAt),
      reason: block.reason
    }))
  ].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function reservationStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getPortalReservations(
  slug: string,
  filters: { reservationId?: string; email?: string }
): Promise<PortalReservation[]> {
  const reservationId = filters.reservationId?.trim();
  const email = filters.email?.trim().toLowerCase();
  if (!reservationId && !email) return [];

  if (!isDatabaseConfigured()) {
    const fleet = await getPublicFleet(slug);
    const vehicle = fleet[0];
    if (!vehicle || (!reservationId && !email)) return [];
    const start = new Date();
    start.setDate(start.getDate() + 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 3);
    return [{
      id: reservationId || "demo-reservation",
      customerName: email ? "Demo Customer" : "Guest",
      customerEmail: email || "guest@example.com",
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      vehicleImage: vehicle.image,
      startsAt: toDateOnly(start),
      endsAt: toDateOnly(end),
      status: "Confirmed",
      totalCents: vehicle.dailyRate * 3 * 100,
      depositCents: 25000,
      paymentStatus: "Demo",
      contractSigned: false
    }];
  }

  const org = await prisma.organization.findFirst({
    where: { OR: [{ slug }, { domain: slug }] },
    select: { id: true }
  });
  if (!org) {
    if (await isDemoFallback(slug)) {
      const fleet = await getPublicFleet(slug);
      const vehicle = fleet[0];
      if (!vehicle || (!reservationId && !email)) return [];
      const start = new Date();
      start.setDate(start.getDate() + 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 3);
      return [{
        id: reservationId || "demo-reservation",
        customerName: email ? "Demo Customer" : "Guest",
        customerEmail: email || "guest@example.com",
        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        vehicleImage: vehicle.image,
        startsAt: toDateOnly(start),
        endsAt: toDateOnly(end),
        status: "Confirmed",
        totalCents: vehicle.dailyRate * 3 * 100,
        depositCents: 25000,
        paymentStatus: "Demo",
        contractSigned: false
      }];
    }
    return [];
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      organizationId: org.id,
      ...(reservationId ? { id: reservationId } : {}),
      ...(email ? { customer: { email: { equals: email, mode: "insensitive" } } } : {})
    },
    include: {
      customer: true,
      vehicle: { include: { images: true } },
      payments: { orderBy: { createdAt: "desc" } },
      contract: true
    },
    orderBy: { startsAt: "desc" },
    take: 12
  });

  return reservations.map((reservation) => {
    const paid = reservation.payments.some((payment) => payment.status.toLowerCase() === "paid");
    const latestPayment = reservation.payments[0]?.status;
    return {
      id: reservation.id,
      customerName: reservation.customer.name,
      customerEmail: reservation.customer.email,
      vehicleName: `${reservation.vehicle.year} ${reservation.vehicle.make} ${reservation.vehicle.model}`,
      vehicleImage:
        reservation.vehicle.images[0]?.url ??
        "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80",
      startsAt: toDateOnly(reservation.startsAt),
      endsAt: toDateOnly(reservation.endsAt),
      status: reservationStatusLabel(reservation.status),
      totalCents: reservation.totalCents,
      depositCents: reservation.depositCents,
      paymentStatus: paid ? "Paid" : latestPayment ? reservationStatusLabel(latestPayment) : "Pending",
      contractSigned: Boolean(reservation.contract?.signedAt)
    };
  });
}

const DEFAULT_VEHICLE_IMAGE =
  "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80";

/**
 * Everything a signed-in customer needs in one place — profile, booking
 * history, receipts, signed agreements, and insurance — keyed off their
 * (trusted) authenticated email so no manual reservation lookup is required.
 */
export async function getPortalAccount(slug: string, email: string): Promise<PortalAccount> {
  const empty: PortalAccount = {
    profile: null,
    reservations: [],
    payments: [],
    agreements: [],
    insuranceUploads: [],
    insurancePurchases: []
  };

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !isDatabaseConfigured()) return empty;

  const org = await prisma.organization.findFirst({
    where: { OR: [{ slug }, { domain: slug }] },
    select: { id: true }
  });
  if (!org) return empty;

  const customer = await prisma.customer.findFirst({
    where: { organizationId: org.id, email: { equals: normalizedEmail, mode: "insensitive" } }
  });
  if (!customer) return empty;

  const reservations = await prisma.reservation.findMany({
    where: { organizationId: org.id, customerId: customer.id },
    include: {
      vehicle: { include: { images: true } },
      payments: { orderBy: { createdAt: "desc" } },
      contract: true,
      rentalAgreement: true
    },
    orderBy: { startsAt: "desc" }
  });

  const reservationIds = reservations.map((reservation) => reservation.id);
  const vehicleLabel = (reservation: (typeof reservations)[number]) =>
    `${reservation.vehicle.year} ${reservation.vehicle.make} ${reservation.vehicle.model}`;

  const [uploads, purchases] = await Promise.all([
    prisma.customerInsuranceUpload.findMany({
      where: {
        organizationId: org.id,
        OR: [{ customerId: customer.id }, ...(reservationIds.length ? [{ reservationId: { in: reservationIds } }] : [])]
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.insurancePurchase.findMany({
      where: {
        organizationId: org.id,
        OR: [{ customerId: customer.id }, ...(reservationIds.length ? [{ reservationId: { in: reservationIds } }] : [])]
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const docCounts = uploads.length
    ? await prisma.insuranceDocument.groupBy({
        by: ["uploadId"],
        where: { uploadId: { in: uploads.map((upload) => upload.id) } },
        _count: { _all: true }
      })
    : [];
  const docCountByUpload = new Map(docCounts.map((row) => [row.uploadId, row._count._all]));

  return {
    profile: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      licenseStatus: customer.licenseStatus,
      memberSince: customer.createdAt.toLocaleString("en-US", { month: "long", year: "numeric" })
    },
    reservations: reservations.map((reservation) => {
      const paid = reservation.payments.some((payment) => payment.status.toLowerCase() === "paid");
      const latestPayment = reservation.payments[0]?.status;
      return {
        id: reservation.id,
        customerName: customer.name,
        customerEmail: customer.email,
        vehicleName: vehicleLabel(reservation),
        vehicleImage: reservation.vehicle.images[0]?.url ?? DEFAULT_VEHICLE_IMAGE,
        startsAt: toDateOnly(reservation.startsAt),
        endsAt: toDateOnly(reservation.endsAt),
        status: reservationStatusLabel(reservation.status),
        totalCents: reservation.totalCents,
        depositCents: reservation.depositCents,
        paymentStatus: paid ? "Paid" : latestPayment ? reservationStatusLabel(latestPayment) : "Pending",
        contractSigned: Boolean(reservation.contract?.signedAt || reservation.rentalAgreement)
      };
    }),
    payments: reservations.flatMap((reservation) =>
      reservation.payments.map((payment) => ({
        id: payment.id,
        reservationId: reservation.id,
        vehicleName: vehicleLabel(reservation),
        amountCents: payment.amountCents,
        kind: payment.kind,
        status: reservationStatusLabel(payment.status),
        date: toDateOnly(payment.createdAt)
      }))
    ),
    agreements: reservations
      .filter((reservation) => reservation.rentalAgreement)
      .map((reservation) => ({
        reservationId: reservation.id,
        vehicleName: vehicleLabel(reservation),
        legalName: reservation.rentalAgreement!.legalName,
        agreedAt: toDateOnly(reservation.rentalAgreement!.agreedAt),
        status: reservationStatusLabel(reservation.rentalAgreement!.status),
        downloadHref: `/api/public/contracts/${reservation.id}?email=${encodeURIComponent(customer.email)}`
      })),
    insuranceUploads: uploads.map((upload) => ({
      id: upload.id,
      insuranceCompany: upload.insuranceCompany,
      policyNumber: upload.policyNumber,
      policyHolderName: upload.policyHolderName,
      expirationDate: upload.expirationDate ? toDateOnly(upload.expirationDate) : null,
      status: reservationStatusLabel(upload.status),
      documentCount: docCountByUpload.get(upload.id) ?? 0
    })),
    insurancePurchases: purchases.map((purchase) => ({
      id: purchase.id,
      planName: purchase.planName,
      coverageSummary: purchase.coverageSummary,
      totalPriceCents: purchase.totalPriceCents,
      policyNumber: purchase.policyNumber,
      status: reservationStatusLabel(purchase.status),
      startsAt: purchase.startsAt ? toDateOnly(purchase.startsAt) : null,
      endsAt: purchase.endsAt ? toDateOnly(purchase.endsAt) : null
    }))
  };
}

/* -------------------------------------------------------------------------- */
/*  Reviews + trust layer (Airbnb-style host profile)                          */
/* -------------------------------------------------------------------------- */

export type HostProfile = {
  name: string;
  initials: string;
  rating: number;
  reviewCount: number;
  completedTrips: number;
  responseRate: number;
  responseTime: string;
  joinedYear: number;
  verifications: string[];
};

export type PublicReview = {
  id: string;
  author: string;
  initials: string;
  rating: number;
  date: string;
  body: string;
  vehicle: string;
};

const REVIEW_AUTHORS = [
  "Jordan M.", "Priya S.", "Daniel R.", "Maya K.", "Andre W.", "Chloe T.",
  "Marcus B.", "Lena F.", "Theo P.", "Sofia G.", "Ethan L.", "Naomi C."
];

const REVIEW_BODIES = [
  "Spotless car and seamless pickup. {host} had everything ready and the booking process took two minutes. Would absolutely rent again.",
  "Exactly as described. Communication was fast and the car drove beautifully. Easiest rental I've done.",
  "Great experience from start to finish. The {vehicle} was immaculate and {host} was super responsive to every question.",
  "Smooth handoff, fair deposit, and the car was clean and fully fueled. Highly recommend this host.",
  "{host} went above and beyond — flexible on timing and the {vehicle} was a dream on the highway.",
  "Booked for a weekend trip and it could not have been smoother. Verified, professional, and friendly.",
  "Top-tier host. Quick replies, no surprises, and a genuinely premium car. Five stars.",
  "The whole thing felt effortless. Digital check-in, clear instructions, and a pristine vehicle."
];

function initialsOf(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Aggregate host trust signals — rating, completed trips, response time, verifications. */
export async function getHostProfile(slug: string): Promise<HostProfile> {
  const [tenant, fleet] = await Promise.all([getPublicTenant(slug), getPublicFleet(slug)]);
  const name = tenant?.name ?? prettifySlug(slug);
  const seed = hashString(`${slug}:host`);

  const completedTrips = fleet.reduce((sum, vehicle) => sum + vehicle.trips, 0) || 120 + (seed % 400);
  const rating = fleet.length ? Math.round(avg(fleet.map((vehicle) => vehicle.rating)) * 100) / 100 : 4.9;

  if (isDatabaseConfigured() && tenant) {
    const reviews = await prisma.review.findMany({
      where: { customer: { organizationId: tenant.id } },
      select: { rating: true }
    });
    if (reviews.length) {
      return {
        name,
        initials: initialsOf(name),
        rating: Math.round(avg(reviews.map((review) => review.rating)) * 100) / 100,
        reviewCount: reviews.length,
        completedTrips,
        responseRate: 99,
        responseTime: "within an hour",
        joinedYear: 2021 + (seed % 4),
        verifications: ["Email verified", "Phone verified", "Government ID", "Business license"]
      };
    }
  }

  return {
    name,
    initials: initialsOf(name),
    rating,
    reviewCount: Math.max(8, Math.round(completedTrips * 0.6)),
    completedTrips,
    responseRate: 98 + (seed % 3),
    responseTime: "within an hour",
    joinedYear: 2021 + (seed % 4),
    verifications: ["Email verified", "Phone verified", "Government ID", "Business license"]
  };
}

/** Customer reviews for the host profile — pulls from the DB, falls back to curated demo reviews. */
export async function getReviews(slug: string, limit = 6): Promise<PublicReview[]> {
  const tenant = await getPublicTenant(slug);
  const name = tenant?.name ?? prettifySlug(slug);

  if (isDatabaseConfigured() && tenant) {
    const dbReviews = await prisma.review.findMany({
      where: { customer: { organizationId: tenant.id } },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit
    });
    if (dbReviews.length) {
      return dbReviews.map((review) => ({
        id: review.id,
        author: review.customer.name,
        initials: initialsOf(review.customer.name),
        rating: review.rating,
        date: review.createdAt.toLocaleString("en-US", { month: "long", year: "numeric" }),
        body: review.body ?? "Great experience — highly recommend this host.",
        vehicle: ""
      }));
    }
  }

  const fleet = await getPublicFleet(slug);
  const now = new Date();
  return Array.from({ length: limit }).map((_, index) => {
    const seed = hashString(`${slug}:review:${index}`);
    const author = REVIEW_AUTHORS[seed % REVIEW_AUTHORS.length];
    const vehicle = fleet.length ? `${fleet[seed % fleet.length].make} ${fleet[seed % fleet.length].model}` : "the car";
    const body = REVIEW_BODIES[seed % REVIEW_BODIES.length]
      .replaceAll("{host}", name)
      .replaceAll("{vehicle}", vehicle);
    const monthsAgo = index + (seed % 3);
    const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    return {
      id: `rev_${index}`,
      author,
      initials: initialsOf(author),
      rating: seed % 7 === 0 ? 4 : 5,
      date: date.toLocaleString("en-US", { month: "long", year: "numeric" }),
      body,
      vehicle
    };
  });
}
