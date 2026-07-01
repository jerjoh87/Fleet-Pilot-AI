"use client";

import * as React from "react";
import { Clock, History, Search, Trash2 } from "lucide-react";
import type { AdExport, AdProject, ExportFormat, GeneratedImage } from "@/lib/admaker/types";
import { EmptyState, FavoriteButton, GlassPanel, TextInput } from "./ui";
import { ImageGallery } from "./image-gallery";

/**
 * HistoryPanel — searchable timeline of generated projects and export history.
 */
export function HistoryPanel({
  projects,
  exports,
  brandColors,
  onToggleProjectFavorite,
  onToggleImageFavorite,
  onExport,
  onDeleteProject
}: {
  projects: AdProject[];
  exports: AdExport[];
  brandColors: string[];
  onToggleProjectFavorite: (id: string) => void;
  onToggleImageFavorite: (projectId: string, imageId: string) => void;
  onExport: (projectId: string, image: GeneratedImage, format: ExportFormat, label: string) => void;
  onDeleteProject: (id: string) => void;
}) {
  const [query, setQuery] = React.useState("");

  const filtered = projects.filter((project) =>
    `${project.name} ${project.platform} ${project.goal} ${project.prompt} ${project.style}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <GlassPanel
        title="History"
        icon={History}
        subtitle="Every generation, edit, and export — searchable."
        action={
          <div className="flex w-full max-w-xs items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3">
            <Search className="size-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search history"
              className="h-9 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
            />
          </div>
        }
      >
        {filtered.length ? (
          <div className="flex flex-col gap-5">
            {filtered.map((project) => (
              <div key={project.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <FavoriteButton active={project.favorite} onClick={() => onToggleProjectFavorite(project.id)} />
                    <div>
                      <p className="font-semibold text-white">{project.name}</p>
                      <p className="text-xs text-slate-400">
                        {project.platform} · {project.goal} · {project.style} · {new Date(project.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => onDeleteProject(project.id)} aria-label="Delete project" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-300">
                    <Trash2 className="size-4" /> Delete
                  </button>
                </div>
                <ImageGallery
                  images={project.images}
                  brandColors={brandColors}
                  onToggleFavorite={(imageId) => onToggleImageFavorite(project.id, imageId)}
                  onExport={(image, format, label) => onExport(project.id, image, format, label)}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={History} title="No history yet" text="Generated ads will appear here as a searchable timeline." />
        )}
      </GlassPanel>

      <GlassPanel title="Export History" icon={Clock}>
        {exports.length ? (
          <div className="divide-y divide-white/10">
            {exports.slice(0, 30).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="text-slate-200">{entry.label}</span>
                <span className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No exports yet.</p>
        )}
      </GlassPanel>
    </div>
  );
}
