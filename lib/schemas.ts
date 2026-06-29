import { z } from "zod";

export const vehicleSchema = z.object({
  make: z.string().min(2),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1990).max(2035),
  vin: z.string().min(11).max(17),
  licensePlate: z.string().min(2),
  mileage: z.coerce.number().int().min(0),
  fuelLevel: z.coerce.number().min(0).max(100),
  status: z.enum(["Available", "Reserved", "Rented", "Cleaning", "Maintenance", "Out of Service", "Retired"]),
  location: z.string().min(2),
  dailyRate: z.coerce.number().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  publicDescription: z.string().max(600).optional().or(z.literal("")),
  features: z.string().max(500).optional().or(z.literal("")),
  rules: z.string().max(500).optional().or(z.literal(""))
});

export const vehicleUpdateSchema = vehicleSchema.extend({
  id: z.string().min(1)
});

export const availabilityBlockSchema = z.object({
  vehicleId: z.string().min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
  reason: z.string().min(2).max(120)
}).refine((value) => value.endDate >= value.startDate, {
  message: "End date must be after start date",
  path: ["endDate"]
});

export const reservationSchema = z.object({
  customerId: z.string().min(1),
  vehicleId: z.string().min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
  pickupTime: z.string().min(4),
  returnTime: z.string().min(4),
  deposit: z.coerce.number().min(0)
}).refine((value) => value.endDate >= value.startDate, {
  message: "Return date must be after pickup date",
  path: ["endDate"]
});

export const customerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  type: z.enum(["Retail", "Corporate", "VIP"]),
  licenseStatus: z.enum(["Verified", "Pending", "Rejected"])
});

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1),
  kind: z.string().min(2),
  dueAtMileage: z.coerce.number().int().min(0),
  dueDate: z.string().date(),
  priority: z.enum(["Low", "Medium", "High"]),
  status: z.enum(["Scheduled", "Due", "Completed"]),
  costEstimate: z.coerce.number().min(0)
});

export const damageReportSchema = z.object({
  vehicleId: z.string().min(1),
  reservationId: z.string().optional(),
  phase: z.enum(["Checkout", "Return", "Inspection", "Maintenance"]),
  mileage: z.coerce.number().int().min(0),
  fuelLevel: z.coerce.number().min(0).max(100),
  notes: z.string().min(3),
  estimate: z.coerce.number().min(0).default(0)
});

export const websiteSettingsSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  backgroundStyle: z.enum(["soft", "solid", "cover"]).default("soft"),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  heroTitle: z.string().min(8).max(120),
  about: z.string().max(1200).optional().or(z.literal("")),
  serviceArea: z.string().max(120).optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(40).optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  pickupInstructions: z.string().max(900).optional().or(z.literal("")),
  cancellationPolicy: z.string().max(900).optional().or(z.literal("")),
  depositPolicy: z.string().max(900).optional().or(z.literal("")),
  businessHours: z.string().max(500).optional().or(z.literal("")),
  trustBadges: z.string().max(400).optional().or(z.literal("")),
  seoTitle: z.string().max(80).optional().or(z.literal("")),
  customDomain: z.string().max(120).optional().or(z.literal("")),
  depositFee: z.coerce.number().min(0).max(10000)
});
