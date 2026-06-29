import Link from "next/link";
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
    <main className="min-h-screen bg-[#070b16] px-4 py-10 text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-blue-300">fleetpilot_access / secure workspace</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-tight text-white md:text-6xl">Run the rental operation from one protected cockpit.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Sign in to manage fleet inventory, bookings, maintenance, customer profiles, contracts, and tenant-scoped reporting.
          </p>
          {!supabaseReady ? (
            <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              Supabase keys are not configured yet, so local demo mode is enabled.
              <Link
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-blue-500 px-4 text-sm font-medium text-white hover:bg-blue-400"
                href="/dashboard"
              >
                Open Demo Dashboard
              </Link>
            </div>
          ) : null}
        </section>

        <section className="grid gap-4">
          {params.error ? (
            <div className="rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">{params.error}</div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold text-white">Sign In</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <form action={oauthSignInAction}>
                <input type="hidden" name="provider" value="google" />
                <input type="hidden" name="next" value={next} />
                <Button type="submit" variant="outline" className="w-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">
                  <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-black text-blue-600">G</span>
                  Continue with Gmail
                </Button>
              </form>
              <form action={oauthSignInAction}>
                <input type="hidden" name="provider" value="yahoo" />
                <input type="hidden" name="next" value={next} />
                <Button type="submit" variant="outline" className="w-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#6001d2] text-xs font-black text-white">Y!</span>
                  Continue with Yahoo
                </Button>
              </form>
            </div>
            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
              <span className="h-px flex-1 bg-white/10" /> or email <span className="h-px flex-1 bg-white/10" />
            </div>
            <form action={signInAction} className="mt-5 grid gap-3">
              <input type="hidden" name="next" value={next} />
              <Input name="email" type="email" placeholder="Email" required />
              <Input name="password" type="password" placeholder="Password" required />
              <Button className="mt-2 bg-blue-500 text-white hover:bg-blue-400">Sign In</Button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold text-white">Create Workspace</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <form action={oauthSignInAction}>
                <input type="hidden" name="provider" value="google" />
                <input type="hidden" name="next" value="/onboard" />
                <Button type="submit" variant="outline" className="w-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">
                  <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-black text-blue-600">G</span>
                  Sign up with Gmail
                </Button>
              </form>
              <form action={oauthSignInAction}>
                <input type="hidden" name="provider" value="yahoo" />
                <input type="hidden" name="next" value="/onboard" />
                <Button type="submit" variant="outline" className="w-full border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#6001d2] text-xs font-black text-white">Y!</span>
                  Sign up with Yahoo
                </Button>
              </form>
            </div>
            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
              <span className="h-px flex-1 bg-white/10" /> or email <span className="h-px flex-1 bg-white/10" />
            </div>
            <form action={signUpAction} className="mt-5 grid gap-3">
              <Input name="fullName" placeholder="Full name" required />
              <Input name="email" type="email" placeholder="Email" required />
              <Input name="password" type="password" placeholder="Password" minLength={8} required />
              <Button className="mt-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400">Create Account</Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
