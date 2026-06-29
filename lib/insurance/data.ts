import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { getPublicTenant } from "@/lib/data/public-data";
import { defaultInsuranceSettings, depositForSelection, maskPolicyNumber, type InsuranceSettings } from "@/lib/insurance/config";
import { getProvider, quotesForBooking } from "@/lib/insurance/providers";
import type { InsuranceProviderKey, InsuranceQuote } from "@/lib/insurance/types";

type SettingsRow = {
  requireInsurance: boolean;
  allowOwnInsurance: boolean;
  allowDecline: boolean;
  manualApproval: boolean;
  enabledProviders: string[];
  minLiabilityCents: number;
  requiredCoverageLimitsCents: number;
  customTerms: string | null;
  depositThirdPartyCents: number;
  depositOwnInsuranceCents: number;
  depositDeclinedCents: number;
};

function mapSettings(row: SettingsRow): InsuranceSettings {
  return {
    requireInsurance: row.requireInsurance,
    allowOwnInsurance: row.allowOwnInsurance,
    allowDecline: row.allowDecline,
    manualApproval: row.manualApproval,
    enabledProviders: row.enabledProviders.filter((key): key is InsuranceProviderKey =>
      ["rentalcover", "allianz", "bonzah"].includes(key)
    ),
    minLiabilityCents: row.minLiabilityCents,
    requiredCoverageLimitsCents: row.requiredCoverageLimitsCents,
    customTerms: row.customTerms ?? "",
    depositThirdPartyCents: row.depositThirdPartyCents,
    depositOwnInsuranceCents: row.depositOwnInsuranceCents,
    depositDeclinedCents: row.depositDeclinedCents
  };
}

/** Owner's insurance policy for an org. Falls back to sensible defaults in demo mode. */
export async function getInsuranceSettings(organizationId: string | null | undefined): Promise<InsuranceSettings> {
  if (!organizationId || !isDatabaseConfigured()) return defaultInsuranceSettings();
  const row = await prisma.insuranceSetting.findUnique({ where: { organizationId } });
  return row ? mapSettings(row) : defaultInsuranceSettings();
}

export type BookingInsurance = {
  settings: InsuranceSettings;
  /** Per-day quotes (days = 1); the client multiplies by the selected trip length. */
  quotes: InsuranceQuote[];
  deposits: { thirdParty: number; own: number; declined: number };
};

/** Everything the booking page needs to render the insurance step for a vehicle. */
export async function getBookingInsurance(slug: string, dailyRateCents: number): Promise<BookingInsurance> {
  const tenant = await getPublicTenant(slug);
  const settings = await getInsuranceSettings(tenant?.id);
  const quotes = quotesForBooking({ days: 1, dailyRateCents }, settings.enabledProviders);
  return {
    settings,
    quotes,
    deposits: {
      thirdParty: depositForSelection(settings, "third_party"),
      own: depositForSelection(settings, "own"),
      declined: depositForSelection(settings, "declined")
    }
  };
}

export type PersistSelectionInput = {
  organizationId: string;
  reservationId: string;
  customerId: string | null;
  days: number;
  settings: InsuranceSettings;
  selection:
    | { type: "third_party"; providerKey: InsuranceProviderKey; planId: string; customerName: string; customerEmail: string }
    | {
        type: "own";
        ownInsurance: {
          insuranceCompany: string;
          policyNumber: string;
          policyHolderName: string;
          expirationDate?: string | null;
          additionalNotes?: string | null;
        };
        documents?: { kind: "CARD_FRONT" | "CARD_BACK" | "DECLARATION_PAGE"; storagePath: string; fileName?: string }[];
      }
    | { type: "declined" };
};

export type PersistSelectionResult = {
  reservationInsuranceId: string | null;
  coverageCostCents: number;
  depositCents: number;
  status: string;
  policyNumber?: string;
  demo?: boolean;
};

/**
 * Persist a customer's insurance choice for a reservation. Creates the
 * InsurancePurchase / CustomerInsuranceUpload + documents and the
 * ReservationInsurance link. In demo mode it computes the cost/deposit/status
 * without writing to the database so the booking flow still works end-to-end.
 */
