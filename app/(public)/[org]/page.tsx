import type { Metadata } from "next";
import { MapPin, Search, ShieldCheck, SlidersHorizontal, Star } from "lucide-react";
import { getHostProfile, getPublicFleet, getPublicTenant, getReviews } from "@/lib/data/public-data";
import { VehicleCard } from "@/components/public/vehicle-card";
import { ReviewsSection } from "@/components/public/reviews-section";
import { appUrl } from "@/lib/billing/customer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[org]">): Promise<Metadata> {
  const { org } = await params;
  const tenant = await getPublicTenant(org);
  if (!tenant) {
    return {
      title: "FleetPilot AI",
      description: "AI operating system for independent car rental businesses"
    };
  }

  const title = `${tenant.name} | ${tenant.heroTitle || "Premium vehicle rentals"}`;
  const description =
    tenant.about ||
    `Browse ${tenant.name}'s fleet, reserve online, and manage your rental with secure checkout.`;
  const canonical = `${appUrl()}/${tenant.slug}`;
  const image = `${appUrl()}/${tenant.slug}/og-image`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: tenant.name,
      images: [{ url: image, width: 1200, height: 630, alt: `${tenant.name} vehicle rentals` }],
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    }
  };
}

const CHIPS: { label: string; params: Record<string, string> }[] = [
  { label: "All cars", params: {} },
  { label: "Electric", params: { fuel: "Electric" } },
  { label: "Gas", params: { fuel: "Gasoline" } },
  { label: "Under $100", params: { maxRate: "100" } },
  { label: "Under $150", params: { maxRate: "150" } },
  { label: "Under $250", params: { maxRate: "250" } }
];

