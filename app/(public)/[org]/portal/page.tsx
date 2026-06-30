import { Download, Search } from "lucide-react";
import { getPortalReservations, getPublicTenant } from "@/lib/data/public-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { currency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerPortalPage({ params, searchParams }: PageProps<"/[org]/portal">) {
  const { org } = await params;
  const query = (await searchParams) as { reservation?: string; email?: string };
  const tenant = await getPublicTenant(org);
  const brand = tenant?.brandColor ?? "#166534";
  const authUser = isSupabaseConfigured()
    ? await createSupabaseServerClient()
        .then((supabase) => supabase.auth.getUser())
        .then(({ data }) => data.user)
        .catch(() => null)
    : null;
  const customerEmail = query.email || authUser?.email || "";
  const reservations = await getPortalReservations(org, {
    reservationId: query.reservation,
    email: customerEmail
  });
  const searched = Boolean(query.reservation || customerEmail);
  const slug = tenant?.slug ?? org;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">{tenant?.name} customer portal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Find your reservation</h1>
        <p className="mt-3 text-muted-foreground">
          View trip details, payment status, and download your rental agreement.
        </p>
        {authUser?.email ? (
          <div className="mt-4 rounded-2xl border bg-card p-4 text-sm">
            <p className="font-medium">Signed in as {authUser.email}</p>
            <p className="mt-1 text-muted-foreground">Your reservations are loaded automatically from this email.</p>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href={`/${slug}/signup`}
            className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white"
            style={{ backgroundColor: brand }}
          >
            Create customer account
          </a>
          {!authUser ? (
            <>
              <a href={`/api/auth/oauth?provider=google&next=${encodeURIComponent(`/${slug}/portal`)}`} className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold hover:bg-muted">
                Sign in with Gmail
              </a>
              <a href={`/api/auth/oauth?provider=yahoo&next=${encodeURIComponent(`/${slug}/portal`)}`} className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold hover:bg-muted">
                Sign in with Yahoo
              </a>
            </>
          ) : null}
          <a href={`/${slug}`} className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold hover:bg-muted">
            Browse cars
          </a>
        </div>
      </div>

      <form className="mt-8 grid gap-3 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm">
          <span className="text-muted-foreground">Reservation reference</span>
          <input
            name="reservation"
            defaultValue={query.reservation ?? ""}
            placeholder="res_..."
            className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Email address</span>
          <input
            name="email"
            type="email"
            defaultValue={customerEmail}
            placeholder="you@example.com"
            className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm"
          />
        </label>
        <button
          className="mt-5 flex h-11 items-center justify-center gap-2 rounded-lg px-5 font-semibold text-white md:self-end"
          style={{ backgroundColor: brand }}
        >
          <Search className="size-4" />
          Search
        </button>
      </form>

      <div className="mt-8 space-y-4">
        {reservations.map((reservation) => (
          <article key={reservation.id} className="grid gap-4 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-[160px_1fr]">
            <div className="h-36 rounded-xl bg-cover bg-center md:h-full" style={{ backgroundImage: `url(${reservation.vehicleImage})` }} />
            <div className="min-w-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{reservation.startsAt} to {reservation.endsAt}</p>
                  <h2 className="mt-1 text-xl font-bold">{reservation.vehicleName}</h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{reservation.id}</p>
                </div>
                <span className="w-fit rounded-full border px-3 py-1 text-sm font-medium">{reservation.status}</span>
              </div>

              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-xl bg-muted/50 p-3">
                  <dt className="text-muted-foreground">Payment</dt>
                  <dd className="mt-1 font-semibold">{reservation.paymentStatus}</dd>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <dt className="text-muted-foreground">Trip total</dt>
                  <dd className="mt-1 font-semibold">{currency.format(reservation.totalCents / 100)}</dd>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <dt className="text-muted-foreground">Deposit</dt>
                  <dd className="mt-1 font-semibold">{currency.format(reservation.depositCents / 100)}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={`/api/public/contracts/${reservation.id}?email=${encodeURIComponent(reservation.customerEmail)}`}
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  <Download className="size-4" />
                  Download contract
                </a>
                <span className="text-sm text-muted-foreground">
                  Contract {reservation.contractSigned ? "signed" : "pending signature"}
                </span>
              </div>
            </div>
          </article>
        ))}

        {searched && !reservations.length ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            No reservation matched those details. Check the reference from your confirmation email.
          </div>
        ) : null}
      </div>
    </div>
  );
}