export async function persistInsuranceSelection(input: PersistSelectionInput): Promise<PersistSelectionResult> {
  const { settings, selection, days } = input;

  // Compute cost, deposit, and coverage status from the selection + owner policy.
  let coverageCostCents = 0;
  let depositCents = depositForSelection(settings, selection.type === "third_party" ? "third_party" : selection.type === "own" ? "own" : "declined");
  let status: string;
  let policyNumber: string | undefined;

  if (selection.type === "third_party") {
    const provider = getProvider(selection.providerKey);
    const quote = provider?.quote({ days, dailyRateCents: 0 })[0];
    // Recompute against the real per-day price for the booking length.
    const perDay = provider?.quote({ days: 1, dailyRateCents: 0 })[0]?.dailyPriceCents ?? quote?.dailyPriceCents ?? 0;
    coverageCostCents = perDay * Math.max(1, days);
    status = "ACTIVE";
  } else if (selection.type === "own") {
    status = settings.manualApproval ? "PENDING_REVIEW" : "APPROVED";
  } else {
    status = "DECLINED";
  }

  if (!isDatabaseConfigured()) {
    return { reservationInsuranceId: null, coverageCostCents, depositCents, status, demo: true };
  }

  // --- Live persistence ---
  if (selection.type === "third_party") {
    const provider = getProvider(selection.providerKey);
    const quote = provider?.quote({ days, dailyRateCents: 0 })[0];
    coverageCostCents = (quote?.dailyPriceCents ?? 0) * Math.max(1, days);
    const purchaseResult = provider
      ? await provider.purchase({
          quote: { ...(quote as InsuranceQuote), days },
          customer: { name: selection.customerName, email: selection.customerEmail },
          reservationId: input.reservationId
        })
      : { ok: false as const };
    policyNumber = purchaseResult.ok ? purchaseResult.policyNumber : undefined;

    const purchase = await prisma.insurancePurchase.create({
      data: {
        organizationId: input.organizationId,
        reservationId: input.reservationId,
        customerId: input.customerId,
        providerKey: selection.providerKey,
        planId: quote?.planId ?? selection.planId,
        planName: quote?.planName ?? selection.planId,
        coverageSummary: quote?.coverageSummary ?? "",
        coverageLimits: quote?.coverageLimits ?? {},
        deductibleCents: quote?.deductibleCents ?? 0,
        dailyPriceCents: quote?.dailyPriceCents ?? 0,
        totalPriceCents: coverageCostCents,
        policyNumber,
        externalRef: policyNumber,
        status: "ACTIVE"
      }
    });

    const link = await prisma.reservationInsurance.create({
      data: {
        organizationId: input.organizationId,
        reservationId: input.reservationId,
        customerId: input.customerId,
        selectionType: "THIRD_PARTY",
        status: "ACTIVE",
        providerKey: selection.providerKey,
        purchaseId: purchase.id,
        coverageCostCents,
        depositCents
      }
    });
    return { reservationInsuranceId: link.id, coverageCostCents, depositCents, status, policyNumber };
  }

  if (selection.type === "own") {
    const upload = await prisma.customerInsuranceUpload.create({
      data: {
        organizationId: input.organizationId,
        customerId: input.customerId,
        reservationId: input.reservationId,
        insuranceCompany: selection.ownInsurance.insuranceCompany,
        policyNumber: selection.ownInsurance.policyNumber,
        policyHolderName: selection.ownInsurance.policyHolderName,
        expirationDate: selection.ownInsurance.expirationDate ? new Date(selection.ownInsurance.expirationDate) : null,
        additionalNotes: selection.ownInsurance.additionalNotes ?? null,
        status: settings.manualApproval ? "PENDING" : "APPROVED"
      }
    });

    for (const doc of selection.documents ?? []) {
      await prisma.insuranceDocument.create({
        data: { uploadId: upload.id, kind: doc.kind, storagePath: doc.storagePath, fileName: doc.fileName ?? null }
      });
    }

    const link = await prisma.reservationInsurance.create({
      data: {
        organizationId: input.organizationId,
        reservationId: input.reservationId,
        customerId: input.customerId,
        selectionType: "CUSTOMER_OWN",
        status: settings.manualApproval ? "PENDING_REVIEW" : "APPROVED",
        uploadId: upload.id,
        coverageCostCents: 0,
        depositCents
      }
    });
    return { reservationInsuranceId: link.id, coverageCostCents: 0, depositCents, status };
  }

  // declined
  const link = await prisma.reservationInsurance.create({
    data: {
      organizationId: input.organizationId,
      reservationId: input.reservationId,
      customerId: input.customerId,
      selectionType: "DECLINED",
      status: "DECLINED",
      coverageCostCents: 0,
      depositCents
    }
  });
  return { reservationInsuranceId: link.id, coverageCostCents: 0, depositCents, status };
}

// ---------------------------------------------------------------------------
// Business dashboard
// ---------------------------------------------------------------------------

export type InsuranceUploadRow = {
  id: string;
  customerName: string;
  insuranceCompany: string;
  policyNumber: string;
  policyHolderName: string;
  expirationDate: string | null;
  status: string;
  documents: { kind: string; fileName: string | null }[];
  createdAt: string;
};

export type InsuranceReservationRow = {
  reservationId: string;
  customerName: string;
  vehicleLabel: string;
  selectionType: string;
  status: string;
  providerKey: string | null;
  policyNumberMasked: string;
  coverageCostCents: number;
};

export type InsuranceDashboard = {
  settings: InsuranceSettings;
  pendingUploads: InsuranceUploadRow[];
  reservations: InsuranceReservationRow[];
  revenueCents: number;
  counts: { active: number; pendingReview: number; declined: number };
};

