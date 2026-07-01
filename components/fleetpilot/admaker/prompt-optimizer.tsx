"use client";

import * as React from "react";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { optimizePromptAction } from "@/app/dashboard/ad-maker/actions";
import { OPTIMIZE_ACTIONS } from "@/lib/admaker/presets";
import type { OptimizeMode } from "@/lib/admaker/types";

/**
 * AI Prompt Assistant — one-click prompt enhancement buttons.
 * Works offline via heuristics; richer when OpenAI is connected.
 */
export function PromptOptimizer({
  prompt,
  onChange,
  aiConnected
}: {
  prompt: string;
  onChange: (next: string) => void;
  aiConnected: boolean;
}) {
  const [busy, setBusy] = React.useState<OptimizeMode | null>(null);

  async function run(mode: OptimizeMode) {
    if (!prompt.trim()) {
      toast.error("Write a prompt first, then let the assistant refine it.");
      return;
    }
    setBusy(mode);
    try {
      const result = await optimizePromptAction({ prompt, mode });
      onChange(result.prompt);
      toast.success("Prompt updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not optimize prompt");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Wand2 className="size-4 text-blue-300" />
        <p className="text-sm font-semibold text-white">AI Prompt Assistant</p>
        <span className="ml-auto text-xs text-slate-500">{aiConnected ? "OpenAI connected" : "Heuristic engine"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {OPTIMIZE_ACTIONS.map((action) => (
          <button
            key={action.mode}
            type="button"
            disabled={busy !== null}
            onClick={() => run(action.mode)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-blue-500/20 hover:text-white disabled:opacity-50"
          >
            {busy === action.mode ? <Loader2 className="size-3 animate-spin" /> : null}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
