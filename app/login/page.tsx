import Link from "next/link";
import { Car } from "lucide-react";
import { oauthSignInAction, signInAction, signUpAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const supabaseReady = isSupabaseConfigured();
  const next = params.next && params.next.startsWith("/") ? params.next : "/dashboard";

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
            href="/become-a-host"
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Become a host
          </a>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <section>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">fleetpilot access</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
              Run the rental operation from one cockpit.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
              Sign in to manage fleet inventory, bookings, maintenance, customer profiles, contracts, and reporting.
            </p>
            {!supabaseReady ? (
              <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm leading-6">
                Supabase keys are not configured yet, so local demo mode is enabled.
                <Link
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  href="/dashboard"
                >
                  Open Demo Dashboard
                </Link>
              </div>
            ) : null}
          </section>

          <section className="grid gap-4">
            {params.error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{params.error}</div>
            ) : null}

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Sign In</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <form action={oauthSignInAction}>
                  <input type="hidden" name="provider" value="google" />
                  <input type="hidden" name="next" value={next} />
                  <Button type="submit" variant="outline" className="w-full">
                    <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">G</span>
                    Continue with Gmail
                  </Button>
                </form>
                <form action={oauthSignInAction}>
                  <input type="hidden" name="provider" value="yahoo" />
                  <input type="hidden" name="next" value={next} />
                  <Button type="submit" variant="outline" className="w-full">
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#6001d2] text-xs font-black text-white">Y!</span>
                    Continue with Yahoo
                  </Button>
                </form>
              </div>
              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
              </div>
              <form action={signInAction} className="mt-5 grid gap-3">
                <input type="hidden" name="next" value={next} />
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="password" type="password" placeholder="Password" required />
                <Button className="mt-2">Sign In</Button>
              </form>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Create Workspace</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <form action={oauthSignInAction}>
                  <input type="hidden" name="provider" value="google" />
                  <input type="hidden" name="next" value="/onboard" />
                  <Button type="submit" variant="outline" className="w-full">
                    <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">G</span>
                    Sign up with Gmail
                  </Button>
                </form>
                <form action={oauthSignInAction}>
                  <input type="hidden" name="provider" value="yahoo" />
                  <input type="hidden" name="next" value="/onboard" />
                  <Button type="submit" variant="outline" className="w-full">
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#6001d2] text-xs font-black text-white">Y!</span>
                    Sign up with Yahoo
                  </Button>
                </form>
              </div>
              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
              </div>
              <form action={signUpAction} className="mt-5 grid gap-3">
                <Input name="fullName" placeholder="Full name" required />
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="password" type="password" placeholder="Password" minLength={8} required />
                <Button className="mt-2" variant="secondary">Create Account</Button>
              </form>
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
