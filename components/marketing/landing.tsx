import {
  ArrowRight,
  BarChart3,
  Car,
  CalendarCheck,
  Check,
  CreditCard,
  Globe,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wrench
} from "lucide-react";
import { billingPlans } from "@/lib/billing/plans";

const liveBookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/luxedrive`;

const features = [
  { icon: BarChart3, title: "Operations dashboard", text: "Live utilization, revenue, and fleet health in one real-time command center." },
  { icon: CreditCard, title: "Payments & deposits", text: "Stripe-powered checkout, refundable deposit holds, refunds, and automated invoicing." },
  { icon: Globe, title: "Branded booking site", text: "Your own companyname.fleetpilot.ai storefront — fleet search, vehicle pages, and online checkout." },
  { icon: Sparkles, title: "AI workspace", text: "Revenue prediction, idle-vehicle detection, predictive maintenance, and marketing campaigns." },
  { icon: MapPin, title: "Telematics & tracking", text: "Geofencing, live location, and fuel/battery monitoring across every vehicle." },
  { icon: Wrench, title: "Maintenance automation", text: "Service intervals, damage reports, and AI recommendations that prevent downtime." }
];

const steps = [
  { title: "Add your fleet", text: "Import vehicles, rates, and photos in minutes." },
  { title: "Launch your site", text: "Publish a branded booking page on your subdomain instantly." },
  { title: "Take bookings & deposits", text: "Customers reserve and pay online with secure deposit holds." },
  { title: "Optimize with AI", text: "Let the AI workspace surface revenue and maintenance wins." }
];

export function MarketingLanding() {
  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.16),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(16,185,129,0.12),transparent_30%)]" />
      <div className="relative">
        {/* Nav */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070b16]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
            <a href="/" className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/30">
                <Car className="size-5" />
              </span>
              <span className="font-semibold">FleetPilot AI</span>
            </a>
            <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
              <a href="#features" className="hover:text-white">Features</a>
              <a href="#how" className="hover:text-white">How it works</a>
              <a href="#pricing" className="hover:text-white">Pricing</a>
              <a href={liveBookingUrl} className="hover:text-white">Live demo</a>
            </nav>
            <div className="flex items-center gap-2">
              <a href="/login" className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white">Sign in</a>
              <a href="/dashboard" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400">
                Start free trial
              </a>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-20 md:px-6 md:pt-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-blue-300">
                <Sparkles className="size-3.5" /> AI rental operating system
              </span>
              <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-white md:text-7xl">
                Run your car rental business on autopilot.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                FleetPilot AI gives independent rental operators a complete platform — fleet management, a branded
                booking website, Stripe payments and deposits, and an AI workspace that grows revenue.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="/dashboard" className="inline-flex h-12 items-center gap-2 rounded-full bg-blue-500 px-6 font-medium text-white hover:bg-blue-400">
                  Start free trial <ArrowRight className="size-4" />
                </a>
                <a href={liveBookingUrl} className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 font-medium text-white hover:bg-white/[0.08]">
                  See a live booking site
                </a>
              </div>
              <div className="mt-10 grid max-w-lg grid-cols-3 gap-6">
                {[
                  ["98.6%", "Fleet utilization"],
                  ["2 min", "To first booking"],
                  ["$0", "Setup fees"]
                ].map(([stat, label]) => (
                  <div key={label}>
                    <p className="text-3xl font-black text-white">{stat}</p>
                    <p className="mt-1 text-sm text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-blue-950/40">
              <div className="rounded-[1.5rem] border border-white/10 bg-[#0b1020] p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400">LIVE · AUSTIN, TX</span>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">AI Active</span>
                </div>
                <div className="mt-6 grid gap-4">
                  {[
                    { icon: CalendarCheck, label: "New booking · Tesla Model Y", meta: "+$384 · deposit held", tone: "text-blue-300 bg-blue-500/15" },
                    { icon: Sparkles, label: "AI: 3 idle vehicles detected", meta: "~$4,200/mo recoverable", tone: "text-emerald-300 bg-emerald-500/15" },
                    { icon: Wrench, label: "Predictive maintenance flag", meta: "Brake service · C300", tone: "text-amber-300 bg-amber-500/15" },
                    { icon: CreditCard, label: "Invoice paid · Northstar", meta: "$1,240 · corporate", tone: "text-indigo-300 bg-indigo-500/15" }
                  ].map((row) => {
                    const Icon = row.icon;
                    return (
                      <div key={row.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                        <span className={`flex size-10 items-center justify-center rounded-xl ${row.tone}`}>
                          <Icon className="size-5" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">{row.label}</p>
                          <p className="text-xs text-slate-400">{row.meta}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <h2 className="text-3xl font-bold text-white md:text-5xl">Everything you need to run rentals</h2>
          <p className="mt-3 max-w-2xl text-slate-400">One platform replaces your spreadsheets, booking forms, payment links, and guesswork.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-white">{feature.title}</h3>
                  <p className="mt-2 leading-7 text-slate-400">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <h2 className="text-3xl font-bold text-white md:text-5xl">Live in an afternoon</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-blue-500 font-bold text-white">{index + 1}</span>
                <h3 className="mt-5 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <h2 className="text-3xl font-bold text-white md:text-5xl">Simple, scalable pricing</h2>
          <p className="mt-3 text-slate-400">Start free for 14 days. No card required.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {billingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`flex flex-col rounded-3xl border p-6 ${plan.featured ? "border-blue-400/50 bg-blue-500/10" : "border-white/10 bg-white/[0.04]"}`}
              >
                {plan.featured ? (
                  <span className="mb-3 w-fit rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white">Most popular</span>
                ) : null}
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-black text-white">{plan.priceLabel}</span>
                  <span className="pb-1 text-slate-400">{plan.cadence}</span>
                </div>
                <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-slate-300">
                      <Check className="size-4 text-emerald-300" /> {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="/dashboard"
                  className={`mt-8 rounded-lg py-3 text-center text-sm font-medium ${plan.featured ? "bg-blue-500 text-white hover:bg-blue-400" : "border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"}`}
                >
                  {plan.id === "pro" ? "Choose Pro" : "Start free trial"}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-600/20 to-emerald-500/10 p-10 md:p-16">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white md:text-4xl">Ready to put your fleet on autopilot?</h2>
                <p className="mt-3 flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="size-4 text-emerald-300" /> Secure Stripe payments · Cancel anytime
                </p>
              </div>
              <a href="/dashboard" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-blue-500 px-7 font-medium text-white hover:bg-blue-400">
                Start free trial <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-slate-400 md:flex-row md:px-6">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500 text-white">
                <Car className="size-4" />
              </span>
              <span className="font-medium text-white">FleetPilot AI</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p>© {new Date().getFullYear()} FleetPilot AI</p>
              <a href="/legal/terms" className="hover:text-white transition">Terms of Service</a>
              <a href="/legal/privacy" className="hover:text-white transition">Privacy Policy</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
