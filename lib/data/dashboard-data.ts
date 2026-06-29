import type { Activity, AvailabilityBlock, Customer, MaintenanceItem, Reservation, Vehicle, VehicleStatus } from "@/lib/types";
import { activity, customers, maintenance, reservations, revenueSeries, vehicles } from "@/lib/demo-data";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import type { AppSession } from "@/lib/auth/session";

type DashboardData = {
  activity: Activity[];
  availabilityBlocks: AvailabilityBlock[];
  customers: Customer[];
  maintenance: MaintenanceItem[];
  reservations: Reservation[];
  revenueSeries: typeof revenueSeries;
  websiteSettings: WebsiteSettingsData;
  vehicles: Vehicle[];
};

export type WebsiteSettingsData = {
  logoUrl: string;
  coverImageUrl: string;
  backgroundStyle: "soft" | "solid" | "cover";
  brandColor: string;
  heroTitle: string;
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
  trustBadges: string;
  seoTitle: string;
  customDomain: string;
  depositFee: number;
};

const demoWebsiteSettings: WebsiteSettingsData = {
  logoUrl: "",
  coverImageUrl: "",
  backgroundStyle: "soft",
  brandColor: "#166534",
  heroTitle: "Premium vehicles, booked in minutes.",
  about: "LuxeDrive Rentals offers carefully maintained premium vehicles, flexible pickup, and fast online reservations for travelers and local drivers.",
  serviceArea: "Austin, TX",
  contactEmail: "reservations@luxedrive.fleetpilot.ai",
  contactPhone: "(512) 555-0148",
  instagramUrl: "",
  facebookUrl: "",
  pickupInstructions: "Pickup details are shared after booking confirmation. Bring a valid driver's license and matching payment card.",
  cancellationPolicy: "Free cancellation up to 24 hours before pickup. Late cancellations may be charged one rental day.",
  depositPolicy: "A refundable security deposit is authorized at booking and released after vehicle return inspection.",
  businessHours: "Mon-Sat 8:00 AM-7:00 PM, Sun 10:00 AM-4:00 PM",
  trustBadges: "Verified fleet, Roadside support, Contactless booking",
  seoTitle: "LuxeDrive Rentals",
  customDomain: "",
  depositFee: 250
};

const vehicleStatusMap = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  RENTED: "Rented",
  CLEANING: "Cleaning",
  MAINTENANCE: "Maintenance",
  OUT_OF_SERVICE: "Out of Service",
  RETIRED: "Retired"
} as const satisfies Record<string, VehicleStatus>;

const reservationStatusMap = {
  QUOTE: "Quote",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  CHECKED_OUT: "Checked Out",
  LATE: "Late",
  CANCELLED: "Cancelled"
} as const;

export function scopeDemoData(organizationId: string): DashboardData {
  const scope = <T extends { organizationId: string }>(items: T[]) =>
    items.map((item) => ({ ...item, organizationId }));

  return {
    activity: scope(activity),
    availabilityBlocks: [],
    customers: scope(customers),
    maintenance: scope(maintenance),
    reservations: scope(reservations),
    revenueSeries,
    websiteSettings: demoWebsiteSettings,
    vehicles: scope(vehicles)
  };
}

