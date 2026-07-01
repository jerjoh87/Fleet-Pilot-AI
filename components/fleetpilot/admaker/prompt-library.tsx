"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BookMarked,
  Copy,
  Download,
  FileUp,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wand2,
  X
} from "lucide-react";
import { toast } from "sonner";
import {
  ASPECT_RATIOS,
  CAMERA_ANGLES,
  IMAGE_STYLES,
  LIGHTING,
  MOODS,
  PLATFORMS,
  PRESET_CATEGORIES,
  PRESET_PROMPTS
} from "@/lib/admaker/presets";
import type { AdPrompt, AspectRatio, ImageStyle, Platform } from "@/lib/admaker/types";
import { Button } from "@/components/ui/button";
import { EmptyState, FavoriteButton, Field, GlassPanel, Pill, SelectInput, TextArea, TextInput } from "./ui";
import { PromptOptimizer } from "./prompt-optimizer";

function emptyPrompt(clientId: string | null): Omit<AdPrompt, "id" | "createdAt"> {
  return {
    clientId,
    name: "",
    category: "Custom",
    description: "",
    promptText: "",
    style: "Modern",
    cameraAngle: "Eye level",
    lighting: "Soft natural light",
    mood: "Bold",
    colorPalette: "",
    negativePrompt: "",
    platform: "Facebook",
    aspectRatio: "1:1",
    brandVoice: "",
    cta: "",
    variables: [],
    favorite: false,
    preset: false
  };
}

/**
 * PromptEditor — the Custom Prompt Builder. Every field from the spec plus the
 * inline AI Prompt Assistant.
 */
