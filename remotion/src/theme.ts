/**
 * Single source of truth for all visual / timing constants.
 * Nothing in the pipeline or scenes should hardcode these values.
 */
import { FONT_FAMILY } from "./fonts";

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

/**
 * Vertical format for shorts (TikTok / Reels / YouTube Shorts). 9:16 @ 30fps.
 * The SAFE zone keeps all content clear of platform UI chrome (top clock/handle,
 * bottom caption/CTA rail, side action buttons).
 */
export const VIDEO_VERTICAL = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

export const SHORT_SAFE = {
  top: 220, // platform header / clock
  bottom: 320, // caption rail + CTA
  side: 60, // action buttons
} as const;

/**
 * Shorts optimization (Phase 14). Shorts rank on view-duration-relative-to-length
 * + loops, NOT CTR — so a LONG brand end-card bleeds the %-watched + loop metric.
 * The end-card is capped to ~1s; the CTA moves to the platform captions + the
 * pinned comment; a small persistent wordmark watermark carries the brand through
 * the body instead. Edit SHORTS_ENDCARD_SECONDS to tune the cap.
 */
export const SHORTS_ENDCARD_SECONDS = 1.0;
/** Target length band for shorts (seconds). Lint warns beyond `warn`. */
export const SHORTS_DURATION = { min: 35, max: 50, warn: 55 } as const;

/**
 * Silent padding (in frames) appended after each scene's narration so that
 * one scene's audio doesn't bump straight into the next.
 */
export const SCENE_PADDING_FRAMES = 12; // 0.4s at 30fps

/**
 * MEASURED channel pacing constant (Phase 11). Words of narration per minute of
 * FINAL rendered video — i.e. including scene padding + draw-ins, not raw speech.
 * Derived empirically from the atomic-habits Phase-10 render: 1,212 narration
 * words ÷ 8.352 min = 145.1. Use it to size a script to a target length:
 *   target_words ≈ WORDS_PER_FINAL_MINUTE × target_minutes
 * Longer videos trend a hair longer per word (more scenes ⇒ more padding), so
 * this is a slight under-estimate at 30+ min — which safely favors the 30.0 floor.
 */
export const WORDS_PER_FINAL_MINUTE = 145;

/**
 * Shared color system (MoneyCogs). Per-brand identity lives in config/brands.ts
 * and flows into real scenes via the brand layer (brand.accent / accentOnInk /
 * paper). These shared constants back everything that reads a fixed color —
 * the drawing hand, effects/bursts, ambient doodles, and the dev sheets — and
 * are kept aligned to the MoneyCogs palette so those read on-brand too.
 * Characters use ink fills + a board-tone head area + the accent on exactly one
 * item. marker/slate NEVER appear on characters.
 */
export const COLORS = {
  paper: "#FBFAF6", // MoneyCogs Board — every scene lives on it
  ink: "#1C1C1C", // near-black — all linework, character fills, text
  inkSoft: "#6B6459", // derived warm grey for secondary text
  // Far (receding) limb tint in profile = ink composited over paper,
  // precomputed as mix(ink, paper, 0.35). A clean step lighter so far limbs sit
  // BEHIND the torso — never a desaturated grey.
  inkFar: "#6A6762",
  flame: "#0E7B4F", // THE accent (Cog Green) — emphasis, circles, bursts
  flameSoft: "#A7D8BE", // light tint of the accent, for background bursts only (never on characters)
  marker: "#F5B700", // Coin Gold highlighter swipes behind keywords (sparing)
  slate: "#2F6690", // charts only — second data series
  danger: "#D64545", // Alert Red — fees, fine print, the catch; danger-accent cast
} as const;

/**
 * SCENE ART palette (Phase 7) — 5 muted marker tones for backgrounds, staging,
 * and colored props. They sit calmly on paper #FAF6EE next to ink linework, and
 * are desaturated enough that flame (#E8501E) still pops as THE emphasis color.
 * RULE (see template.md): a scene uses at most 2–3 of these + ink; flame is
 * reserved for the hero/emphasis so it never drowns. NEVER on characters.
 */
export const SCENE_PALETTE = {
  leaf: "#7A9E5E", // muted leaf green — grass, trees, growth, "go"
  sky: "#5E8CA8", // muted sky/slate blue — sky, water, windows, calm (kin to slate)
  sand: "#CBA56B", // warm sand/brown — ground, wood, desks, buildings
  sun: "#F2C94C", // soft sun yellow — light, highlights, warmth (kin to marker)
  coral: "#E0896B", // muted coral — soft accent, roofs, warmth (distinct from flame)
} as const;
export type SceneColor = keyof typeof SCENE_PALETTE;

/**
 * CAST_WARDROBE — a muted top/garment color per MoneyCogs cast member. Each is
 * distinct so roles read apart at a glance; the gold (or danger) accent item
 * stays the brightest thing on the character; hands render skin-tone.
 */
