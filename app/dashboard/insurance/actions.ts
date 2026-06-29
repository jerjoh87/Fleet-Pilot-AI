"use server";

import { z } from "zod";
import { requireAppSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import {
  insuranceApprovedEmail,
  insuranceMoreInfoEmail,
  insuranceRejectedEmail
} from "@/lib/email/templates";

type ActionResult = { ok: boolean; message?: string; demo?: boolean };

async function assertSettings() {
  const session = await requireAppSession();
  if (!can(session.role, "settings:write")) {
    throw new Error("You do not have access to insurance settings.");
  }
  return session;
}

const settingsSchema = z.object({
  requireInsurance: z.boolean(),
  allowOwnInsurance: z.boolean(),
  allowDecline: z.boolean(),
  manualApproval: z.boolean(),
  enabledProviders: z.array(z.enum(["rentalcover", "allianz", "bonzah"])),
  minLiabilityCents: z.coerce.number().int().nonnegative(),
  requiredCoverageLimitsCents: z.coerce.number().int().nonnegative(),
  customTerms: z.string().max(4000).optional().default(""),
  depositThirdPartyCents: z.coerce.number().int().nonnegative(),
  depositOwnInsuranceCents: z.coerce.number().int().nonnegative(),
  depositDeclinedCents: z.coerce.number().int().nonnegative()
});

/** Save the organization's insurance policy (provider toggles, requirements, deposit rules). */
export async function updateInsuranceSettingsAction(input: z.input<typeof settingsSchema>): Promise<ActionResult> {
  const session = await assertSettings();
  const data = settingsSchema.parse(input);

  if (!isDatabaseConfigured()) {
    return { ok: true, demo: true, message: "Demo mode: insurance settings preview saved (connect a database to persist)." };
  }

  await prisma.insuranceSetting.upsert({
    where: { organizationId: session.organization.id },
    update: { ...data, customTerms: data.customTerms || null },
    create: { organizationId: session.organization.id, ...data, customTerms: data.customTerms || null }
  });
  return { ok: true, message: "Insurance settings saved." };
}

const reviewSchema = z.object({
  uploadId: z.string().min(1),
  decision: z.enum(["approve", "reject", "more_info"]),
  notes: z.string().max(2000).optional()
});

/** Approve / reject / request more info on a customer's uploaded insurance. */
export async function reviewInsuranceUploadAction(input: z.input<typeof reviewSchema>): Promise<ActionResult> {
  const session = await assertSettings();
  const { uploadId, decision, notes } = reviewSchema.parse(input);

  if (!isDatabaseConfigured()) {
    return { ok: true, demo: true, message: `Demo mode: upload ${decision} simulated.` };
  }

  const upload = await prisma.customerInsuranceUpload.findFirst({
    where: { id: uploadId, organizationId: session.organization.id }
  });
  if (!upload) return { ok: false, message: "Upload not found." };

  const verificationStatus = decision === "approve" ? "APPROVED" : decision === "reject" ? "REJECTED" : "MORE_INFO_REQUIRED";
  const coverageStatus = decision === "approve" ? "APPROVED" : decision === "reject" ? "REJECTED" : "MORE_INFO_REQUIRED";

  await prisma.$transaction([
    prisma.customerInsuranceUpload.update({ where: { id: upload.id }, data: { status: verificationStatus } }),
    prisma.reservationInsurance.updateMany({ where: { uploadId: upload.id }, data: { status: coverageStatus } }),
    prisma.insuranceVerification.create({
      data: {
        organizationId: session.organization.id,
        uploadId: upload.id,
        reviewerId: session.user.id,
        status: verificationStatus,
        notes: notes ?? null
      }
    })
  ]);

  // Notify the customer of the decision (fire-and-forget).
  if (upload.customerId) {
    const [customer, settings] = await Promise.all([
      prisma.customer.findUnique({ where: { id: upload.customerId }, select: { name: true, email: true } }),
      prisma.websiteSetting.findUnique({ where: { organizationId: session.organization.id }, select: { brandColor: true } })
    ]);
    if (customer) {
      const payload = { customerName: customer.name, organizationName: session.organization.name, reason: notes, brandColor: settings?.brandColor };
      const template =
        decision === "approve"
          ? insuranceApprovedEmail(payload)
          : decision === "reject"
            ? insuranceRejectedEmail(payload)
            : insuranceMoreInfoEmail(payload);
      void sendEmail({ to: customer.email, ...template });
    }
  }

  return { ok: true, message: `Insurance ${decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "marked as needing more info"}.` };
}
