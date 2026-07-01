"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ImageOff, Pencil } from "lucide-react";
import type { ExportFormat, GeneratedImage } from "@/lib/admaker/types";
import { CanvaEditor } from "./canva-editor";
import { ExportManager } from "./export-manager";
import { EmptyState, FavoriteButton, SkeletonCard } from "./ui";
import { cn } from "@/lib/utils";

/**
 * ImageGallery — responsive grid of generated images with favorite, edit
 * (Canva), and export actions. Also used to render loading skeletons.
 */
export function ImageGallery({
  images,
  loading,
  loadingCount = 4,
  brandColors,
  onToggleFavorite,
  onExport,
  onDuplicate,
  className
}: {
  images: GeneratedImage[];
  loading?: boolean;
  loadingCount?: number;
  brandColors: string[];
  onToggleFavorite: (imageId: string) => void;
  onExport: (image: GeneratedImage, format: ExportFormat, label: string) => void;
  onDuplicate?: (image: GeneratedImage) => void;
  className?: string;
}) {
  const [editing, setEditing] = React.useState<GeneratedImage | null>(null);

  if (loading) {
    return (
      <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4", className)}>
        {Array.from({ length: loadingCount }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (!images.length) {
    return (
      <EmptyState
        icon={ImageOff}
        title="No images yet"
        text="Generate your first ad in the wizard, or pick a preset prompt to get started."
      />
    );
  }

  return (
    <>
      <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4", className)}>
        {images.map((image) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.prompt} loading="lazy" className="aspect-square w-full object-cover" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2">
              <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                {image.providerLabel}
              </span>
              <FavoriteButton active={image.favorite} onClick={() => onToggleFavorite(image.id)} />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-2.5 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setEditing(image)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-black/60"
              >
                <Pencil className="size-3.5" /> Edit
              </button>
              <ExportManager
                image={image}
                compact
                onExport={(format, label) => onExport(image, format, label)}
                onOpenCanva={() => setEditing(image)}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {editing ? (
        <CanvaEditor
          image={editing}
          brandColors={brandColors}
          onClose={() => setEditing(null)}
          onSaveDuplicate={() => {
            onDuplicate?.(editing);
            setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}
