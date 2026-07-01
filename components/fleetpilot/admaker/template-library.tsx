"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LayoutTemplate, Plus, Sparkles, Trash2 } from "lucide-react";
import { PRESET_TEMPLATES } from "@/lib/admaker/presets";
import type { AdTemplate, AspectRatio, Platform } from "@/lib/admaker/types";
import { Button } from "@/components/ui/button";
import { FavoriteButton, GlassPanel, Pill } from "./ui";

/**
 * TemplateLibrary — editable design starting points across formats/platforms.
 */
export function TemplateLibrary({
  templates,
  activeClientId,
  onUse,
  onSave,
  onDelete,
  onToggleFavorite
}: {
  templates: AdTemplate[];
  activeClientId: string | null;
  onUse: (input: { name: string; aspectRatio: AspectRatio; platform: Platform }) => void;
  onSave: (template: Omit<AdTemplate, "id" | "createdAt">) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const categories = Array.from(new Set(PRESET_TEMPLATES.map((t) => t.category)));
  const [category, setCategory] = React.useState("All");
  const presets = category === "All" ? PRESET_TEMPLATES : PRESET_TEMPLATES.filter((t) => t.category === category);
  const saved = templates.filter((t) => t.clientId === null || t.clientId === activeClientId);

  return (
    <div className="flex flex-col gap-6">
      <GlassPanel title="Template Library" icon={LayoutTemplate} subtitle="Start from a proven layout, then edit in the studio.">
        <div className="mb-4 flex flex-wrap gap-2">
          <Pill active={category === "All"} onClick={() => setCategory("All")}>All</Pill>
          {categories.map((cat) => (
            <Pill key={cat} active={category === cat} onClick={() => setCategory(cat)}>{cat}</Pill>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {presets.map((template) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              <div
                className="flex aspect-video items-center justify-center p-3 text-center text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${template.gradient[0]}, ${template.gradient[1]})` }}
              >
                {template.name}
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="text-[11px] text-slate-400">{template.aspectRatio}</span>
                <div className="flex gap-1.5">
                  <Button className="h-7 bg-blue-500 px-2.5 text-xs text-white hover:bg-blue-400" onClick={() => onUse({ name: template.name, aspectRatio: template.aspectRatio, platform: template.platform })}>
                    <Sparkles className="size-3.5" /> Use
                  </Button>
                  <Button
                    variant="outline"
                    className="h-7 border-white/10 bg-white/[0.04] px-2 text-xs text-white hover:bg-white/[0.08]"
                    onClick={() =>
                      onSave({
                        clientId: activeClientId,
                        name: template.name,
                        category: template.category,
                        aspectRatio: template.aspectRatio,
                        platform: template.platform,
                        previewGradient: template.gradient,
                        favorite: false,
                        preset: true
                      })
                    }
                    aria-label="Save template"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassPanel>

      {saved.length ? (
        <GlassPanel title="Saved Templates" icon={LayoutTemplate}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {saved.map((template) => (
              <div key={template.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div
                  className="relative flex aspect-video items-center justify-center p-3 text-center text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${template.previewGradient[0]}, ${template.previewGradient[1]})` }}
                >
                  {template.name}
                  <div className="absolute right-2 top-2">
                    <FavoriteButton active={template.favorite} onClick={() => onToggleFavorite(template.id)} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <span className="text-[11px] text-slate-400">{template.aspectRatio} · {template.platform}</span>
                  <button type="button" onClick={() => onDelete(template.id)} aria-label="Delete template" className="text-slate-400 hover:text-red-300">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      ) : null}
    </div>
  );
}