function demoDashboard(settings: InsuranceSettings): InsuranceDashboard {
  return {
    settings,
    pendingUploads: [
      {
        id: "demo_upload_1",
        customerName: "Jordan Mills",
        insuranceCompany: "Geico",
        policyNumber: "GC-4480912",
        policyHolderName: "Jordan Mills",
        expirationDate: "2026-12-01",
        status: "PENDING",
        documents: [
          { kind: "CARD_FRONT", fileName: "geico-front.jpg" },
          { kind: "CARD_BACK", fileName: "geico-back.jpg" }
        ],
        createdAt: new Date().toISOString().slice(0, 10)
      }
    ],
    reservations: [
      {
        reservationId: "demo_res_1",
        customerName: "Priya Shah",
        vehicleLabel: "2024 Tesla Model Y",
        selectionType: "THIRD_PARTY",
        status: "ACTIVE",
        providerKey: "rentalcover",
        policyNumberMasked: maskPolicyNumber("RC-LXZ81-4421"),
        coverageCostCents: 5_400
      },
      {
        reservationId: "demo_res_2",
        customerName: "Jordan Mills",
        vehicleLabel: "2023 Mercedes C300",
        selectionType: "CUSTOMER_OWN",
        status: "PENDING_REVIEW",
        providerKey: null,
        policyNumberMasked: maskPolicyNumber("GC-4480912"),
        coverageCostCents: 0
      }
    ],
    revenueCents: 5_400,
    counts: { active: 1, pendingReview: 1, declined: 0 }
  };
}

/** Owner-facing insurance overview: settings, pending reviews, coverage by reservation, revenue. */
export async function getInsuranceDashboard(organizationId: string | null | undefined): Promise<InsuranceDashboard> {
  const settings = await getInsuranceSettings(organizationId);
  if (!organizationId || !isDatabaseConfigured()) {
    return demoDashboard(settings);
  }

  const [uploads, links, revenue] = await Promise.all([
    prisma.customerInsuranceUpload.findMany({
      where: { organizationId, status: { in: ["PENDING", "MORE_INFO_REQUIRED"] } },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.reservationInsurance.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.insurancePurchase.aggregate({ where: { organizationId }, _sum: { totalPriceCents: true } })
  ]);

  // Resolve customer names + documents for the pending uploads.
  const customerIds = [...new Set(uploads.map((u) => u.customerId).filter((id): id is string => Boolean(id)))];
  const customers = customerIds.length
    ? await prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true } })
    : [];
  const customerName = new Map(customers.map((c) => [c.id, c.name]));
  const docs = uploads.length
    ? await prisma.insuranceDocument.findMany({ where: { uploadId: { in: uploads.map((u) => u.id) } } })
    : [];

  const pendingUploads: InsuranceUploadRow[] = uploads.map((u) => ({
    id: u.id,
    customerName: (u.customerId && customerName.get(u.customerId)) || u.policyHolderName,
    insuranceCompany: u.insuranceCompany,
    policyNumber: u.policyNumber,
    policyHolderName: u.policyHolderName,
    expirationDate: u.expirationDate ? u.expirationDate.toISOString().slice(0, 10) : null,
    status: u.status,
    documents: docs.filter((d) => d.uploadId === u.id).map((d) => ({ kind: d.kind, fileName: d.fileName })),
    createdAt: u.createdAt.toISOString().slice(0, 10)
  }));

  // Resolve reservation / customer / vehicle labels for the coverage list.
  const reservationIds = links.map((l) => l.reservationId);
  const reservations = reservationIds.length
    ? await prisma.reservation.findMany({
        where: { id: { in: reservationIds } },
        select: { id: true, customer: { select: { name: true } }, vehicle: { select: { year: true, make: true, model: true } } }
      })
    : [];
  const resInfo = new Map(reservations.map((r) => [r.id, r]));
  const purchases = links.some((l) => l.purchaseId)
    ? await prisma.insurancePurchase.findMany({ where: { id: { in: links.map((l) => l.purchaseId).filter((id): id is string => Boolean(id)) } } })
    : [];
  const purchaseById = new Map(purchases.map((p) => [p.id, p]));

  const reservationRows: InsuranceReservationRow[] = links.map((l) => {
    const res = resInfo.get(l.reservationId);
    const purchase = l.purchaseId ? purchaseById.get(l.purchaseId) : null;
    return {
      reservationId: l.reservationId,
      customerName: res?.customer.name ?? "—",
      vehicleLabel: res?.vehicle ? `${res.vehicle.year} ${res.vehicle.make} ${res.vehicle.model}` : "—",
      selectionType: l.selectionType,
      status: l.status,
      providerKey: l.providerKey,
      policyNumberMasked: maskPolicyNumber(purchase?.policyNumber),
      coverageCostCents: l.coverageCostCents
    };
  });

  return {
    settings,
    pendingUploads,
    reservations: reservationRows,
    revenueCents: revenue._sum.totalPriceCents ?? 0,
    counts: {
      active: links.filter((l) => l.status === "ACTIVE" || l.status === "APPROVED").length,
      pendingReview: links.filter((l) => l.status === "PENDING_REVIEW").length,
      declined: links.filter((l) => l.status === "DECLINED").length
    }
  };
}