export async function getDashboardData(session: AppSession): Promise<DashboardData> {
  if (!isDatabaseConfigured()) {
    return scopeDemoData(session.organization.id);
  }

  const [dbVehicles, dbCustomers, dbReservations, dbAvailabilityBlocks, dbMaintenance, dbActivity, websiteSettings] = await Promise.all([
    prisma.vehicle.findMany({
      where: { organizationId: session.organization.id },
      include: { images: true, documents: true, damageReports: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.customer.findMany({
      where: { organizationId: session.organization.id },
      include: { reservations: true, reviews: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.reservation.findMany({
      where: { organizationId: session.organization.id },
      orderBy: { startsAt: "desc" }
    }),
    prisma.vehicleAvailabilityBlock.findMany({
      where: { organizationId: session.organization.id },
      orderBy: { startsAt: "asc" }
    }),
    prisma.maintenance.findMany({
      where: { organizationId: session.organization.id },
      orderBy: [{ dueDate: "asc" }]
    }),
    prisma.activityLog.findMany({
      where: { organizationId: session.organization.id },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.websiteSetting.findUnique({
      where: { organizationId: session.organization.id }
    })
  ]);

  if (!dbVehicles.length && !dbCustomers.length && !dbReservations.length) {
    return scopeDemoData(session.organization.id);
  }

  return {
    vehicles: dbVehicles.map((vehicle) => ({
      id: vehicle.id,
      organizationId: vehicle.organizationId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
      licensePlate: vehicle.licensePlate,
      mileage: vehicle.mileage,
      fuelLevel: Number(vehicle.fuelLevel),
      status: vehicleStatusMap[vehicle.status],
      location: vehicle.location ?? "Fleet hub",
      dailyRate: Number(vehicle.dailyRate),
      publicDescription: vehicle.publicDescription ?? "",
      features: vehicle.features,
      rules: vehicle.rules,
      images: vehicle.images.map((image) => image.url),
      revenueMtd: 0,
      profitMtd: 0,
      nextMaintenance: vehicle.updatedAt.toISOString().slice(0, 10),
      registrationExpires: "2027-01-01",
      insuranceExpires: "2027-01-01",
      image: vehicle.images[0]?.url ?? "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80",
      documents: vehicle.documents.map((document) => document.kind),
      damageReports: vehicle.damageReports.length
    })),
    availabilityBlocks: dbAvailabilityBlocks.map((block) => ({
      id: block.id,
      organizationId: block.organizationId,
      vehicleId: block.vehicleId,
      startDate: block.startsAt.toISOString().slice(0, 10),
      endDate: block.endsAt.toISOString().slice(0, 10),
      reason: block.reason
    })),
    customers: dbCustomers.map((customer) => ({
      id: customer.id,
      organizationId: customer.organizationId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      licenseStatus: customer.licenseStatus as Customer["licenseStatus"],
      type: customer.customerType as Customer["type"],
      rentals: customer.reservations.length,
      lifetimeValue: customer.reservations.reduce((sum, reservation) => sum + reservation.totalCents / 100, 0),
      rating: customer.reviews[0]?.rating ?? 5,
      blacklisted: customer.blacklisted
    })),
    reservations: dbReservations.map((reservation) => ({
      id: reservation.id,
      organizationId: reservation.organizationId,
      customerId: reservation.customerId,
      vehicleId: reservation.vehicleId,
      startDate: reservation.startsAt.toISOString().slice(0, 10),
      endDate: reservation.endsAt.toISOString().slice(0, 10),
      pickupTime: reservation.startsAt.toISOString().slice(11, 16),
      returnTime: reservation.endsAt.toISOString().slice(11, 16),
      status: reservationStatusMap[reservation.status],
      total: reservation.totalCents / 100,
      deposit: reservation.depositCents / 100,
      agreementSigned: Boolean(reservation.signedAt),
      paymentStatus: reservation.depositCents > 0 ? "Deposit Held" : "Partial"
    })),
    maintenance: dbMaintenance.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      vehicleId: item.vehicleId,
      kind: item.kind,
      dueAtMileage: item.dueAtMileage ?? 0,
      dueDate: item.dueDate?.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      priority: item.status === "Due" ? "High" : "Medium",
      status: item.status as MaintenanceItem["status"],
      costEstimate: (item.costCents ?? 0) / 100
    })),
    activity: dbActivity.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      actor: item.actorUserId ?? "FleetPilot AI",
      action: item.action,
      target: item.target,
      createdAt: item.createdAt.toISOString()
    })),
    revenueSeries,
    websiteSettings: {
      logoUrl: websiteSettings?.logoUrl ?? "",
      coverImageUrl: websiteSettings?.coverImageUrl ?? "",
      backgroundStyle: (websiteSettings?.backgroundStyle as WebsiteSettingsData["backgroundStyle"] | null) ?? "soft",
      brandColor: websiteSettings?.brandColor ?? "#166534",
      heroTitle: websiteSettings?.heroTitle ?? "Premium vehicles, booked in minutes.",
      about: websiteSettings?.about ?? "",
      serviceArea: websiteSettings?.serviceArea ?? "",
      contactEmail: websiteSettings?.contactEmail ?? "",
      contactPhone: websiteSettings?.contactPhone ?? "",
      instagramUrl: websiteSettings?.instagramUrl ?? "",
      facebookUrl: websiteSettings?.facebookUrl ?? "",
      pickupInstructions: websiteSettings?.pickupInstructions ?? "",
      cancellationPolicy: websiteSettings?.cancellationPolicy ?? "",
      depositPolicy: websiteSettings?.depositPolicy ?? "",
      businessHours: websiteSettings?.businessHours ?? "",
      trustBadges: websiteSettings?.trustBadges.join(", ") ?? "",
      seoTitle: websiteSettings?.seoTitle ?? session.organization.name,
      customDomain: websiteSettings?.customDomain ?? "",
      depositFee: (websiteSettings?.depositFeeCents ?? 25000) / 100
    }
  };
}

export function toDbVehicleStatus(status: VehicleStatus): keyof typeof vehicleStatusMap {
  const entry = Object.entries(vehicleStatusMap).find(([, value]) => value === status);
  return (entry?.[0] ?? "AVAILABLE") as keyof typeof vehicleStatusMap;
}
