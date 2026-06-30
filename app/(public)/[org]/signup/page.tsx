import { Car, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { customerSignUpAction } from "@/app/(public)/[org]/signup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublicTenant } from "@/lib/data/public-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function CustomerSignupPage({
  params,
  searchParams
}: PageProps<"/[org]/signup">) {
  const { org } = await params;
  const query = (await searchParams) as { error?: string; email?: string };
  const tenant = await getPublicTenant(org);
  const brand = tenant?.brandColor ?? "#166534";
  const portalPath = `/${tenant?.slug ?? org}/portal`;
  const oauthNext = encodeURIComponent(portalPath);
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
      <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
        <div
          className="flex size-12 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: brand }}
        >
          <Car className="size-6" />
        </div>
        <p className="mt-6 text-sm font-medium text-muted-foreground">{tenant?.name} renter account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Create your rental profile</h1>
        <p className="mt-4 text-muted-foreground">
          Save your contact details, find reservations faster, and return to your agreements after booking.
        </p>

        <div className="mt-8 grid gap-3 text-sm">
          {[
            "Track upcoming and past reservations",
            "Download rental agreements from your portal",
            "Keep booking details connected to one email"
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle2 className="size-5" style={{ color: brand }} />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {!supabaseReady ? (
          <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm leading-6">
            Demo mode is enabled, so signup will take you straight to the customer portal.
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Sign up to rent</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use this for customer reservations, not host setup.</p>
          </div>
          <ShieldCheck className="size-5 shrink-0" style={{ color: brand }} />
        </div>

        {query.error ? (
          <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {query.error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <a
            href={`/api/auth/oauth?provider=google&next=${oauthNext}`}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border bg-card text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">G</span>
            Sign up with Gmail
          </a>
          <a
            href={`/api/auth/oauth?provider=yahoo&next=${oauthNext}`}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border bg-card text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-[#6001d2] text-xs font-black text-white">Y!</span>
            Sign up with Yahoo
          </a>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
        </div>

        <form action={customerSignUpAction} className="grid gap-3">
          <input type="hidden" name="slug" value={tenant?.slug ?? org} />
          <Input name="fullName" placeholder="Full legal name" required />
          <Input name="email" type="email" defaultValue={query.email ?? ""} placeholder="Email address" required />
          <Input name="phone" type="tel" placeholder="Phone number" />
          <Input name="password" type="password" placeholder="Password" minLength={8} required />
          <Button className="mt-2" style={{ backgroundColor: brand }}>
            Create renter account
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <a href={portalPath} className="inline-flex items-center gap-2 font-medium hover:text-foreground">
            <Mail className="size-4" />
            Already booked? Find reservation
          </a>
          <a href={`/${tenant?.slug ?? org}`} className="font-medium hover:text-foreground">
            Browse cars
          </a>
        </div>
      </section>
    </div>
  );
}
