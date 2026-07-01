import { CheckCircle2, Download, FileSignature, IdCard, Receipt, Search, ShieldCheck, User } from "lucide-react";
import { getPortalAccount, getPortalReservations, getPublicTenant } from "@/lib/data/public-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { currency } from "@/lib/utils";
import { signOutCustomerAction, updateCustomerProfileAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CustomerPortalPage({ params, searchParams }: PageProps<"/[org]/portal">) {
  const { org } = await params;
  const query = (await searchParams) as {
    reservation?: string;
    email?: string;
    saved?: string;
    error?: string;
    complete?: string;
    next?: string;
  };
  const nextPath = query.next && query.next.startsWith("/") && !query.next.startsWith("//") ? query.next : "";
  const tenant = await getPublicTenant(org);
  const brand = tenant?.brandColor ?? "#166534";
  const slug = tenant?.slug ?? org;

  const authUser = isSupabaseConfigured()
    ? await createSupabaseServerClient()
        .then((supabase) => supabase.auth.getUser())
        .then(({ data }) => data.user)
        .catch(() => null)
    : null;

  // Signed-in customers get their full account automatically — no lookup needed.
  if (authUser?.email) {
    const account = await getPortalAccount(slug, authUser.email);
    return (
      <SignedInPortal
        account={account}
        slug={slug}
        brand={brand}
        tenantName={tenant?.name ?? slug}
        email={authUser.email}
        saved={query.saved === "1"}
        error={query.error}
        completeProfile={query.complete === "1"}
        nextPath={nextPath}
      />
    );
  }

  // Guests look up a single reservation by reference + email.
  const customerEmail = query.email || "";
  const reservations = await getPortalReservations(org, {
    reservationId: query.reservation,
    email: customerEmail
  });
  const searched = Boolean(query.reservation || customerEmail);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">{tenant?.name} customer portal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Your account</h1>
        <p className="mt-3 text-muted-foreground">
          Sign in to see your bookings, receipts, signed agreements, insurance, and profile in one place — no
          reservation number needed.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href={`/api/auth/oauth?provider=google&next=${encodeURIComponent(`/${slug}/portal`)}`}
            className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white"
            style={{ backgroundColor: brand }}
          >
            Sign in with Gmail
          </a>
          <a
            href={`/api/auth/oauth?provider=yahoo&next=${encodeURIComponent(`/${slug}/portal`)}`}
            className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold hover:bg-muted"
          >
            Sign in with Yahoo
          </a>
          <a
            href={`/${slug}/signup`}
            className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold hover:bg-muted"
          >
            Create account
          </a>
        </div>
      </div>

      <div className="mt-10 border-t pt-8">
        <h2 className="text-lg font-semibold">Look up a single reservation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Have a confirmation but no account? Find one booking with its reference and email.
        </p>
        <form className="mt-4 grid gap-3 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]">
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
      </div>

      <div className="mt-8 space-y-4">
        {reservations.map((reservation) => (
          <ReservationCard key={reservation.id} reservation={reservation} />
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

function SectionHeading({ icon: Icon, title, count }: { icon: typeof User; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-5 text-muted-foreground" />
      <h2 className="text-lg font-semibold">{title}</h2>
      {typeof count === "number" ? (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{count}</span>
      ) : null}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{children}</p>;
}

function ApprovalBadge({ status }: { status: string }) {
  if (status === "PENDING_REVIEW") {
    return (
      <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
        Pending host approval
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
        Not approved
      </span>
    );
  }
  return (
    <span className="rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-800">
      Approved
    </span>
  );
}

function ReservationCard({
  reservation
}: {
  reservation: Awaited<ReturnType<typeof getPortalReservations>>[number];
}) {
  return (
    <article className="grid gap-4 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-[160px_1fr]">
      <div
        className="h-36 rounded-xl bg-cover bg-center md:h-full"
        style={{ backgroundImage: `url(${reservation.vehicleImage})` }}
      />
      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {reservation.startsAt} to {reservation.endsAt}
            </p>
            <h3 className="mt-1 text-xl font-bold">{reservation.vehicleName}</h3>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{reservation.id}</p>
          </div>
          <div className="flex w-fit flex-col items-end gap-1.5">
            <span className="rounded-full border px-3 py-1 text-sm font-medium">{reservation.status}</span>
            <ApprovalBadge status={reservation.approvalStatus} />
          </div>
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
  );
}

function SignedInPortal({
  account,
  slug,
  brand,
  tenantName,
  email,
  saved,
  error,
  completeProfile,
  nextPath
}: {
  account: Awaited<ReturnType<typeof getPortalAccount>>;
  slug: string;
  brand: string;
  tenantName: string;
  email: string;
  saved: boolean;
  error?: string;
  completeProfile?: boolean;
  nextPath?: string;
}) {
  const { profile, reservations, payments, agreements, insuranceUploads, insurancePurchases } = account;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{tenantName} customer portal</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome back{profile ? `, ${profile.name.split(" ")[0]}` : ""}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Signed in as {email}</p>
        </div>
        <div className="flex items-center gap-3">
          <a href={`/${slug}`} className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold hover:bg-muted">
            Browse cars
          </a>
          <form action={signOutCustomerAction}>
            <input type="hidden" name="slug" value={slug} />
            <button className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold hover:bg-muted">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {saved ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="size-4" /> Your profile was updated.
        </div>
      ) : null}
      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {profile ? null : (
        <div className="mt-6 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
          We couldn&apos;t find a customer record for {email} with {tenantName} yet. Once you complete a booking it will
          appear here. You can still set up your profile below.
        </div>
      )}

      {completeProfile ? (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Please add your phone number and address to finish your profile — they&apos;re required before you can book.
        </div>
      ) : null}

      {/* Profile */}
      <section className="mt-10">
        <SectionHeading icon={User} title="Profile" />
        <form action={updateCustomerProfileAction} className="mt-4 grid gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:grid-cols-2">
          <input type="hidden" name="slug" value={slug} />
          {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
          <label className="text-sm">
            <span className="text-muted-foreground">Full name</span>
            <input
              name="name"
              required
              minLength={2}
              defaultValue={profile?.name ?? ""}
              className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground">Phone</span>
            <input
              name="phone"
              type="tel"
              required
              defaultValue={profile?.phone ?? ""}
              placeholder="(555) 555-0100"
              className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-muted-foreground">Address</span>
            <input
              name="address"
              required
              defaultValue={profile?.address ?? ""}
              placeholder="Street, city, state, ZIP"
              className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground">Email</span>
            <input
              value={email}
              readOnly
              className="mt-1 h-11 w-full cursor-not-allowed rounded-lg border bg-muted px-3 text-sm text-muted-foreground"
            />
          </label>
          <div className="text-sm">
            <span className="text-muted-foreground">Driver&apos;s license</span>
            <div className="mt-1 flex h-11 items-center gap-2 rounded-lg border bg-muted/40 px-3">
              <IdCard className="size-4 text-muted-foreground" />
              <span className="font-medium">{profile?.licenseStatus ?? "Pending"}</span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <button
              className="inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-semibold text-white"
              style={{ backgroundColor: brand }}
            >
              Save profile
            </button>
            {profile?.memberSince ? (
              <span className="ml-3 text-xs text-muted-foreground">Customer since {profile.memberSince}</span>
            ) : null}
          </div>
        </form>
      </section>

      {/* Booking history */}
      <section className="mt-12">
        <SectionHeading icon={Receipt} title="Booking history" count={reservations.length} />
        <div className="mt-4 space-y-4">
          {reservations.length ? (
            reservations.map((reservation) => <ReservationCard key={reservation.id} reservation={reservation} />)
          ) : (
            <EmptyHint>
              No bookings yet. <a href={`/${slug}`} className="font-medium underline">Browse the fleet</a> to book your first
              trip.
            </EmptyHint>
          )}
        </div>
      </section>

      {/* Receipts */}
      <section className="mt-12">
        <SectionHeading icon={Receipt} title="Receipts & payments" count={payments.length} />
        <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
          {payments.length ? (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t">
                    <td className="px-4 py-3">{payment.date}</td>
                    <td className="px-4 py-3">{payment.vehicleName}</td>
                    <td className="px-4 py-3 capitalize">{payment.kind}</td>
                    <td className="px-4 py-3">{payment.status}</td>
                    <td className="px-4 py-3 text-right font-semibold">{currency.format(payment.amountCents / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4">
              <EmptyHint>Your payment receipts will appear here after your first charge.</EmptyHint>
            </div>
          )}
        </div>
      </section>

      {/* Signed agreements */}
      <section className="mt-12">
        <SectionHeading icon={FileSignature} title="Signed agreements" count={agreements.length} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {agreements.length ? (
            agreements.map((agreement) => (
              <div key={agreement.reservationId} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{agreement.vehicleName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Signed by {agreement.legalName}</p>
                    <p className="text-xs text-muted-foreground">on {agreement.agreedAt}</p>
                  </div>
                  <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium">{agreement.status}</span>
                </div>
                <a
                  href={agreement.downloadHref}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  <Download className="size-4" />
                  Download agreement
                </a>
              </div>
            ))
          ) : (
            <div className="sm:col-span-2">
              <EmptyHint>You have no signed rental agreements yet.</EmptyHint>
            </div>
          )}
        </div>
      </section>

      {/* Insurance */}
      <section className="mt-12">
        <SectionHeading icon={ShieldCheck} title="Insurance" count={insuranceUploads.length + insurancePurchases.length} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {insurancePurchases.map((purchase) => (
            <div key={purchase.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Purchased coverage</p>
                  <p className="mt-1 font-semibold">{purchase.planName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{purchase.coverageSummary}</p>
                  {purchase.policyNumber ? (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">Policy {purchase.policyNumber}</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium">{purchase.status}</span>
              </div>
              <p className="mt-3 text-sm font-semibold">{currency.format(purchase.totalPriceCents / 100)}</p>
            </div>
          ))}
          {insuranceUploads.map((upload) => (
            <div key={upload.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your policy on file</p>
                  <p className="mt-1 font-semibold">{upload.insuranceCompany}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Policyholder: {upload.policyHolderName}</p>
                  <p className="font-mono text-xs text-muted-foreground">Policy {upload.policyNumber}</p>
                  {upload.expirationDate ? (
                    <p className="text-xs text-muted-foreground">Expires {upload.expirationDate}</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium">{upload.status}</span>
              </div>
              {upload.documents.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {upload.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={`/api/insurance-docs/${doc.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      <Download className="size-3.5" />
                      {doc.fileName}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">No documents attached</p>
              )}
            </div>
          ))}
          {!insuranceUploads.length && !insurancePurchases.length ? (
            <div className="sm:col-span-2">
              <EmptyHint>No insurance coverage or uploaded policies yet. You can add coverage during checkout.</EmptyHint>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
