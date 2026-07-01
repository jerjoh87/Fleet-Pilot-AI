"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CalendarClock, Megaphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GOALS, PLATFORMS } from "@/lib/admaker/presets";
import type { AdCampaign, AdGoal, AdProject, Platform } from "@/lib/admaker/types";
import { Button } from "@/components/ui/button";
import { EmptyState, FavoriteButton, Field, GlassPanel, SelectInput, TextArea, TextInput } from "./ui";

/**
 * CampaignManager — group assets (images, copy, headlines, descriptions, CTA,
 * audience, platform, launch date) into launch-ready campaigns.
 */
export function CampaignManager({
  campaigns,
  projects,
  activeClientId,
  onCreate,
  onDelete,
  onToggleFavorite,
  onAssignProject
}: {
  campaigns: AdCampaign[];
  projects: AdProject[];
  activeClientId: string | null;
  onCreate: (campaign: Omit<AdCampaign, "id" | "createdAt">) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAssignProject: (campaignId: string, projectId: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [platform, setPlatform] = React.useState<Platform>("Facebook");
  const [goal, setGoal] = React.useState<AdGoal>("Sales");
  const [audience, setAudience] = React.useState("");
  const [headlines, setHeadlines] = React.useState("");
  const [descriptions, setDescriptions] = React.useState("");
  const [cta, setCta] = React.useState("");
  const [launchDate, setLaunchDate] = React.useState("");

  const clientProjects = projects.filter((p) => p.clientId === activeClientId);

  function create() {
    if (!name.trim() || !activeClientId) {
      toast.error("Name your campaign and select a client.");
      return;
    }
    onCreate({
      clientId: activeClientId,
      name: name.trim(),
      platform,
      goal,
      audience,
      headlines: headlines.split("\n").map((h) => h.trim()).filter(Boolean),
      descriptions: descriptions.split("\n").map((d) => d.trim()).filter(Boolean),
      cta,
      launchDate,
      projectIds: [],
      favorite: false
    });
    toast.success("Campaign created");
    setName("");
    setAudience("");
    setHeadlines("");
    setDescriptions("");
    setCta("");
    setLaunchDate("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <GlassPanel title="Campaigns" icon={Megaphone} subtitle="Bundle creative, copy, and audience into a launch plan.">
        {campaigns.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map((campaign) => {
              const assets = projects.filter((p) => campaign.projectIds.includes(p.id));
              return (
                <motion.div key={campaign.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">{campaign.name}</p>
                      <p className="text-xs text-slate-400">{campaign.platform} · {campaign.goal}</p>
                    </div>
                    <FavoriteButton active={campaign.favorite} onClick={() => onToggleFavorite(campaign.id)} />
                  </div>
                  {campaign.audience ? <p className="mt-2 text-xs text-slate-400">Audience: {campaign.audience}</p> : null}
                  {campaign.launchDate ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-emerald-300">
                      <CalendarClock className="size-3.5" /> Launch {campaign.launchDate}
                    </p>
                  ) : null}
                  {campaign.headlines.length ? (
                    <div className="mt-2 space-y-1">
                      {campaign.headlines.slice(0, 3).map((h, i) => (
                        <p key={i} className="truncate rounded bg-white/[0.04] px-2 py-1 text-xs text-slate-200">{h}</p>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-3 text-[11px] uppercase tracking-wide text-slate-500">{assets.length} asset{assets.length === 1 ? "" : "s"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {clientProjects.length ? (
                      <select
                        className="h-8 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-2 text-xs text-white [&_option]:bg-slate-950"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            onAssignProject(campaign.id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="" disabled>Add ad…</option>
                        {clientProjects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    ) : null}
                    <button type="button" onClick={() => onDelete(campaign.id)} aria-label="Delete campaign" className="inline-flex size-8 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/20">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Megaphone} title="No campaigns yet" text="Create a campaign to organize your ads for launch." />
        )}
      </GlassPanel>

      <GlassPanel title="New Campaign" icon={Plus}>
        <div className="grid gap-3">
          <Field label="Campaign name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring Sales Push" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Platform">
              <SelectInput value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </SelectInput>
            </Field>
            <Field label="Goal">
              <SelectInput value={goal} onChange={(e) => setGoal(e.target.value as AdGoal)}>
                {GOALS.map((g) => <option key={g}>{g}</option>)}
              </SelectInput>
            </Field>
          </div>
          <Field label="Audience">
            <TextInput value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Who is this for?" />
          </Field>
          <Field label="Headlines" hint="One per line">
            <TextArea value={headlines} onChange={(e) => setHeadlines(e.target.value)} />
          </Field>
          <Field label="Descriptions" hint="One per line">
            <TextArea value={descriptions} onChange={(e) => setDescriptions(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CTA">
              <TextInput value={cta} onChange={(e) => setCta(e.target.value)} placeholder="e.g. Shop Now" />
            </Field>
            <Field label="Launch date">
              <TextInput type="date" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} />
            </Field>
          </div>
          <Button className="bg-blue-500 text-white hover:bg-blue-400" onClick={create}>
            <Plus className="size-4" /> Create campaign
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}
