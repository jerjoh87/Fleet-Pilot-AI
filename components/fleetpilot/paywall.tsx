"use client";

import { LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type BillingPlan, billingPlans, getPaidPlans } from "@/lib/billing/plans";

export function limitLabel(limit: number | null, noun: string) {
  return limit === null ? `Unlimited ${noun}` : `${limit.toLocaleString()} ${noun}`;
}

export function PlanComparison({
  currentPlanId,
  onUpgrade
}: {
  currentPlanId: string;
  onUpgrade: (planId: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {getPaidPlans().map((plan) => (
        <div key={plan.id} className={`rounded-2xl border p-4 ${plan.featured ? "border-blue-400/50 bg-blue-500/10" : "border-white/10 bg-white/[0.04]"}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{plan.priceLabel}/mo · {plan.annualLabel}/yr</p>
            </div>
            {currentPlanId === plan.id ? <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-slate-300">Current</span> : null}
          </div>
          <ul className="mt-4 space-y-2 text-xs text-slate-300">
            <li>{limitLabel(plan.limits.vehicles, "vehicles")}</li>
            <li>{limitLabel(plan.limits.staff, "staff")}</li>
            <li>{limitLabel(plan.limits.aiRequests, "AI requests")}</li>
          </ul>
          <Button className="mt-4 w-full bg-blue-500 text-white hover:bg-blue-400" type="button" onClick={() => onUpgrade(plan.id)}>
            Upgrade
          </Button>
        </div>
      ))}
    </div>
  );
}

export function FeaturePaywall({
  currentPlan,
  feature,
  benefits,
  onUpgrade
}: {
  currentPlan: BillingPlan;
  feature: string;
  benefits: string[];
  onUpgrade: (planId: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-xs text-blue-100">
            <LockKeyhole className="size-3.5" />
            {currentPlan.name} plan
          </span>
          <h2 className="mt-4 text-xl font-bold text-white">{feature} is available on a higher plan</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Upgrade to unlock this feature, raise your limits, and keep your rental operation growing without manual workarounds.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2"><Sparkles className="size-4 text-blue-300" />{benefit}</li>
            ))}
          </ul>
        </div>
        <Button className="bg-blue-500 text-white hover:bg-blue-400" type="button" onClick={() => onUpgrade("growth")}>
          Upgrade Now
        </Button>
      </div>
      <div className="mt-5">
        <PlanComparison currentPlanId={currentPlan.id} onUpgrade={onUpgrade} />
      </div>
    </div>
  );
}

export function findPlan(id: string) {
  return billingPlans.find((plan) => plan.id === id) ?? billingPlans[0];
}
