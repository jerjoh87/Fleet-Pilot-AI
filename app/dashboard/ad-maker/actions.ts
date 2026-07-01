"use server";

import { requireAppSession } from "@/lib/auth/session";
import { resolveProvider } from "@/lib/admaker/providers";
import { generateAdCopy, type CopyRequest } from "@/lib/admaker/copy";
import { optimizePrompt } from "@/lib/admaker/optimize";
import type { AdCopy, AspectRatio, GeneratedImage, ImageStyle, OptimizeMode } from "@/lib/admaker/types";

export type GenerateImagesInput = {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  style: ImageStyle;
  count: number;
  providerId?: string;
};

/** Generate ad images through the resolved provider (ChatGPT Image 2.0 → preview). */
export async function generateAdImagesAction(input: GenerateImagesInput): Promise<{
  provider: string;
  providerLabel: string;
  images: GeneratedImage[];
}> {
  await requireAppSession();

  if (!input.prompt?.trim()) {
    throw new Error("A prompt is required to generate images.");
  }

  const provider = resolveProvider(input.providerId);
  const result = await provider.generate({
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    aspectRatio: input.aspectRatio,
    style: input.style,
    count: Math.max(1, Math.min(8, input.count))
  });

  const now = new Date().toISOString();
  const images: GeneratedImage[] = result.images.map((image, index) => ({
    id: `img_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
    url: image.url,
    provider: result.provider,
    providerLabel: result.providerLabel,
    prompt: image.prompt,
    aspectRatio: input.aspectRatio,
    style: input.style,
    favorite: false,
    createdAt: now
  }));

  return { provider: result.provider, providerLabel: result.providerLabel, images };
}

export async function generateAdCopyAction(input: CopyRequest): Promise<AdCopy> {
  await requireAppSession();
  return generateAdCopy(input);
}

export async function optimizePromptAction(input: { prompt: string; mode: OptimizeMode }): Promise<{ prompt: string }> {
  await requireAppSession();
  if (!input.prompt?.trim()) {
    throw new Error("Enter a prompt to optimize.");
  }
  const optimized = await optimizePrompt(input.prompt, input.mode);
  return { prompt: optimized };
}