export function PromptEditor({
  clientId,
  initial,
  aiConnected,
  onSave,
  onCancel
}: {
  clientId: string | null;
  initial?: AdPrompt;
  aiConnected: boolean;
  onSave: (prompt: Omit<AdPrompt, "id" | "createdAt">) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = React.useState<Omit<AdPrompt, "id" | "createdAt">>(
    initial ? { ...initial } : emptyPrompt(clientId)
  );

  function set<K extends keyof AdPrompt>(key: K, value: AdPrompt[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function submit() {
    if (!draft.name.trim() || !draft.promptText.trim()) {
      toast.error("Give the prompt a name and prompt text.");
      return;
    }
    onSave(draft);
    toast.success(initial ? "Prompt updated" : "Prompt saved");
    if (!initial) setDraft(emptyPrompt(clientId));
  }

  return (
    <GlassPanel title={initial ? "Edit Prompt" : "Custom Prompt Builder"} icon={Wand2}>
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Prompt name">
            <TextInput value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Summer Flash Sale" />
          </Field>
          <Field label="Category">
            <TextInput value={draft.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Facebook Ads" />
          </Field>
        </div>
        <Field label="Description">
          <TextInput value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="Short summary" />
        </Field>
        <Field label="Prompt text" hint="Use {{tokens}} like {{business}} or {{product}} — they're filled from the brand kit.">
          <TextArea value={draft.promptText} onChange={(e) => set("promptText", e.target.value)} className="min-h-28" />
        </Field>
        <PromptOptimizer prompt={draft.promptText} onChange={(next) => set("promptText", next)} aiConnected={aiConnected} />

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Style">
            <SelectInput value={draft.style} onChange={(e) => set("style", e.target.value as ImageStyle)}>
              {IMAGE_STYLES.map((s) => <option key={s}>{s}</option>)}
            </SelectInput>
          </Field>
          <Field label="Camera angle">
            <SelectInput value={draft.cameraAngle} onChange={(e) => set("cameraAngle", e.target.value)}>
              {CAMERA_ANGLES.map((s) => <option key={s}>{s}</option>)}
            </SelectInput>
          </Field>
          <Field label="Lighting">
            <SelectInput value={draft.lighting} onChange={(e) => set("lighting", e.target.value)}>
              {LIGHTING.map((s) => <option key={s}>{s}</option>)}
            </SelectInput>
          </Field>
          <Field label="Mood">
            <SelectInput value={draft.mood} onChange={(e) => set("mood", e.target.value)}>
              {MOODS.map((s) => <option key={s}>{s}</option>)}
            </SelectInput>
          </Field>
          <Field label="Color palette">
            <TextInput value={draft.colorPalette} onChange={(e) => set("colorPalette", e.target.value)} placeholder="e.g. navy & gold" />
          </Field>
          <Field label="Platform">
            <SelectInput value={draft.platform} onChange={(e) => set("platform", e.target.value as Platform)}>
              {PLATFORMS.map((s) => <option key={s}>{s}</option>)}
            </SelectInput>
          </Field>
          <Field label="Aspect ratio">
            <SelectInput value={draft.aspectRatio} onChange={(e) => set("aspectRatio", e.target.value as AspectRatio)}>
              {ASPECT_RATIOS.map((s) => <option key={s}>{s}</option>)}
            </SelectInput>
          </Field>
          <Field label="Brand voice">
            <TextInput value={draft.brandVoice} onChange={(e) => set("brandVoice", e.target.value)} placeholder="e.g. Confident, premium" />
          </Field>
          <Field label="CTA">
            <TextInput value={draft.cta} onChange={(e) => set("cta", e.target.value)} placeholder="e.g. Shop Now" />
          </Field>
        </div>
        <Field label="Negative prompt" hint="What to avoid in the image">
          <TextInput value={draft.negativePrompt} onChange={(e) => set("negativePrompt", e.target.value)} placeholder="e.g. blurry, text artifacts, watermark" />
        </Field>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={draft.clientId === null}
            onChange={(e) => set("clientId", e.target.checked ? null : clientId)}
            className="size-4 rounded border-white/20 bg-white/10"
          />
          Share this prompt across all clients
        </label>

        <div className="flex gap-2">
          <Button className="bg-blue-500 text-white hover:bg-blue-400" onClick={submit}>
            <Save className="size-4" /> {initial ? "Update prompt" : "Save prompt"}
          </Button>
          {onCancel ? (
            <Button variant="outline" className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" onClick={onCancel}>
              <X className="size-4" /> Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </GlassPanel>
  );
}

/**
 * PromptLibrary — categorized preset templates plus the user's saved prompts,
 * with favorite / duplicate / edit / delete / export / import.
 */
export function PromptLibrary({
  prompts,
  activeClientId,
  onUse,
  onSavePreset,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onImport
}: {
  prompts: AdPrompt[];
  activeClientId: string | null;
  onUse: (input: { promptText: string; style: ImageStyle; aspectRatio: AspectRatio; platform: Platform; negativePrompt?: string; cta?: string; name: string }) => void;
  onSavePreset: (prompt: Omit<AdPrompt, "id" | "createdAt">) => void;
  onEdit: (prompt: AdPrompt) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onImport: (prompts: AdPrompt[]) => void;
}) {
  const [category, setCategory] = React.useState<string>("All");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const savedForClient = prompts.filter((p) => p.clientId === null || p.clientId === activeClientId);
  const filteredPresets = category === "All" ? PRESET_PROMPTS : PRESET_PROMPTS.filter((p) => p.category === category);

  function exportPrompts() {
    const blob = new Blob([JSON.stringify(savedForClient, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prompt-library.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Prompt library exported");
  }

  function importPrompts(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AdPrompt[];
        if (!Array.isArray(parsed)) throw new Error("bad format");
        onImport(parsed);
        toast.success(`Imported ${parsed.length} prompt${parsed.length === 1 ? "" : "s"}`);
      } catch {
        toast.error("Could not read that prompt file");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <div className="flex flex-col gap-6">
      <GlassPanel
        title="Preset Prompt Library"
        icon={BookMarked}
        subtitle="Battle-tested prompts across platforms and industries."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Pill active={category === "All"} onClick={() => setCategory("All")}>All</Pill>
          {PRESET_CATEGORIES.map((cat) => (
            <Pill key={cat} active={category === cat} onClick={() => setCategory(cat)}>{cat}</Pill>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredPresets.map((preset) => (
            <motion.div
              key={`${preset.category}-${preset.name}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-medium text-blue-200">{preset.category}</span>
                <span className="text-[11px] text-slate-500">{preset.aspectRatio} · {preset.platform}</span>
              </div>
              <p className="mt-2 font-semibold text-white">{preset.name}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{preset.description}</p>
              {preset.variables.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {preset.variables.map((v) => (
                    <span key={v} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-300">{`{{${v}}}`}</span>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 flex gap-2">
                <Button
                  className="h-8 flex-1 bg-blue-500 px-3 text-xs text-white hover:bg-blue-400"
                  onClick={() => onUse({ promptText: preset.promptText, style: preset.style, aspectRatio: preset.aspectRatio, platform: preset.platform, name: preset.name })}
                >
                  <Sparkles className="size-3.5" /> Use
                </Button>
                <Button
                  variant="outline"
                  className="h-8 border-white/10 bg-white/[0.04] px-3 text-xs text-white hover:bg-white/[0.08]"
                  onClick={() =>
                    onSavePreset({
                      clientId: activeClientId,
                      name: preset.name,
                      category: preset.category,
                      description: preset.description,
                      promptText: preset.promptText,
                      style: preset.style,
                      cameraAngle: "Eye level",
                      lighting: "Soft natural light",
                      mood: "Bold",
                      colorPalette: "",
                      negativePrompt: "",
                      platform: preset.platform,
                      aspectRatio: preset.aspectRatio,
                      brandVoice: "",
                      cta: "",
                      variables: preset.variables,
                      favorite: false,
                      preset: true
                    })
                  }
                >
                  <Plus className="size-3.5" /> Save
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel
        title="My Prompts"
        icon={Wand2}
        subtitle="Your saved and shared prompts."
        action={
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importPrompts} />
            <Button variant="outline" className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" onClick={() => fileRef.current?.click()}>
              <FileUp className="size-4" /> Import
            </Button>
            <Button variant="outline" className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" onClick={exportPrompts} disabled={!savedForClient.length}>
              <Download className="size-4" /> Export
            </Button>
          </div>
        }
      >
        {savedForClient.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {savedForClient.map((prompt) => (
              <div key={prompt.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{prompt.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {prompt.category} · {prompt.platform} · {prompt.aspectRatio}
                      {prompt.clientId === null ? " · shared" : ""}
                    </p>
                  </div>
                  <FavoriteButton active={prompt.favorite} onClick={() => onToggleFavorite(prompt.id)} />
                </div>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">{prompt.promptText}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    className="h-8 bg-blue-500 px-3 text-xs text-white hover:bg-blue-400"
                    onClick={() => onUse({ promptText: prompt.promptText, style: prompt.style, aspectRatio: prompt.aspectRatio, platform: prompt.platform, negativePrompt: prompt.negativePrompt, cta: prompt.cta, name: prompt.name })}
                  >
                    <Sparkles className="size-3.5" /> Use
                  </Button>
                  <IconBtn icon={Pencil} label="Edit" onClick={() => onEdit(prompt)} />
                  <IconBtn icon={Copy} label="Duplicate" onClick={() => onDuplicate(prompt.id)} />
                  <IconBtn icon={Trash2} label="Delete" onClick={() => onDelete(prompt.id)} danger />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Wand2} title="No saved prompts" text="Save a preset above or build your own with the Custom Prompt Builder." />
        )}
      </GlassPanel>
    </div>
  );
}

function IconBtn({ icon: Icon, label, onClick, danger }: { icon: typeof Pencil; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex size-8 items-center justify-center rounded-full border transition ${
        danger
          ? "border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/20"
          : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      <Icon className="size-4" />
    </button>
  );
}
