"use client";

import * as React from "react";
import { Check, CreditCard, ExternalLink, Info, Loader2, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  captureDepositAction,
  createDepositHoldAction,
  createInvoiceAction,
  openBillingPortalAction,
  refundPaymentAction,
  releaseDepositAction,
  startSubscriptionAction
} from "@/app/dashboard/billing/actions";
import { billingPlans } from "@/lib/billing/plans";
import type { Customer, Reservation } from "@/lib/types";
import { currency } from "@/lib/utils";

type Props = {
  reservations: Reservation[];
  customers: Customer[];
  stripeConnected: boolean;
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type DepositIntent = {
  clientSecret: string;
  paymentIntentId: string;
  reservationId: string;
  amount: number;
  customerEmail: string;
};

export function BillingPanel({ reservations, customers, stripeConnected }: Props) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [depositIntent, setDepositIntent] = React.useState<DepositIntent | null>(null);

  function handleResult(result: { ok: boolean; url?: string; message?: string; demo?: boolean }, fallback: string) {
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    if (result.ok) {
      toast.success(result.message ?? fallback);
    } else {
      toast.error(result.message ?? "Action failed");
    }
  }

  async function withBusy(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  async function onDeposit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await withBusy("deposit", async () => {
      const result = await createDepositHoldAction({
        reservationId: String(form.get("reservationId")),
        amount: Math.round(Number(form.get("amount")) * 100),
        customerEmail: String(form.get("customerEmail")),
        description: String(form.get("description") || "Security deposit hold")
      });
      if (result.clientSecret && result.paymentIntentId) {
        setDepositIntent({
          clientSecret: result.clientSecret,
          paymentIntentId: result.paymentIntentId,
          reservationId: String(form.get("reservationId")),
          amount: Math.round(Number(form.get("amount")) * 100),
          customerEmail: String(form.get("customerEmail"))
        });
        toast.success("Enter card details to authorize the hold");
        return;
      }
      handleResult(result, "Deposit hold created");
    });
  }

  async function onPaymentIntentAction(event: React.FormEvent<HTMLFormElement>, kind: "capture" | "release" | "refund") {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const paymentIntentId = String(form.get("paymentIntentId"));
    if (!paymentIntentId) {
      toast.error("Enter a PaymentIntent id (pi_…)");
      return;
    }
    await withBusy(kind, async () => {
      const result =
        kind === "capture"
          ? await captureDepositAction({ paymentIntentId })
          : kind === "release"
            ? await releaseDepositAction(paymentIntentId)
            : await refundPaymentAction({ paymentIntentId, reason: "requested_by_customer" });
      handleResult(result, "Done");
    });
  }

  async function onInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await withBusy("invoice", async () => {
      const result = await createInvoiceAction({
        customerName: String(form.get("customerName")),
        customerEmail: String(form.get("customerEmail")),
        description: String(form.get("description")),
        amount: Math.round(Number(form.get("amount")) * 100),
        daysUntilDue: Number(form.get("daysUntilDue") || 7)
      });
      handleResult(result, "Invoice sent");
      if (result.ok) formElement.reset();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Billing & Payments</h1>
          <p className="mt-2 text-slate-400">Subscriptions, deposit holds, refunds, and invoicing — powered by Stripe.</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${stripeConnected ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
          <ShieldCheck className="size-3.5" />
          {stripeConnected ? "Stripe connected" : "Demo mode · add STRIPE_SECRET_KEY for live payments"}
        </span>
      </div>

      {/* Webhook URL callout */}
      {!stripeConnected ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-200">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <div className="min-w-0">
            <span className="font-medium">Stripe not connected.</span>
            {" "}Add <code className="rounded bg-amber-400/10 px-1 font-mono text-xs">STRIPE_SECRET_KEY</code> and register your webhook endpoint in the{" "}
            <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">Stripe Dashboard <ExternalLink className="size-3" /></a>.
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-400/20 bg-black/30 px-3 py-2 font-mono text-xs text-amber-100">
              {process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/stripe/webhook
            </div>
            <p className="mt-1.5 text-xs text-amber-200/60">Select all events when creating the webhook. Copy the signing secret into <code className="font-mono">STRIPE_WEBHOOK_SECRET</code>.</p>
          </div>
        </div>
      ) : null}

      {/* Subscription plans */}
      <Panel title="Subscription plan">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {billingPlans.map((plan) => (
            <div key={plan.id} className={`flex flex-col rounded-2xl border p-5 ${plan.featured ? "border-blue-400/50 bg-blue-500/10" : "border-white/10 bg-white/[0.04]"}`}>
              {plan.featured ? <span className="mb-2 w-fit rounded-full bg-blue-500 px-2.5 py-0.5 text-xs text-white">Popular</span> : null}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="mt-2 text-2xl font-black text-white">{plan.priceLabel}<span className="text-sm font-normal text-slate-400">{plan.cadence}</span></p>
              <ul className="mt-4 flex flex-1 flex-col gap-2 text-xs text-slate-300">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2"><Check className="size-3.5 text-emerald-300" />{feature}</li>
                ))}
              </ul>
              <Button
                className="mt-5 bg-blue-500 text-white hover:bg-blue-400"
                disabled={busy === `sub-${plan.id}`}
                onClick={() => withBusy(`sub-${plan.id}`, async () => handleResult(await startSubscriptionAction(plan.id), "Plan selected"))}
              >
                {busy === `sub-${plan.id}` ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {plan.id === "enterprise" ? "Contact sales" : "Choose plan"}
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="outline" className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" disabled={busy === "portal"} onClick={() => withBusy("portal", async () => handleResult(await openBillingPortalAction(), "Opening portal"))}>
            <CreditCard className="size-4" /> Manage subscription
          </Button>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Deposit holds */}
        <Panel title="Security deposit hold">
          <form className="grid gap-3" onSubmit={onDeposit}>
            <DarkSelect name="reservationId" required>
              <option value="">Select reservation</option>
              {reservations.map((reservation) => (
                <option key={reservation.id} value={reservation.id}>{reservation.id} · {currency.format(reservation.total)}</option>
              ))}
            </DarkSelect>
            <div className="grid grid-cols-2 gap-3">
              <DarkInput name="amount" type="number" step="1" placeholder="Deposit amount ($)" required />
              <DarkInput name="customerEmail" type="email" placeholder="Customer email" required />
            </div>
            <DarkInput name="description" placeholder="Description (optional)" />
            <Button className="bg-blue-500 text-white hover:bg-blue-400" type="submit" disabled={busy === "deposit"}>
              {busy === "deposit" ? <Loader2 className="size-4 animate-spin" /> : null} Authorize deposit hold
            </Button>
          </form>
          <p className="mt-3 text-xs text-slate-500">Creates a manual-capture PaymentIntent — funds are held, not charged.</p>
          {depositIntent ? (
            <DepositPaymentElement
              intent={depositIntent}
              onAuthorized={() => {
                toast.success("Deposit authorization completed");
                setDepositIntent(null);
              }}
            />
          ) : null}
        </Panel>

        {/* Capture / release / refund */}
        <Panel title="Capture, release & refund">
          <div className="grid gap-3">
            <form className="flex gap-2" onSubmit={(event) => onPaymentIntentAction(event, "capture")}>
              <DarkInput name="paymentIntentId" placeholder="pi_… payment intent id" required />
              <Button className="shrink-0 bg-emerald-500 text-slate-950 hover:bg-emerald-400" type="submit" disabled={busy === "capture"}>Capture</Button>
            </form>
            <form className="flex gap-2" onSubmit={(event) => onPaymentIntentAction(event, "release")}>
              <DarkInput name="paymentIntentId" placeholder="pi_… to release hold" required />
              <Button variant="outline" className="shrink-0 border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" type="submit" disabled={busy === "release"}>Release</Button>
            </form>
            <form className="flex gap-2" onSubmit={(event) => onPaymentIntentAction(event, "refund")}>
              <DarkInput name="paymentIntentId" placeholder="pi_… to refund" required />
              <Button variant="destructive" className="shrink-0" type="submit" disabled={busy === "refund"}>Refund</Button>
            </form>
          </div>
          <p className="mt-3 text-xs text-slate-500">Capture charges a held deposit, release voids it, refund returns a captured payment.</p>
        </Panel>
      </div>

      {/* Invoicing */}
      <Panel title="Create invoice">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onInvoice}>
          <DarkSelect name="customerPreset" onChange={() => undefined} defaultValue="">
            <option value="">Quick-fill from customer…</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.email}>{customer.name}</option>
            ))}
          </DarkSelect>
          <div />
          <DarkInput name="customerName" placeholder="Customer / company name" required />
          <DarkInput name="customerEmail" type="email" placeholder="Billing email" required />
          <DarkInput name="description" placeholder="What's this for? (e.g. fuel, mileage)" required />
          <div className="grid grid-cols-2 gap-3">
            <DarkInput name="amount" type="number" step="1" placeholder="Amount ($)" required />
            <DarkInput name="daysUntilDue" type="number" placeholder="Due in days" defaultValue={7} />
          </div>
          <Button className="bg-blue-500 text-white hover:bg-blue-400 md:col-span-2" type="submit" disabled={busy === "invoice"}>
            {busy === "invoice" ? <Loader2 className="size-4 animate-spin" /> : <ReceiptText className="size-4" />} Create & send invoice
          </Button>
        </form>
      </Panel>
    </div>
  );
}

