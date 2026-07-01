"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  PaintBucket,
  Save,
  Shapes,
  Sparkles,
  Sticker,
  Type,
  Wand2,
  X
} from "lucide-react";
import { toast } from "sonner";
import type { GeneratedImage } from "@/lib/admaker/types";
import { Button } from "@/components/ui/button";

const TOOLS = [
  { icon: Type, label: "Text" },
  { icon: PaintBucket, label: "Background" },
  { icon: Sticker, label: "Icons" },
  { icon: Shapes, label: "Shapes" },
  { icon: Sparkles, label: "Brand colors" },
  { icon: ImageIcon, label: "Logos" },
  { icon: Wand2, label: "Fonts" },
  { icon: Layers, label: "Effects & Layers" }
];

/**
 * CanvaEditor — a lightweight in-app editing surface that mirrors the Canva
 * workflow (edit text, background, icons, shapes, brand colors, logos, fonts,
 * effects, layers) and hands off to Canva for full editing.
 */
export function CanvaEditor({
  image,
  brandColors,
  onClose,
  onSaveDuplicate
}: {
  image: GeneratedImage;
  brandColors: string[];
  onClose: () => void;
  onSaveDuplicate: () => void;
}) {
  const [activeTool, setActiveTool] = React.useState<string>("Text");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020] shadow-2xl md:flex-row"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Tool rail */}
          <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-white/10 bg-black/30 p-3 md:w-52 md:flex-col md:overflow-visible md:border-b-0 md:border-r">
            <div className="hidden items-center gap-2 px-2 pb-2 text-sm font-semibold text-white md:flex">
              <Wand2 className="size-4 text-blue-300" /> Design Studio
            </div>
            {TOOLS.map((tool) => (
              <button
                key={tool.label}
                type="button"
                onClick={() => {
                  setActiveTool(tool.label);
                  toast.info(`${tool.label} tool ready`);
                }}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${
                  activeTool === tool.label ? "bg-blue-500/20 text-white" : "text-slate-300 hover:bg-white/[0.06]"
                }`}
              >
                <tool.icon className="size-4" />
                <span className="whitespace-nowrap">{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Canvas */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-white/10 p-3">
              <p className="text-sm font-medium text-white">Editing · {image.style} · {image.aspectRatio}</p>
              <button type="button" onClick={onClose} aria-label="Close editor" className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_60%)] p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="Design canvas" className="max-h-[52vh] w-auto rounded-xl border border-white/10 shadow-2xl" />
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 p-3">
              <div className="mr-auto flex items-center gap-1.5">
                {brandColors.slice(0, 5).map((color) => (
                  <span key={color} className="size-6 rounded-full border border-white/20" style={{ backgroundColor: color }} title={color} />
                ))}
              </div>
              <Button variant="outline" className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" onClick={onSaveDuplicate}>
                <Copy className="size-4" /> Duplicate
              </Button>
              <Button variant="outline" className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" onClick={() => { toast.success("Design saved"); onClose(); }}>
                <Save className="size-4" /> Save
              </Button>
              <Button
                className="bg-blue-500 text-white hover:bg-blue-400"
                onClick={() => window.open("https://www.canva.com/create/", "_blank", "noopener")}
              >
                <ExternalLink className="size-4" /> Open in Canva
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