export const CAST_WARDROBE = {
  penny: "#5E8CA8", // everyday sky blue (The Customer)
  ledger: "#2F3A4A", // pinstripe navy (The Banker)
  rosa: "#B06A4F", // terracotta under the apron (The Merchant)
  sterling: "#23262E", // sharp charcoal suit (The CEO)
  vera: "#6E5A8C", // blazer violet (The Investor)
  joe: "#8A5A2B", // work-brown under the hi-vis (The Worker)
  norma: "#40566B", // official steel blue (The Regulator)
  felix: "#3A3A3A", // bureaucrat grey (The Taxman)
  slick: "#8E3B6B", // flashy magenta jacket (The Hustler)
  keys: "#6B7A52", // landlord olive (The Landlord)
} as const;

/** Lighter tints of the palette, for large soft background washes (sky, walls). */
export const SCENE_TINT = {
  leaf: "#C7D7B5",
  sky: "#BBD0DD",
  sand: "#E7D6B8",
  sun: "#FBE5B0",
  coral: "#F2CFC0",
} as const;

/**
 * Chart series colors (Phase 16 — motion graphics). Secondary tones to cycle
 * AFTER the brand accent (which stays the emphasis/first series). Warm, muted,
 * cohesive with SCENE_PALETTE so animated data still reads as hand-drawn-adjacent.
 */
export const CHART_COLORS = ["#2F6690", "#7A9E5E", "#CBA56B", "#5E8CA8", "#E0896B"] as const;

/** Font families (resolved webfonts from fonts.ts). */
export const FONTS = {
  heading: FONT_FAMILY.hand, // Caveat
  label: FONT_FAMILY.hand, // Caveat
  body: FONT_FAMILY.body, // Inter
  display: FONT_FAMILY.display, // Anton — bold thumbnail punch words
} as const;

export const LAYOUT = {
  safeMargin: 120, // px inset from edges for content
  titleSize: 150,
  subtitleSize: 72,
  labelSize: 52,
  bodySize: 48,
  quoteSize: 84,
  attributionSize: 52,
  lineHeight: 1.25,
} as const;

/**
 * Hand-drawing feel. Speed is in SCENE pixels per second so strokes draw at a
 * consistent visual pace regardless of how big an element is scaled.
 */
export const DRAW = {
  speedPxPerSec: 620, // fast sketching — a stick figure draws in ~1.5–2.5s
  minStrokeFrames: 4, // tiny strokes still take a beat
  maxElementFrames: 60, // cap any single element's whole draw at ~2.0s (progressive pacing)
  liftFrames: 5, // hand lifts + hops between strokes of one drawing
  gapFrames: 7, // hand hop between separate elements
  enterFrames: 9, // hand flies in before the first stroke
  exitFrames: 12, // hand flies out after the last stroke
  labelFadeFrames: 10, // label text fades in after its drawing finishes
  // --- travel (between-stroke hops) ---
  travelMult: 4.5, // hop travel speed as a multiple of draw speed (≥4×)
  hopCapSec: 0.25, // HARD cap on one hop's duration
  longHopFrac: 0.6, // a hop wider than this × frame width lifts out / drops in
} as const;

/** Default content grid used to place drawn elements in a scene. */
export const GRID = {
  cols: 12,
  rows: 6,
} as const;

/**
 * Animation timing + feel (cast rig). All data-tunable from here: the motion
 * module builds Easing.bezier curves from EASING_BEZIER control points.
 */
export const EASING_BEZIER = {
  gesture: [0.22, 1, 0.36, 1], // snappy ease-out for small gestures
  locomotion: [0.45, 0, 0.55, 1], // ease-in-out for walk/body
  settle: [0.34, 1.56, 0.64, 1], // ease-out-back: overshoot + settle
  anticipate: [0.66, -0.5, 0.28, 1.5], // ease-in-out-back: anticipation + overshoot
} as const;

export const MOTION = {
  holdFrames: 40, // how long a pose is held before transitioning
  transFrames: 18, // pose transition length
  followLagFrames: 3, // head / free-arm drag behind the body
  armArcPx: 10, // perpendicular bulge so gestures travel on an arc
  walk: {
    bobPx: 3.2, // vertical body bob (weight)
    leanDeg: 4, // forward torso lean
    armSwing: 9, // arm counter-swing amplitude (local units)
    legSwing: 13,
    headLagFrames: 4, // head bob trails the body
    cycleFrames: 26, // one full stride
  },
  idle: {
    breathePx: 1.2,
    swayDeg: 1.1,
    weightShiftPx: 1.6, // occasional lateral weight shift
    headTurnDeg: 6, // occasional small head turn
    microPeriod: 150, // base frames between micro-actions (seed-jittered)
  },
  staggerFrames: 7, // max seeded offset between characters in a scene
} as const;

/** Caption line-grouping rules (used by build_captions.ts). */
export const CAPTIONS = {
  maxWordsPerLine: 7,
  maxCharsPerLine: 42,
} as const;
