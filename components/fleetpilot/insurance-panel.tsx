"use client";

import * as React from "react";
import { BadgeCheck, FileText, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateInsuranceSettingsAction, reviewInsuranceUploadAction } from "@/app/dashboard/insurance/actions";
import type { InsuranceDashboard, InsuranceUploadRow } from "@/lib/insurance/data";
import type { InsuranceProviderKey } from "@/lib/insurance/types";
import { currency } from "@/lib/utils";

const PROVIDERS: { key: InsuranceProviderKey; name: string }[] = [
  { key: "rentalcover", name: "RentalCover" },
  { key: "allianz", name: "Allianz Travel Insurance" },
  { key: "bonzah", name: "Bonzah" }
];

export function InsurancePanel({ data }: { data: InsuranceDashboard }) {
  const [settings, setSettings] = React.useState(data.settings);
  const [uploads, setUploads] = React.useState(data.pendingUploads);
  const [saving, setSaving] = React.useState(false);
  const [busyUpload, setBusyUpload] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<string>("all");

  function set<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }
  function toggleProvider(key: InsuranceProviderKey) {
    setSettings((prev) => ({
      ...prev,
      enabledProviders: prev.enabledProviders.includes(key)
        ? prev.enabledProviders.filter((k) => k !== key)
        : [...prev.enabledProviders, key]
    }));
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const result = await updateInsuranceSettingsAction(settings);
      result.ok ? toast.success(result.message ?? "Saved") : toast.error(result.message ?? "Save failed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function review(upload: InsuranceUploadRow, decision: "approve" | "reject" | "more_info") {
    setBusyUpload(upload.id);
    try {
      const result = await reviewInsuranceUploadAction({ uploadId: upload.id, decision });
      if (result.ok) {
        toast.success(result.message ?? "Done");
        setUploads((prev) => prev.filter((u) => u.id !== upload.id));
      } else {
        toast.error(result.message ?? "Action failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusyUpload(null);
    }
  }

  const reservations = data.reservations.filter((r) => filter === "all" || r.selectionType === filter);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-white">Insurance</h1>
        <p className="mt-2 text-slate-400">Coverage requirements, provider options, customer policy review, and reporting.</p>
      </div>

      {/* Stat chips */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Active coverage" value={String(data.counts.active)} />
        <Stat label="Pending review" value={String(data.counts.pendingReview)} accent={data.counts.pendingReview > 0} />
        <Stat label="Declined" value={String(data.counts.declined)} />
        <Stat label="Insurance revenue" value={currency.format(data.revenueCents / 100)} />
      </div>

      {/* Pending reviews */}
      <Panel title={`Pending insurance reviews${uploads.length ? ` (${uploads.length})` : ""}`}>
        {uploads.length === 0 ? (
          <p className="text-sm text-slate-500">No customer-uploaded policies are waiting for review.</p>
        ) : (
          <div className="grid gap-3">
            {uploads.map((upload) => (
              <div key={upload.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{upload.customerName}</p>
                    <p className="text-sm text-slate-400">
                      {upload.insuranceCompany} · Policy {upload.policyNumber} · Holder {upload.policyHolderName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {upload.expirationDate ? `Expires ${upload.expirationDate} · ` : ""}Uploaded {upload.createdAt}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {upload.documents.map((doc) => (
                        <span key={doc.kind} className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-slate-300">
                          <FileText className="size-3.5" /> {doc.kind.replace(/_/g, " ").toLowerCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" disabled={busyUpload === upload.id} onClick={() => review(upload, "approve")}>
                      {busyUpload === upload.id ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />} Approve
                    </Button>
                    <Button variant="outline" className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" disabled={busyUpload === upload.id} onClick={() => review(upload, "more_info")}>
                      More info
                    </Button>
                    <Button variant="destructive" disabled={busyUpload === upload.id} onClick={() => review(upload, "reject")}>
                      <XCircle className="size-4" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Coverage by reservation */}
      <Panel title="Coverage by reservation">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-slate-400">Filter</span>
          <DarkSelect value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-48">
            <option value="all">All</option>
            <option value="THIRD_PARTY">Purchased coverage</option>
            <option value="CUSTOMER_OWN">Own insurance</option>
            <option value="DECLINED">Declined</option>
          </DarkSelect>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="pb-2">Customer</th><th className="pb-2">Vehicle</th><th className="pb-2">Type</th>
                <th className="pb-2">Provider</th><th className="pb-2">Policy</th><th className="pb-2">Status</th><th className="pb-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {reservations.length === 0 ? (
                <tr><td colSpan={7} className="py-4 text-slate-500">No reservations match this filter.</td></tr>
              ) : reservations.map((r) => (
                <tr key={r.reservationId} className="border-t border-white/5">
                  <td className="py-2.5 text-white">{r.customerName}</td>
                  <td className="py-2.5">{r.vehicleLabel}</td>
                  <td className="py-2.5">{r.selectionType.replace(/_/g, " ").toLowerCase()}</td>
                  <td className="py-2.5">{r.providerKey ?? "—"}</td>
                  <td className="py-2.5 font-mono text-xs">{r.policyNumberMasked}</td>
                  <td className="py-2.5"><StatusBadge status={r.status} /></td>
                  <td className="py-2.5 text-right">{r.coverageCostCents ? currency.format(r.coverageCostCents / 100) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Settings */}
      <Panel title="Insurance settings">
        <div className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle label="Require insurance for every rental" checked={settings.requireInsurance} onChange={(v) => set("requireInsurance", v)} />
            <Toggle label="Allow customers to use their own insurance" checked={settings.allowOwnInsurance} onChange={(v) => set("allowOwnInsurance", v)} />
            <Toggle label="Allow customers to decline coverage" checked={settings.allowDecline} onChange={(v) => set("allowDecline", v)} />
            <Toggle label="Require manual approval of uploaded policies" checked={settings.manualApproval} onChange={(v) => set("manualApproval", v)} />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">Enabled providers</p>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => {
                const on = settings.enabledProviders.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => toggleProvider(p.key)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${on ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.04] text-slate-400"}`}
                  >
                    <ShieldCheck className="size-4" /> {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DollarField label="Minimum liability requirement" cents={settings.minLiabilityCents} onChange={(c) => set("minLiabilityCents", c)} />
            <DollarField label="Required coverage limits" cents={settings.requiredCoverageLimitsCents} onChange={(c) => set("requiredCoverageLimitsCents", c)} />
            <div />
            <DollarField label="Deposit — purchased coverage" cents={settings.depositThirdPartyCents} onChange={(c) => set("depositThirdPartyCents", c)} />
            <DollarField label="Deposit — own insurance" cents={settings.depositOwnInsuranceCents} onChange={(c) => set("depositOwnInsuranceCents", c)} />
            <DollarField label="Deposit — declined coverage" cents={settings.depositDeclinedCents} onChange={(c) => set("depositDeclinedCents", c)} />
          </div>

          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Custom insurance terms</span>
            <textarea
              rows={3}
              value={settings.customTerms}
              onChange={(e) => set("customTerms", e.target.value)}
              placeholder="Shown to customers on the insurance step at checkout."
              className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </label>

          <div>
            <Button className="bg-blue-500 text-white hover:bg-blue-400" disabled={saving} onClick={saveSettings}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null} Save insurance settings
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-amber-400/30 bg-amber-400/10" : "border-white/10 bg-white/[0.04]"}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "ACTIVE" || status === "APPROVED" ? "bg-emerald-400/10 text-emerald-200"
    : status === "PENDING_REVIEW" || status === "MORE_INFO_REQUIRED" ? "bg-amber-400/10 text-amber-200"
    : status === "REJECTED" || status === "DECLINED" ? "bg-red-400/10 text-red-200"
    : "bg-white/[0.06] text-slate-300";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status.replace(/_/g, " ").toLowerCase()}</span>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-emerald-500" : "bg-white/15"}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white transition ${checked ? "left-5" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function DollarField({ label, cents, onChange }: { label: string; cents: number; onChange: (cents: number) => void }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-slate-300">{label}</span>
      <Input
        type="number"
        min="0"
        step="1"
        value={Math.round(cents / 100)}
        onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value) * 100)))}
        className="border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
      />
    </label>
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

function DarkSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <Select {...props} className={`border-white/10 bg-white/[0.04] text-white focus-visible:ring-blue-500 [&_option]:bg-slate-950 ${props.className ?? ""}`} />;
}
