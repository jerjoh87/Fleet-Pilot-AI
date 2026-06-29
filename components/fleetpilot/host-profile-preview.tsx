"use client";

import { BadgeCheck, Car, Clock, Star } from "lucide-react";

export type ProfileDraft = {
  name: string;
  slug: string;
  logoUrl: string;
  coverImageUrl: string;
  backgroundStyle: "soft" | "solid" | "cover";
  brandColor: string;
  heroTitle: string;
  about: string;
  serviceArea: string;
  trustBadges: string;
};

/**
 * Live, light-themed mockup of the public host profile. Mirrors the real
 * `/[org]` hero so hosts can see brand, cover, hero copy, and badges update
 * as they type — before saving.
 */
export function HostProfilePreview({ draft }: { draft: ProfileDraft }) {
  const brand = draft.brandColor || "#166534";
  const useCover = draft.backgroundStyle === "cover" && draft.coverImageUrl;
  const onDark = useCover || draft.backgroundStyle === "solid";

  const heroBackground = useCover
    ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.45)), url(${draft.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : draft.backgroundStyle === "solid"
      ? { background: brand }
      : { background: `linear-gradient(135deg, ${brand}26, ${brand}0a 45%, transparent 80%)` };

  const badges = draft.trustBadges
    .split(",")
    .map((badge) => badge.trim())
    .filter(Boolean)
    .slice(0, 3);

  const textMain = onDark ? "text-white" : "text-slate-900";
  const textSub = onDark ? "text-white/80" : "text-slate-500";

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 truncate rounded-md bg-white px-2 py-0.5 text-[10px] text-slate-400">
          {draft.slug}.fleetpilot.ai
        </span>
      </div>

      {/* Mini nav */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          {draft.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.logoUrl} alt="" className="size-6 rounded-md object-cover" />
          ) : (
            <span className="flex size-6 items-center justify-center rounded-md text-white" style={{ backgroundColor: brand }}>
              <Car className="size-3.5" />
            </span>
          )}
          <span className="text-sm font-bold text-slate-900">{draft.name || "Your fleet"}</span>
        </div>
        <span className="rounded-full px-3 py-1 text-[10px] font-medium text-white" style={{ backgroundColor: brand }}>
          Sign in
        </span>
      </div>

      {/* Hero */}
      <div className="px-5 py-6" style={heroBackground}>
        <p className={`text-[11px] ${textSub}`}>{draft.serviceArea || "Service area"}</p>
        <div className={`mt-1 flex items-center gap-1.5 text-xs ${textMain}`}>
          <Star className={`size-3.5 ${onDark ? "fill-white text-white" : "fill-amber-400 text-amber-400"}`} />
          <span className="font-semibold">4.92</span>
          <span className={textSub}>· Superhost</span>
        </div>
        <h2 className={`mt-2 text-xl font-bold leading-snug ${textMain}`}>
          {draft.heroTitle || "Premium vehicles, booked in minutes."}
        </h2>
        {draft.about ? (
          <p className={`mt-2 line-clamp-2 text-xs leading-5 ${textSub}`}>{draft.about}</p>
        ) : null}

        {badges.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${onDark ? "border-white/30 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-700"}`}
              >
                <BadgeCheck className="size-3" style={{ color: onDark ? "#fff" : brand }} /> {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Host trust strip */}
      <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-5 py-3">
        <span className="flex size-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: brand }}>
          {(draft.name || "FP").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-xs font-semibold text-slate-900">
            Hosted by {draft.name || "you"} <BadgeCheck className="size-3.5" style={{ color: brand }} />
          </p>
          <p className="flex items-center gap-1 text-[10px] text-slate-500">
            <Clock className="size-3" /> Responds within an hour · 99% response rate
          </p>
        </div>
      </div>

      {/* Sample fleet row */}
      <div className="grid grid-cols-3 gap-2 bg-white px-5 pb-5 pt-2">
        {[0, 1, 2].map((index) => (
          <div key={index}>
            <div className="aspect-[4/3] rounded-lg" style={{ background: `linear-gradient(135deg, ${brand}2e, ${brand}12)` }} />
            <div className="mt-1.5 h-1.5 w-3/4 rounded bg-slate-200" />
            <div className="mt-1 h-1.5 w-1/2 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
