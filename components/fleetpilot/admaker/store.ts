"use client";

import * as React from "react";
import type {
  AdCampaign,
  AdClient,
  AdExport,
  AdMakerState,
  AdProject,
  AdPrompt,
  AdTemplate,
  BrandKit,
  GeneratedImage,
  ImageStyle
} from "@/lib/admaker/types";

export type AdMakerSeed = {
  organizationId: string;
  orgName: string;
  website?: string;
  brandColor?: string;
  logoUrl?: string;
};

const VERSION = 1;

function storageKey(organizationId: string) {
  return `admaker:v${VERSION}:${organizationId}`;
}

function uid(prefix: string) {
  const rand = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}_${rand}`;
}

function defaultBrandKit(clientId: string, seed: AdMakerSeed): BrandKit {
  return {
    clientId,
    businessName: seed.orgName,
    logoUrl: seed.logoUrl ?? "",
    colors: [seed.brandColor ?? "#2563eb", "#0ea5e9", "#0f172a"],
    typography: "Inter",
    brandVoice: "Confident, friendly, and premium",
    website: seed.website ?? "",
    socialLinks: "",
    industry: "General",
    targetAudience: "Local customers looking for a trusted brand",
    preferredImageStyle: "Modern" as ImageStyle,
    ctaPreference: "Book Now",
    products: "",
    services: "",
    offers: ""
  };
}

function seedState(seed: AdMakerSeed): AdMakerState {
  const client: AdClient = {
    id: uid("cli"),
    organizationId: seed.organizationId,
    name: seed.orgName,
    industry: "General",
    favorite: true,
    createdAt: new Date().toISOString()
  };
  return {
    clients: [client],
    brandKits: { [client.id]: defaultBrandKit(client.id, seed) },
    prompts: [],
    projects: [],
    campaigns: [],
    exports: [],
    templates: [],
    activeClientId: client.id
  };
}

function loadState(seed: AdMakerSeed): AdMakerState {
  if (typeof window === "undefined") return seedState(seed);
  try {
    const raw = window.localStorage.getItem(storageKey(seed.organizationId));
    if (!raw) return seedState(seed);
    const parsed = JSON.parse(raw) as AdMakerState;
    if (!parsed.clients?.length) return seedState(seed);
    return parsed;
  } catch {
    return seedState(seed);
  }
}

export type AdMakerActions = {
  setActiveClient: (id: string) => void;
  addClient: (input: { name: string; industry: string }) => AdClient;
  updateClient: (id: string, patch: Partial<Pick<AdClient, "name" | "industry">>) => void;
  toggleClientFavorite: (id: string) => void;
  deleteClient: (id: string) => void;
  saveBrandKit: (clientId: string, patch: Partial<BrandKit>) => void;
  addPrompt: (prompt: Omit<AdPrompt, "id" | "createdAt">) => AdPrompt;
  updatePrompt: (id: string, patch: Partial<AdPrompt>) => void;
  duplicatePrompt: (id: string) => void;
  deletePrompt: (id: string) => void;
  togglePromptFavorite: (id: string) => void;
  importPrompts: (prompts: AdPrompt[]) => void;
  addProject: (project: Omit<AdProject, "id" | "createdAt">) => AdProject;
  deleteProject: (id: string) => void;
  toggleProjectFavorite: (id: string) => void;
  toggleImageFavorite: (projectId: string, imageId: string) => void;
  updateProjectCopy: (projectId: string, copy: AdProject["copy"]) => void;
  addCampaign: (campaign: Omit<AdCampaign, "id" | "createdAt">) => AdCampaign;
  updateCampaign: (id: string, patch: Partial<AdCampaign>) => void;
  deleteCampaign: (id: string) => void;
  toggleCampaignFavorite: (id: string) => void;
  assignProjectToCampaign: (campaignId: string, projectId: string) => void;
  addExport: (entry: Omit<AdExport, "id" | "createdAt">) => void;
  addTemplate: (template: Omit<AdTemplate, "id" | "createdAt">) => void;
  deleteTemplate: (id: string) => void;
  toggleTemplateFavorite: (id: string) => void;
};

export function useAdMakerStore(seed: AdMakerSeed) {
  const [state, setState] = React.useState<AdMakerState>(() => seedState(seed));
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  React.useEffect(() => {
    setState(loadState(seed));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed.organizationId]);

  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey(seed.organizationId), JSON.stringify(state));
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [state, hydrated, seed.organizationId]);

  const actions = React.useMemo<AdMakerActions>(() => {
    const now = () => new Date().toISOString();
    return {
      setActiveClient: (id) => setState((s) => ({ ...s, activeClientId: id })),
      addClient: (input) => {
        const client: AdClient = {
          id: uid("cli"),
          organizationId: seed.organizationId,
          name: input.name,
          industry: input.industry,
          favorite: false,
          createdAt: now()
        };
        setState((s) => ({
          ...s,
          clients: [client, ...s.clients],
          brandKits: {
            ...s.brandKits,
            [client.id]: { ...defaultBrandKit(client.id, seed), industry: input.industry }
          },
          activeClientId: client.id
        }));
        return client;
      },
      updateClient: (id, patch) =>
        setState((s) => ({ ...s, clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      toggleClientFavorite: (id) =>
        setState((s) => ({ ...s, clients: s.clients.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)) })),
      deleteClient: (id) =>
        setState((s) => {
          const clients = s.clients.filter((c) => c.id !== id);
          const brandKits = { ...s.brandKits };
          delete brandKits[id];
          return {
            ...s,
            clients,
            brandKits,
            prompts: s.prompts.filter((p) => p.clientId !== id),
            projects: s.projects.filter((p) => p.clientId !== id),
            campaigns: s.campaigns.filter((c) => c.clientId !== id),
            exports: s.exports.filter((e) => e.clientId !== id),
            templates: s.templates.filter((t) => t.clientId !== id),
            activeClientId: s.activeClientId === id ? (clients[0]?.id ?? null) : s.activeClientId
          };
        }),
      saveBrandKit: (clientId, patch) =>
        setState((s) => ({
          ...s,
          brandKits: {
            ...s.brandKits,
            [clientId]: { ...(s.brandKits[clientId] ?? defaultBrandKit(clientId, seed)), ...patch, clientId }
          }
        })),
      addPrompt: (prompt) => {
        const created: AdPrompt = { ...prompt, id: uid("prm"), createdAt: now() };
        setState((s) => ({ ...s, prompts: [created, ...s.prompts] }));
        return created;
      },
      updatePrompt: (id, patch) =>
        setState((s) => ({ ...s, prompts: s.prompts.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      duplicatePrompt: (id) =>
        setState((s) => {
          const original = s.prompts.find((p) => p.id === id);
          if (!original) return s;
          const copy: AdPrompt = { ...original, id: uid("prm"), name: `${original.name} (copy)`, preset: false, createdAt: now() };
          return { ...s, prompts: [copy, ...s.prompts] };
        }),
      deletePrompt: (id) => setState((s) => ({ ...s, prompts: s.prompts.filter((p) => p.id !== id) })),
      togglePromptFavorite: (id) =>
        setState((s) => ({ ...s, prompts: s.prompts.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)) })),
      importPrompts: (prompts) =>
        setState((s) => ({
          ...s,
          prompts: [...prompts.map((p) => ({ ...p, id: uid("prm"), createdAt: now() })), ...s.prompts]
        })),
      addProject: (project) => {
        const created: AdProject = { ...project, id: uid("prj"), createdAt: now() };
        setState((s) => ({ ...s, projects: [created, ...s.projects] }));
        return created;
      },
      deleteProject: (id) => setState((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id) })),
      toggleProjectFavorite: (id) =>
        setState((s) => ({ ...s, projects: s.projects.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)) })),
      toggleImageFavorite: (projectId, imageId) =>
        setState((s) => ({
          ...s,
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, images: p.images.map((img: GeneratedImage) => (img.id === imageId ? { ...img, favorite: !img.favorite } : img)) }
              : p
          )
        })),
      updateProjectCopy: (projectId, copy) =>
        setState((s) => ({ ...s, projects: s.projects.map((p) => (p.id === projectId ? { ...p, copy } : p)) })),
      addCampaign: (campaign) => {
        const created: AdCampaign = { ...campaign, id: uid("cmp"), createdAt: now() };
        setState((s) => ({ ...s, campaigns: [created, ...s.campaigns] }));
        return created;
      },
      updateCampaign: (id, patch) =>
        setState((s) => ({ ...s, campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteCampaign: (id) => setState((s) => ({ ...s, campaigns: s.campaigns.filter((c) => c.id !== id) })),
      toggleCampaignFavorite: (id) =>
        setState((s) => ({ ...s, campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)) })),
      assignProjectToCampaign: (campaignId, projectId) =>
        setState((s) => ({
          ...s,
          campaigns: s.campaigns.map((c) =>
            c.id === campaignId && !c.projectIds.includes(projectId)
              ? { ...c, projectIds: [...c.projectIds, projectId] }
              : c
          ),
          projects: s.projects.map((p) => (p.id === projectId ? { ...p, campaignId } : p))
        })),
      addExport: (entry) =>
        setState((s) => ({ ...s, exports: [{ ...entry, id: uid("exp"), createdAt: now() }, ...s.exports] })),
      addTemplate: (template) =>
        setState((s) => ({ ...s, templates: [{ ...template, id: uid("tpl"), createdAt: now() }, ...s.templates] })),
      deleteTemplate: (id) => setState((s) => ({ ...s, templates: s.templates.filter((t) => t.id !== id) })),
      toggleTemplateFavorite: (id) =>
        setState((s) => ({ ...s, templates: s.templates.map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t)) }))
    };
  }, [seed]);

  return { state, actions, hydrated };
}
