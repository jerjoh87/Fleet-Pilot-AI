"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { generateAdImagesAction } from "@/app/dashboard/ad-maker/actions";
import {
  ASPECT_RATIOS,
  GOALS,
  IMAGE_STYLES,
  PLATFORMS,
  VARIATION_COUNTS
} from "@/lib/admaker/presets";
import { composePrompt } from "@/lib/admaker/prompt";
import type {
  AdGoal,
  AdMakerState,
  AspectRatio,
  ExportFormat,
  GeneratedImage,
  ImageStyle,
  Platform,
  VariationCount
} from "@/lib/admaker/types";
import type { AdMakerActions } from "./store";
import { Button } from "@/components/ui/button";
import { Field, GlassPanel, Pill, SelectInput, TextArea, TextInput } from "./ui";
import { PromptOptimizer } from "./prompt-optimizer";
import { ImageGallery } from "./image-gallery";

export type GeneratorSeed = {
  promptText: string;
  style?: ImageStyle;
  aspectRatio?: AspectRatio;
  platform?: Platform;
  negativePrompt?: string;
  cta?: string;
  name?: string;
};

const STEPS = ["Client", "Platform", "Goal", "Prompt", "Generate"] as const;

type ProviderOption = { id: string; label: string; available: boolean; comingSoon: boolean };

