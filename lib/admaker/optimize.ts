/**
 * AI Prompt Assistant — improves image prompts.
 *
 * Each mode appends targeted directives (deterministic, works offline) and,
 * when OpenAI is configured, rewrites the prompt entirely for a stronger result.
 */

import { generateNarrative } from "@/lib/ai/provider";
import type { OptimizeMode } from "./types";

const DIRECTIVES: Record<OptimizeMode, string> = {
  improve:
    "highly detailed, professional composition, balanced lighting, strong focal point, clean negative space for copy",
  professional:
    "polished corporate aesthetic, refined color grading, premium finish, trustworthy and credible tone",
  conversions:
    "conversion-optimized, clear visual hierarchy, prominent product focus, space reserved for a bold call-to-action badge",
  realistic:
    "photorealistic, natural textures, accurate lighting and shadows, true-to-life materials",
  luxury:
    "luxury premium aesthetic, elegant, opulent materials, sophisticated soft lighting, high-end brand feel",
  modern:
    "modern minimal design, clean lines, contemporary palette, sleek and fresh",
  cinematic:
    "cinematic composition, dramatic lighting, shallow depth of field, filmic color grade, atmospheric",
  "hyper-realistic":
    "hyper realistic, ultra sharp, 8k detail, lifelike micro-textures, studio-grade clarity",
  "product-photography":
    "professional product photography, seamless studio backdrop, crisp reflections, soft box lighting, catalog quality",
  "social-media":
    "scroll-stopping social media creative, vibrant, thumb-stopping contrast, mobile-first framing, bold and shareable"
};

const LABELS: Record<OptimizeMode, string> = {
  improve: "improve overall quality",
  professional: "make it more professional",
  conversions: "maximize conversions",
  realistic: "make it more realistic",
  luxury: "give it a luxury style",
  modern: "give it a modern style",
  cinematic: "make it cinematic",
  "hyper-realistic": "make it hyper realistic",
  "product-photography": "turn it into product photography",
  "social-media": "make it social-media ready"
};

function heuristicOptimize(prompt: string, mode: OptimizeMode): string {
  const trimmed = prompt.trim().replace(/[.,\s]+$/, "");
  const directive = DIRECTIVES[mode];
  // Avoid duplicating directives if re-run.
  if (trimmed.toLowerCase().includes(directive.split(",")[0].toLowerCase())) {
    return trimmed;
  }
  return `${trimmed}, ${directive}`;
}

export async function optimizePrompt(prompt: string, mode: OptimizeMode): Promise<string> {
  const fallback = heuristicOptimize(prompt, mode);

  const narrative = await generateNarrative({
    system: `You are an expert AI image-prompt engineer for advertising. Rewrite the user's prompt to ${LABELS[mode]}. Keep the original subject and intent. Return ONLY the improved prompt text, no preamble, no quotes.`,
    context: { prompt, mode },
    maxWords: 120
  });

  return narrative?.replace(/^["']|["']$/g, "").trim() || fallback;
}
