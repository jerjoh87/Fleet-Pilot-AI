"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAuthenticatedUser, slugifyOrganizationName } from "@/lib/auth/session";
import { syncUserProfile } from "@/lib/auth/users";
import { agreementTemplateToContent, defaultAgreementTemplate } from "@/lib/agreements/default-template";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

const onboardSchema = z.object({
  organizationName: z.string().min(2),
  slug: z.string().min(2).max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  domain: z.string().optional(),
  heroTitle: z.string().min(8),
  about: z.string().max(1200).optional(),
  serviceArea: z.string().max(120).optional(),
  businessAddress: z.string().min(5, "Enter your home or business address."),
  backgroundStyle: z.enum(["soft", "solid", "cover"]).default("soft"),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  depositFee: z.coerce.number().min(0).max(10000).default(250),
  tosAccepted: z.literal("on", { message: "You must accept the Terms of Service to continue." })
});

export async function createOrganizationAction(formData: FormData) {
  const user = await requireAuthenticatedUser();

  if (!isDatabaseConfigured()) {
    redirect("/dashboard" as never);
  }

  const organizationName = String(formData.get("organizationName") ?? "");
  const parsed = onboardSchema.parse({
    organizationName,
    slug: String(formData.get("slug") || slugifyOrganizationName(organizationName)),
    domain: String(formData.get("domain") ?? ""),
    heroTitle: String(formData.get("heroTitle") || "Premium vehicles, booked in minutes."),
    about: String(formData.get("about") || ""),
    serviceArea: String(formData.get("serviceArea") || ""),
    businessAddress: String(formData.get("businessAddress") || ""),
    backgroundStyle: (formData.get("backgroundStyle") as string) || "soft",
    brandColor: String(formData.get("brandColor") || "#166534"),
    depositFee: formData.get("depositFee") ?? 250,
    tosAccepted: formData.get("tosAccepted") ?? ""
  });

  const profile = await syncUserProfile(user);

  await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: parsed.organizationName,
        slug: parsed.slug,
        domain: parsed.domain || `${parsed.slug}.fleetpilot.ai`,
        members: {
          create: {
            userId: profile.id,
            role: "OWNER",
            tosAcceptedAt: new Date()
          }
        },
        websiteSettings: {
          create: {
            brandColor: parsed.brandColor,
            heroTitle: parsed.heroTitle,
            about: parsed.about || null,
            serviceArea: parsed.serviceArea || null,
            backgroundStyle: parsed.backgroundStyle,
            depositPolicy: "A refundable security deposit is authorized at booking and released after return inspection.",
            cancellationPolicy: "Free cancellation up to 24 hours before pickup. Late cancellations may be charged one rental day.",
            trustBadges: ["Verified fleet", "Secure checkout", "Responsive host"],
            seoTitle: `${parsed.organizationName} rentals`,
            depositFeeCents: Math.round(parsed.depositFee * 100)
          }
        }
      }
    });

    const agreementTemplate = {
      ...defaultAgreementTemplate(parsed.organizationName),
      businessAddress: parsed.businessAddress
    };

    const template = await tx.agreementTemplate.create({
      data: {
        organizationId: organization.id,
        ...agreementTemplate
      }
    });

    await tx.agreementVersion.create({
      data: {
        organizationId: organization.id,
        templateId: template.id,
        version: template.activeVersion,
        content: agreementTemplateToContent(agreementTemplate)
      }
    });

    await tx.activityLog.create({
      data: {
        organizationId: organization.id,
        actorUserId: profile.id,
        action: "created organization",
        target: parsed.organizationName
      }
    });
  });

  redirect("/dashboard" as never);
}
