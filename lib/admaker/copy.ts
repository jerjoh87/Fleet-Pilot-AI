/**
 * AI copy generation for ads.
 *
 * Deterministic heuristics produce ready-to-use copy today; when OpenAI is
 * configured the same request is enriched with model-written variants. Mirrors
 * the graceful-degradation pattern of `lib/ai/insights.ts`.
 */

import { generateNarrative } from "@/lib/ai/provider";
import type { AdCopy, AdGoal, Platform } from "./types";

export type CopyRequest = {
  business: string;
  product: string;
  audience: string;
  platform: Platform;
  goal: AdGoal;
  tone: string;
  offer?: string;
  keywords?: string;
};

const goalVerb: Record<AdGoal, string> = {
  Sales: "Shop now and save",
  Leads: "Get your free quote",
  "Brand Awareness": "Discover the difference",
  Traffic: "Learn more today",
  Appointments: "Book your appointment",
  "Phone Calls": "Call us today",
  Engagement: "Join the conversation"
};

function heuristicCopy(request: CopyRequest): AdCopy {
  const subject = request.product?.trim() || request.business;
  const offer = request.offer?.trim();
  const cta = goalVerb[request.goal] ?? "Learn more";
  const keywordSeed = (request.keywords ?? `${request.business} ${request.product} ${request.audience}`)
    .split(/[\s,]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);

  const uniqueKeywords = Array.from(new Set(keywordSeed.map((w) => w.toLowerCase()))).slice(0, 8);

  const primaryText = [
    `${offer ? `${offer} — ` : ""}${subject} built for ${request.audience || "you"}.`,
    `${request.business} makes it effortless. ${request.tone ? `${request.tone}, ` : ""}reliable, and ready when you are.`,
    `${cta} and see why customers keep coming back.`
  ].join(" ");

  return {
    primaryText,
    headline: offer ? `${offer} on ${subject}` : `Meet ${subject}`,
    description: `${request.business} · ${cta}. Trusted by ${request.audience || "customers"} everywhere.`,
    cta,
    hashtags: uniqueKeywords.map((word) => `#${word.replace(/[^a-z0-9]/g, "")}`).filter((tag) => tag.length > 1).slice(0, 6),
    keywords: uniqueKeywords,
    seoTitle: `${subject} | ${request.business}`.slice(0, 60),
    metaDescription: `${primaryText}`.slice(0, 155)
  };
}

export async function generateAdCopy(request: CopyRequest): Promise<AdCopy> {
  const base = heuristicCopy(request);

  const narrative = await generateNarrative({
    system:
      "You are a senior direct-response ad copywriter. Given the JSON brief, return a single compelling primary text for the specified platform and goal. No hashtags, no quotes, just the copy.",
    context: request,
    maxWords: 60
  });

  if (narrative) {
    return { ...base, primaryText: narrative };
  }
  return base;
}
