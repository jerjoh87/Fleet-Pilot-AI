/**
 * Deterministic placeholder provider.
 *
 * Always available. Produces branded gradient SVG data URLs so the entire Ad
 * Maker experience is fully functional (generate → gallery → edit → export)
 * without any external API key — mirroring the rest of the app, which runs on
 * heuristics until real providers are connected.
 */

import { ASPECT_SIZES } from "../presets";
import type { GenerateImageRequest, ImageProvider, ProviderResult } from "./base";

const PALETTES: Array<[string, string, string]> = [
  ["#2563eb", "#0ea5e9", "#22d3ee"],
  ["#7c3aed", "#ec4899", "#f97316"],
  ["#059669", "#10b981", "#a3e635"],
  ["#e11d48", "#f43f5e", "#fb923c"],
  ["#0f172a", "#334155", "#0891b2"],
  ["#f59e0b", "#ef4444", "#be123c"]
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(text: string, max: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > max) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`;
    }
    if (lines.length >= 3) break;
  }
  if (current && lines.length < 4) lines.push(current.trim());
  return lines.slice(0, 4);
}

function svgFor(request: GenerateImageRequest, index: number): string {
  const { width, height } = ASPECT_SIZES[request.aspectRatio];
  const [a, b, c] = PALETTES[index % PALETTES.length];
  const lines = wrap(request.prompt, Math.max(14, Math.round(width / 42)));
  const fontSize = Math.round(width / 20);
  const startY = height / 2 - ((lines.length - 1) * fontSize * 0.7);

  const textEls = lines
    .map(
      (line, i) =>
        `<text x="${width / 2}" y="${startY + i * fontSize * 1.35}" font-family="Inter, system-ui, sans-serif" font-size="${fontSize}" font-weight="800" fill="#ffffff" text-anchor="middle" opacity="0.96">${escapeXml(line)}</text>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${a}"/>
        <stop offset="55%" stop-color="${b}"/>
        <stop offset="100%" stop-color="${c}"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
    <rect width="${width}" height="${height}" fill="url(#glow)"/>
    <circle cx="${width * 0.82}" cy="${height * 0.18}" r="${width * 0.14}" fill="#ffffff" opacity="0.08"/>
    <circle cx="${width * 0.16}" cy="${height * 0.84}" r="${width * 0.2}" fill="#000000" opacity="0.08"/>
    <text x="${width / 2}" y="${height * 0.12}" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(width / 46)}" letter-spacing="6" fill="#ffffff" text-anchor="middle" opacity="0.7">${escapeXml(request.style.toUpperCase())} · ${escapeXml(request.aspectRatio)}</text>
    ${textEls}
    <text x="${width / 2}" y="${height * 0.9}" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(width / 40)}" font-weight="700" fill="#0b1020" text-anchor="middle" opacity="0.85">Preview render · connect ChatGPT Image 2.0</text>
  </svg>`;
}

function toDataUrl(svg: string) {
  const encoded =
    typeof Buffer !== "undefined"
      ? Buffer.from(svg).toString("base64")
      : btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encoded}`;
}

export const mockProvider: ImageProvider = {
  id: "preview-render",
  label: "Preview Render",
  isAvailable: () => true,
  async generate(request: GenerateImageRequest): Promise<ProviderResult> {
    const count = Math.max(1, Math.min(8, request.count));
    return {
      provider: "preview-render",
      providerLabel: "Preview Render",
      images: Array.from({ length: count }, (_, index) => ({
        url: toDataUrl(svgFor(request, index)),
        prompt: request.prompt
      }))
    };
  }
};
