"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Glassmorphism panel matching the console's dark theme. */
export function GlassPanel({
  title,
  subtitle,
  icon: Icon,
  action,
  className,
  children
}: {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("min-w-0 rounded-3xl border border-white/10 bg-[#0b1020]/80 p-5 shadow-2xl shadow-black/20 backdrop-blur", className)}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
                <Icon className="size-5" />
              </span>
            ) : null}
            <div>
              {title ? <h2 className="text-lg font-bold text-white">{title}</h2> : null}
              {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-slate-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-300">{label}</span>
      {children}
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500",
        props.className
      )}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500",
        props.className
      )}
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&_option]:bg-slate-950",
        props.className
      )}
    />
  );
}

export function Pill({
  active,
  onClick,
  children
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
        active
          ? "border-blue-400/40 bg-blue-500/20 text-white shadow-lg shadow-blue-500/10"
          : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue"
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  tone?: "blue" | "emerald" | "amber" | "indigo" | "pink";
}) {
  const tones: Record<string, string> = {
    blue: "bg-blue-500/15 text-blue-300",
    emerald: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    indigo: "bg-indigo-500/15 text-indigo-300",
    pink: "bg-pink-500/15 text-pink-300"
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-[#0b1020]/80 p-5"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <div className={cn("flex size-11 items-center justify-center rounded-2xl", tones[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
      {detail ? <p className="mt-2 text-sm text-slate-400">{detail}</p> : null}
    </motion.div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.05] text-slate-400">
        <Icon className="size-7" />
      </span>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="max-w-md text-sm text-slate-400">{text}</p>
      {action}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]", className)}>
      <div className="aspect-square w-full rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
    </div>
  );
}

export function FavoriteButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "flex size-8 items-center justify-center rounded-full border transition",
        active
          ? "border-amber-300/40 bg-amber-400/20 text-amber-200"
          : "border-white/10 bg-black/30 text-slate-300 hover:text-white"
      )}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5l2.3 4.66 5.14.75-3.72 3.62.88 5.12L11.48 15.9 6.9 18.8l.88-5.12L4.05 8.9l5.14-.75 2.29-4.65z" />
      </svg>
    </button>
  );
}

/** Downloads a data/remote URL as a file (used by the export manager). */
export async function downloadUrl(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    // Fallback: open in new tab.
    window.open(url, "_blank");
  }
}
