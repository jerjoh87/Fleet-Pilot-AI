"use client";

import * as React from "react";
import { BadgeCheck, Check, FileText, LifeBuoy, ShieldCheck, ShieldQuestion, Upload } from "lucide-react";
import type { InsuranceQuote } from "@/lib/insurance/types";
import {
  emptyOwnInsurance,
  type InsuranceSelectionValue,
  type OwnInsuranceForm
} from "@/lib/insurance/selection";
import { currency } from "@/lib/utils";

type Props = {
  quotes: InsuranceQuote[];
  days: number;
  brandColor: string;
  requireInsurance: boolean;
  allowOwnInsurance: boolean;
  allowDecline: boolean;
  manualApproval: boolean;
  customTerms?: string;
  value: InsuranceSelectionValue;
  onChange: (value: InsuranceSelectionValue) => void;
};

const fmt = (cents: number) => currency.format(cents / 100);

export function InsuranceSelection({
  quotes,
  days,
  brandColor,
  requireInsurance,
  allowOwnInsurance,
  allowDecline,
  manualApproval,
  customTerms,
  value,
  onChange
}: Props) {
  const [own, setOwn] = React.useState<OwnInsuranceForm>(
    value.type === "own" ? value.ownInsurance : emptyOwnInsurance()
  );

  const selectedProvider = value.type === "third_party" ? value.providerKey : null;

  function updateOwn(patch: Partial<OwnInsuranceForm>) {
    const next = { ...own, ...patch };
    setOwn(next);
    onChange({ type: "own", ownInsurance: next });
  }

  return (
    <fieldset className="rounded-2xl border bg-card p-6">
      <legend className="px-1 text-sm font-semibold">Rental insurance</legend>
      <p className="mt-1 text-sm text-muted-foreground">
        {requireInsurance
          ? "Coverage is required to complete this booking. Choose an option below."
          : "Protect your trip — purchase coverage, use your own policy, or continue without it."}
      </p>
      <p className="mt-2 text-xs text-muted-foreground/70">
        FleetPilot AI is not an insurance company, broker, or agent. Coverage shown is provided by
        independent third-party insurers and is subject to their terms, conditions, and exclusions.
        Review the full policy before purchasing.
      </p>

      {/* Provider options */}
      <div className="mt-5 grid gap-3">
        {quotes.map((quote) => {
          const selected = selectedProvider === quote.providerKey;
          const total = quote.dailyPriceCents * Math.max(1, days);
          return (
            <button
              type="button"
              key={quote.providerKey}
              onClick={() => onChange({ type: "third_party", providerKey: quote.providerKey, planId: quote.planId })}
              className={`rounded-2xl border p-5 text-left transition ${
                selected ? "ring-2" : "hover:border-foreground/30"
              }`}
              style={selected ? { borderColor: brandColor, boxShadow: `0 0 0 1px ${brandColor}` } : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5" style={{ color: brandColor }} />
                  <div>
                    <p className="font-semibold">
                      {quote.providerName}
                      {quote.demo ? <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">Demo</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">{quote.planName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{fmt(quote.dailyPriceCents)}<span className="text-xs font-normal text-muted-foreground">/day</span></p>
                  <p className="text-xs text-muted-foreground">{fmt(total)} total</p>
                </div>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">{quote.coverageSummary}</p>

              <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {quote.coverageLines.map((line) => (
                  <div key={line.label} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">{line.label}</span>
                    <span className="font-medium">{line.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {quote.roadsideAssistance ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    <LifeBuoy className="size-3.5" /> Roadside assistance
                  </span>
                ) : null}
                {quote.highlights.slice(0, 2).map((h) => (
                  <span key={h} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    <Check className="size-3" /> {h}
                  </span>
                ))}
                <span
                  className={`ml-auto rounded-full px-4 py-1.5 text-xs font-semibold ${selected ? "text-white" : "border"}`}
                  style={selected ? { backgroundColor: brandColor } : undefined}
                >
                  {selected ? "Selected" : "Purchase coverage"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Own insurance */}
      {allowOwnInsurance ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => onChange({ type: "own", ownInsurance: own })}
            className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
              value.type === "own" ? "ring-2" : "hover:border-foreground/30"
            }`}
            style={value.type === "own" ? { borderColor: brandColor, boxShadow: `0 0 0 1px ${brandColor}` } : undefined}
          >
            <BadgeCheck className="size-5" style={{ color: brandColor }} />
            <div>
              <p className="font-semibold">I already have coverage</p>
              <p className="text-xs text-muted-foreground">Upload proof of your own insurance policy</p>
            </div>
          </button>

          {value.type === "own" ? (
            <div className="mt-3 grid gap-4 rounded-2xl border bg-background p-5 sm:grid-cols-2">
              <Field label="Insurance company" required>
                <input className={inputCls} value={own.insuranceCompany} onChange={(e) => updateOwn({ insuranceCompany: e.target.value })} />
              </Field>
              <Field label="Policy number" required>
                <input className={inputCls} value={own.policyNumber} onChange={(e) => updateOwn({ policyNumber: e.target.value })} />
              </Field>
              <Field label="Policy holder name" required>
                <input className={inputCls} value={own.policyHolderName} onChange={(e) => updateOwn({ policyHolderName: e.target.value })} />
              </Field>
              <Field label="Expiration date" required>
                <input type="date" className={inputCls} value={own.expirationDate} onChange={(e) => updateOwn({ expirationDate: e.target.value })} />
              </Field>
              <FileField label="Insurance card — front" required name={own.cardFrontName} onPick={(name) => updateOwn({ cardFrontName: name })} />
              <FileField label="Insurance card — back" required name={own.cardBackName} onPick={(name) => updateOwn({ cardBackName: name })} />
              <FileField label="Declaration page (optional)" name={own.declarationName} onPick={(name) => updateOwn({ declarationName: name })} />
              <Field label="Additional notes" className="sm:col-span-2">
                <textarea rows={2} className={inputCls} value={own.additionalNotes} onChange={(e) => updateOwn({ additionalNotes: e.target.value })} />
              </Field>
              <p className="sm:col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="size-4" />
                {manualApproval
                  ? "Status: Pending review — the host will verify your documents before pickup."
                  : "Your coverage will be auto-approved. The host may request more information."}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Decline */}
      {allowDecline && !requireInsurance ? (
        <button
          type="button"
          onClick={() => onChange({ type: "declined" })}
          className={`mt-3 flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
            value.type === "declined" ? "ring-2" : "hover:border-foreground/30"
          }`}
          style={value.type === "declined" ? { borderColor: brandColor, boxShadow: `0 0 0 1px ${brandColor}` } : undefined}
        >
          <ShieldQuestion className="size-5 text-muted-foreground" />
          <div>
            <p className="font-semibold">Continue without coverage</p>
            <p className="text-xs text-muted-foreground">I decline insurance and accept full liability per the rental terms</p>
          </div>
        </button>
      ) : null}

      {customTerms ? (
        <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">{customTerms}</p>
      ) : null}
    </fieldset>
  );
}

const inputCls = "mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm";

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={`text-sm ${className ?? ""}`}>
      <span className="text-muted-foreground">{label}{required ? <span className="text-destructive"> *</span> : null}</span>
      {children}
    </label>
  );
}

function FileField({ label, required, name, onPick }: { label: string; required?: boolean; name: string; onPick: (name: string) => void }) {
  return (
    <label className="text-sm">
      <span className="text-muted-foreground">{label}{required ? <span className="text-destructive"> *</span> : null}</span>
      <span className="mt-1 flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed bg-background px-3 text-sm text-muted-foreground hover:bg-muted/50">
        <Upload className="size-4 shrink-0" />
        <span className="truncate">{name || "Choose file…"}</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0]?.name ?? "")}
        />
      </span>
    </label>
  );
}
