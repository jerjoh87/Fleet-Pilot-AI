import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublicTenant, getPublicVehicle, getVehicleAvailability } from "@/lib/data/public-data";
import { BookingForm } from "@/components/public/booking-form";

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <a
        href={`/${org}/vehicles/${vehicle.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to vehicle
      </a>
      <h1 className="mt-6 text-3xl font-bold">Reserve your {vehicle.make} {vehicle.model}</h1>
      <p className="mt-1 text-muted-foreground">Enter your trip details and continue to secure checkout.</p>

      <div className="mt-8">
        <BookingForm
          slug={org}
          vehicle={vehicle}
          brandColor={tenant?.brandColor ?? "#166534"}
          depositFee={tenant?.depositFee ?? 250}
          availabilityBlocks={availabilityBlocks}
        />
      </div>
    </div>
  );
}
