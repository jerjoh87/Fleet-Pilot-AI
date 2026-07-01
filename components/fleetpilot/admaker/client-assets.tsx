"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Building2, FolderOpen, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { AdMakerState } from "@/lib/admaker/types";
import { Button } from "@/components/ui/button";
import { EmptyState, FavoriteButton, Field, GlassPanel, TextInput } from "./ui";

/**
 * ClientAssets — the client workspace switcher. Each client is isolated: brand
 * kit, prompts, projects, campaigns, exports and templates are all scoped by id.
 */
export function ClientAssets({
  state,
  onSelect,
  onAdd,
  onDelete,
  onToggleFavorite
}: {
  state: AdMakerState;
  onSelect: (id: string) => void;
  onAdd: (input: { name: string; industry: string }) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [industry, setIndustry] = React.useState("");

  function counts(clientId: string) {
    return {
      prompts: state.prompts.filter((p) => p.clientId === clientId || p.clientId === null).length,
      projects: state.projects.filter((p) => p.clientId === clientId).length,
      campaigns: state.campaigns.filter((c) => c.clientId === clientId).length
    };
  }

  function submit() {
    if (!name.trim()) {
      toast.error("Enter a client name");
      return;
    }
    onAdd({ name: name.trim(), industry: industry.trim() || "General" });
    setName("");
    setIndustry("");
    toast.success("Client workspace created");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <GlassPanel title="Client Workspaces" icon={Users} subtitle="Every client is fully isolated — brand, prompts, ads, and history.">
        {state.clients.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {state.clients.map((client) => {
              const c = counts(client.id);
              const active = client.id === state.activeClientId;
              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-4 transition ${active ? "border-blue-400/40 bg-blue-500/10" : "border-white/10 bg-white/[0.03]"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-500/20 text-white">
                        <Building2 className="size-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-white">{client.name}</p>
                        <p className="text-xs text-slate-400">{client.industry}</p>
                      </div>
                    </div>
                    <FavoriteButton active={client.favorite} onClick={() => onToggleFavorite(client.id)} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <Metric label="Prompts" value={c.prompts} />
                    <Metric label="Ads" value={c.projects} />
                    <Metric label="Campaigns" value={c.campaigns} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      className={`h-8 flex-1 px-3 text-xs ${active ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : "bg-blue-500 text-white hover:bg-blue-400"}`}
                      onClick={() => onSelect(client.id)}
                    >
                      <FolderOpen className="size-3.5" /> {active ? "Active" : "Open"}
                    </Button>
                    {state.clients.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete ${client.name} and all its assets?`)) onDelete(client.id);
                        }}
                        aria-label="Delete client"
                        className="inline-flex size-8 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/20"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Users} title="No clients yet" text="Create your first client workspace to get started." />
        )}
      </GlassPanel>

      <GlassPanel title="New Client" icon={Plus}>
        <div className="grid gap-3">
          <Field label="Client / business name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunrise Roofing" />
          </Field>
          <Field label="Industry">
            <TextInput value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Roofing" />
          </Field>
          <Button className="bg-blue-500 text-white hover:bg-blue-400" onClick={submit}>
            <Plus className="size-4" /> Create workspace
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] py-2">
      <p className="text-base font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
