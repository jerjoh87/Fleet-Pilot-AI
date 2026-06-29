import type { Activity, AgreementTemplateData, AvailabilityBlock, BankAccount, Customer, FinancialSummary, FinancialTransaction, MaintenanceItem, PayoutRecord, RentalAgreementRecord, Reservation, SubscriptionInfo, UsageMetrics, Vehicle, VehicleStatus } from "@/lib/types";
import { activity, customers, maintenance, reservations, revenueSeries, vehicles } from "@/lib/demo-data";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import type { AppSession } from "@/lib/auth/session";
import { defaultAgreementTemplate } from "@/lib/agreements/default-template";
import { getPlan } from "@/lib/billing/plans";

type DashboardData = {
  activity: Activity[];
  availabilityBlocks: AvailabilityBlock[];
  agreementTemplate: AgreementTemplateData;
  bankAccount: BankAccount | null;
  customers: Customer[];
  financialSummary: FinancialSummary;
  financialTransactions: FinancialTransaction[];
  maintenance: MaintenanceItem[];
  payouts: PayoutRecord[];
  rentalAgreements: RentalAgreementRecord[];
  reservations: Reservation[];
  revenueSeries: typeof revenueSeries;
  subscriptionInfo: SubscriptionInfo;
  usageMetrics: UsageMetrics;
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

const emptyFinancialSummary: FinancialSummary = {
  availableBalance: 0,
  pendingBalance: 0,
  totalRevenue: 0,
  lifetimeEarnings: 0,
  nextPayout: 0,
  lastPayout: 0,
  processingFees: 0,
  platformFees: 0,
  refunds: 0
};

function trialInfo(createdAt?: Date): SubscriptionInfo {
  const started = createdAt ?? new Date();
  const ends = new Date(started.getTime() + 30 * 86_400_000);
  const remaining = Math.max(0, Math.ceil((ends.getTime() - Date.now()) / 86_400_000));
  return {
    planId: "trial",
    planName: "Free Trial",
    status: remaining > 0 ? "trialing" : "expired",
    interval: "monthly",
    trialStartedAt: started.toISOString(),
    trialEndsAt: ends.toISOString(),
    trialDaysRemaining: remaining,
    currentPeriodEnd: ends.toISOString(),
    cancelAtPeriodEnd: false,
    nextInvoiceAmount: 0,
    paymentMethod: "No card required"
  };
}

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
    agreementTemplate: defaultAgreementTemplate("LuxeDrive Rentals"),
    bankAccount: null,
    customers: scope(customers),
    financialSummary: emptyFinancialSummary,
    financialTransactions: [],
    maintenance: scope(maintenance),
    payouts: [],
    rentalAgreements: [],
    reservations: scope(reservations),
    revenueSeries,
    subscriptionInfo: trialInfo(),
    usageMetrics: {
      vehicles: vehicles.length,
      staff: 1,
      locations: 1,
      aiRequests: 184,
      storageGb: 4,
      apiRequests: 0
    },
    websiteSettings: demoWebsiteSettings,
    vehicles: scope(vehicles)
  };
}

