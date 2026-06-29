"use client";

import * as React from "react";
import { Loader2, Sparkles, TrendingUp, Wrench, Megaphone, Car } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  detectIdleVehiclesAction,
  generateCampaignAction,
  predictRevenueAction,
  recommendMaintenanceAction,
  sendCampaignAction
} from "@/app/dashboard/ai/actions";
import type {
  IdleDetection,
  MaintenanceAdvice,
  MarketingCampaign,
  RevenuePoint,
  RevenuePrediction
} from "@/lib/ai/insights";
import type { MaintenanceItem, Reservation, Vehicle } from "@/lib/types";
import { currency } from "@/lib/utils";

type Props = {
  vehicles: Vehicle[];
  reservations: Reservation[];
  maintenance: MaintenanceItem[];
  revenueSeries: RevenuePoint[];
  aiConnected: boolean;
};

const campaignGoals = [
  { value: "fill_idle", label: "Fill idle vehicles" },
  { value: "win_back", label: "Win back past customers" },
  { value: "seasonal", label: "Seasonal promotion" },
  { value: "corporate", label: "Corporate accounts" }
] as const;

export function AiWorkspace({ vehicles, reservations, maintenance, revenueSeries, aiConnected }: Props) {
  const [revenue, setRevenue] = React.useState<RevenuePrediction | null>(null);
  const [idle, setIdle] = React.useState<IdleDetection | null>(null);
  const [advice, setAdvice] = React.useState<MaintenanceAdvice | null>(null);
  const [campaign, setCampaign] = React.useState<MarketingCampaign | null>(null);
  const [loading, setLoading] = React.useState<string | null>(null);
  const [sendingCampaign, setSendingCampaign] = React.useState(false);
  const [goal, setGoal] = React.useState<(typeof campaignGoals)[number]["value"]>("fill_idle");
  const [channel, setChannel] = React.useState("Email");

  async function run<T>(key: string, fn: () => Promise<T>, set: (value: T) => void) {
    setLoading(key);
    try {
      set(await fn());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI task failed");
    } finally {
      setLoading(null);
    }
  }

  async function dispatchCampaign() {
    if (!campaign) return;
    setSendingCampaign(true);
    try {
      const result = await sendCampaignAction(campaign);
      if (result.sent > 0) {
        toast.success(result.message);
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Campaign send failed");
    } finally {
      setSendingCampaign(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">AI Workspace</h1>
          <p className="mt-2 text-slate-400">Revenue forecasting, utilization, maintenance, and marketing — powered by your fleet data.</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${aiConnected ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
          <Sparkles className="size-3.5" />
          {aiConnected ? "OpenAI connected" : "Heuristic engine · connect OpenAI for richer narratives"}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Revenue prediction */}
        <AiPanel icon={TrendingUp} title="Revenue prediction" tone="blue">
          <Button className="bg-blue-500 text-white hover:bg-blue-400" disabled={loading === "revenue"} onClick={() => run("revenue", () => predictRevenueAction(revenueSeries), setRevenue)}>
            {loading === "revenue" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Forecast next month
          </Button>
          {revenue ? (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Next month" value={currency.format(revenue.nextMonthRevenue)} />
                <Stat label="Projected profit" value={currency.format(revenue.nextMonthProfit)} />
                <Stat label="Confidence" value={`${revenue.confidence}%`} />
              </div>
              <div className="flex items-end gap-1.5">
                {revenue.forecast.map((point) => {
                  const max = Math.max(...revenue.forecast.map((entry) => entry.revenue)) || 1;
                  return (
                    <div key={point.month} className="flex flex-1 flex-col items-center gap-1">
                      <div className={`w-full rounded-t ${point.projected ? "bg-emerald-400" : "bg-blue-500/70"}`} style={{ height: `${Math.max(8, (point.revenue / max) * 90)}px` }} />
                      <span className="text-[10px] text-slate-500">{point.month}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm leading-6 text-slate-300">{revenue.narrative}</p>
            </div>
          ) : (
            <Empty text="Run a forecast to project revenue and profit." />
          )}
        </AiPanel>

        {/* Idle detection */}
        <AiPanel icon={Car} title="Idle vehicle detection" tone="amber">
          <Button className="bg-blue-500 text-white hover:bg-blue-400" disabled={loading === "idle"} onClick={() => run("idle", () => detectIdleVehiclesAction(vehicles, reservations), setIdle)}>
            {loading === "idle" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Scan fleet
          </Button>
          {idle ? (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-slate-300">{idle.narrative}</p>
              {idle.idle.length ? (
                <>
                  <p className="text-xs text-emerald-300">~{currency.format(idle.estimatedRecoverableRevenue)}/mo recoverable</p>
                  <div className="space-y-2">
                    {idle.idle.slice(0, 5).map((entry) => (
                      <div key={entry.vehicleId} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{entry.label}</p>
                          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200">Idle {entry.idleScore}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{entry.recommendedAction}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <Empty text="Scan to surface underutilized vehicles and recover revenue." />
          )}
        </AiPanel>

        {/* Maintenance recommendations */}
        <AiPanel icon={Wrench} title="Maintenance recommendations" tone="indigo">
          <Button className="bg-blue-500 text-white hover:bg-blue-400" disabled={loading === "advice"} onClick={() => run("advice", () => recommendMaintenanceAction(vehicles, maintenance), setAdvice)}>
            {loading === "advice" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Analyze fleet health
          </Button>
          {advice ? (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-slate-300">{advice.narrative}</p>
              <div className="space-y-2">
                {advice.recommendations.slice(0, 6).map((rec, index) => (
                  <div key={`${rec.vehicleId}-${index}`} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <span className={`mt-0.5 rounded-full px-2 py-0.5 text-xs ${rec.priority === "High" ? "bg-red-400/10 text-red-200" : rec.priority === "Medium" ? "bg-amber-400/10 text-amber-200" : "bg-slate-400/10 text-slate-300"}`}>{rec.priority}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{rec.label}</p>
                      <p className="text-xs text-slate-400">{rec.recommendation} · {rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Empty text="Analyze to get predictive service recommendations." />
          )}
        </AiPanel>

        {/* Marketing campaigns */}
        <AiPanel icon={Megaphone} title="Marketing campaigns" tone="emerald">
          <div className="grid grid-cols-2 gap-3">
            <select value={goal} onChange={(event) => setGoal(event.target.value as typeof goal)} className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white [&_option]:bg-slate-950">
              {campaignGoals.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <select value={channel} onChange={(event) => setChannel(event.target.value)} className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white [&_option]:bg-slate-950">
              <option>Email</option>
              <option>SMS</option>
              <option>Instagram</option>
              <option>Google Ads</option>
            </select>
          </div>
          <Button className="mt-3 bg-blue-500 text-white hover:bg-blue-400" disabled={loading === "campaign"} onClick={() => run("campaign", () => generateCampaignAction({ goal, channel, vehicles }), setCampaign)}>
            {loading === "campaign" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generate campaign
          </Button>
          {campaign ? (
            <div className="mt-5 space-y-2 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{campaign.channel} · {campaign.audience}</p>
              <p className="text-base font-semibold text-white">{campaign.headline}</p>
              <p className="text-sm leading-6 text-slate-300">{campaign.body}</p>
              <div className="flex items-center justify-between pt-2">
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{campaign.cta}</span>
                <span className="text-xs text-slate-500">Est. reach {campaign.estimatedReach.toLocaleString()}</span>
              </div>
              <Button
                className="mt-3 w-full bg-emerald-500 text-white hover:bg-emerald-400"
                disabled={sendingCampaign}
                onClick={dispatchCampaign}
              >
                {sendingCampaign ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
                Send campaign
              </Button>
            </div>
          ) : (
            <Empty text="Pick a goal and channel, then generate ready-to-send copy." />
          )}
        </AiPanel>
      </div>
    </div>
  );
}

function AiPanel({ icon: Icon, title, tone, children }: { icon: React.ComponentType<{ className?: string }>; title: string; tone: "blue" | "amber" | "indigo" | "emerald"; children: React.ReactNode }) {
  const tones = {
    blue: "bg-blue-500/15 text-blue-300",
    amber: "bg-amber-500/15 text-amber-300",
    indigo: "bg-indigo-500/15 text-indigo-300",
    emerald: "bg-emerald-500/15 text-emerald-300"
  };
  return (
    <section className="min-w-0 rounded-3xl border border-white/10 bg-[#0b1020]/80 p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex size-10 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon className="size-5" />
        </span>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">{text}</p>;
}
