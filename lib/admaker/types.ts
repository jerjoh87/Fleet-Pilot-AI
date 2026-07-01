/**
 * AI Ad Maker — shared domain types.
 *
 * The Ad Maker lives inside the Owner Console and lets owners generate,
 * organize, and export professional advertisements for themselves or their
 * clients. Every asset is isolated per client workspace.
 *
 * These types are shared between the client components (workspace state stored
 * locally per organization) and the server actions (image / copy generation).
 */

export type Platform =
  | "Facebook"
  | "Instagram"
  | "TikTok"
  | "Google"
  | "LinkedIn"
  | "Pinterest"
  | "YouTube"
  | "X";

export type AdGoal =
  | "Sales"
  | "Leads"
  | "Brand Awareness"
  | "Traffic"
  | "Appointments"
  | "Phone Calls"
  | "Engagement";

export type ImageStyle =
  | "Photo"
  | "Illustration"
  | "3D"
  | "Luxury"
  | "Minimal"
  | "Corporate"
  | "Modern"
  | "Lifestyle"
  | "Cinematic"
  | "Hyper Realistic"
  | "Flat Design";

export type AspectRatio =
  | "1:1"
  | "4:5"
  | "9:16"
  | "16:9"
  | "1080x1080"
  | "1080x1350"
  | "1920x1080";

export type ExportFormat = "PNG" | "JPG" | "PDF" | "SVG" | "Canva" | "ZIP" | "Social Media Package";

export type VariationCount = 1 | 2 | 4 | 8;

/** A client workspace. Everything else is scoped by `clientId`. */
export type AdClient = {
  id: string;
  organizationId: string;
  name: string;
  industry: string;
  favorite: boolean;
  createdAt: string;
};

/** Brand kit — automatically injected into every generated prompt. */
export type BrandKit = {
  clientId: string;
  businessName: string;
  logoUrl: string;
  colors: string[];
  typography: string;
  brandVoice: string;
  website: string;
  socialLinks: string;
  industry: string;
  targetAudience: string;
  preferredImageStyle: ImageStyle;
  ctaPreference: string;
  products: string;
  services: string;
  offers: string;
};

/** A reusable prompt — either from the preset library or user-authored. */
export type AdPrompt = {
  id: string;
  clientId: string | null; // null = shared across all clients
  name: string;
  category: string;
  description: string;
  promptText: string;
  style: ImageStyle;
  cameraAngle: string;
  lighting: string;
  mood: string;
  colorPalette: string;
  negativePrompt: string;
  platform: Platform;
  aspectRatio: AspectRatio;
  brandVoice: string;
  cta: string;
  variables: string[];
  favorite: boolean;
  preset: boolean;
  createdAt: string;
};

/** A generated image and where it came from. */
export type GeneratedImage = {
  id: string;
  url: string; // remote URL or data URL
  provider: string;
  providerLabel: string;
  prompt: string;
  aspectRatio: AspectRatio;
  style: ImageStyle;
  favorite: boolean;
  createdAt: string;
};

/** Ad copy generated for a project. */
export type AdCopy = {
  primaryText: string;
  headline: string;
  description: string;
  cta: string;
  hashtags: string[];
  keywords: string[];
  seoTitle: string;
  metaDescription: string;
};

/** A saved project = one run of the wizard, stored in history. */
export type AdProject = {
  id: string;
  clientId: string;
  name: string;
  platform: Platform;
  goal: AdGoal;
  prompt: string;
  style: ImageStyle;
  aspectRatio: AspectRatio;
  images: GeneratedImage[];
  copy: AdCopy | null;
  campaignId: string | null;
  favorite: boolean;
  createdAt: string;
};

/** Grouping of assets into a campaign. */
export type AdCampaign = {
  id: string;
  clientId: string;
  name: string;
  platform: Platform;
  goal: AdGoal;
  audience: string;
  headlines: string[];
  descriptions: string[];
  cta: string;
  launchDate: string;
  projectIds: string[];
  favorite: boolean;
  createdAt: string;
};

/** Export history entry. */
export type AdExport = {
  id: string;
  clientId: string;
  projectId: string | null;
  format: ExportFormat;
  label: string;
  createdAt: string;
};

/** Design template metadata (editable design starting points). */
export type AdTemplate = {
  id: string;
  clientId: string | null;
  name: string;
  category: string;
  aspectRatio: AspectRatio;
  platform: Platform;
  previewGradient: [string, string];
  favorite: boolean;
  preset: boolean;
  createdAt: string;
};

/** The full per-organization workspace persisted locally. */
export type AdMakerState = {
  clients: AdClient[];
  brandKits: Record<string, BrandKit>; // keyed by clientId
  prompts: AdPrompt[];
  projects: AdProject[];
  campaigns: AdCampaign[];
  exports: AdExport[];
  templates: AdTemplate[];
  activeClientId: string | null;
};

/** Prompt-assistant enhancement modes. */
export type OptimizeMode =
  | "improve"
  | "professional"
  | "conversions"
  | "realistic"
  | "luxury"
  | "modern"
  | "cinematic"
  | "hyper-realistic"
  | "product-photography"
  | "social-media";
