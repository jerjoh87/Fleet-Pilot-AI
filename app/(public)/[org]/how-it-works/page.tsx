import { CalendarCheck, Car, CreditCard, FileSignature, IdCard, ShieldCheck } from "lucide-react";
import { getPublicTenant } from "@/lib/data/public-data";
import type { OrgRouteParamsProps } from "../route-types";

export const dynamic = "force-dynamic";

export default async function HowItWorksPage({ params }: OrgRouteParamsProps) {
  const { org } = await params;
  const tenant = await getPublicTenant(org);
  const brand = tenant?.brandColor ?? "#166534";
  const slug = tenant?.slug ?? org;
  const deposit = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(tenant?.depositFee ?? 250);

  const steps = [
    {
      icon: Car,
      title: "Choose a vehicle",
      body: "Browse available cars, compare daily rates, and pick the vehicle that fits your trip."
    },
    {
      icon: CalendarCheck,
      title: "Select trip dates",
      body: "Enter your pickup and return dates so availability and pricing can be confirmed."
    },
    {
      icon: IdCard,
      title: "Share driver details",
      body: "Provide your legal name, contact info, and driver information for the rental record."
    },
    {
      icon: ShieldCheck,
      title: "Choose coverage",
      body: "Use the available insurance options or submit your own coverage when the host allows it."
    },
    {
      icon: FileSignature,
      title: "Sign the agreement",
      body: "Review the rental terms and sign digitally before checkout is completed."
    },
    {
      icon: CreditCard,
      title: "Pay securely",
      body: "Complete payment online. Deposit holds are authorized and released after return inspection."
    }
  ];

  const policies = [
    {
      title: "Pickup",
      body: tenant?.pickupInstructions || "Pickup instructions are sent after checkout. Bring a valid driver's license and matching payment card."
    },
    {
      title: "Security deposit",
      body: tenant?.depositPolicy || `A refundable ${deposit} deposit may be authorized at booking and released after vehicle return inspection.`
    },
    {
      title: "Cancellation",
      body: tenant?.cancellationPolicy || "Free cancellation is available up to 24 hours before pickup. Late cancellations may be charged one rental day."
    }
  ];

  return (
    <div>
      <section className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <p className="text-sm font-medium text-muted-foreground">{tenant?.name} rentals</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">How booking works</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            A simple rental flow from vehicle search to signed agreement, secure payment, pickup, and return.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={`/${slug}`}
              className="inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold text-white"
              style={{ backgroundColor: brand }}
            >
              Browse cars
            </a>
            <a
              href={`/${slug}/portal`}
              className="inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-semibold hover:bg-muted"
            >
              Find my reservation
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-2xl border bg-card p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-5" style={{ color: brand }} />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">Step {index + 1}</span>
                </div>
                <h2 className="mt-5 text-lg font-semibold">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 md:px-6">
        <div className="mb-5">
          <p className="text-sm font-medium text-muted-foreground">Before pickup</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">What customers should know</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {policies.map((policy) => (
            <article key={policy.title} className="rounded-2xl border bg-card p-5">
              <h3 className="font-semibold">{policy.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{policy.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
