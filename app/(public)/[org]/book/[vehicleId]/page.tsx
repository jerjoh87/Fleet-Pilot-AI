import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublicTenant, getPublicVehicle, getVehicleAvailability } from "@/lib/data/public-data";
import { getBookingInsurance } from "@/lib/insurance/data";
import { BookingForm } from "@/components/public/booking-form";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BookVehiclePage({ params }: PageProps<"/[org]/book/[vehicleId]">) {
  const { org, vehicleId } = await params;
  const [tenant, vehicle, availabilityBlocks] = await Promise.all([
    getPublicTenant(org),
    getPublicVehicle(org, vehicleId),
    getVehicleAvailability(org, vehicleId)
  ]);

  if (!vehicle) {
    notFound();
  }

  const slug = tenant?.slug ?? org;
  const bookVehiclePath = `/${slug}/book/${vehicle.id}`;

  // Booking requires a signed-in renter with a completed profile. (Demo mode —
  // no Supabase — stays open so local development keeps working.)
  let prefill: { name: string; email: string; phone: string } | undefined;
  if (isSupabaseConfigured()) {
    const authUser = await createSupabaseServerClient()
      .then((supabase) => supabase.auth.getUser())
      .then(({ data }) => data.user)
      .catch(() => null);

    if (!authUser?.email) {
      redirect(`/${slug}/signup?next=${encodeURIComponent(bookVehiclePath)}` as never);
    }

    if (isDatabaseConfigured()) {
      const org = await prisma.organization.findFirst({
        where: { OR: [{ slug }, { domain: slug }] },
        select: { id: true }
      });
      const customer = org
        ? await prisma.customer.findFirst({
            where: { organizationId: org.id, email: { equals: authUser.email, mode: "insensitive" } },
            select: { name: true, email: true, phone: true, address: true }
          })
        : null;

      // Missing profile details (e.g. an OAuth signup) — collect them before booking.
      if (!customer || !customer.phone || !customer.address) {
        redirect(
          `/${slug}/portal?complete=1&next=${encodeURIComponent(bookVehiclePath)}` as never
        );
      }

      prefill = { name: customer.name, email: customer.email, phone: customer.phone ?? "" };
    } else {
      prefill = { name: authUser.user_metadata?.full_name ?? "", email: authUser.email, phone: "" };
    }
  }

  const bookingInsurance = await getBookingInsurance(org, Math.round(vehicle.dailyRate * 100));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <a
        href={`/${org}/vehicles/${vehicle.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to vehicle
      </a>
      <h1 className="mt-6 text-3xl font-bold">Reserve your {vehicle.make} {vehicle.model}</h1>
      <p className="mt-1 text-muted-foreground">Verify your identity, sign the agreement, and continue to secure checkout.</p>

      <div className="mt-8">
        <BookingForm
          slug={org}
          vehicle={vehicle}
          brandColor={tenant?.brandColor ?? "#166534"}
          depositFee={tenant?.depositFee ?? 250}
          taxRatePct={tenant?.taxRatePct ?? 8}
          platformFeePct={tenant?.platformFeePct ?? 10}
          availabilityBlocks={availabilityBlocks}
          bookingInsurance={bookingInsurance}
          prefill={prefill}
          idUploadAvailable={isSupabaseAdminConfigured()}
        />
      </div>
    </div>
  );
}
