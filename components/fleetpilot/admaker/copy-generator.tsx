"use client";

import * as React from "react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateAdCopyAction } from "@/app/dashboard/ad-maker/actions";
import { GOALS, PLATFORMS } from "@/lib/admaker/presets";
import type { AdCopy, AdGoal, BrandKit, Platform } from "@/lib/admaker/types";
import { Button } from "@/components/ui/button";
import { Field, GlassPanel, SelectInput, TextInput } from "./ui";

/**
 * CopyGenerator — generates primary text, headline, description, CTA, hashtags,
 * keywords, SEO title, and meta description. Pre-filled from the brand kit.
 */
export function CopyGenerator({
  brand,
  defaultPlatform,
  defaultGoal,
  onGenerated
}: {
  brand?: BrandKit;
  defaultPlatform?: Platform;
  defaultGoal?: AdGoal;
  onGenerated?: (copy: AdCopy) => void;
}) {
  const [platform, setPlatform] = React.useState<Platform>(defaultPlatform ?? "Facebook");
  const [goal, setGoal] = React.useState<AdGoal>(defaultGoal ?? "Sales");
  const [product, setProduct] = React.useState(brand?.products ?? "");
  const [audience, setAudience] = React.useState(brand?.targetAudience ?? "");
  const [offer, setOffer] = React.useState(brand?.offers ?? "");
  const [loading, setLoading] = React.useState(false);
  const [copy, setCopy] = React.useState<AdCopy | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const result = await generateAdCopyAction({
        business: brand?.businessName ?? "our business",
        product,
        audience,
        platform,
        goal,
        tone: brand?.brandVoice ?? "confident",
        offer,
        keywords: [product, audience, brand?.industry].filter(Boolean).join(" ")
      });
      setCopy(result);
      onGenerated?.(result);
      toast.success("Ad copy generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Copy generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassPanel title="AI Copy Generator" icon={Sparkles} subtitle="Primary text, headline, description, CTA, hashtags, keywords & SEO.">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Product / service">
          <TextInput value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. Premium detailing package" />
        </Field>
        <Field label="Target audience">
          <TextInput value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Busy professionals" />
        </Field>
        <Field label="Offer (optional)">
          <TextInput value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="e.g. 20% off this week" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Platform">
            <SelectInput value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Goal">
            <SelectInput value={goal} onChange={(e) => setGoal(e.target.value as AdGoal)}>
              {GOALS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </div>
      <Button className="mt-4 bg-blue-500 text-white hover:bg-blue-400" disabled={loading} onClick={generate}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Generate copy
      </Button>

      {copy ? (
        <div className="mt-5 space-y-3">
          <CopyField label="Primary text" value={copy.primaryText} multiline />
          <div className="grid gap-3 md:grid-cols-2">
            <CopyField label="Headline" value={copy.headline} />
            <CopyField label="CTA" value={copy.cta} />
          </div>
          <CopyField label="Description" value={copy.description} />
          <div className="grid gap-3 md:grid-cols-2">
            <CopyField label="SEO title" value={copy.seoTitle} />
            <CopyField label="Meta description" value={copy.metaDescription} multiline />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <CopyField label="Hashtags" value={copy.hashtags.join(" ")} />
            <CopyField label="Keywords" value={copy.keywords.join(", ")} />
          </div>
        </div>
      ) : null}
    </GlassPanel>
  );
}

function CopyField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  const [copied, setCopied] = React.useState(false);
  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Clipboard unavailable");
    }
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</span>
        <button type="button" onClick={copyValue} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
          {copied ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className={`text-sm text-slate-200 ${multiline ? "leading-6" : "truncate"}`}>{value}</p>
    </div>
  );
}