export function AdGenerator({
  state,
  actions,
  aiConnected,
  providers,
  seed,
  onSeedConsumed
}: {
  state: AdMakerState;
  actions: AdMakerActions;
  aiConnected: boolean;
  providers: ProviderOption[];
  seed?: GeneratorSeed | null;
  onSeedConsumed?: () => void;
}) {
  const [step, setStep] = React.useState(0);
  const [clientId, setClientId] = React.useState(state.activeClientId ?? state.clients[0]?.id ?? "");
  const [platform, setPlatform] = React.useState<Platform>("Facebook");
  const [goal, setGoal] = React.useState<AdGoal>("Sales");
  const [promptText, setPromptText] = React.useState("");
  const [style, setStyle] = React.useState<ImageStyle>("Modern");
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>("1:1");
  const [negativePrompt, setNegativePrompt] = React.useState("");
  const [cta, setCta] = React.useState("");
  const [variations, setVariations] = React.useState<VariationCount>(4);
  const defaultProvider = providers.find((p) => p.available && p.id !== "preview-render")?.id ?? "chatgpt-image";
  const [providerId, setProviderId] = React.useState(defaultProvider);

  const [loading, setLoading] = React.useState(false);
  const [projectId, setProjectId] = React.useState<string | null>(null);

  const brand = clientId ? state.brandKits[clientId] : undefined;
  const project = projectId ? state.projects.find((p) => p.id === projectId) ?? null : null;

  // When a prompt is sent in from the library/templates, load it and jump ahead.
  React.useEffect(() => {
    if (!seed) return;
    setPromptText(seed.promptText);
    if (seed.style) setStyle(seed.style);
    if (seed.aspectRatio) setAspectRatio(seed.aspectRatio);
    if (seed.platform) setPlatform(seed.platform);
    if (seed.negativePrompt) setNegativePrompt(seed.negativePrompt);
    if (seed.cta) setCta(seed.cta);
    setStep(3);
    onSeedConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  React.useEffect(() => {
    if (brand && !cta) setCta(brand.ctaPreference);
    if (brand) setStyle((current) => current ?? brand.preferredImageStyle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const finalPrompt = React.useMemo(
    () =>
      composePrompt(
        { promptText: promptText || `${goal} ad for ${platform}`, style, cta, brandVoice: brand?.brandVoice },
        brand
      ),
    [promptText, goal, platform, style, cta, brand]
  );

  async function generate() {
    if (!clientId) {
      toast.error("Choose a client first.");
      setStep(0);
      return;
    }
    if (!promptText.trim()) {
      toast.error("Add a prompt or pick a template.");
      return;
    }
    setLoading(true);
    setProjectId(null);
    try {
      const result = await generateAdImagesAction({
        prompt: finalPrompt,
        negativePrompt,
        aspectRatio,
        style,
        count: variations,
        providerId
      });
      const created = actions.addProject({
        clientId,
        name: seed?.name ? seed.name : `${platform} ${goal} · ${new Date().toLocaleDateString()}`,
        platform,
        goal,
        prompt: finalPrompt,
        style,
        aspectRatio,
        images: result.images,
        copy: null,
        campaignId: null,
        favorite: false
      });
      setProjectId(created.id);
      toast.success(
        result.provider === "preview-render"
          ? `Generated ${result.images.length} preview${result.images.length === 1 ? "" : "s"} — connect ChatGPT Image 2.0 for live art`
          : `Generated ${result.images.length} image${result.images.length === 1 ? "" : "s"}`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function handleExport(image: GeneratedImage, format: ExportFormat, label: string) {
    if (!projectId) return;
    actions.addExport({ clientId, projectId, format, label: `${label} · ${format}` });
  }

  const canNext = step === 0 ? Boolean(clientId) : true;

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((label, index) => (
          <React.Fragment key={label}>
            <button
              type="button"
              onClick={() => index <= step && setStep(index)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                index === step
                  ? "border-blue-400/40 bg-blue-500/20 text-white"
                  : index < step
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    : "border-white/10 bg-white/[0.03] text-slate-400"
              }`}
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                {index < step ? <Check className="size-3" /> : index + 1}
              </span>
              {label}
            </button>
            {index < STEPS.length - 1 ? <span className="hidden h-px w-4 bg-white/10 sm:block" /> : null}
          </React.Fragment>
        ))}
      </div>

      <GlassPanel>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            {step === 0 ? (
              <StepShell title="Choose a client" subtitle="Everything is generated on-brand for the selected client.">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {state.clients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setClientId(client.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        clientId === client.id ? "border-blue-400/40 bg-blue-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    >
                      <p className="font-semibold text-white">{client.name}</p>
                      <p className="text-xs text-slate-400">{client.industry}</p>
                    </button>
                  ))}
                </div>
              </StepShell>
            ) : null}

            {step === 1 ? (
              <StepShell title="Choose a platform">
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <Pill key={p} active={platform === p} onClick={() => setPlatform(p)}>{p}</Pill>
                  ))}
                </div>
              </StepShell>
            ) : null}

            {step === 2 ? (
              <StepShell title="Choose a goal">
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((g) => (
                    <Pill key={g} active={goal === g} onClick={() => setGoal(g)}>{g}</Pill>
                  ))}
                </div>
              </StepShell>
            ) : null}

            {step === 3 ? (
              <StepShell title="Prompt & style" subtitle="Pick a template from the library, or write your own — the brand kit is added automatically.">
                <div className="grid gap-4">
                  <Field label="Prompt" hint="Tokens like {{business}} and {{product}} fill from the brand kit.">
                    <TextArea value={promptText} onChange={(e) => setPromptText(e.target.value)} className="min-h-28" placeholder="Describe the ad you want…" />
                  </Field>
                  <PromptOptimizer prompt={promptText} onChange={setPromptText} aiConnected={aiConnected} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Style">
                      <SelectInput value={style} onChange={(e) => setStyle(e.target.value as ImageStyle)}>
                        {IMAGE_STYLES.map((s) => <option key={s}>{s}</option>)}
                      </SelectInput>
                    </Field>
                    <Field label="Aspect ratio">
                      <SelectInput value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}>
                        {ASPECT_RATIOS.map((r) => <option key={r}>{r}</option>)}
                      </SelectInput>
                    </Field>
                    <Field label="Call-to-action">
                      <TextInput value={cta} onChange={(e) => setCta(e.target.value)} placeholder="e.g. Book Now" />
                    </Field>
                    <Field label="Negative prompt">
                      <TextInput value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="What to avoid" />
                    </Field>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Final prompt preview</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{finalPrompt}</p>
                  </div>
                </div>
              </StepShell>
            ) : null}

            {step === 4 ? (
              <StepShell title="Generate images" subtitle="Pick how many variations and which engine to use.">
                <div className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Variations">
                      <div className="flex gap-2">
                        {VARIATION_COUNTS.map((count) => (
                          <Pill key={count} active={variations === count} onClick={() => setVariations(count)}>{count}</Pill>
                        ))}
                      </div>
                    </Field>
                    <Field label="Image engine">
                      <SelectInput value={providerId} onChange={(e) => setProviderId(e.target.value)}>
                        {providers.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.comingSoon}>
                            {p.label}{p.comingSoon ? " (soon)" : p.available ? "" : " (preview)"}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                  </div>
                  <Button className="bg-blue-500 text-white hover:bg-blue-400" disabled={loading} onClick={generate}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    Generate {variations} variation{variations === 1 ? "" : "s"}
                  </Button>

                  {loading ? (
                    <ImageGallery images={[]} loading loadingCount={variations} brandColors={brand?.colors ?? []} onToggleFavorite={() => {}} onExport={() => {}} />
                  ) : project ? (
                    <ImageGallery
                      images={project.images}
                      brandColors={brand?.colors ?? []}
                      onToggleFavorite={(imageId) => actions.toggleImageFavorite(project.id, imageId)}
                      onExport={handleExport}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/12 p-8 text-center text-sm text-slate-500">
                      <Wand2 className="mx-auto mb-2 size-6 text-slate-400" />
                      Your generated ads will appear here, ready to edit in Canva and export.
                    </div>
                  )}
                </div>
              </StepShell>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button className="bg-blue-500 text-white hover:bg-blue-400" disabled={!canNext} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
              Next <ArrowRight className="size-4" />
            </Button>
          ) : (
            <span className="text-xs text-slate-500">{aiConnected ? "ChatGPT Image 2.0 connected" : "Preview mode · connect ChatGPT Image 2.0"}</span>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {subtitle ? <p className="mt-1 mb-4 text-sm text-slate-400">{subtitle}</p> : <div className="mb-4" />}
      {children}
    </div>
  );
}
