/**
 * Image provider registry.
 *
 * `resolveProvider` picks the requested provider when it is available and falls
 * back to the always-on preview renderer otherwise, so generation never fails
 * hard. Future providers are listed with `comingSoon: true` — surfacing them in
 * the UI without any calling-code changes when they graduate to real adapters.
 */

import type { ImageProvider } from "./base";
import { mockProvider } from "./mock";
import { openAiImageProvider } from "./openai";

/** Placeholder adapter for a not-yet-implemented provider. */
function comingSoonProvider(id: string, label: string): ImageProvider {
  return {
    id,
    label,
    comingSoon: true,
    isAvailable: () => false,
    async generate() {
      throw new Error(`${label} is not available yet.`);
    }
  };
}

export const PROVIDERS: ImageProvider[] = [
  openAiImageProvider,
  comingSoonProvider("dalle", "DALL·E 3"),
  comingSoonProvider("adobe-express", "Adobe Express"),
  comingSoonProvider("ideogram", "Ideogram"),
  comingSoonProvider("midjourney", "Midjourney"),
  comingSoonProvider("flux", "Flux"),
  comingSoonProvider("stable-diffusion", "Stable Diffusion"),
  comingSoonProvider("leonardo", "Leonardo AI"),
  mockProvider
];

export function listProviders(): Array<{ id: string; label: string; available: boolean; comingSoon: boolean }> {
  return PROVIDERS.map((provider) => ({
    id: provider.id,
    label: provider.label,
    available: provider.isAvailable(),
    comingSoon: Boolean(provider.comingSoon)
  }));
}

export function getProvider(id?: string): ImageProvider | undefined {
  return PROVIDERS.find((provider) => provider.id === id);
}

/**
 * Resolve the provider to actually run with: the requested one if available,
 * otherwise the first available real provider, otherwise the preview renderer.
 */
export function resolveProvider(id?: string): ImageProvider {
  const requested = getProvider(id);
  if (requested?.isAvailable()) return requested;
  const firstReal = PROVIDERS.find((provider) => !provider.comingSoon && provider.id !== mockProvider.id && provider.isAvailable());
  return firstReal ?? mockProvider;
}
