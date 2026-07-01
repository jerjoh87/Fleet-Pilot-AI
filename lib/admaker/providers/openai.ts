/**
 * ChatGPT Image 2.0 provider (OpenAI `gpt-image-1`).
 *
 * Called via `fetch` so no extra dependency is required — the same "connect
 * later" philosophy as `lib/ai/provider.ts`. Falls back gracefully: the caller
 * (see `./index.ts`) uses the mock provider whenever this is unavailable.
 */

import { openAiSizeFor } from "../presets";
import type { GenerateImageRequest, ImageProvider, ProviderResult } from "./base";

const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

export const openAiImageProvider: ImageProvider = {
  id: "chatgpt-image",
  label: "ChatGPT Image 2.0",
  isAvailable: () => Boolean(process.env.OPENAI_API_KEY),
  async generate(request: GenerateImageRequest): Promise<ProviderResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("ChatGPT Image is not connected. Add OPENAI_API_KEY to enable live generation.");
    }

    const count = Math.max(1, Math.min(8, request.count));
    const negative = request.negativePrompt ? ` Avoid: ${request.negativePrompt}.` : "";
    const fullPrompt = `${request.prompt} Style: ${request.style}, advertising creative, high quality.${negative}`;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt: fullPrompt,
        n: count,
        size: openAiSizeFor(request.aspectRatio)
      })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`ChatGPT Image request failed (${response.status}). ${detail.slice(0, 180)}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
    };

    const images = (data.data ?? [])
      .map((item) => {
        if (item.url) return { url: item.url, prompt: request.prompt };
        if (item.b64_json) return { url: `data:image/png;base64,${item.b64_json}`, prompt: request.prompt };
        return null;
      })
      .filter((item): item is { url: string; prompt: string } => item !== null);

    if (!images.length) {
      throw new Error("ChatGPT Image returned no images.");
    }

    return { provider: "chatgpt-image", providerLabel: "ChatGPT Image 2.0", images };
  }
};
