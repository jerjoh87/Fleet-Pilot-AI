import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { requireAppSession } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isStripeConfigured } from "@/lib/billing/customer";
import { isEmailConfigured } from "@/lib/email/client";

export const dynamic = "force-dynamic";

type Check = {
  label: string;
  ok: boolean;
  required: boolean;
  fix: string;
  detail?: string;
};

export default async function SetupPage() {
  await requireAppSession();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checks: Check[] = [
    {
      label: "Supabase auth",
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      required: true,
      fix: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from your Supabase project → Settings → API.",
      detail: process.env.NEXT_PUBLIC_SUPABASE_URL ? `Connected to ${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname}` : undefined
    },
    {
      label: "Database (Prisma / Postgres)",
      ok: isDatabaseConfigured(),
      required: true,
      fix: "Set DATABASE_URL and DIRECT_URL (from Supabase → Settings → Database → Connection string), then run: npx prisma db push"
    },
    {
      label: "Stripe secret key",
      ok: isStripeConfigured(),
      required: true,
      fix: "Add STRIPE_SECRET_KEY from Stripe Dashboard → Developers → API keys. Use sk_test_… for test mode."
    },
    {
      label: "Stripe publishable key",
      ok: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      required: true,
      fix: "Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_… or pk_live_…) from the same Stripe API keys page."
    },
    {
      label: "Stripe webhook secret",
      ok: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      required: true,
      fix: `In Stripe Dashboard → Webhooks, add endpoint: ${appUrl}/api/stripe/webhook — select all events. Copy the signing secret into STRIPE_WEBHOOK_SECRET. For local dev run: stripe listen --forward-to localhost:3000/api/stripe/webhook`,
      detail: `Endpoint: ${appUrl}/api/stripe/webhook`
    },
    {
      label: "Stripe subscription prices",
      ok: Boolean(process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_GROWTH),
      required: false,
      fix: "In Stripe Dashboard → Products, create recurring prices for Starter ($99), Growth ($299), Scale ($599). Copy each Price ID (price_…) into STRIPE_PRICE_STARTER, STRIPE_PRICE_GROWTH, STRIPE_PRICE_SCALE."
    },
    {
      label: "Email (Resend)",
      ok: isEmailConfigured(),
      required: false,
      fix: "Create a free account at resend.com, verify your domain, and add RESEND_API_KEY. Also set EMAIL_FROM to your verified sender address.",
      detail: "Without this, booking confirmations and payment emails are logged to the console only."
    },
    {
      label: "AI workspace (OpenAI)",
      ok: Boolean(process.env.OPENAI_API_KEY),
      required: false,
      fix: "Add OPENAI_API_KEY from platform.openai.com/api-keys. The AI workspace runs on heuristics without it — OpenAI enriches the narratives.",
      detail: `Model: ${process.env.OPENAI_MODEL ?? "gpt-4o-mini (default)"}`
    },
    {
      label: "App URL",
      ok: Boolean(process.env.NEXT_PUBLIC_APP_URL) && !process.env.NEXT_PUBLIC_APP_URL?.includes("localhost"),
      required: false,
      fix: "Set NEXT_PUBLIC_APP_URL to your production domain (e.g. https://app.fleetpilot.ai) so redirect URLs in Stripe and emails are correct.",
      detail: `Current: ${appUrl}`
    }
  ];

  const required = checks.filter((c) => c.required);
  const optional = checks.filter((c) => !c.required);
  const requiredDone = required.filter((c) => c.ok).length;
  const allRequiredDone = requiredDone === required.length;

  return (
    <main className="min-h-screen bg-[#070b16] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-blue-300">system_setup / go-live checklist</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Setup status</h1>
        <p className="mt-2 text-slate-400">
          {allRequiredDone
            ? "All required services are connected — you're ready to go live."
            : `${required.length - requiredDone} required service${required.length - requiredDone === 1 ? "" : "s"} still need attention.`}
        </p>

        <div className="mt-8 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Required</h2>
          {required.map((check) => (
            <CheckRow key={check.label} check={check} />
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recommended</h2>
          {optional.map((check) => (
            <CheckRow key={check.label} check={check} />
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm">
          <p className="font-semibold text-white">Quick start commands</p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 text-xs leading-6 text-slate-300">
{`# 1. Copy env file and fill in your keys
cp .env.example .env.local

# 2. Push database schema
npx prisma db push

# 3. (Optional) Listen to Stripe webhooks locally
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 4. Start dev server
npm run dev`}
          </pre>
        </div>

        <div className="mt-6 flex gap-3">
          <a href="/dashboard" className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-400">
            Go to dashboard
          </a>
          <a href="/onboard" className="rounded-lg border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white hover:bg-white/[0.08]">
            Re-run onboarding
          </a>
        </div>
      </div>
    </main>
  );
}

function CheckRow({ check }: { check: Check }) {
  return (
    <div className={`rounded-2xl border p-4 ${check.ok ? "border-emerald-400/20 bg-emerald-400/5" : check.required ? "border-red-400/20 bg-red-400/5" : "border-amber-400/20 bg-amber-400/5"}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">
          {check.ok
            ? <CheckCircle2 className="size-5 text-emerald-400" />
            : check.required
              ? <XCircle className="size-5 text-red-400" />
              : <AlertCircle className="size-5 text-amber-400" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white">{check.label}</p>
          {check.detail ? <p className="mt-0.5 text-xs text-slate-400">{check.detail}</p> : null}
          {!check.ok ? <p className="mt-2 text-sm leading-6 text-slate-300">{check.fix}</p> : null}
        </div>
      </div>
    </div>
  );
}
