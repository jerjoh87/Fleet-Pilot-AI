/**
 * Static option sets and the preset prompt / template libraries for the
 * AI Ad Maker. Kept dependency-free so both client and server can import it.
 */

import type {
  AdGoal,
  AspectRatio,
  ExportFormat,
  ImageStyle,
  OptimizeMode,
  Platform,
  VariationCount
} from "./types";

export const PLATFORMS: Platform[] = [
  "Facebook",
  "Instagram",
  "TikTok",
  "Google",
  "LinkedIn",
  "Pinterest",
  "YouTube",
  "X"
];

export const GOALS: AdGoal[] = [
  "Sales",
  "Leads",
  "Brand Awareness",
  "Traffic",
  "Appointments",
  "Phone Calls",
  "Engagement"
];

export const IMAGE_STYLES: ImageStyle[] = [
  "Photo",
  "Illustration",
  "3D",
  "Luxury",
  "Minimal",
  "Corporate",
  "Modern",
  "Lifestyle",
  "Cinematic",
  "Hyper Realistic",
  "Flat Design"
];

export const ASPECT_RATIOS: AspectRatio[] = [
  "1:1",
  "4:5",
  "9:16",
  "16:9",
  "1080x1080",
  "1080x1350",
  "1920x1080"
];

export const VARIATION_COUNTS: VariationCount[] = [1, 2, 4, 8];

export const EXPORT_FORMATS: ExportFormat[] = [
  "PNG",
  "JPG",
  "PDF",
  "SVG",
  "Canva",
  "ZIP",
  "Social Media Package"
];

export const CAMERA_ANGLES = [
  "Eye level",
  "Low angle",
  "High angle",
  "Close-up",
  "Wide shot",
  "Overhead / flat lay",
  "Dutch angle",
  "Macro"
];

export const LIGHTING = [
  "Soft natural light",
  "Golden hour",
  "Studio softbox",
  "Dramatic rim light",
  "Neon / cyberpunk",
  "High-key",
  "Low-key",
  "Backlit"
];

export const MOODS = [
  "Energetic",
  "Luxurious",
  "Trustworthy",
  "Playful",
  "Bold",
  "Calm",
  "Premium",
  "Urgent"
];

/** Maps each aspect ratio to a concrete pixel size for image generation. */
export const ASPECT_SIZES: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:5": { width: 1024, height: 1280 },
  "9:16": { width: 1024, height: 1792 },
  "16:9": { width: 1792, height: 1024 },
  "1080x1080": { width: 1080, height: 1080 },
  "1080x1350": { width: 1080, height: 1350 },
  "1920x1080": { width: 1920, height: 1080 }
};

/** OpenAI gpt-image only accepts a handful of sizes; map to the closest. */
export function openAiSizeFor(ratio: AspectRatio): "1024x1024" | "1024x1536" | "1536x1024" {
  const { width, height } = ASPECT_SIZES[ratio];
  if (width > height) return "1536x1024";
  if (height > width) return "1024x1536";
  return "1024x1024";
}

export type PresetPrompt = {
  name: string;
  category: string;
  description: string;
  promptText: string;
  variables: string[];
  aspectRatio: AspectRatio;
  platform: Platform;
  style: ImageStyle;
};

/**
 * Categorized preset prompt library. `{{variables}}` are editable tokens that
 * get substituted from the brand kit / wizard before generation.
 */
