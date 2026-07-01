"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BookMarked,
  Building2,
  Clock,
  Images,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  Palette,
  PlusCircle,
  Search,
  Sparkles,
  Star,
  Type,
  Wand2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdPrompt, ExportFormat, GeneratedImage } from "@/lib/admaker/types";
import { useAdMakerStore, type AdMakerSeed } from "./store";
import { EmptyState, GlassPanel, Pill, SectionHeader, SkeletonCard, StatCard } from "./ui";
import { AdGenerator, type GeneratorSeed } from "./ad-generator";
import { ClientAssets } from "./client-assets";
import { BrandKit } from "./brand-kit";
import { PromptEditor, PromptLibrary } from "./prompt-library";
import { CopyGenerator } from "./copy-generator";
import { TemplateLibrary } from "./template-library";
import { CampaignManager } from "./campaign-manager";
import { HistoryPanel } from "./history-panel";
import { ImageGallery } from "./image-gallery";
import { Button } from "@/components/ui/button";

type ProviderOption = { id: string; label: string; available: boolean; comingSoon: boolean };

type View =
  | "Dashboard"
  | "Create Ad"
  | "Clients"
  | "Brand Kit"
  | "Prompts"
  | "AI Copy"
  | "Templates"
  | "Campaigns"
  | "History"
  | "Favorites";

const NAV: Array<{ view: View; icon: LucideIcon }> = [
  { view: "Dashboard", icon: LayoutDashboard },
  { view: "Create Ad", icon: PlusCircle },
  { view: "Clients", icon: Building2 },
  { view: "Brand Kit", icon: Palette },
  { view: "Prompts", icon: BookMarked },
  { view: "AI Copy", icon: Type },
  { view: "Templates", icon: LayoutTemplate },
  { view: "Campaigns", icon: Megaphone },
  { view: "History", icon: Clock },
  { view: "Favorites", icon: Star }
];

