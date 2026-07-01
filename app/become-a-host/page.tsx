import Link from "next/link";
import { Car, CarFront, CalendarCheck, CreditCard, Globe, ShieldCheck, Sparkles } from "lucide-react";
import { signUpAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const benefits = [
  {
    icon: Globe,
    title: "Your own booking site",
    body: "Get a branded page where customers browse your fleet and book in minutes — your colors, your domain, your rules."
  },
  {
    icon: CalendarCheck,
    title: "Bookings on autopilot",
    body: "Availability, reservations, and rental agreements are handled for you. Approve, decline, and track every trip from one place."
  },
  {
    icon: CreditCard,
    title: "Get paid securely",
    body: "Take deposits and rental payments online with Stripe. Payouts land in your bank — no chasing invoices."
  },
  {
    icon: ShieldCheck,
    title: "Protected & compliant",
    body: "Digital agreements, insurance tracking, and customer profiles keep every rental documented and covered."
  }
];

export default async function BecomeAHostPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Car className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">FleetPilot AI</span>
          </a>
          <a
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Sign in
          </a>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <section>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">become a host</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
              Turn your cars into a rental business.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
              Create your free FleetPilot host account and launch your own branded booking page in minutes.
              Manage your listings, reservations, and payouts — all from one dashboard.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="rounded-2xl border bg-card p-5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <benefit.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{benefit.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              <span>Already a host?</span>
              <Link href={"/login" as never} className="font-medium text-primary hover:underline">
                Sign in to your dashboard
              </Link>
            </div>
          </section>

          <section className="grid gap-4">
            {params.error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{params.error}</div>
            ) : null}

            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <CarFront className="size-5" />
                </span>
                <h2 className="text-xl font-semibold">Create your host account</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This is your FleetPilot login. Next, you&apos;ll set up your booking page.
              </p>

              {!supabaseReady ? (
                <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm leading-6">
                  Sign-up isn&apos;t configured yet, so you can explore in demo mode.
                  <Link
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    href="/dashboard"
                  >
                    Open Demo Dashboard
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <a href="/api/auth/oauth?provider=google&next=%2Fonboard" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border bg-card text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                      <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">G</span>
                      Sign up with Gmail
                    </a>
                    <a href="/api/auth/oauth?provider=yahoo&next=%2Fonboard" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border bg-card text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                      <span className="flex size-5 items-center justify-center rounded-full bg-[#6001d2] text-xs font-black text-white">Y!</span>
                      Sign up with Yahoo
                    </a>
                  </div>
                  <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
                  </div>
                  <form action={signUpAction} className="grid gap-3">
                    <input type="hidden" name="next" value="/onboard" />
                    <input type="hidden" name="errorPath" value="/become-a-host" />
                    <input type="hidden" name="accountType" value="host" />
                    <Input name="fullName" placeholder="Full name" required />
                    <Input name="email" type="email" placeholder="Email" required />
                    <Input name="homeAddress" placeholder="Home or business address" required />
                    <Input name="password" type="password" placeholder="Password (min 8 characters)" minLength={8} required />
                    <Button className="mt-2">Create host account</Button>
                  </form>
                  <p className="mt-4 text-xs leading-5 text-muted-foreground">
                    By creating an account you agree to the{" "}
                    <Link href={"/legal/terms" as never} className="text-primary hover:underline">Host Terms</Link>
                    {" "}and{" "}
                    <Link href={"/legal/privacy" as never} className="text-primary hover:underline">Privacy Policy</Link>.
                  </p>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground md:px-6">
          <p className="font-medium text-foreground">FleetPilot AI</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <a href="/legal/terms" className="hover:text-foreground transition">Terms of Service</a>
            <a href="/legal/privacy" className="hover:text-foreground transition">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
