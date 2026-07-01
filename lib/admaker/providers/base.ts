/**
 * Image-generation provider abstraction.
 *
 * The Ad Maker is provider-agnostic: ChatGPT Image 2.0 is the default, but the
 * same interface lets future providers (Adobe Express, Ideogram, Midjourney,
 * Flux, Stable Diffusion, DALL·E, Leonardo AI, …) be dropped in without any
 * changes to the calling code. See `./index.ts` for the registry.
 */

import type { AspectRatio, ImageStyle } from "../types";

export type GenerateImageRequest = {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  style: ImageStyle;
  count: number;
};

export type ProviderImage = {
  /** Remote URL or a self-contained data URL. */
  url: string;
  prompt: string;
};

export type ProviderResult = {
  provider: string;
  providerLabel: string;
  images: ProviderImage[];
};

export interface ImageProvider {
  /** Stable id used in state / registry lookups. */
  id: string;
  /** Human-friendly label. */
  label: string;
  /** Whether the provider can run in the current environment (keys present). */
  isAvailable(): boolean;
  /** Providers not yet implemented are surfaced as "coming soon" in the UI. */
  comingSoon?: boolean;
  generate(request: GenerateImageRequest): Promise<ProviderResult>;
}
