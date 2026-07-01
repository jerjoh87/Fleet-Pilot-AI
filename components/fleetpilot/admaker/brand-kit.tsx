"use client";

import * as React from "react";
import { Palette, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { IMAGE_STYLES } from "@/lib/admaker/presets";
import type { BrandKit as BrandKitType, ImageStyle } from "@/lib/admaker/types";
import { Button } from "@/components/ui/button";
import { Field, GlassPanel, SelectInput, TextArea, TextInput } from "./ui";

/**
 * BrandKit — per-client brand settings automatically injected into every prompt.
 */
export function BrandKit({
  brand,
  onSave
}: {
  brand: BrandKitType;
  onSave: (patch: Partial<BrandKitType>) => void;
}) {
  const [draft, setDraft] = React.useState<BrandKitType>(brand);
  const [newColor, setNewColor] = React.useState("#2563eb");

  React.useEffect(() => setDraft(brand), [brand]);

  function set<K extends keyof BrandKitType>(key: K, value: BrandKitType[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function addColor() {
    if (draft.colors.includes(newColor)) return;
    set("colors", [...draft.colors, newColor]);
  }

  function save() {
    onSave(draft);
    toast.success("Brand kit saved");
  }

  return (
    <GlassPanel
      title="Brand Kit"
      icon={Palette}
      subtitle="Used automatically in every prompt for this client."
      action={
        <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={save}>
          <Save className="size-4" /> Save
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Business name">
          <TextInput value={draft.businessName} onChange={(e) => set("businessName", e.target.value)} />
        </Field>
        <Field label="Industry">
          <TextInput value={draft.industry} onChange={(e) => set("industry", e.target.value)} />
        </Field>
        <Field label="Logo URL" hint="Paste a hosted logo URL">
          <TextInput value={draft.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Website">
          <TextInput value={draft.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
        </Field>

        <div className="md:col-span-2">
          <span className="text-sm font-medium text-slate-300">Brand colors</span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {draft.colors.map((color) => (
              <span key={color} className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1.5 pr-2 text-xs text-white">
                <span className="size-5 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                {color}
                <button type="button" onClick={() => set("colors", draft.colors.filter((c) => c !== color))} aria-label={`Remove ${color}`} className="text-slate-400 hover:text-white">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="size-6 cursor-pointer rounded-full border-0 bg-transparent" />
              <button type="button" onClick={addColor} className="text-slate-300 hover:text-white" aria-label="Add color">
                <Plus className="size-4" />
              </button>
            </span>
          </div>
        </div>

        <Field label="Typography">
          <TextInput value={draft.typography} onChange={(e) => set("typography", e.target.value)} placeholder="e.g. Inter, Playfair Display" />
        </Field>
        <Field label="Preferred image style">
          <SelectInput value={draft.preferredImageStyle} onChange={(e) => set("preferredImageStyle", e.target.value as ImageStyle)}>
            {IMAGE_STYLES.map((style) => (
              <option key={style}>{style}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="CTA preference">
          <TextInput value={draft.ctaPreference} onChange={(e) => set("ctaPreference", e.target.value)} placeholder="e.g. Book Now" />
        </Field>
        <Field label="Social links">
          <TextInput value={draft.socialLinks} onChange={(e) => set("socialLinks", e.target.value)} placeholder="@handle, facebook.com/…" />
        </Field>

        <Field label="Brand voice">
          <TextArea value={draft.brandVoice} onChange={(e) => set("brandVoice", e.target.value)} />
        </Field>
        <Field label="Target audience">
          <TextArea value={draft.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} />
        </Field>
        <Field label="Products">
          <TextArea value={draft.products} onChange={(e) => set("products", e.target.value)} placeholder="Key products, comma separated" />
        </Field>
        <Field label="Services">
          <TextArea value={draft.services} onChange={(e) => set("services", e.target.value)} placeholder="Key services, comma separated" />
        </Field>
        <Field label="Offers">
          <TextArea value={draft.offers} onChange={(e) => set("offers", e.target.value)} placeholder="Current promotions" />
        </Field>
      </div>
    </GlassPanel>
  );
}