export async function getDashboardData(session: AppSession): Promise<DashboardData> {
  if (!isDatabaseConfigured()) {
    return scopeDemoData(session.organization.id);
  }

  const [
    dbVehicles,
    dbCustomers,
    dbReservations,
    dbAvailabilityBlocks,
    dbMaintenance,
    dbActivity,
    websiteSettings,
    bankAccount,
    payouts,
    transactions,
    rentalAgreements,
    agreementTemplate,
    subscription
  ] = await Promise.all([
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
    }),
    prisma.bankAccount.findFirst({
      where: { organizationId: session.organization.id },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.payout.findMany({
      where: { organizationId: session.organization.id },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.transaction.findMany({
      where: { organizationId: session.organization.id },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.rentalAgreement.findMany({
      where: { organizationId: session.organization.id },
      include: { customer: true, reservation: { include: { vehicle: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.agreementTemplate.findFirst({
      where: { organizationId: session.organization.id },
      orderBy: { activeVersion: "desc" }
    }),
    prisma.subscription.findUnique({
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
    bankAccount: bankAccount ? {
      id: bankAccount.id,
      organizationId: bankAccount.organizationId,
      accountHolderName: bankAccount.accountHolderName,
      businessName: bankAccount.businessName,
      accountType: bankAccount.accountType,
      bankName: bankAccount.bankName ?? "Connected bank",
      last4: bankAccount.last4 ?? "",
      routingLast4: bankAccount.routingLast4 ?? "",
      verificationStatus: bankAccount.verificationStatus,
      payoutSchedule: bankAccount.payoutSchedule,
      nextPayoutDate: bankAccount.nextPayoutAt?.toISOString().slice(0, 10) ?? "",
      estimatedPayout: bankAccount.estimatedPayoutCents / 100
    } : null,
    payouts: payouts.map((payout) => ({
      id: payout.id,
      organizationId: payout.organizationId,
      amount: payout.amountCents / 100,
      status: payout.status,
      arrivalDate: payout.arrivalDate?.toISOString().slice(0, 10) ?? "",
      failureMessage: payout.failureMessage ?? "",
      createdAt: payout.createdAt.toISOString()
    })),
    financialTransactions: transactions.map((transaction) => ({
      id: transaction.id,
      organizationId: transaction.organizationId,
      reservationId: transaction.reservationId ?? "",
      customerName: transaction.customerName,
      vehicleLabel: transaction.vehicleLabel,
      grossAmount: transaction.grossAmountCents / 100,
      platformFee: transaction.platformFeeCents / 100,
      processingFee: transaction.processingFeeCents / 100,
      insuranceRevenue: transaction.insuranceRevenueCents / 100,
      taxes: transaction.taxesCents / 100,
      netPayout: transaction.netPayoutCents / 100,
      status: transaction.status,
      createdAt: transaction.createdAt.toISOString()
    })),
    financialSummary: {
      availableBalance: transactions.filter((item) => item.status === "available").reduce((sum, item) => sum + item.netPayoutCents, 0) / 100,
      pendingBalance: transactions.filter((item) => item.status !== "available").reduce((sum, item) => sum + item.netPayoutCents, 0) / 100,
      totalRevenue: transactions.reduce((sum, item) => sum + item.grossAmountCents, 0) / 100,
      lifetimeEarnings: transactions.reduce((sum, item) => sum + item.netPayoutCents, 0) / 100,
      nextPayout: bankAccount?.estimatedPayoutCents ? bankAccount.estimatedPayoutCents / 100 : 0,
      lastPayout: payouts[0]?.amountCents ? payouts[0].amountCents / 100 : 0,
      processingFees: transactions.reduce((sum, item) => sum + item.processingFeeCents, 0) / 100,
      platformFees: transactions.reduce((sum, item) => sum + item.platformFeeCents, 0) / 100,
      refunds: transactions.filter((item) => item.status === "refunded").reduce((sum, item) => sum + item.grossAmountCents, 0) / 100
    },
    rentalAgreements: rentalAgreements.map((agreement) => ({
      id: agreement.id,
      organizationId: agreement.organizationId,
      reservationId: agreement.reservationId,
      customerName: agreement.customer.name,
      vehicleLabel: `${agreement.reservation.vehicle.year} ${agreement.reservation.vehicle.make} ${agreement.reservation.vehicle.model}`,
      legalName: agreement.legalName,
      status: agreement.status,
      version: agreement.version,
      signedAt: agreement.agreedAt.toISOString(),
      ipAddress: agreement.ipAddress ?? "",
      signatureMethod: agreement.signatureMethod,
      pdfUrl: agreement.pdfUrl ?? `/api/agreements/${agreement.id}/pdf`
    })),
    agreementTemplate: agreementTemplate ? {
      businessName: agreementTemplate.businessName,
      businessAddress: agreementTemplate.businessAddress ?? "",
      phone: agreementTemplate.phone ?? "",
      email: agreementTemplate.email ?? "",
      terms: agreementTemplate.terms,
      mileagePolicy: agreementTemplate.mileagePolicy,
      fuelPolicy: agreementTemplate.fuelPolicy,
      smokingPolicy: agreementTemplate.smokingPolicy,
      petPolicy: agreementTemplate.petPolicy,
      lateReturnPolicy: agreementTemplate.lateReturnPolicy,
      cleaningFee: agreementTemplate.cleaningFee,
      damagePolicy: agreementTemplate.damagePolicy,
      insuranceTerms: agreementTemplate.insuranceTerms,
      roadsideAssistance: agreementTemplate.roadsideAssistance,
      securityDeposit: agreementTemplate.securityDeposit,
      cancellationPolicy: agreementTemplate.cancellationPolicy,
      prohibitedUses: agreementTemplate.prohibitedUses,
      stateClauses: agreementTemplate.stateClauses,
      signatureDisclosure: agreementTemplate.signatureDisclosure,
      activeVersion: agreementTemplate.activeVersion
    } : defaultAgreementTemplate(session.organization.name),
    subscriptionInfo: subscription ? {
      planId: (subscription.planId as SubscriptionInfo["planId"]) || "trial",
      planName: getPlan(subscription.planId)?.name ?? "Free Trial",
      status: subscription.status,
      interval: (subscription.interval as SubscriptionInfo["interval"]) || "monthly",
      trialStartedAt: subscription.trialStartedAt?.toISOString() ?? subscription.currentPeriodEnd.toISOString(),
      trialEndsAt: subscription.trialEndsAt?.toISOString() ?? subscription.currentPeriodEnd.toISOString(),
      trialDaysRemaining: subscription.trialEndsAt ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - Date.now()) / 86_400_000)) : 0,
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      nextInvoiceAmount: getPlan(subscription.planId)?.monthlyCents ? getPlan(subscription.planId)!.monthlyCents / 100 : 0,
      paymentMethod: "Managed in Stripe"
    } : trialInfo(dbActivity[0]?.createdAt),
    usageMetrics: {
      vehicles: dbVehicles.length,
      staff: Math.max(1, dbCustomers.filter((customer) => customer.customerType === "Staff").length || 1),
      locations: new Set(dbVehicles.map((vehicle) => vehicle.location ?? "Fleet hub")).size,
      aiRequests: dbActivity.filter((item) => item.action.toLowerCase().includes("ai")).length,
      storageGb: Math.max(1, Math.ceil(dbVehicles.reduce((sum, vehicle) => sum + vehicle.images.length, 0) / 25)),
      apiRequests: 0
    },
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