export function AdMaker({
  organizationId,
  orgName,
  website,
  brandColor,
  logoUrl,
  aiConnected,
  providers
}: {
  organizationId: string;
  orgName: string;
  website?: string;
  brandColor?: string;
  logoUrl?: string;
  aiConnected: boolean;
  providers: ProviderOption[];
}) {
  const seed = React.useMemo<AdMakerSeed>(
    () => ({ organizationId, orgName, website, brandColor, logoUrl }),
    [organizationId, orgName, website, brandColor, logoUrl]
  );
  const { state, actions, hydrated } = useAdMakerStore(seed);
  const [view, setView] = React.useState<View>("Dashboard");
  const [generatorSeed, setGeneratorSeed] = React.useState<GeneratorSeed | null>(null);
  const [editingPrompt, setEditingPrompt] = React.useState<AdPrompt | null>(null);
  const [query, setQuery] = React.useState("");

  const activeClientId = state.activeClientId;
  const brand = activeClientId ? state.brandKits[activeClientId] : undefined;
  const brandColors = brand?.colors ?? [brandColor ?? "#2563eb"];

  function openInGenerator(input: GeneratorSeed) {
    setGeneratorSeed(input);
    setView("Create Ad");
  }

  function handleProjectExport(projectId: string, image: GeneratedImage, format: ExportFormat, label: string) {
    const project = state.projects.find((p) => p.id === projectId);
    actions.addExport({ clientId: project?.clientId ?? activeClientId ?? "", projectId, format, label: `${label}` });
  }

  if (!hydrated) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="AI Ad Maker"
        subtitle="Generate on-brand ads with ChatGPT Image 2.0, edit in Canva, and export for every platform."
        action={
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${aiConnected ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
              <Sparkles className="size-3.5" /> {aiConnected ? "ChatGPT Image 2.0 connected" : "Preview mode"}
            </span>
            <Button className="bg-blue-500 text-white hover:bg-blue-400" onClick={() => { setGeneratorSeed(null); setView("Create Ad"); }}>
              <Wand2 className="size-4" /> New Ad
            </Button>
          </div>
        }
      />

      {/* Internal nav + global search */}
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0b1020]/70 p-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-wrap gap-1.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.view;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => setView(item.view)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon className="size-4" /> {item.view}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 lg:w-72">
          <Search className="size-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything"
            className="h-9 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      {query.trim() ? (
        <GlobalSearch query={query} state={state} onOpen={(v) => { setView(v); setQuery(""); }} />
      ) : null}

      {!query.trim() && view === "Dashboard" ? (
        <Dashboard state={state} onNavigate={setView} brandColors={brandColors} onNew={() => setView("Create Ad")} />
      ) : null}

      {!query.trim() && view === "Create Ad" ? (
        <AdGenerator
          state={state}
          actions={actions}
          aiConnected={aiConnected}
          providers={providers}
          seed={generatorSeed}
          onSeedConsumed={() => setGeneratorSeed(null)}
        />
      ) : null}

      {!query.trim() && view === "Clients" ? (
        <ClientAssets
          state={state}
          onSelect={actions.setActiveClient}
          onAdd={actions.addClient}
          onDelete={actions.deleteClient}
          onToggleFavorite={actions.toggleClientFavorite}
        />
      ) : null}

      {!query.trim() && view === "Brand Kit" ? (
        brand && activeClientId ? (
          <BrandKit brand={brand} onSave={(patch) => actions.saveBrandKit(activeClientId, patch)} />
        ) : (
          <EmptyState icon={Palette} title="No client selected" text="Create or select a client to edit its brand kit." action={<Button className="mt-2 bg-blue-500 text-white hover:bg-blue-400" onClick={() => setView("Clients")}>Go to clients</Button>} />
        )
      ) : null}

      {!query.trim() && view === "Prompts" ? (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <PromptLibrary
            prompts={state.prompts}
            activeClientId={activeClientId}
            onUse={openInGenerator}
            onSavePreset={actions.addPrompt}
            onEdit={setEditingPrompt}
            onDuplicate={actions.duplicatePrompt}
            onDelete={actions.deletePrompt}
            onToggleFavorite={actions.togglePromptFavorite}
            onImport={actions.importPrompts}
          />
          <PromptEditor
            key={editingPrompt?.id ?? "new"}
            clientId={activeClientId}
            initial={editingPrompt ?? undefined}
            aiConnected={aiConnected}
            onSave={(prompt) => {
              if (editingPrompt) {
                actions.updatePrompt(editingPrompt.id, prompt);
                setEditingPrompt(null);
              } else {
                actions.addPrompt(prompt);
              }
            }}
            onCancel={editingPrompt ? () => setEditingPrompt(null) : undefined}
          />
        </div>
      ) : null}

      {!query.trim() && view === "AI Copy" ? (
        <CopyGenerator brand={brand} />
      ) : null}

      {!query.trim() && view === "Templates" ? (
        <TemplateLibrary
          templates={state.templates}
          activeClientId={activeClientId}
          onUse={(input) => openInGenerator({ promptText: `${input.name} for {{business}}`, aspectRatio: input.aspectRatio, platform: input.platform, name: input.name })}
          onSave={actions.addTemplate}
          onDelete={actions.deleteTemplate}
          onToggleFavorite={actions.toggleTemplateFavorite}
        />
      ) : null}

      {!query.trim() && view === "Campaigns" ? (
        <CampaignManager
          campaigns={state.campaigns.filter((c) => c.clientId === activeClientId)}
          projects={state.projects}
          activeClientId={activeClientId}
          onCreate={actions.addCampaign}
          onDelete={actions.deleteCampaign}
          onToggleFavorite={actions.toggleCampaignFavorite}
          onAssignProject={actions.assignProjectToCampaign}
        />
      ) : null}

      {!query.trim() && view === "History" ? (
        <HistoryPanel
          projects={state.projects.filter((p) => p.clientId === activeClientId)}
          exports={state.exports.filter((e) => e.clientId === activeClientId)}
          brandColors={brandColors}
          onToggleProjectFavorite={actions.toggleProjectFavorite}
          onToggleImageFavorite={actions.toggleImageFavorite}
          onExport={handleProjectExport}
          onDeleteProject={actions.deleteProject}
        />
      ) : null}

      {!query.trim() && view === "Favorites" ? (
        <Favorites state={state} brandColors={brandColors} onToggleImageFavorite={actions.toggleImageFavorite} onExport={handleProjectExport} />
      ) : null}
    </div>
  );
}

