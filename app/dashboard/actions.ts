"use server";

import { availabilityBlockSchema, customerSchema, damageReportSchema, maintenanceSchema, reservationSchema, vehicleSchema, vehicleUpdateSchema, websiteSettingsSchema } from "@/lib/schemas";
import { requireAppSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { toDbVehicleStatus } from "@/lib/data/dashboard-data";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function splitList(value: string | undefined) {
  return (value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function assertWrite(permission: string) {
  const session = await requireAppSession();

  if (!can(session.role, permission)) {
    throw new Error("You do not have access to perform this action.");
  }

  return session;
}

async function uploadFleetImage(file: File | null, organizationId: string, folder: string) {
  if (!file || file.size === 0 || !isSupabaseAdminConfigured()) {
    return "";
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${organizationId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage
    .from(process.env.SUPABASE_VEHICLE_IMAGES_BUCKET ?? "vehicle-images")
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false
    });

  if (error) {
    throw new Error(`Vehicle image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(process.env.SUPABASE_VEHICLE_IMAGES_BUCKET ?? "vehicle-images")
    .getPublicUrl(path);

  return data.publicUrl;
}

async function uploadManyFleetImages(files: FormDataEntryValue[], organizationId: string, folder: string) {
  const uploads = await Promise.all(
    files
      .filter((file): file is File => file instanceof File && file.size > 0)
      .map((file) => uploadFleetImage(file, organizationId, folder))
  );

  return uploads.filter(Boolean);
}

export async function createVehicleAction(formData: FormData) {
  const session = await assertWrite("fleet:write");
  const parsed = vehicleSchema.parse(Object.fromEntries(formData));
  const imageFile = formData.get("image") instanceof File ? formData.get("image") as File : null;
  const uploadedImageUrl = await uploadFleetImage(imageFile, session.organization.id, "vehicles");
  const galleryUrls = await uploadManyFleetImages(formData.getAll("galleryImages"), session.organization.id, "vehicles");
  const imageUrl = uploadedImageUrl || parsed.imageUrl || "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80";
  const imageUrls = [imageUrl, ...galleryUrls];

  if (!isDatabaseConfigured()) {
    return { ok: true, imageUrl, imageUrls };
  }

  await prisma.vehicle.create({
    data: {
      organizationId: session.organization.id,
      make: parsed.make,
      model: parsed.model,
      year: parsed.year,
      vin: parsed.vin,
      licensePlate: parsed.licensePlate,
      mileage: parsed.mileage,
      fuelLevel: parsed.fuelLevel,
      status: toDbVehicleStatus(parsed.status),
      location: parsed.location,
      dailyRate: parsed.dailyRate,
      publicDescription: parsed.publicDescription || null,
      features: splitList(parsed.features),
      rules: splitList(parsed.rules),
      images: {
        create: imageUrls.map((url, index) => ({
          url,
          alt: `${parsed.year} ${parsed.make} ${parsed.model}`,
          sortOrder: index
        }))
      }
    }
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      action: "added vehicle",
      target: `${parsed.make} ${parsed.model}`
    }
  });

  return { ok: true, imageUrl, imageUrls };
}

export async function updateVehicleAction(formData: FormData) {
  const session = await assertWrite("fleet:write");
  const parsed = vehicleUpdateSchema.parse(Object.fromEntries(formData));
  const imageFile = formData.get("image") instanceof File ? formData.get("image") as File : null;
  const uploadedImageUrl = await uploadFleetImage(imageFile, session.organization.id, "vehicles");
  const galleryUrls = await uploadManyFleetImages(formData.getAll("galleryImages"), session.organization.id, "vehicles");
  const incomingPrimaryUrl = uploadedImageUrl || parsed.imageUrl || "";
  const newImageUrls = [incomingPrimaryUrl, ...galleryUrls].filter(Boolean);

  if (!isDatabaseConfigured()) {
    return { ok: true, imageUrl: incomingPrimaryUrl, imageUrls: newImageUrls };
  }

  const vehicle = await prisma.vehicle.findFirstOrThrow({
    where: { id: parsed.id, organizationId: session.organization.id },
    include: { images: true }
  });
  const existingUrls = vehicle.images.map((image) => image.url);
  const nextImageUrls = newImageUrls.length ? [...newImageUrls, ...existingUrls.filter((url) => !newImageUrls.includes(url))] : existingUrls;

  await prisma.vehicle.update({
    where: { id: parsed.id },
    data: {
      make: parsed.make,
      model: parsed.model,
      year: parsed.year,
      vin: parsed.vin,
      licensePlate: parsed.licensePlate,
      mileage: parsed.mileage,
      fuelLevel: parsed.fuelLevel,
      status: toDbVehicleStatus(parsed.status),
      location: parsed.location,
      dailyRate: parsed.dailyRate,
      publicDescription: parsed.publicDescription || null,
      features: splitList(parsed.features),
      rules: splitList(parsed.rules),
      images: nextImageUrls.length
        ? {
            deleteMany: {},
            create: nextImageUrls.map((url, index) => ({
              url,
              alt: `${parsed.year} ${parsed.make} ${parsed.model}`,
              sortOrder: index
            }))
          }
        : undefined
    }
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      action: "updated vehicle",
      target: `${parsed.make} ${parsed.model}`
    }
  });

  return { ok: true, imageUrl: nextImageUrls[0] ?? "", imageUrls: nextImageUrls };
}

export async function archiveVehicleAction(vehicleId: string) {
  const session = await assertWrite("fleet:write");

  if (!isDatabaseConfigured()) {
    return { ok: true };
  }

  const vehicle = await prisma.vehicle.findFirstOrThrow({
    where: { id: vehicleId, organizationId: session.organization.id }
  });

  await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { status: "RETIRED" }
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      action: "archived vehicle",
      target: `${vehicle.make} ${vehicle.model}`
    }
  });

  return { ok: true };
}

export async function createCustomerAction(formData: FormData) {
  const session = await assertWrite("customers:write");
  const parsed = customerSchema.parse(Object.fromEntries(formData));

  if (!isDatabaseConfigured()) {
    return { ok: true };
  }

  await prisma.customer.create({
    data: {
      organizationId: session.organization.id,
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      customerType: parsed.type,
      licenseStatus: parsed.licenseStatus
    }
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      action: "created customer",
      target: parsed.name
    }
  });

  return { ok: true };
}

export async function createReservationAction(formData: FormData) {
  const session = await assertWrite("reservations:write");
  const parsed = reservationSchema.parse(Object.fromEntries(formData));

  if (!isDatabaseConfigured()) {
    return { ok: true };
  }

  const startsAt = combineDateTime(parsed.startDate, parsed.pickupTime);
  const endsAt = combineDateTime(parsed.endDate, parsed.returnTime);
  const overlapping = await prisma.reservation.findFirst({
    where: {
      organizationId: session.organization.id,
      vehicleId: parsed.vehicleId,
      status: { in: ["QUOTE", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "LATE"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt }
    }
  });

  if (overlapping) {
    throw new Error("That vehicle is already booked for the selected window.");
  }

  const blocked = await prisma.vehicleAvailabilityBlock.findFirst({
    where: {
      organizationId: session.organization.id,
      vehicleId: parsed.vehicleId,
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt }
    }
  });

  if (blocked) {
    throw new Error("That vehicle is blocked for the selected window.");
  }

  const vehicle = await prisma.vehicle.findFirstOrThrow({
    where: {
      id: parsed.vehicleId,
      organizationId: session.organization.id
    }
  });
  const days = Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 86_400_000));

  const reservation = await prisma.reservation.create({
    data: {
      organizationId: session.organization.id,
      customerId: parsed.customerId,
      vehicleId: parsed.vehicleId,
      startsAt,
      endsAt,
      status: "CONFIRMED",
      totalCents: Math.round(days * Number(vehicle.dailyRate) * 100),
      depositCents: Math.round(parsed.deposit * 100),
      payments: {
        create: {
          amountCents: Math.round(parsed.deposit * 100),
          kind: "deposit",
          status: "held"
        }
      }
    }
  });

  await prisma.vehicle.update({
    where: { id: parsed.vehicleId },
    data: { status: "RESERVED" }
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      action: "confirmed booking",
      target: reservation.id
    }
  });

  return { ok: true };
}

export async function createAvailabilityBlockAction(formData: FormData) {
  const session = await assertWrite("fleet:write");
  const parsed = availabilityBlockSchema.parse(Object.fromEntries(formData));

  if (!isDatabaseConfigured()) {
    return { ok: true };
  }

  const startsAt = new Date(`${parsed.startDate}T00:00:00`);
  const endsAt = new Date(`${parsed.endDate}T23:59:59`);
  await prisma.vehicle.findFirstOrThrow({
    where: { id: parsed.vehicleId, organizationId: session.organization.id }
  });

  const overlappingReservation = await prisma.reservation.findFirst({
    where: {
      organizationId: session.organization.id,
      vehicleId: parsed.vehicleId,
      status: { in: ["QUOTE", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "LATE"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt }
    }
  });

  if (overlappingReservation) {
    throw new Error("That vehicle already has a booking in this date range.");
  }

  await prisma.vehicleAvailabilityBlock.create({
    data: {
      organizationId: session.organization.id,
      vehicleId: parsed.vehicleId,
      startsAt,
      endsAt,
      reason: parsed.reason
    }
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      action: "blocked vehicle dates",
      target: parsed.reason
    }
  });

  return { ok: true };
}

export async function deleteAvailabilityBlockAction(blockId: string) {
  const session = await assertWrite("fleet:write");

  if (!isDatabaseConfigured()) {
    return { ok: true };
  }

  await prisma.vehicleAvailabilityBlock.deleteMany({
    where: { id: blockId, organizationId: session.organization.id }
  });

  return { ok: true };
}

export async function createMaintenanceAction(formData: FormData) {
  const session = await assertWrite("fleet:write");
  const parsed = maintenanceSchema.parse(Object.fromEntries(formData));

  if (!isDatabaseConfigured()) {
    return { ok: true };
  }

  await prisma.maintenance.create({
    data: {
      organizationId: session.organization.id,
      vehicleId: parsed.vehicleId,
      kind: parsed.kind,
      status: parsed.status,
      dueAtMileage: parsed.dueAtMileage,
      dueDate: new Date(`${parsed.dueDate}T12:00:00`),
      costCents: Math.round(parsed.costEstimate * 100),
      notes: `${parsed.priority} priority`
    }
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      action: "scheduled maintenance",
      target: parsed.kind
    }
  });

  return { ok: true };
}

export async function createDamageReportAction(formData: FormData) {
  const session = await assertWrite("reservations:write");
  const parsed = damageReportSchema.parse(Object.fromEntries(formData));

  if (!isDatabaseConfigured()) {
    return { ok: true };
  }

  await prisma.damageReport.create({
    data: {
      organizationId: session.organization.id,
      vehicleId: parsed.vehicleId,
      reservationId: parsed.reservationId || null,
      phase: parsed.phase,
      mileage: parsed.mileage,
      fuelLevel: parsed.fuelLevel,
      notes: parsed.notes,
      estimateCents: Math.round(parsed.estimate * 100),
      mediaUrls: []
    }
  });

  await prisma.vehicle.update({
    where: { id: parsed.vehicleId },
    data: { status: "MAINTENANCE" }
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      action: "filed damage report",
      target: parsed.phase
    }
  });

  return { ok: true };
}

export async function createContractAction(reservationId: string) {
  const session = await assertWrite("reservations:write");

  if (!isDatabaseConfigured()) {
    return { ok: true };
  }

  const reservation = await prisma.reservation.findFirstOrThrow({
    where: {
      id: reservationId,
      organizationId: session.organization.id
    }
  });

  await prisma.contract.upsert({
    where: { reservationId: reservation.id },
    update: {},
    create: {
      reservationId: reservation.id,
      pdfUrl: `/api/contracts/${reservation.id}`
    }
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      action: "generated contract",
      target: reservation.id
    }
  });

  return { ok: true };
}

export async function updateWebsiteSettingsAction(formData: FormData) {
  const session = await assertWrite("settings:write");
  const parsed = websiteSettingsSchema.parse(Object.fromEntries(formData));
  const logoFile = formData.get("logo") instanceof File ? formData.get("logo") as File : null;
  const coverFile = formData.get("coverImage") instanceof File ? formData.get("coverImage") as File : null;
  const uploadedLogoUrl = await uploadFleetImage(logoFile, session.organization.id, "branding");
  const uploadedCoverImageUrl = await uploadFleetImage(coverFile, session.organization.id, "branding");
  const logoUrl = uploadedLogoUrl || parsed.logoUrl || null;
  const coverImageUrl = uploadedCoverImageUrl || parsed.coverImageUrl || null;

  if (!isDatabaseConfigured()) {
    return { ok: true, message: "Demo mode: website settings preview saved locally.", logoUrl, coverImageUrl };
  }

  await prisma.websiteSetting.upsert({
    where: { organizationId: session.organization.id },
    update: {
      logoUrl,
      coverImageUrl,
      backgroundStyle: parsed.backgroundStyle,
      brandColor: parsed.brandColor,
      heroTitle: parsed.heroTitle,
      about: parsed.about || null,
      serviceArea: parsed.serviceArea || null,
      contactEmail: parsed.contactEmail || null,
      contactPhone: parsed.contactPhone || null,
      instagramUrl: parsed.instagramUrl || null,
      facebookUrl: parsed.facebookUrl || null,
      pickupInstructions: parsed.pickupInstructions || null,
      cancellationPolicy: parsed.cancellationPolicy || null,
      depositPolicy: parsed.depositPolicy || null,
      businessHours: parsed.businessHours || null,
      trustBadges: splitList(parsed.trustBadges),
      seoTitle: parsed.seoTitle || null,
      customDomain: parsed.customDomain || null,
      depositFeeCents: Math.round(parsed.depositFee * 100)
    },
    create: {
      organizationId: session.organization.id,
      logoUrl,
      coverImageUrl,
      backgroundStyle: parsed.backgroundStyle,
      brandColor: parsed.brandColor,
      heroTitle: parsed.heroTitle,
      about: parsed.about || null,
      serviceArea: parsed.serviceArea || null,
      contactEmail: parsed.contactEmail || null,
      contactPhone: parsed.contactPhone || null,
      instagramUrl: parsed.instagramUrl || null,
      facebookUrl: parsed.facebookUrl || null,
      pickupInstructions: parsed.pickupInstructions || null,
      cancellationPolicy: parsed.cancellationPolicy || null,
      depositPolicy: parsed.depositPolicy || null,
      businessHours: parsed.businessHours || null,
      trustBadges: splitList(parsed.trustBadges),
      seoTitle: parsed.seoTitle || null,
      customDomain: parsed.customDomain || null,
      depositFeeCents: Math.round(parsed.depositFee * 100)
    }
  });

  await prisma.organization.update({
    where: { id: session.organization.id },
    data: {
      domain: parsed.customDomain || `${session.organization.slug}.fleetpilot.ai`
    }
  });

  await prisma.activityLog.create({
    data: {
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      action: "updated website settings",
      target: session.organization.slug
    }
  });

  return { ok: true, message: "Website settings saved.", logoUrl, coverImageUrl };
}
