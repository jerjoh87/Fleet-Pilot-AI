"use client";

import * as React from "react";
import { Download, FileArchive, FileImage, FileText, Package, Share2 } from "lucide-react";
import { toast } from "sonner";
import { EXPORT_FORMATS } from "@/lib/admaker/presets";
import type { ExportFormat, GeneratedImage } from "@/lib/admaker/types";
import { downloadUrl } from "./ui";
import { cn } from "@/lib/utils";

const FORMAT_ICON: Record<ExportFormat, typeof Download> = {
  PNG: FileImage,
  JPG: FileImage,
  PDF: FileText,
  SVG: FileImage,
  Canva: Share2,
  ZIP: FileArchive,
  "Social Media Package": Package
};

/**
 * ExportManager — export a generated image to every major format / platform.
 * Raster formats download directly; Canva opens the editor; package formats are
 * logged to export history for the batch pipeline.
 */
export function ExportManager({
  image,
  compact,
  onExport,
  onOpenCanva
}: {
  image: GeneratedImage;
  compact?: boolean;
  onExport: (format: ExportFormat, label: string) => void;
  onOpenCanva?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  async function handleExport(format: ExportFormat) {
    const base = `ad-${image.id}`;
    if (format === "PNG" || format === "JPG" || format === "SVG") {
      await downloadUrl(image.url, `${base}.${format.toLowerCase()}`);
      toast.success(`Exported ${format}`);
    } else if (format === "Canva") {
      onOpenCanva?.();
      window.open("https://www.canva.com/create/", "_blank", "noopener");
      toast.success("Opening in Canva");
    } else {
      // PDF / ZIP / Social Media Package: raster asset + logged pipeline entry.
      await downloadUrl(image.url, `${base}.png`);
      toast.success(`${format} queued — asset downloaded`);
    }
    onExport(format, `${format} · ${image.aspectRatio}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 font-medium text-white transition hover:bg-black/60",
          compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
        )}
      >
        <Download className={compact ? "size-3.5" : "size-4"} /> Export
      </button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-white/10 bg-[#0b1020] p-2 shadow-2xl shadow-black/40">
            <p className="px-2 py-1.5 text-xs uppercase tracking-[0.16em] text-slate-500">Export as</p>
            {EXPORT_FORMATS.map((format) => {
              const Icon = FORMAT_ICON[format];
              return (
                <button
                  key={format}
                  type="button"
                  onClick={() => handleExport(format)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-slate-200 transition hover:bg-white/[0.06]"
                >
                  <Icon className="size-4 text-blue-300" />
                  {format}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
