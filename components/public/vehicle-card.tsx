import { Heart, Star, Zap } from "lucide-react";
import type { PublicVehicle } from "@/lib/data/public-data";
import { currency } from "@/lib/utils";

export function VehicleCard({ slug, vehicle }: { slug: string; vehicle: PublicVehicle }) {
  const available = vehicle.status === "Available";
  const isEv = vehicle.fuelType === "Electric";

  return (
    <a href={`/${slug}/vehicles/${vehicle.id}`} className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
        <div
          className="size-full bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${vehicle.image})` }}
        />
        <span className="pointer-events-none absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur transition group-hover:bg-white">
          <Heart className="size-4" />
        </span>
        {isEv ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
            <Zap className="size-3.5 text-emerald-600" /> Electric
          </span>
        ) : !available ? (
          <span className="absolute left-3 top-3 rounded-full bg-foreground/85 px-2.5 py-1 text-xs font-semibold text-background">
            {vehicle.status}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">
            {vehicle.make} {vehicle.model}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm">
            <Star className="size-3.5 fill-foreground text-foreground" />
            <span className="font-medium">{vehicle.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({vehicle.trips})</span>
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          {vehicle.year} · {vehicle.location}
        </p>

        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="truncate">{vehicle.host}</span>
          {vehicle.hostAllStar ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <Star className="size-3 fill-emerald-600 text-emerald-600" /> All-Star Host
            </span>
          ) : null}
        </div>

        <p className="mt-1.5">
          <span className="text-lg font-bold">{currency.format(vehicle.dailyRate)}</span>
          <span className="text-sm text-muted-foreground"> /day</span>
        </p>
      </div>
    </a>
  );
}