export default async function TenantHomePage({ params, searchParams }: PageProps<"/[org]">) {
  const { org } = await params;
  const filters = (await searchParams) as { q?: string; maxRate?: string; fuel?: string };
  const tenant = await getPublicTenant(org);
  const fleet = await getPublicFleet(org, {
    query: filters.q,
    maxRate: filters.maxRate ? Number(filters.maxRate) : undefined,
    fuelType: filters.fuel
  });
  const [host, reviews] = await Promise.all([getHostProfile(org), getReviews(org)]);

  const brand = tenant?.brandColor ?? "#166534";
  const today = new Date().toISOString().slice(0, 10);

  const useCover = tenant?.backgroundStyle === "cover" && tenant.coverImageUrl;
  const heroVideoUrl = org === "luxedrive" ? "/videos/luxedrive-traffic-bg.mp4" : "";
  const useHeroVideo = Boolean(heroVideoUrl) && !useCover;
  const heroStyle = useCover
    ? undefined
    : useHeroVideo
      ? undefined
    : tenant?.backgroundStyle === "solid"
      ? { background: brand, color: "#fff" }
      : { background: `linear-gradient(135deg, ${brand}20, ${brand}08 42%, transparent 78%)` };
  const onDarkHero = Boolean(useCover || useHeroVideo || tenant?.backgroundStyle === "solid");

  function chipHref(chipParams: Record<string, string>) {
    const search = new URLSearchParams();
    if (filters.q) search.set("q", filters.q);
    for (const [key, value] of Object.entries(chipParams)) search.set(key, value);
    const qs = search.toString();
    return qs ? `/${org}?${qs}` : `/${org}`;
  }

  function chipActive(chipParams: Record<string, string>) {
    const keys = Object.keys(chipParams);
    if (keys.length === 0) return !filters.fuel && !filters.maxRate;
    return keys.every((key) => (filters as Record<string, string | undefined>)[key] === chipParams[key]);
  }

  return (
    <div>
      {/* Hero */}
      <section className={`relative overflow-hidden border-b ${useHeroVideo ? "bg-slate-950" : ""}`} style={heroStyle}>
        {useHeroVideo ? (
          <>
            <video
              className="absolute inset-0 size-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            >
              <source src={heroVideoUrl} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65" />
          </>
        ) : null}

        {useCover ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.35)), url(${tenant.coverImageUrl})` }}
          />
        ) : null}

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 md:px-6 md:pb-16 md:pt-14">
          {/* Host header */}
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-4">
              {tenant?.logoUrl ? (
                <img src={tenant.logoUrl} alt={`${tenant.name} logo`} className="size-14 rounded-2xl border bg-card object-cover shadow-sm" />
              ) : null}
              <div className={onDarkHero ? "text-white" : ""}>
                <p className={`text-sm ${onDarkHero ? "text-white/80" : "text-muted-foreground"}`}>
                  {tenant?.serviceArea || "Local rental host"}
                </p>
                <h2 className="text-xl font-bold">{tenant?.name}</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(tenant?.trustBadges.length ? tenant.trustBadges : ["Verified fleet", "Secure checkout"]).map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1.5 rounded-full border bg-card/95 px-3 py-1 text-xs font-medium backdrop-blur">
                  <ShieldCheck className="size-3.5" style={{ color: brand }} /> {badge}
                </span>
              ))}
            </div>
          </div>

          <div className={`mt-8 ${onDarkHero ? "text-white" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Star className={`size-4 ${onDarkHero ? "fill-white text-white" : "fill-foreground text-foreground"}`} />
              <span className="font-medium">4.9</span>
              <span className={onDarkHero ? "text-white/80" : "text-muted-foreground"}>
                · Thousands of trips in {tenant?.serviceArea || "your city"}
              </span>
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              {tenant?.heroTitle ?? "Find your drive."}
            </h1>
            <p className={`mt-4 max-w-2xl text-lg ${onDarkHero ? "text-white/85" : "text-muted-foreground"}`}>
              {tenant?.about || `Browse the ${tenant?.name} fleet, book instantly, and skip the rental counter. Premium cars, hosted locally.`}
            </p>
          </div>

          {/* Segmented search bar */}
          <form
            method="get"
            className="mt-8 grid items-stretch gap-2 rounded-3xl border bg-card p-2 text-foreground shadow-xl sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:rounded-full"
          >
            <label className="flex items-center gap-2 rounded-2xl px-4 py-2 hover:bg-muted/60 sm:rounded-full">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex min-w-0 flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Where</span>
                <input
                  name="q"
                  defaultValue={filters.q ?? ""}
                  placeholder="City, make, or model"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </span>
            </label>
            <label className="flex flex-col rounded-2xl px-4 py-2 hover:bg-muted/60 sm:rounded-full">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">From</span>
              <input name="from" type="date" min={today} defaultValue={today} className="w-full bg-transparent text-sm outline-none" />
            </label>
            <label className="flex flex-col rounded-2xl px-4 py-2 hover:bg-muted/60 sm:rounded-full">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Until</span>
              <input name="until" type="date" min={today} className="w-full bg-transparent text-sm outline-none" />
            </label>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:aspect-square sm:px-0"
              style={{ backgroundColor: brand }}
              aria-label="Search"
            >
              <Search className="size-5" />
              <span className="sm:hidden">Search</span>
            </button>
          </form>
        </div>
      </section>

      {/* Fleet */}
      <section className="mx-auto max-w-6xl px-4 pb-2 pt-12 md:px-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <div className="flex gap-2">
            {CHIPS.map((chip) => {
              const active = chipActive(chip.params);
              return (
                <a
                  key={chip.label}
                  href={chipHref(chip.params)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active ? "border-foreground bg-foreground text-background" : "bg-card hover:border-foreground/40"
                  }`}
                >
                  {chip.label}
                </a>
              );
            })}
          </div>
          <span className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium">
            <SlidersHorizontal className="size-4" /> Filters
          </span>
        </div>

        <div className="mb-6 mt-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">{fleet.length} car{fleet.length === 1 ? "" : "s"} available</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">Free cancellation up to 24h before pickup</p>
        </div>

        {fleet.length ? (
          <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {fleet.map((vehicle) => (
              <VehicleCard key={vehicle.id} slug={org} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed p-12 text-center text-muted-foreground">
            No cars match your search. Try widening your filters.
          </div>
        )}
      </section>

      {/* Reviews */}
      <ReviewsSection host={host} reviews={reviews} />

      {/* Policies */}
      <section id="policies" className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 md:grid-cols-3 md:px-6">
        <div className="flex flex-col justify-between gap-3 rounded-2xl border bg-card p-5 md:col-span-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-bold">Need the full booking walkthrough?</h2>
            <p className="mt-1 text-sm text-muted-foreground">See every step from choosing a car to signing the agreement and pickup.</p>
          </div>
          <a
            href={`/${org}/how-it-works`}
            className="inline-flex h-10 w-fit items-center justify-center rounded-lg px-4 text-sm font-semibold text-white"
            style={{ backgroundColor: brand }}
          >
            How booking works
          </a>
        </div>
        {[
          ["Pickup", tenant?.pickupInstructions],
          ["Deposit", tenant?.depositPolicy || `Refundable deposit: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(tenant?.depositFee ?? 250)}`],
          ["Cancellation", tenant?.cancellationPolicy]
        ].map(([title, text]) => (
          <div key={title} className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{text || "Policy details are shared during booking confirmation."}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