export const PRESET_PROMPTS: PresetPrompt[] = [
  // ---- Facebook Ads ----
  {
    name: "New Product Launch",
    category: "Facebook Ads",
    description: "Hero shot announcing a brand-new product.",
    promptText:
      "A premium advertisement for {{product}} by {{business}}, dramatic hero product shot, launch announcement, bold headline space, {{colors}} accent color palette",
    variables: ["product", "business", "colors"],
    aspectRatio: "1:1",
    platform: "Facebook",
    style: "Photo"
  },
  {
    name: "Flash Sale",
    category: "Facebook Ads",
    description: "High-urgency limited-time discount creative.",
    promptText:
      "Eye-catching flash sale advertisement for {{business}}, big bold discount badge, urgent energetic mood, {{colors}} palette, space for {{offer}} text",
    variables: ["business", "colors", "offer"],
    aspectRatio: "1:1",
    platform: "Facebook",
    style: "Modern"
  },
  {
    name: "Holiday Promotion",
    category: "Facebook Ads",
    description: "Seasonal, festive promotional creative.",
    promptText:
      "Festive holiday promotion for {{business}}, seasonal decorations, warm inviting mood, gift and celebration theme, {{colors}} accents",
    variables: ["business", "colors"],
    aspectRatio: "4:5",
    platform: "Facebook",
    style: "Lifestyle"
  },
  {
    name: "Grand Opening",
    category: "Facebook Ads",
    description: "Announce a new location or launch.",
    promptText:
      "Grand opening announcement for {{business}} in {{location}}, celebratory ribbon-cutting energy, confetti, welcoming and exciting, {{colors}} branding",
    variables: ["business", "location", "colors"],
    aspectRatio: "1:1",
    platform: "Facebook",
    style: "Modern"
  },
  {
    name: "Limited Time Offer",
    category: "Facebook Ads",
    description: "Scarcity-driven conversion creative.",
    promptText:
      "Limited time offer ad for {{product}}, countdown urgency, premium presentation, clear focal point, {{colors}} palette",
    variables: ["product", "colors"],
    aspectRatio: "1:1",
    platform: "Facebook",
    style: "Corporate"
  },

  // ---- Instagram ----
  {
    name: "Carousel Slide",
    category: "Instagram",
    description: "Cohesive multi-slide carousel frame.",
    promptText:
      "Instagram carousel slide for {{business}}, cohesive minimal layout, single strong subject, generous negative space for caption, {{colors}} palette",
    variables: ["business", "colors"],
    aspectRatio: "4:5",
    platform: "Instagram",
    style: "Minimal"
  },
  {
    name: "Story",
    category: "Instagram",
    description: "Full-screen vertical story ad.",
    promptText:
      "Vertical Instagram story ad for {{product}}, immersive full-bleed background, top and bottom space for stickers and CTA, {{colors}} accents",
    variables: ["product", "colors"],
    aspectRatio: "9:16",
    platform: "Instagram",
    style: "Lifestyle"
  },
  {
    name: "Reel Cover",
    category: "Instagram",
    description: "Scroll-stopping reel cover thumbnail.",
    promptText:
      "Bold Instagram reel cover for {{business}}, high contrast, expressive subject, big readable title zone, {{colors}} palette",
    variables: ["business", "colors"],
    aspectRatio: "9:16",
    platform: "Instagram",
    style: "Cinematic"
  },
  {
    name: "Giveaway",
    category: "Instagram",
    description: "Prize-forward engagement creative.",
    promptText:
      "Exciting giveaway announcement for {{business}}, prize hero shot, celebratory confetti, 'win' energy, {{colors}} branding",
    variables: ["business", "colors"],
    aspectRatio: "1:1",
    platform: "Instagram",
    style: "Modern"
  },
  {
    name: "Engagement Post",
    category: "Instagram",
    description: "Question / poll style engagement post.",
    promptText:
      "Engaging Instagram post for {{business}}, friendly relatable scene, space for a question prompt, warm inviting mood, {{colors}} palette",
    variables: ["business", "colors"],
    aspectRatio: "1:1",
    platform: "Instagram",
    style: "Lifestyle"
  },

  // ---- Google Display ----
  {
    name: "Display Banner",
    category: "Google Display",
    description: "Clean horizontal banner creative.",
    promptText:
      "Clean Google display banner for {{business}}, horizontal composition, subject on one side, clear headline zone, {{colors}} palette",
    variables: ["business", "colors"],
    aspectRatio: "16:9",
    platform: "Google",
    style: "Corporate"
  },
  {
    name: "Responsive Display",
    category: "Google Display",
    description: "Flexible asset for responsive display ads.",
    promptText:
      "Responsive display ad asset for {{product}}, centered subject, neutral adaptable background, {{colors}} accents, ample safe margins",
    variables: ["product", "colors"],
    aspectRatio: "1:1",
    platform: "Google",
    style: "Minimal"
  },
  {
    name: "Remarketing",
    category: "Google Display",
    description: "Reminder creative for warm audiences.",
    promptText:
      "Remarketing banner for {{business}}, 'come back' reminder tone, product hero, subtle incentive badge, {{colors}} palette",
    variables: ["business", "colors"],
    aspectRatio: "16:9",
    platform: "Google",
    style: "Modern"
  },

  // ---- LinkedIn ----
  {
    name: "B2B Promotion",
    category: "LinkedIn",
    description: "Professional B2B value-prop creative.",
    promptText:
      "Professional LinkedIn B2B ad for {{business}}, corporate polished aesthetic, confident business scene, {{colors}} branding, headline space",
    variables: ["business", "colors"],
    aspectRatio: "1:1",
    platform: "LinkedIn",
    style: "Corporate"
  },
  {
    name: "Lead Generation",
    category: "LinkedIn",
    description: "Gated-offer lead-gen creative.",
    promptText:
      "LinkedIn lead generation ad for {{business}}, whitepaper / demo offer theme, trustworthy professional mood, {{colors}} accents",
    variables: ["business", "colors"],
    aspectRatio: "4:5",
    platform: "LinkedIn",
    style: "Corporate"
  },
  {
    name: "Recruitment",
    category: "LinkedIn",
    description: "Hiring / employer-brand creative.",
    promptText:
      "LinkedIn recruitment ad for {{business}}, welcoming team culture scene, 'we're hiring' energy, {{colors}} branding",
    variables: ["business", "colors"],
    aspectRatio: "1:1",
    platform: "LinkedIn",
    style: "Lifestyle"
  },

  // ---- Industry verticals ----
  {
    name: "Real Estate Listing",
    category: "Real Estate",
    description: "Showcase a property with agent branding.",
    promptText:
      "Luxury real estate advertisement, stunning {{property}} exterior at golden hour, aspirational lifestyle, {{business}} branding, {{colors}} accents",
    variables: ["property", "business", "colors"],
    aspectRatio: "4:5",
    platform: "Instagram",
    style: "Luxury"
  },
  {
    name: "Automotive Feature",
    category: "Automotive",
    description: "Cinematic vehicle hero ad.",
    promptText:
      "Cinematic automotive ad for {{vehicle}} from {{business}}, dramatic studio lighting, glossy reflections, premium showroom mood, {{colors}} accents",
    variables: ["vehicle", "business", "colors"],
    aspectRatio: "16:9",
    platform: "Facebook",
    style: "Cinematic"
  },
  {
    name: "Restaurant Special",
    category: "Restaurants",
    description: "Appetizing food-forward promotion.",
    promptText:
      "Mouth-watering food photography ad for {{business}}, hero dish {{dish}}, appetizing natural light, cozy restaurant ambiance, {{colors}} accents",
    variables: ["business", "dish", "colors"],
    aspectRatio: "1:1",
    platform: "Instagram",
    style: "Photo"
  },
  {
    name: "Roofing Service",
    category: "Roofing",
    description: "Trust-building home-services creative.",
    promptText:
      "Professional roofing service ad for {{business}}, freshly finished quality roof, trustworthy crew, clean suburban home, {{colors}} branding",
    variables: ["business", "colors"],
    aspectRatio: "1:1",
    platform: "Facebook",
    style: "Photo"
  },
  {
    name: "HVAC Tune-Up",
    category: "HVAC",
    description: "Seasonal HVAC service promotion.",
    promptText:
      "HVAC service advertisement for {{business}}, comfortable cool home, friendly technician, seasonal comfort theme, {{colors}} accents",
    variables: ["business", "colors"],
    aspectRatio: "1:1",
    platform: "Facebook",
    style: "Corporate"
  },
  {
    name: "Medical Practice",
    category: "Medical",
    description: "Reassuring healthcare creative.",
    promptText:
      "Clean modern medical practice ad for {{business}}, caring professional healthcare setting, reassuring bright mood, {{colors}} accents",
    variables: ["business", "colors"],
    aspectRatio: "1:1",
    platform: "Google",
    style: "Corporate"
  },
  {
    name: "Fitness Membership",
    category: "Fitness",
    description: "High-energy gym / fitness promo.",
    promptText:
      "High-energy fitness ad for {{business}}, athletic subject mid-workout, dynamic gym lighting, motivational bold mood, {{colors}} accents",
    variables: ["business", "colors"],
    aspectRatio: "9:16",
    platform: "Instagram",
    style: "Cinematic"
  },
  {
    name: "Beauty Product",
    category: "Beauty",
    description: "Elegant beauty / cosmetics creative.",
    promptText:
      "Elegant beauty advertisement for {{product}} by {{business}}, soft glowing skin, luxurious minimal set, premium mood, {{colors}} palette",
    variables: ["product", "business", "colors"],
    aspectRatio: "4:5",
    platform: "Instagram",
    style: "Luxury"
  },
  {
    name: "Finance / Advisory",
    category: "Finance",
    description: "Confident financial-services creative.",
    promptText:
      "Trustworthy finance advertisement for {{business}}, confident professional, clean corporate aesthetic, growth and security theme, {{colors}} accents",
    variables: ["business", "colors"],
    aspectRatio: "1:1",
    platform: "LinkedIn",
    style: "Corporate"
  },
  {
    name: "Ecommerce Product",
    category: "Ecommerce",
    description: "Clean conversion-focused product shot.",
    promptText:
      "Ecommerce product ad for {{product}} by {{business}}, clean studio background, crisp product hero, badge space for price, {{colors}} accents",
    variables: ["product", "business", "colors"],
    aspectRatio: "1:1",
    platform: "Facebook",
    style: "Minimal"
  },
  {
    name: "SaaS Feature",
    category: "SaaS",
    description: "Modern product-UI SaaS creative.",
    promptText:
      "Modern SaaS advertisement for {{business}}, sleek product UI mockup, gradient tech backdrop, innovative confident mood, {{colors}} accents",
    variables: ["business", "colors"],
    aspectRatio: "16:9",
    platform: "LinkedIn",
    style: "3D"
  },
  {
    name: "Local Business",
    category: "Local Business",
    description: "Community-focused local promo.",
    promptText:
      "Friendly local business ad for {{business}} in {{location}}, warm community feel, approachable storefront, {{colors}} branding",
    variables: ["business", "location", "colors"],
    aspectRatio: "1:1",
    platform: "Facebook",
    style: "Lifestyle"
  }
];