function Dashboard({
  state,
  brandColors,
  onNavigate,
  onNew
}: {
  state: ReturnType<typeof useAdMakerStore>["state"];
  brandColors: string[];
  onNavigate: (view: View) => void;
  onNew: () => void;
}) {
  const now = new Date();
  const adsThisMonth = state.projects.filter((p) => {
    const created = new Date(p.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  const favoriteTemplates = state.templates.filter((t) => t.favorite).length;

  const brandUsage = state.projects.reduce<Record<string, number>>((acc, project) => {
    const client = state.clients.find((c) => c.id === project.clientId);
    const brandName = client ? state.brandKits[client.id]?.businessName ?? client.name : "Unknown";
    acc[brandName] = (acc[brandName] ?? 0) + 1;
    return acc;
  }, {});
  const mostUsedBrand = Object.entries(brandUsage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const recent = state.projects.slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Ads Created" value={state.projects.length} detail={`${state.clients.length} client workspace${state.clients.length === 1 ? "" : "s"}`} icon={Images} tone="blue" />
        <StatCard label="Ads This Month" value={adsThisMonth} detail={now.toLocaleString("default", { month: "long" })} icon={Sparkles} tone="emerald" />
        <StatCard label="Saved Prompts" value={state.prompts.length} detail={`${state.prompts.filter((p) => p.favorite).length} favorited`} icon={BookMarked} tone="indigo" />
        <StatCard label="Favorite Templates" value={favoriteTemplates} detail={`${state.templates.length} saved`} icon={LayoutTemplate} tone="pink" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <GlassPanel title="Recent Projects" icon={Clock} action={<Button variant="ghost" className="text-slate-300 hover:bg-white/[0.06] hover:text-white" onClick={() => onNavigate("History")}>View all</Button>}>
          {recent.length ? (
            <ImageGallery
              images={recent.flatMap((p) => p.images).slice(0, 8)}
              brandColors={brandColors}
              onToggleFavorite={() => {}}
              onExport={() => {}}
            />
          ) : (
            <EmptyState icon={Images} title="No ads yet" text="Launch the wizard to create your first professional ad." action={<Button className="mt-2 bg-blue-500 text-white hover:bg-blue-400" onClick={onNew}><Wand2 className="size-4" /> Create an ad</Button>} />
          )}
        </GlassPanel>

        <div className="flex flex-col gap-6">
          <GlassPanel title="At a glance" icon={Star}>
            <div className="space-y-3 text-sm">
              <Row label="Most used brand" value={mostUsedBrand} />
              <Row label="Campaigns" value={String(state.campaigns.length)} />
              <Row label="Exports" value={String(state.exports.length)} />
              <Row label="Clients" value={String(state.clients.length)} />
            </div>
          </GlassPanel>
          <GlassPanel title="Export History" icon={Clock}>
            {state.exports.length ? (
              <div className="divide-y divide-white/10">
                {state.exports.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="truncate text-slate-200">{entry.label}</span>
                    <span className="shrink-0 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Exports will appear here.</p>
            )}
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function Favorites({
  state,
  brandColors,
  onToggleImageFavorite,
  onExport
}: {
  state: ReturnType<typeof useAdMakerStore>["state"];
  brandColors: string[];
  onToggleImageFavorite: (projectId: string, imageId: string) => void;
  onExport: (projectId: string, image: GeneratedImage, format: ExportFormat, label: string) => void;
}) {
  const favoriteImages = state.projects.flatMap((project) =>
    project.images.filter((img) => img.favorite).map((img) => ({ projectId: project.id, img }))
  );
  const favPrompts = state.prompts.filter((p) => p.favorite);
  const favClients = state.clients.filter((c) => c.favorite);
  const favCampaigns = state.campaigns.filter((c) => c.favorite);
  const favTemplates = state.templates.filter((t) => t.favorite);

  const nothing = !favoriteImages.length && !favPrompts.length && !favClients.length && !favCampaigns.length && !favTemplates.length;

  if (nothing) {
    return <EmptyState icon={Star} title="No favorites yet" text="Star images, prompts, templates, clients, or campaigns to pin them here." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {favoriteImages.length ? (
        <GlassPanel title="Favorite Images" icon={Images}>
          <ImageGallery
            images={favoriteImages.map((f) => f.img)}
            brandColors={brandColors}
            onToggleFavorite={(imageId) => {
              const match = favoriteImages.find((f) => f.img.id === imageId);
              if (match) onToggleImageFavorite(match.projectId, imageId);
            }}
            onExport={(image, format, label) => {
              const match = favoriteImages.find((f) => f.img.id === image.id);
              if (match) onExport(match.projectId, image, format, label);
            }}
          />
        </GlassPanel>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {favClients.length ? (
          <GlassPanel title="Favorite Clients" icon={Building2}>
            <div className="flex flex-wrap gap-2">{favClients.map((c) => <Pill key={c.id}>{c.name}</Pill>)}</div>
          </GlassPanel>
        ) : null}
        {favTemplates.length ? (
          <GlassPanel title="Favorite Templates" icon={LayoutTemplate}>
            <div className="flex flex-wrap gap-2">{favTemplates.map((t) => <Pill key={t.id}>{t.name}</Pill>)}</div>
          </GlassPanel>
        ) : null}
        {favCampaigns.length ? (
          <GlassPanel title="Favorite Campaigns" icon={Megaphone}>
            <div className="flex flex-wrap gap-2">{favCampaigns.map((c) => <Pill key={c.id}>{c.name}</Pill>)}</div>
          </GlassPanel>
        ) : null}
        {favPrompts.length ? (
          <GlassPanel title="Favorite Prompts" icon={BookMarked}>
            <div className="flex flex-col gap-2">
              {favPrompts.map((p) => (
                <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{p.promptText}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        ) : null}
      </div>
    </div>
  );
}

function GlobalSearch({
  query,
  state,
  onOpen
}: {
  query: string;
  state: ReturnType<typeof useAdMakerStore>["state"];
  onOpen: (view: View) => void;
}) {
  const q = query.toLowerCase();
  const clients = state.clients.filter((c) => `${c.name} ${c.industry}`.toLowerCase().includes(q));
  const prompts = state.prompts.filter((p) => `${p.name} ${p.category} ${p.promptText}`.toLowerCase().includes(q));
  const projects = state.projects.filter((p) => `${p.name} ${p.platform} ${p.goal} ${p.prompt}`.toLowerCase().includes(q));
  const campaigns = state.campaigns.filter((c) => `${c.name} ${c.platform} ${c.goal}`.toLowerCase().includes(q));

  const allGroups: Array<{ label: string; view: View; items: string[] }> = [
    { label: "Clients", view: "Clients", items: clients.map((c) => c.name) },
    { label: "Ads", view: "History", items: projects.map((p) => p.name) },
    { label: "Prompts", view: "Prompts", items: prompts.map((p) => p.name) },
    { label: "Campaigns", view: "Campaigns", items: campaigns.map((c) => c.name) }
  ];
  const groups = allGroups.filter((group) => group.items.length);

  if (!groups.length) {
    return <EmptyState icon={Search} title="No matches" text={`Nothing matched "${query}".`} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((group) => (
        <motion.div key={group.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <GlassPanel title={group.label} action={<Button variant="ghost" className="text-slate-300 hover:bg-white/[0.06] hover:text-white" onClick={() => onOpen(group.view)}>Open</Button>}>
            <div className="flex flex-col gap-2">
              {group.items.slice(0, 8).map((item, index) => (
                <button key={`${item}-${index}`} type="button" onClick={() => onOpen(group.view)} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/[0.06]">
                  {item}
                </button>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      ))}
    </div>
  );
}