function DepositPaymentElement({
  intent,
  onAuthorized
}: {
  intent: DepositIntent;
  onAuthorized: () => void;
}) {
  const mountRef = React.useRef<HTMLDivElement | null>(null);
  const stripeRef = React.useRef<Stripe | null>(null);
  const elementsRef = React.useRef<StripeElements | null>(null);
  const [ready, setReady] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function mountPaymentElement() {
      setReady(false);
      setError(null);

      if (!stripePromise) {
        setError("Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to collect card details.");
        return;
      }

      const stripe = await stripePromise;
      if (!stripe || !mounted || !mountRef.current) {
        return;
      }

      stripeRef.current = stripe;
      const elements = stripe.elements({
        clientSecret: intent.clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#3B82F6",
            colorBackground: "#0b1020",
            colorText: "#ffffff",
            borderRadius: "8px"
          }
        }
      });
      elementsRef.current = elements;
      const payment = elements.create("payment");
      payment.mount(mountRef.current);
      payment.on("ready", () => mounted && setReady(true));
    }

    void mountPaymentElement();

    return () => {
      mounted = false;
      elementsRef.current = null;
      stripeRef.current = null;
      if (mountRef.current) mountRef.current.innerHTML = "";
    };
  }, [intent.clientSecret]);

  async function authorize() {
    if (!stripeRef.current || !elementsRef.current) {
      setError("Payment form is still loading.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await stripeRef.current.confirmPayment({
      elements: elementsRef.current,
      clientSecret: intent.clientSecret,
      confirmParams: {
        return_url: window.location.href,
        receipt_email: intent.customerEmail
      },
      redirect: "if_required"
    });
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? "Card authorization failed.");
      return;
    }

    onAuthorized();
  }

  return (
    <div className="mt-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-white">Authorize card hold</p>
          <p className="text-xs text-slate-400">{intent.paymentIntentId} · {currency.format(intent.amount / 100)}</p>
        </div>
        <span className="rounded-full bg-blue-400/10 px-2.5 py-1 text-xs text-blue-200">Manual capture</span>
      </div>
      <div ref={mountRef} className="min-h-24" />
      {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
      <Button className="mt-4 w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400" type="button" disabled={!ready || submitting} onClick={authorize}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        Authorize deposit
      </Button>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-3xl border border-white/10 bg-[#0b1020]/80 p-5 shadow-2xl shadow-black/20">
      <h2 className="mb-5 text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...props} className="border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-blue-500" />;
}

function DarkSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <Select {...props} className="border-white/10 bg-white/[0.04] text-white focus-visible:ring-blue-500 [&_option]:bg-slate-950" />;
}
