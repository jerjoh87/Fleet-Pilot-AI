/**
 * Prompt composition — merges the wizard/editor inputs with the client's brand
 * kit so brand information is automatically injected into every generation.
 */

import type { AdPrompt, BrandKit } from "./types";

export type PromptComposition = {
  promptText: string;
  cameraAngle?: string;
  lighting?: string;
  mood?: string;
  colorPalette?: string;
  style?: string;
  cta?: string;
  brandVoice?: string;
  variables?: Record<string, string>;
};

/** Replace `{{tokens}}` using explicit variables first, then brand-kit values. */
export function substituteVariables(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key.toLowerCase()];
    return value && value.trim() ? value.trim() : "";
  });
}

function brandVariables(brand?: BrandKit): Record<string, string> {
  if (!brand) return {};
  return {
    business: brand.businessName,
    brand: brand.businessName,
    colors: brand.colors.join(", "),
    audience: brand.targetAudience,
    industry: brand.industry,
    website: brand.website,
    offer: brand.offers,
    product: brand.products,
    service: brand.services
  };
}

/**
 * Build the final generation prompt. Appends styling directives and a compact
 * brand-context line so the model stays on-brand automatically.
 */
export function composePrompt(input: PromptComposition, brand?: BrandKit): string {
  const variables = { ...brandVariables(brand), ...(input.variables ?? {}) };
  const base = substituteVariables(input.promptText, variables).replace(/\s{2,}/g, " ").trim();

  const modifiers: string[] = [];
  if (input.style) modifiers.push(`${input.style} style`);
  if (input.cameraAngle) modifiers.push(input.cameraAngle.toLowerCase());
  if (input.lighting) modifiers.push(input.lighting.toLowerCase());
  if (input.mood) modifiers.push(`${input.mood.toLowerCase()} mood`);
  if (input.colorPalette) modifiers.push(`${input.colorPalette} color palette`);

  const brandBits: string[] = [];
  if (brand?.businessName) brandBits.push(`brand: ${brand.businessName}`);
  if (brand?.colors.length) brandBits.push(`brand colors ${brand.colors.join(", ")}`);
  if (brand?.brandVoice || input.brandVoice) brandBits.push(`voice: ${input.brandVoice || brand?.brandVoice}`);

  const parts = [base];
  if (modifiers.length) parts.push(modifiers.join(", "));
  if (brandBits.length) parts.push(`On-brand for ${brandBits.join("; ")}`);
  if (input.cta) parts.push(`leave clear space for the call-to-action "${input.cta}"`);
  parts.push("professional advertising creative, sharp focus, high detail");

  return parts.filter(Boolean).join(". ");
}

/** Convenience: compose directly from a saved prompt + brand kit. */
export function composeFromPrompt(prompt: AdPrompt, brand?: BrandKit, extraVariables?: Record<string, string>): string {
  return composePrompt(
    {
      promptText: prompt.promptText,
      style: prompt.style,
      cameraAngle: prompt.cameraAngle,
      lighting: prompt.lighting,
      mood: prompt.mood,
      colorPalette: prompt.colorPalette,
      cta: prompt.cta,
      brandVoice: prompt.brandVoice,
      variables: extraVariables
    },
    brand
  );
}
