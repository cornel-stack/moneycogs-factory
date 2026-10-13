/**
 * Brand layer — the ONLY place brand identity lives.
 *
 * The production system is SHARED across brands: the cast, wardrobe,
 * SCENE_PALETTE, stages, the drawing hand, fonts, layout. This file controls
 * only the brand-identity surface: board tint, accent inks, highlight/marker,
 * caption treatment, chips, end-card chrome, and the CTA copy.
 *
 * `flame` in the shared system (remotion/src/theme.ts) is substituted by each
 * brand's `accent` wherever it appears, so the single emphasis color is
 * brand-controlled from here.
 *
 * Flipping `prelaunch` here changes every CTA across every output in one place.
 */

export type BrandId = "moneycogs";

export interface CaptionTreatment {
  /** Wash color painted behind the current spoken word in burned-in captions. */
  wash: string;
  /** Wash opacity (0–1). */
  washOpacity: number;
  /** Tick drawn at the caption line's left edge (the sentence-sync motif). */
  tick: string;
}

export interface Chip {
  bg: string;
  text: string;
}

export interface Brand {
  id: BrandId;
  name: string;
  wordmark: string;
  domain: string;
  prelaunch: boolean;

  /** Long-form runtime policy (per-brand; read by the build_manifest guard). */
  min_minutes: number;
  default_target_minutes: number;

  // --- palette (substitutes into the shared system) ---
  /** Scene background tint (replaces the shared paper for this brand). */
  paper: string;
  /** On-paper accent: titles' emphasis, underlines, circles, number badges, chart focal. */
  accent: string;
  /** Accent ON characters (ink bodies). Where a deep accent would vanish on ink. */
  accentOnInk: string;
  /** Accent carrying WHITE text (e.g. an end-card CTA chip) — dark enough for contrast. */
  accentInk: string;
  /** Marker swipes / chart accent highlight. */
  highlight: string;
  /** Alert / "the catch" color — fine print, fees, traps (optional). */
  danger?: string;
  /** Ground lines / card rules in this brand's scenes (optional; defaults to shared ink-soft). */
  divider?: string;

  // --- burned-in caption treatment (shorts) ---
  caption: CaptionTreatment;

  // --- chrome / end-card ---
  chrome: {
    bg: string;
    text: string;
    /** CTA chip on the end-card. */
    chip: Chip;
  };
  /** Takeaway chip style used in scenes. */
  chip: Chip;
  /** The ONLY gradient allowed anywhere (end-card hero only). */
  gradient?: { from: string; to: string; angleDeg: number };

  // --- CTA copy (prelaunch flag selects which is live) ---
  cta_prelaunch: string;
  cta_live: string;
  /** Optional legal/ethical line, shown on end-cards + in descriptions if set. */
  disclaimer?: string;
}

export const BRANDS: Record<BrandId, Brand> = {
  moneycogs: {
    id: "moneycogs",
    name: "MoneyCogs",
    wordmark: "MoneyCogs",
    domain: "moneycogs.com",
    prelaunch: true,
    min_minutes: 12,
    default_target_minutes: 14,

    paper: "#FBFAF6", // MoneyCogs Board — the warm off-white whiteboard
    accent: "#0E7B4F", // Cog Green — THE emphasis: underlines, badges, chart focal
    accentOnInk: "#F5B700", // Coin Gold — the accent that still reads on ink bodies
    accentInk: "#0E7B4F", // Cog Green carrying WHITE text (chips, end-card CTA)
    highlight: "#F5B700", // Coin Gold — marker swipes, chart accent highlight
    danger: "#D64545", // Alert Red — fees, fine print, the catch

    caption: {
      wash: "#FBE39A", // soft gold wash behind the current word
      washOpacity: 0.4,
      tick: "#0E7B4F", // 2px cog-green tick at the caption line's left edge
    },

    chrome: {
      bg: "#1C1C1C", // ink end-card
      text: "#FBFAF6",
      chip: { bg: "#0E7B4F", text: "#FFFFFF" }, // cog-green chip, white text
    },
    chip: { bg: "#FBE39A", text: "#1C1C1C" }, // light-gold takeaway chip, ink text
    gradient: { from: "#0E7B4F", to: "#F5B700", angleDeg: 35 }, // green→gold hero

    cta_prelaunch: "New money machine, drawn daily — subscribe.",
    cta_live: "New money machine, drawn daily — subscribe.",
    disclaimer: "Educational content, not financial advice.",
  },
};

export const DEFAULT_BRAND: BrandId = "moneycogs";

export function getBrand(id: BrandId | undefined | null): Brand {
  return BRANDS[id ?? DEFAULT_BRAND] ?? BRANDS[DEFAULT_BRAND];
}

/** The CTA that is live right now, given the brand's prelaunch flag. */
export function activeCta(brand: Brand): string {
  return brand.prelaunch ? brand.cta_prelaunch : brand.cta_live;
}

/** Long-form runtime floor for a brand (minutes). */
export function brandMinMinutes(id: BrandId | undefined | null): number {
  return getBrand(id).min_minutes;
}
