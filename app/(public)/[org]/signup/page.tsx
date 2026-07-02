import { Car, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { customerSignInAction, customerSignUpAction } from "@/app/(public)/[org]/signup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublicTenant } from "@/lib/data/public-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { OrgRoutePageProps } from "../route-types";

export const dynamic = "force-dynamic";

export default async function CustomerSignupPage({
  params,
  searchParams
}: OrgRoutePageProps<{ error?: string; email?: string; next?: string; mode?: string }>) {
  const { org } = await params;
  const query = (await searchParams) as { error?: string; email?: string; next?: string; mode?: string };
  const tenant = await getPublicTenant(org);
  const brand = tenant?.brandColor ?? "#166534";
  const slug = tenant?.slug ?? org;
  const portalPath = `/${slug}/portal`;
  const nextPath = query.next && query.next.startsWith("/") && !query.next.startsWith("//") ? query.next : portalPath;
  const oauthNext = encodeURIComponent(nextPath);
  const supabaseReady = isSupabaseConfigured();
  const signInMode = query.mode === "signin";
  const bookingGated = nextPath.includes("/book/");

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
          {bookingGated
            ? "An account is required to book. Add your details and you'll upload your ID and finish your reservation next."
            : "Save your contact details, find reservations faster, and return to your agreements after booking."}
        </p>

        <div className="mt-8 grid gap-3 text-sm">
          {[
            "Book with a verified renter profile",
            "Upload your ID once — reused for every trip",
            "Track reservations, receipts, and agreements in one place"
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle2 className="size-5" style={{ color: brand }} />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {!supabaseReady ? (
          <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm leading-6">
            Demo mode is enabled, so signup will take you straight to your reservation.
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{signInMode ? "Sign in to rent" : "Sign up to rent"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {signInMode ? "Welcome back — sign in to continue." : "Use this for customer reservations, not host setup."}
            </p>
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
            Continue with Gmail
          </a>
          <a
            href={`/api/auth/oauth?provider=yahoo&next=${oauthNext}`}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border bg-card text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-[#6001d2] text-xs font-black text-white">Y!</span>
            Continue with Yahoo
          </a>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
        </div>

        {signInMode ? (
          <form action={customerSignInAction} className="grid gap-3">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="next" value={nextPath} />
            <Input name="email" type="email" defaultValue={query.email ?? ""} placeholder="Email address" required />
            <Input name="password" type="password" placeholder="Password" required />
            <Button className="mt-2" style={{ backgroundColor: brand }}>
              Sign in
            </Button>
          </form>
        ) : (
          <form action={customerSignUpAction} className="grid gap-3">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="next" value={nextPath} />
            <Input name="fullName" placeholder="Full legal name" required />
            <Input name="email" type="email" defaultValue={query.email ?? ""} placeholder="Email address" required />
            <Input name="password" type="password" placeholder="Password (8+ characters)" minLength={8} required />
            <Button className="mt-2" style={{ backgroundColor: brand }}>
              Create renter account
            </Button>
          </form>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          {signInMode ? (
            <a
              href={`/${slug}/signup?next=${encodeURIComponent(nextPath)}`}
              className="font-medium hover:text-foreground"
            >
              New here? Create an account
            </a>
          ) : (
            <a
              href={`/${slug}/signup?mode=signin&next=${encodeURIComponent(nextPath)}`}
              className="inline-flex items-center gap-2 font-medium hover:text-foreground"
            >
              <Mail className="size-4" />
              Already have an account? Sign in
            </a>
          )}
          <a href={`/${slug}`} className="font-medium hover:text-foreground">
            Browse cars
          </a>
        </div>
      </section>
    </div>
  );
}