export const PRESET_CATEGORIES = Array.from(new Set(PRESET_PROMPTS.map((p) => p.category)));

export type PresetTemplate = {
  name: string;
  category: string;
  aspectRatio: AspectRatio;
  platform: Platform;
  gradient: [string, string];
};

/** Editable design templates (starting points shown in the Template Library). */
export const PRESET_TEMPLATES: PresetTemplate[] = [
  { name: "Facebook Ad", category: "Facebook Ads", aspectRatio: "1:1", platform: "Facebook", gradient: ["#2563eb", "#0ea5e9"] },
  { name: "Instagram Story", category: "Instagram", aspectRatio: "9:16", platform: "Instagram", gradient: ["#db2777", "#f97316"] },
  { name: "Instagram Post", category: "Instagram", aspectRatio: "1:1", platform: "Instagram", gradient: ["#7c3aed", "#ec4899"] },
  { name: "Carousel", category: "Instagram", aspectRatio: "4:5", platform: "Instagram", gradient: ["#0891b2", "#22c55e"] },
  { name: "Google Display", category: "Google Display", aspectRatio: "16:9", platform: "Google", gradient: ["#f59e0b", "#ef4444"] },
  { name: "Flyer", category: "Print", aspectRatio: "4:5", platform: "Facebook", gradient: ["#4f46e5", "#06b6d4"] },
  { name: "Business Card", category: "Print", aspectRatio: "16:9", platform: "Facebook", gradient: ["#111827", "#374151"] },
  { name: "Poster", category: "Print", aspectRatio: "4:5", platform: "Facebook", gradient: ["#be123c", "#f43f5e"] },
  { name: "Email Header", category: "Email", aspectRatio: "16:9", platform: "Facebook", gradient: ["#0d9488", "#14b8a6"] },
  { name: "YouTube Thumbnail", category: "Video", aspectRatio: "16:9", platform: "YouTube", gradient: ["#dc2626", "#7c2d12"] },
  { name: "Website Banner", category: "Web", aspectRatio: "1920x1080", platform: "Google", gradient: ["#1d4ed8", "#3b82f6"] },
  { name: "TikTok Cover", category: "Video", aspectRatio: "9:16", platform: "TikTok", gradient: ["#0f172a", "#06b6d4"] },
  { name: "Pinterest Pin", category: "Pinterest", aspectRatio: "4:5", platform: "Pinterest", gradient: ["#be185d", "#e11d48"] }
];

export const OPTIMIZE_ACTIONS: Array<{ mode: OptimizeMode; label: string }> = [
  { mode: "improve", label: "Improve Prompt" },
  { mode: "professional", label: "Make More Professional" },
  { mode: "conversions", label: "Increase Conversions" },
  { mode: "realistic", label: "More Realistic" },
  { mode: "luxury", label: "Luxury Style" },
  { mode: "modern", label: "Modern Style" },
  { mode: "cinematic", label: "Cinematic" },
  { mode: "hyper-realistic", label: "Hyper Realistic" },
  { mode: "product-photography", label: "Product Photography" },
  { mode: "social-media", label: "Social Media Ready" }
];
