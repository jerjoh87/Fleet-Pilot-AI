import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Check, Clock, Fuel, Heart, MapPin, Settings2, Share, Shield, Star, Users } from "lucide-react";
import { getHostProfile, getPublicTenant, getPublicVehicle, getReviews } from "@/lib/data/public-data";
import { ReviewsSection } from "@/components/public/reviews-section";
import { currency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({ params }: PageProps<"/[org]/vehicles/[vehicleId]">) {
  const { org, vehicleId } = await params;
  const [tenant, vehicle, host, reviews] = await Promise.all([
    getPublicTenant(org),
    getPublicVehicle(org, vehicleId),
    getHostProfile(org),
    getReviews(org, 3)
  ]);

  if (!vehicle) {
    notFound();
  }

  const brand = tenant?.brandColor ?? "#166534";
  const depositFee = tenant?.depositFee ?? 250;
  const available = vehicle.status === "Available";

  const specs = [
    { icon: Users, label: "Seats", value: String(vehicle.seats) },
    { icon: Settings2, label: "Transmission", value: vehicle.transmission },
    { icon: Fuel, label: "Fuel", value: vehicle.fuelType },
    { icon: MapPin, label: "Pickup", value: vehicle.location }
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <a href={`/${org}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to fleet
      </a>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${vehicle.image})` }}>
            <div className="absolute right-3 top-3 flex gap-2">
              <span className="flex size-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur">
                <Share className="size-4" />
              </span>
              <span className="flex size-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur">
                <Heart className="size-4" />
              </span>
            </div>
          </div>

          <h1 className="mt-6 text-3xl font-bold">
            {vehicle.make} {vehicle.model}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1 font-medium">
              <Star className="size-4 fill-foreground text-foreground" /> {vehicle.rating.toFixed(1)}
              <span className="font-normal text-muted-foreground">({vehicle.trips} trips)</span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{vehicle.year}</span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="size-3.5" /> {vehicle.location}</span>
          </div>

          {/* Host card */}
          <div className="mt-6 rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-12 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: brand }}
                >
                  {host.initials}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 font-semibold">
                    Hosted by {host.name}
                    <BadgeCheck className="size-4" style={{ color: brand }} />
                  </p>
                  <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                    <Star className="size-3.5 fill-foreground text-foreground" /> {host.rating.toFixed(2)}
                    <span>· {host.completedTrips.toLocaleString()} trips</span>
                    <span className="inline-flex items-center gap-1">· <Clock className="size-3.5" /> Responds {host.responseTime}</span>
                  </p>
                </div>
              </div>
              {vehicle.hostAllStar ? (
                <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:inline-flex">
                  <Star className="size-3.5 fill-emerald-600 text-emerald-600" /> All-Star Host
                </span>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              {host.verifications.map((verification) => (
                <span key={verification} className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
                  <BadgeCheck className="size-3.5 text-emerald-600" /> {verification}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-6 max-w-3xl leading-7 text-muted-foreground">{vehicle.publicDescription}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {specs.map((spec) => {
              const Icon = spec.icon;
              return (
                <div key={spec.label} className="rounded-xl border bg-card p-4">
                  <Icon className="size-5 text-muted-foreground" />
                  <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{spec.label}</p>
                  <p className="font-medium">{spec.value}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-semibold">What&apos;s included</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {vehicle.features.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <Check className="size-4" style={{ color: brand }} /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-semibold">Vehicle rules</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {vehicle.rules.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <Check className="size-4" style={{ color: brand }} /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border bg-card p-6 shadow-lg">
            <div className="flex items-end justify-between">
              <p>
                <span className="text-3xl font-bold">{currency.format(vehicle.dailyRate)}</span>
                <span className="text-muted-foreground"> /day</span>
              </p>
              <span className="inline-flex items-center gap-1 text-sm">
                <Star className="size-4 fill-foreground text-foreground" />
                <span className="font-medium">{vehicle.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({vehicle.trips})</span>
              </span>
            </div>

            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Daily rate</dt>
                <dd>{currency.format(vehicle.dailyRate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Refundable deposit</dt>
                <dd>{currency.format(depositFee)}</dd>
              </div>
              <div className="flex items-center gap-2 pt-2 text-muted-foreground">
                <Shield className="size-4" style={{ color: brand }} /> Free cancellation up to 24h before pickup
              </div>
            </dl>

            <a
              href={`/${org}/book/${vehicle.id}`}
              aria-disabled={!available}
              className={`mt-6 block rounded-full py-3.5 text-center font-semibold text-white transition hover:opacity-90 ${available ? "" : "pointer-events-none opacity-50"}`}
              style={{ backgroundColor: brand }}
            >
              {available ? "Continue" : "Currently unavailable"}
            </a>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              You won&apos;t be charged until you confirm at checkout.
            </p>
          </div>
        </aside>
      </div>

      <div className="-mx-4 mt-4 border-t md:-mx-6">
        <ReviewsSection host={host} reviews={reviews} />
      </div>
    </div>
  );
}
