import type { FillRegion, Shape, Stroke } from "./types";
import { SCENE_PALETTE as P, SCENE_TINT as T } from "../theme";

/**
 * Hand-drawable prop + metaphor library. Each prop is ordered OUTLINE strokes
 * (drawn by the hand) plus optional colored FILL regions (flat marker fills
 * revealed behind the outline — the same two-step the cast uses). Line weight
 * stays cast-consistent; fills use the muted SCENE_PALETTE. flame is reserved
 * for the one emphasis element per prop (a summit flag, a bullseye, a done-mark).
 */

const rect = (x: number, y: number, w: number, h: number): Stroke =>
  `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
const line = (x1: number, y1: number, x2: number, y2: number): Stroke => `M ${x1} ${y1} L ${x2} ${y2}`;
const circle = (cx: number, cy: number, r: number): Stroke =>
  `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const poly = (...pts: number[]): Stroke => {
  let s = `M ${pts[0]} ${pts[1]}`;
  for (let i = 2; i < pts.length; i += 2) s += ` L ${pts[i]} ${pts[i + 1]}`;
  return s + " Z";
};
const F = (d: string, color: string, opacity?: number): FillRegion => ({ d, color, opacity });
const FLAME = "#E8501E";

// ---------- MoneyCogs money palette (Phase 1B) ----------
// Ink is for OUTLINES and small darks only; every shape below gets an explicit
// fill color — never default a fill to ink (the 1A cast bug).
const GOLD = "#F5B700"; // coin gold
const GOLD_L = "#FFD24D"; // lit gold highlight
const GOLD_D = "#C98A00"; // gold shade
const GREEN = "#0E7B4F"; // cog green
const GREEN_L = "#5FAE86"; // banknote face
const GREEN_SCR = "#14A06A"; // lit display green
const RED = "#D64545"; // danger red
const BOARD = "#FBFAF6"; // board paper
const GREY = "#B8B8B8"; // light metal
const GREY_D = "#8A8A8A"; // mid metal
const GREY_DD = "#5E5E5E"; // dark metal / opening
const BROWN = "#8A5A2B"; // leather / wood
const BROWN_D = "#5C3A21"; // dark leather
const CREAM = "#EFE7D2"; // paper / cream tag
const CREAM_D = "#E0D6BC"; // cream shade (scroll roll)
const PINK = "#E8A0B4"; // piggy bank
const PINK_D = "#E68AA0"; // piggy snout
const WHITE = "#FFFFFF";
const INKFILL = "#1C1C1C"; // explicit dark fill for pips / slots / small darks

/** A "$" glyph centered at (cx,cy); `s` scales it (~15 units tall at s=1). */
const dollarSign = (cx: number, cy: number, s: number): Stroke =>
  `M ${cx + 7 * s} ${cy - 9 * s} C ${cx - 7 * s} ${cy - 13 * s} ${cx - 9 * s} ${cy - 2 * s} ${cx} ${cy} ` +
  `C ${cx + 9 * s} ${cy + 2 * s} ${cx + 7 * s} ${cy + 13 * s} ${cx - 7 * s} ${cy + 9 * s} ` +
  `M ${cx} ${cy - 15 * s} L ${cx} ${cy + 15 * s}`;

export type PropKind =
  // originals
  | "door" | "desk" | "easel" | "lightbulb" | "moneybag" | "book" | "arrow" | "speech" | "house" | "bridge"
  // metaphors (Phase 7)
  | "mountain" | "path" | "staircase" | "scale" | "hourglass" | "clock" | "calendar" | "trophy" | "target"
  | "seedling" | "sapling" | "tree" | "brain" | "heart" | "gears" | "ladder" | "wall" | "gift" | "phone"
  | "bed" | "dumbbell" | "shoe" | "coffee" | "snowball"
  // money / data graphics (Phase 16)
  | "coins" | "dollar" | "bargraph" | "piechart" | "trendup" | "percent"
  // habit-specific illustrations (Phase 17)
  | "dominoes" | "checkmark" | "brick"
  // money props (Phase 1B)
  | "coin" | "coin-stack" | "bill" | "cash-stack" | "money-bag" | "wallet" | "piggy-bank" | "safe" | "vault" | "atm"
  | "credit-card" | "receipt" | "invoice" | "contract-scroll" | "calculator" | "percent-tag" | "price-tag" | "interest-clock"
  | "balance-scale" | "funnel" | "gauge-meter" | "shopping-cart" | "trap" | "dice" | "slot-machine";

// ---------- originals (now with colored fills) ----------
const door = (open: boolean): Shape =>
  open
    ? {
        viewBox: { w: 120, h: 170 },
        strokes: [rect(10, 8, 46, 158), `M 56 8 L 110 30 L 110 150 L 56 166`, circle(48, 92, 3.5)],
        fills: [F(rect(10, 8, 46, 158), P.sand), F(poly(56, 8, 110, 30, 110, 150, 56, 166), T.sand)],
      }
    : {
        viewBox: { w: 90, h: 170 },
        strokes: [rect(10, 8, 70, 158), rect(22, 26, 46, 124), circle(64, 92, 3.5)],
        fills: [F(rect(10, 8, 70, 158), P.sand), F(rect(22, 26, 46, 124), T.sand)],
      };

const desk = (): Shape => ({
  viewBox: { w: 160, h: 90 },
  strokes: [rect(10, 28, 140, 12), line(26, 40, 26, 86), line(134, 40, 134, 86)],
  fills: [F(rect(10, 28, 140, 12), P.sand)],
});

const easel = (): Shape => ({
  viewBox: { w: 160, h: 200 },
  strokes: [rect(30, 10, 110, 110), line(52, 120, 30, 192), line(118, 120, 140, 192), line(44, 162, 126, 162),
    line(52, 104, 52, 72), line(76, 104, 76, 48), line(100, 104, 100, 84), line(124, 104, 124, 38)],
  fills: [F(rect(30, 10, 110, 110), T.sky)],
});

const lightbulb = (on: boolean): Shape => ({
  viewBox: { w: 100, h: 150 },
  strokes: [circle(50, 70, 30), rect(40, 100, 20, 18), line(42, 107, 58, 107), line(42, 112, 58, 112),
    `M 44 74 L 50 62 L 56 74`,
    ...(on ? [line(50, 28, 50, 12), line(24, 44, 13, 33), line(76, 44, 87, 33), line(16, 70, 2, 70), line(84, 70, 98, 70)] : [])],
  fills: [F(circle(50, 70, 30), on ? P.sun : T.sun), F(rect(40, 100, 20, 18), P.sand)],
});

const moneybag = (): Shape => ({
  viewBox: { w: 120, h: 140 },
  strokes: [`M 34 54 C 18 92 30 132 60 132 C 90 132 102 92 86 54 Z`, `M 42 54 L 78 54`, `M 48 54 L 44 36 L 76 36 L 72 54`,
    `M 60 72 L 60 112`, `M 70 80 C 58 74 50 86 60 92 C 70 98 62 110 50 104`],
  fills: [F(`M 34 54 C 18 92 30 132 60 132 C 90 132 102 92 86 54 Z`, P.sand), F(`M 48 54 L 44 36 L 76 36 L 72 54 Z`, T.sand)],
});

const book = (): Shape => ({
  viewBox: { w: 140, h: 110 },
  strokes: [rect(20, 15, 100, 80), `M 120 15 L 132 22 L 132 102 L 120 95`, line(40, 40, 100, 40), line(40, 55, 90, 55)],
  fills: [F(rect(20, 15, 100, 80), P.sky), F(`M 120 15 L 132 22 L 132 102 L 120 95 Z`, "#FAF6EE")],
});

const arrow = (variant: string): Shape => {
  if (variant === "down") return { viewBox: { w: 100, h: 100 }, strokes: [line(50, 12, 50, 80), `M 34 60 L 50 84 L 66 60`] };
  if (variant === "curved") return { viewBox: { w: 100, h: 100 }, strokes: [`M 18 82 Q 18 24 76 24`, `M 60 12 L 82 24 L 62 38`] };
  return { viewBox: { w: 100, h: 100 }, strokes: [line(50, 88, 50, 18), `M 34 40 L 50 16 L 66 40`] };
};

const speech = (): Shape => {
  const d = `M 30 15 L 140 15 Q 155 15 155 32 L 155 68 Q 155 85 140 85 L 60 85 L 40 110 L 46 85 L 30 85 Q 15 85 15 68 L 15 32 Q 15 15 30 15 Z`;
  return { viewBox: { w: 170, h: 120 }, strokes: [d], fills: [F(d, T.sky)] };
};

const house = (): Shape => ({
  viewBox: { w: 150, h: 140 },
  strokes: [rect(28, 60, 94, 66), `M 16 64 L 75 20 L 134 64`, `M 62 126 L 62 92 L 88 92 L 88 126`],
  fills: [F(rect(28, 60, 94, 66), T.sand), F(poly(16, 64, 75, 20, 134, 64), P.coral), F(rect(62, 92, 26, 34), P.sand)],
});

const bridge = (): Shape => ({
  viewBox: { w: 190, h: 110 },
  strokes: [line(10, 56, 180, 56), `M 22 56 Q 95 2 168 56`, line(44, 56, 44, 92), line(95, 56, 95, 92), line(146, 56, 146, 92), line(10, 92, 180, 92)],
  fills: [F(`M 10 56 L 180 56 L 180 92 L 10 92 Z`, P.sand)],
});

// ---------- metaphors ----------
const mountain = (): Shape => {
  const m1 = poly(10, 170, 90, 38, 170, 170);
  const m2 = poly(110, 170, 165, 85, 220, 170);
  const cap1 = poly(66, 78, 90, 38, 114, 78, 96, 70, 90, 76, 84, 70);
  return {
    viewBox: { w: 230, h: 185 },
    strokes: [m1, m2, cap1, line(90, 38, 90, 10), `M 90 10 L 124 18 L 90 30`],
    fills: [F(m2, P.sky), F(m1, P.sand), F(cap1, "#FAF6EE"), F(`M 90 10 L 124 18 L 90 30 Z`, FLAME)],
  };
};

const path = (): Shape => {
  const ribbon = `M 55 165 C 30 125 150 120 120 85 C 100 60 180 58 175 18 L 205 24 C 205 70 140 76 150 100 C 158 132 95 135 105 165 Z`;
  return {
    viewBox: { w: 230, h: 175 },
    strokes: [ribbon, `M 92 150 L 100 138`, `M 140 108 L 150 100`, `M 150 60 L 162 56`],
    fills: [F(ribbon, P.sand)],
  };
};

const staircase = (): Shape => {
  const steps = `M 10 150 L 10 118 L 50 118 L 50 90 L 90 90 L 90 62 L 130 62 L 130 34 L 170 34 L 170 150 Z`;
  return { viewBox: { w: 185, h: 160 }, strokes: [steps], fills: [F(steps, P.sand)] };
};

const scale = (): Shape => ({
  viewBox: { w: 180, h: 160 },
  strokes: [line(90, 20, 90, 120), rect(68, 120, 44, 10), line(70, 150, 110, 150), line(78, 130, 90, 150), line(102, 130, 90, 150),
    line(30, 34, 150, 34), line(30, 34, 30, 54), line(150, 34, 150, 54), `M 10 54 Q 30 86 50 54 Z`, `M 130 54 Q 150 86 170 54 Z`, circle(90, 20, 5)],
  fills: [F(`M 10 54 Q 30 86 50 54 Z`, P.sky), F(`M 130 54 Q 150 86 170 54 Z`, P.coral), F(rect(68, 120, 44, 10), P.sand)],
});

const hourglass = (): Shape => {
  const top = poly(22, 18, 92, 18, 57, 86);
  const bot = poly(57, 86, 92, 150, 22, 150);
  return {
    viewBox: { w: 114, h: 168 },
    strokes: [line(14, 12, 100, 12), line(14, 156, 100, 156), top, bot],
    fills: [F(top, T.sand), F(`M 40 120 L 74 120 L 60 98 L 54 98 Z`, P.sand)],
  };
};

const clock = (): Shape => ({
  viewBox: { w: 140, h: 150 },
  strokes: [circle(70, 75, 58), line(70, 75, 70, 34), line(70, 75, 98, 88), line(70, 24, 70, 32), line(70, 118, 70, 126), line(21, 75, 29, 75), line(111, 75, 119, 75), line(70, 10, 62, 2), line(70, 10, 78, 2)],
  fills: [F(circle(70, 75, 58), "#FAF6EE"), F(circle(70, 75, 58) + " " + circle(70, 75, 48), P.sky)],
});

const calendar = (): Shape => ({
  viewBox: { w: 140, h: 150 },
  strokes: [rect(14, 22, 112, 116), rect(14, 22, 112, 26), line(40, 12, 40, 34), line(100, 12, 100, 34),
    line(44, 70, 96, 118), line(96, 70, 44, 118)],
  fills: [F(rect(14, 48, 112, 90), "#FAF6EE"), F(rect(14, 22, 112, 26), P.sky), F(`M 44 70 L 96 118 M 96 70 L 44 118`, FLAME)],
});

const trophy = (): Shape => ({
  viewBox: { w: 130, h: 160 },
  strokes: [`M 34 18 L 96 18 L 92 64 Q 65 92 38 64 Z`, `M 34 30 Q 12 30 16 52 Q 20 66 36 60`, `M 96 30 Q 118 30 114 52 Q 110 66 94 60`,
    line(65, 92, 65, 118), rect(48, 118, 34, 12), rect(40, 130, 50, 14), `M 56 34 L 60 44 L 70 44 L 62 50 L 65 60 L 56 54 L 47 60 L 50 50 L 42 44 L 52 44 Z`],
  fills: [F(`M 34 18 L 96 18 L 92 64 Q 65 92 38 64 Z`, P.sun), F(rect(40, 130, 50, 14), P.sand), F(rect(48, 118, 34, 12), P.sand)],
});

const target = (): Shape => ({
  viewBox: { w: 160, h: 160 },
  strokes: [circle(70, 90, 58), circle(70, 90, 38), circle(70, 90, 16), line(70, 90, 140, 30), `M 120 30 L 140 30 L 140 50`, line(118, 48, 140, 30)],
  fills: [F(circle(70, 90, 58) + " " + circle(70, 90, 38), P.coral), F(circle(70, 90, 38) + " " + circle(70, 90, 16), "#FAF6EE"), F(circle(70, 90, 16), FLAME)],
});

const seedling = (): Shape => ({
  viewBox: { w: 90, h: 110 },
  strokes: [`M 45 100 L 45 56`, `M 45 64 Q 18 60 16 34 Q 44 36 45 62`, `M 45 58 Q 72 54 74 28 Q 46 30 45 56`, `M 20 100 Q 45 90 70 100`],
  fills: [F(`M 45 64 Q 18 60 16 34 Q 44 36 45 62 Z`, P.leaf), F(`M 45 58 Q 72 54 74 28 Q 46 30 45 56 Z`, P.leaf), F(`M 20 100 Q 45 90 70 100 L 70 108 L 20 108 Z`, P.sand)],
});

const sapling = (): Shape => ({
  viewBox: { w: 110, h: 140 },
  strokes: [rect(50, 70, 10, 60), `M 55 78 C 20 74 18 40 55 44`, `M 55 70 C 92 66 94 34 55 40`, circle(55, 40, 24)],
  fills: [F(circle(55, 40, 24), P.leaf), F(rect(50, 70, 10, 60), P.sand)],
});

const tree = (): Shape => ({
  viewBox: { w: 150, h: 175 },
  strokes: [rect(66, 96, 18, 72), `M 75 100 Q 45 104 48 128`, `M 75 100 Q 105 104 102 128`, circle(75, 60, 50)],
  fills: [F(circle(75, 60, 50), P.leaf), F(rect(66, 96, 18, 72), P.sand)],
});

const brain = (): Shape => {
  const d = `M 70 20 Q 40 14 34 40 Q 14 46 22 70 Q 12 92 36 100 Q 44 116 70 108 Q 96 116 104 100 Q 128 92 118 70 Q 126 46 106 40 Q 100 14 70 20 Z`;
  return {
    viewBox: { w: 140, h: 125 },
    strokes: [d, `M 70 22 L 70 108`, `M 46 44 Q 60 52 54 66`, `M 94 44 Q 80 52 86 66`, `M 40 82 Q 56 80 58 92`, `M 100 82 Q 84 80 82 92`],
    fills: [F(d, P.coral)],
  };
};

const heart = (): Shape => {
  const d = `M 65 108 C 10 70 18 22 48 22 C 60 22 65 32 65 40 C 65 32 70 22 82 22 C 112 22 120 70 65 108 Z`;
  return { viewBox: { w: 130, h: 120 }, strokes: [d], fills: [F(d, P.coral)] };
};

const gear = (cx: number, cy: number, r: number): Stroke => {
  let d = "";
  const teeth = 8;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
    const ox = cx + Math.cos(a) * (r + 7), oy = cy + Math.sin(a) * (r + 7);
    const ix = cx + Math.cos(a2) * r, iy = cy + Math.sin(a2) * r;
    d += (i === 0 ? "M" : "L") + ` ${Math.round(ox)} ${Math.round(oy)} L ${Math.round(ix)} ${Math.round(iy)} `;
  }
  return d + "Z";
};
const gears = (): Shape => ({
  viewBox: { w: 180, h: 150 },
  strokes: [gear(58, 66, 34), circle(58, 66, 12), gear(122, 96, 26), circle(122, 96, 9)],
  fills: [F(gear(58, 66, 34), P.sky), F(gear(122, 96, 26), P.sand)],
});

const ladder = (): Shape => ({
  viewBox: { w: 90, h: 180 },
  strokes: [line(22, 10, 30, 170), line(66, 10, 58, 170), line(24, 44, 64, 44), line(26, 80, 62, 80), line(28, 116, 60, 116), line(30, 150, 58, 150)],
  fills: [F(`M 22 10 L 30 170 L 58 170 L 66 10 Z`, T.sand, 0.5)],
});

const wall = (): Shape => {
  const bricks: Stroke[] = [rect(10, 20, 150, 90)];
  for (const y of [20, 50, 80]) bricks.push(line(10, y + 30, 160, y + 30));
  bricks.push(line(55, 20, 55, 50), line(105, 20, 105, 50), line(30, 50, 30, 80), line(80, 50, 80, 80), line(130, 50, 130, 80), line(55, 80, 55, 110), line(105, 80, 105, 110));
  return { viewBox: { w: 170, h: 120 }, strokes: bricks, fills: [F(rect(10, 20, 150, 90), P.coral, 0.85)] };
};

const gift = (): Shape => ({
  viewBox: { w: 130, h: 135 },
  strokes: [rect(18, 48, 94, 78), rect(10, 32, 110, 18), line(65, 32, 65, 126),
    `M 65 32 Q 40 4 30 20 Q 24 34 65 32`, `M 65 32 Q 90 4 100 20 Q 106 34 65 32`],
  fills: [F(rect(18, 48, 94, 78), P.sky), F(rect(10, 32, 110, 18), P.sky), F(`M 65 32 Q 40 4 30 20 Q 24 34 65 32 Z`, FLAME), F(`M 65 32 Q 90 4 100 20 Q 106 34 65 32 Z`, FLAME)],
});

const phone = (): Shape => ({
  viewBox: { w: 80, h: 150 },
  strokes: [`M 12 14 Q 12 6 22 6 L 58 6 Q 68 6 68 14 L 68 136 Q 68 144 58 144 L 22 144 Q 12 144 12 136 Z`, rect(18, 22, 44, 102), circle(40, 134, 4)],
  fills: [F(`M 12 14 Q 12 6 22 6 L 58 6 Q 68 6 68 14 L 68 136 Q 68 144 58 144 L 22 144 Q 12 144 12 136 Z`, P.sky), F(rect(18, 22, 44, 102), T.sky)],
});

const bed = (): Shape => ({
  viewBox: { w: 190, h: 115 },
  strokes: [rect(14, 54, 164, 34), `M 14 54 L 14 30 L 54 30 L 54 54`, line(14, 88, 14, 104), line(178, 88, 178, 104),
    `M 24 54 Q 40 40 60 54`],
  fills: [F(rect(14, 54, 164, 34), T.sky), F(`M 14 54 L 14 30 L 54 30 L 54 54 Z`, P.sand), F(`M 24 54 Q 40 40 60 54 Z`, "#FAF6EE")],
});

const dumbbell = (): Shape => ({
  viewBox: { w: 170, h: 80 },
  strokes: [rect(60, 32, 50, 14), rect(26, 16, 20, 46), rect(10, 24, 16, 30), rect(124, 16, 20, 46), rect(144, 24, 16, 30)],
  fills: [F(rect(26, 16, 20, 46), P.sky), F(rect(10, 24, 16, 30), P.sky), F(rect(124, 16, 20, 46), P.sky), F(rect(144, 24, 16, 30), P.sky), F(rect(60, 32, 50, 14), P.sand)],
});

const shoe = (): Shape => {
  const body = `M 10 70 L 12 44 Q 14 30 30 34 L 44 52 L 92 40 Q 120 36 134 56 Q 146 70 120 72 Z`;
  return {
    viewBox: { w: 150, h: 90 },
    strokes: [body, `M 10 72 L 134 72 L 130 82 L 14 82 Z`, line(44, 52, 48, 68), line(60, 48, 64, 66), line(76, 44, 80, 64)],
    fills: [F(body, P.coral), F(`M 10 72 L 134 72 L 130 82 L 14 82 Z`, P.sand)],
  };
};

const coffee = (): Shape => ({
  viewBox: { w: 120, h: 135 },
  strokes: [`M 24 44 L 30 104 Q 32 116 48 116 L 72 116 Q 88 116 90 104 L 96 44 Z`, line(20, 44, 100, 44),
    `M 96 56 Q 118 56 116 76 Q 114 92 94 90`, line(40, 110, 80, 118), `M 46 30 Q 42 22 48 14`, `M 66 30 Q 62 22 68 14`],
  fills: [F(`M 26 48 L 31 100 Q 33 112 48 112 L 72 112 Q 87 112 89 100 L 94 48 Z`, "#FAF6EE"), F(rect(26, 46, 68, 10), P.sand), F(`M 20 44 L 100 44 L 100 50 L 20 50 Z`, P.sky)],
});

const snowball = (): Shape => ({
  viewBox: { w: 185, h: 135 },
  strokes: [`M 10 44 L 150 118`, circle(124, 82, 40), circle(60, 104, 18), circle(26, 115, 8),
    `M 150 118 L 60 118`, `M 112 118 Q 124 128 136 118`],
  fills: [F(circle(124, 82, 40), "#FAF6EE"), F(circle(60, 104, 18), "#FAF6EE"), F(circle(26, 115, 8), "#FAF6EE"), F(`M 10 44 L 150 118 L 150 126 L 10 52 Z`, T.sky)],
});

// ---------- money / data graphics (Phase 16) ----------
const ell = (cx: number, cy: number, rx: number, ry: number): Stroke =>
  `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;

const coins = (): Shape => {
  const cx = 60, rx = 42, ry = 14;
  const ys = [100, 78, 56, 34];
  return {
    viewBox: { w: 120, h: 120 },
    strokes: [
      ...ys.map((y) => ell(cx, y, rx, ry)),
      line(cx - rx, 34, cx - rx, 100), line(cx + rx, 34, cx + rx, 100),
      `M 66 26 C 54 22 50 34 60 36 C 70 38 66 50 54 46`, line(60, 20, 60, 50),
    ],
    fills: ys.map((y) => F(ell(cx, y, rx, ry), P.sun)),
  };
};

const dollar = (): Shape => ({
  viewBox: { w: 80, h: 120 },
  strokes: [`M 58 26 C 30 16 16 42 40 52 C 66 62 52 90 24 80`, line(40, 10, 40, 96)],
});

const bargraph = (): Shape => ({
  viewBox: { w: 140, h: 120 },
  strokes: [line(20, 10, 20, 100), line(20, 100, 132, 100), rect(32, 60, 26, 40), rect(68, 36, 26, 64), rect(104, 20, 26, 80)],
  fills: [F(rect(32, 60, 26, 40), T.sky), F(rect(68, 36, 26, 64), P.sky), F(rect(104, 20, 26, 80), P.sky)],
});

const piechart = (): Shape => ({
  viewBox: { w: 120, h: 120 },
  strokes: [circle(60, 60, 48), line(60, 60, 60, 12), line(60, 60, 104, 80), line(60, 60, 28, 94)],
  fills: [F(`M 60 60 L 60 12 A 48 48 0 0 1 104 80 Z`, P.coral), F(`M 60 60 L 104 80 A 48 48 0 0 1 28 94 Z`, T.sky)],
});

const trendup = (): Shape => ({
  viewBox: { w: 140, h: 120 },
  strokes: [`M 16 96 L 54 70 L 84 82 L 124 24`, poly(108, 24, 124, 24, 124, 40)],
  fills: [F(`M 16 96 L 54 70 L 84 82 L 124 24 L 124 100 L 16 100 Z`, T.leaf, 0.7)],
});

const percent = (): Shape => ({
  viewBox: { w: 110, h: 110 },
  strokes: [circle(55, 55, 48), line(32, 74, 78, 36), circle(40, 44, 9), circle(70, 66, 9)],
  fills: [F(circle(55, 55, 48), T.sun)],
});

// Chain reaction / habit-stacking: upright tiles with the last one tipping over.
const dominoes = (): Shape => {
  const tiles = [20, 54, 88].map((x) => rect(x, 30, 24, 70));
  const tipping = `M 122 42 L 162 72 L 150 88 L 110 58 Z`;
  return {
    viewBox: { w: 180, h: 120 },
    strokes: [...tiles, line(32, 65, 44, 65), line(66, 65, 78, 65), line(100, 65, 112, 65), tipping],
    fills: [...tiles.map((d) => F(d, T.sky)), F(tipping, P.coral)],
  };
};

// Streak / habit-tracker tick in a rounded box.
const roundRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} h ${w - 2 * r} a ${r} ${r} 0 0 1 ${r} ${r} v ${h - 2 * r} a ${r} ${r} 0 0 1 ${-r} ${r} h ${-(w - 2 * r)} a ${r} ${r} 0 0 1 ${-r} ${-r} v ${-(h - 2 * r)} a ${r} ${r} 0 0 1 ${r} ${-r} Z`;
const checkmark = (): Shape => {
  const box = roundRect(18, 18, 84, 84, 14);
  return {
    viewBox: { w: 120, h: 120 },
    strokes: [box, `M 34 62 L 54 84 L 92 38`],
    fills: [F(box, T.leaf, 0.6)],
  };
};

// Identity "bricks": a small wall, built one brick at a time.
const brick = (): Shape => {
  const bottom = [14, 60, 106].map((x) => rect(x, 74, 44, 30));
  const top = [37, 83].map((x) => rect(x, 42, 44, 30));
  return {
    viewBox: { w: 160, h: 120 },
    strokes: [...bottom, ...top],
    fills: [...bottom.map((d) => F(d, P.sand)), ...top.map((d) => F(d, P.coral, 0.8))],
  };
};

// ---------- MoneyCogs money props (Phase 1B) ----------
const coin = (): Shape => {
  const c = circle(50, 50, 42), inner = circle(50, 50, 33);
  return { viewBox: { w: 100, h: 100 }, strokes: [c, inner, dollarSign(50, 50, 1)], fills: [F(c, GOLD), F(inner, GOLD_L)] };
};

const coinStack = (): Shape => {
  const cx = 60, rx = 40, ry = 13, ys = [100, 80, 60, 40, 20];
  return {
    viewBox: { w: 120, h: 120 },
    strokes: [...ys.map((y) => ell(cx, y, rx, ry)), line(cx - rx, 20, cx - rx, 100), line(cx + rx, 20, cx + rx, 100), dollarSign(cx, 62, 0.9)],
    fills: ys.map((y) => F(ell(cx, y, rx, ry), GOLD)),
  };
};

const bill = (): Shape => {
  const b = rect(8, 18, 144, 60), inner = rect(18, 28, 124, 40), disc = circle(80, 48, 15);
  return {
    viewBox: { w: 160, h: 96 },
    strokes: [b, inner, disc, dollarSign(80, 48, 0.9), circle(26, 34, 5), circle(134, 62, 5)],
    fills: [F(b, GREEN_L), F(disc, BOARD)],
  };
};

const cashStack = (): Shape => {
  const n1 = rect(10, 70, 150, 28), n2 = rect(16, 48, 150, 28), n3 = rect(22, 26, 150, 28), band = rect(74, 20, 34, 86);
  return {
    viewBox: { w: 180, h: 110 },
    strokes: [n1, n2, n3, band, line(30, 40, 90, 40)],
    fills: [F(n1, GREEN_L), F(n2, GREEN_L), F(n3, GREEN_L), F(band, GOLD)],
  };
};

const moneyBag = (): Shape => {
  const body = `M 34 54 C 18 92 30 132 60 132 C 90 132 102 92 86 54 Z`, tie = `M 48 54 L 44 36 L 76 36 L 72 54 Z`;
  return {
    viewBox: { w: 120, h: 140 },
    strokes: [body, `M 42 54 L 78 54`, tie, dollarSign(60, 92, 1.1)],
    fills: [F(body, BROWN), F(tie, BROWN_D)],
  };
};

const wallet = (): Shape => {
  const body = rect(14, 40, 132, 70), flap = `M 14 40 L 146 40 L 146 58 Q 120 50 92 58 L 14 58 Z`, billEdge = rect(96, 30, 40, 24), snap = circle(130, 74, 6);
  return {
    viewBox: { w: 160, h: 120 },
    strokes: [billEdge, body, flap, snap, line(14, 78, 146, 78)],
    fills: [F(billEdge, GREEN_L), F(body, BROWN), F(flap, BROWN_D), F(snap, GOLD)],
  };
};

const piggyBank = (): Shape => {
  const body = ell(80, 70, 54, 40), ear = poly(104, 38, 120, 24, 122, 46), snout = ell(128, 70, 14, 12);
  const leg1 = rect(54, 100, 14, 18), leg2 = rect(96, 100, 14, 18), slot = rect(70, 32, 22, 5), coinB = circle(81, 20, 10), eye = circle(100, 60, 4);
  return {
    viewBox: { w: 170, h: 130 },
    strokes: [leg1, leg2, body, ear, snout, slot, circle(128, 70, 2.5), eye, `M 30 72 Q 22 78 28 86`, coinB, dollarSign(81, 20, 0.5)],
    fills: [F(body, PINK), F(ear, PINK), F(snout, PINK_D), F(leg1, PINK), F(leg2, PINK), F(slot, INKFILL), F(eye, INKFILL), F(coinB, GOLD)],
  };
};

const safe = (): Shape => {
  const body = rect(16, 16, 110, 110), door = rect(28, 28, 86, 86), dial = circle(78, 70, 18), hub = circle(78, 70, 6);
  return {
    viewBox: { w: 142, h: 142 },
    strokes: [body, door, dial, hub, line(78, 52, 78, 46), line(78, 88, 78, 94), line(60, 70, 54, 70), line(96, 70, 118, 70), rect(26, 116, 14, 20), rect(102, 116, 14, 20)],
    fills: [F(body, GREY_D), F(door, GREY), F(dial, GOLD), F(hub, GOLD_D)],
  };
};

const vault = (): Shape => {
  const wall = rect(10, 10, 130, 130), door = circle(75, 75, 54), innerRing = circle(75, 75, 44), hub = circle(75, 75, 12);
  const spokes = `M 75 75 L 75 29 M 75 75 L 121 75 M 75 75 L 75 121 M 75 75 L 29 75 M 75 75 L 108 42 M 75 75 L 108 108 M 75 75 L 42 108 M 75 75 L 42 42`;
  return {
    viewBox: { w: 150, h: 150 },
    strokes: [wall, door, innerRing, hub, spokes, `M 120 75 L 140 75`],
    fills: [F(wall, GREY_D), F(door, GOLD), F(innerRing, GOLD_L), F(hub, GREY_D)],
  };
};

const atm = (): Shape => {
  const body = rect(14, 10, 92, 150), screen = rect(26, 26, 68, 42), slot = rect(30, 80, 60, 8), keypad = rect(34, 96, 52, 34), tray = rect(26, 140, 64, 12);
  return {
    viewBox: { w: 120, h: 170 },
    strokes: [body, screen, slot, keypad, tray,
      line(46, 96, 46, 130), line(58, 96, 58, 130), line(70, 96, 70, 130), line(34, 107, 86, 107), line(34, 118, 86, 118),
      line(34, 44, 60, 44), line(34, 54, 54, 54)],
    fills: [F(body, GREY), F(screen, GREEN_SCR), F(slot, INKFILL), F(keypad, GREY_D), F(tray, INKFILL)],
  };
};

const creditCard = (): Shape => {
  const card = roundRect(10, 12, 154, 96, 12), chip = roundRect(30, 40, 32, 26, 5);
  return {
    viewBox: { w: 174, h: 120 },
    strokes: [card, chip, line(34, 52, 58, 52), line(46, 40, 46, 66), line(30, 86, 70, 86), line(80, 86, 120, 86), line(130, 86, 160, 86)],
    fills: [F(card, GREEN), F(chip, GOLD)],
  };
};

const receipt = (): Shape => {
  const paper = `M 20 18 L 100 18 L 100 140 L 92 148 L 84 140 L 76 148 L 68 140 L 60 148 L 52 140 L 44 148 L 36 140 L 28 148 L 20 140 Z`;
  const lines = [40, 56, 72, 88, 104, 120].map((y) => `M 30 ${y} Q 45 ${y - 4} 60 ${y} Q 75 ${y + 4} 90 ${y}`);
  return { viewBox: { w: 120, h: 160 }, strokes: [paper, ...lines], fills: [F(paper, CREAM)] };
};

const invoice = (): Shape => {
  const paper = rect(16, 14, 108, 140);
  const lines = [40, 56, 72, 100, 116].map((y) => line(30, y, 110, y));
  const stamp = `M 36 92 L 104 80 L 110 112 L 42 124 Z`;
  return {
    viewBox: { w: 140, h: 170 },
    strokes: [paper, ...lines, stamp, line(50, 99, 92, 92), line(52, 107, 96, 100), line(54, 115, 88, 109)],
    fills: [F(paper, CREAM), F(stamp, RED, 0.55)],
  };
};

const contractScroll = (): Shape => {
  const body = rect(24, 26, 92, 128), rollTop = ell(70, 26, 52, 10), rollBot = ell(70, 154, 52, 10);
  const lines: Stroke[] = [];
  let y = 46;
  const spans = [80, 78, 74, 70, 64, 58, 52, 46, 40, 34];
  for (let i = 0; i < spans.length; i++) { const w = spans[i]!; lines.push(line(70 - w / 2, y, 70 + w / 2, y)); y += 11 - i * 0.4; }
  return { viewBox: { w: 140, h: 180 }, strokes: [body, rollTop, rollBot, ...lines], fills: [F(body, CREAM), F(rollTop, CREAM_D), F(rollBot, CREAM_D)] };
};

const calculator = (): Shape => {
  const body = roundRect(14, 10, 96, 150, 10), disp = rect(26, 24, 72, 30);
  const btns: Stroke[] = [], bfills: FillRegion[] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const x = 28 + c * 24, by = 66 + r * 22, b = roundRect(x, by, 18, 16, 4); btns.push(b); bfills.push(F(b, GREY_DD)); }
  return { viewBox: { w: 124, h: 170 }, strokes: [body, disp, ...btns], fills: [F(body, GREY), F(disp, GREEN_SCR), ...bfills] };
};

const percentTag = (): Shape => {
  const tag = `M 44 14 L 116 14 L 116 76 L 44 76 L 18 45 Z`, hole = circle(38, 45, 6);
  return {
    viewBox: { w: 130, h: 90 },
    strokes: [tag, hole, line(66, 62, 98, 28), circle(70, 34, 7), circle(94, 56, 7)],
    fills: [F(tag, GOLD), F(hole, BOARD)],
  };
};

const priceTag = (): Shape => {
  const tag = `M 54 20 L 120 20 L 120 92 L 54 92 L 26 56 Z`, hole = circle(44, 56, 6), string = `M 44 56 Q 20 36 14 14`;
  return {
    viewBox: { w: 130, h: 100 },
    strokes: [tag, hole, string, line(64, 64, 104, 64), line(64, 76, 92, 76)],
    fills: [F(tag, CREAM), F(hole, CREAM_D)],
  };
};

const interestClock = (): Shape => {
  const outer = circle(70, 76, 62), face = circle(70, 76, 56), hub = circle(70, 76, 4);
  const ticks: Stroke[] = [];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, x1 = 70 + Math.cos(a) * 50, y1 = 76 + Math.sin(a) * 50, x2 = 70 + Math.cos(a) * 56, y2 = 76 + Math.sin(a) * 56; ticks.push(line(x1, y1, x2, y2)); }
  return {
    viewBox: { w: 140, h: 150 },
    strokes: [outer, face, ...ticks, line(70, 76, 70, 44), line(70, 76, 98, 86), dollarSign(70, 40, 0.5), dollarSign(104, 88, 0.45), hub],
    fills: [F(outer, GOLD), F(face, CREAM), F(hub, INKFILL)],
  };
};

const balanceScale = (): Shape => {
  const panL = `M 8 56 Q 30 92 52 56 Z`, panR = `M 128 56 Q 150 92 172 56 Z`, base = rect(66, 118, 48, 10), foot = poly(72, 150, 108, 150, 98, 128, 82, 128), hub = circle(90, 24, 6);
  return {
    viewBox: { w: 180, h: 160 },
    strokes: [line(90, 24, 90, 118), base, foot, line(28, 40, 152, 40), line(30, 40, 30, 56), line(150, 40, 150, 56), panL, panR, hub],
    fills: [F(panL, GOLD), F(panR, GOLD), F(base, GREY_D), F(foot, GREY_D), F(hub, GOLD)],
  };
};

const funnel = (): Shape => {
  const body = `M 20 40 L 120 40 L 82 100 L 82 140 L 58 140 L 58 100 Z`;
  const c1 = circle(50, 22, 10), c2 = circle(78, 16, 9), c3 = circle(66, 34, 8);
  return {
    viewBox: { w: 140, h: 160 },
    strokes: [body, c1, c2, c3, dollarSign(50, 22, 0.4)],
    fills: [F(body, GREY), F(c1, GOLD), F(c2, GOLD), F(c3, GOLD)],
  };
};

const gaugeMeter = (): Shape => {
  const dial = `M 20 100 A 60 60 0 0 1 140 100 Z`;
  const greenArc = `M 30 100 A 50 50 0 0 1 80 50 L 86 58 A 42 42 0 0 0 38 100 Z`;
  const redArc = `M 80 50 A 50 50 0 0 1 130 100 L 122 100 A 42 42 0 0 0 86 58 Z`;
  const hub = circle(80, 100, 6);
  return {
    viewBox: { w: 160, h: 116 },
    strokes: [dial, `M 30 100 A 50 50 0 0 1 130 100`, line(80, 100, 112, 64), hub],
    fills: [F(dial, CREAM), F(greenArc, GREEN), F(redArc, RED), F(hub, INKFILL)],
  };
};

const shoppingCart = (): Shape => {
  const basket = `M 40 36 L 150 36 L 134 92 L 56 92 Z`, handle = `M 10 20 L 32 20 L 40 36`, w1 = circle(66, 122, 10), w2 = circle(128, 122, 10);
  return {
    viewBox: { w: 170, h: 140 },
    strokes: [handle, basket, line(60, 52, 130, 52), line(66, 72, 124, 72), line(72, 36, 80, 92), line(96, 36, 100, 92), line(120, 36, 116, 92), `M 56 92 L 48 110`, `M 134 92 L 142 110`, w1, w2],
    fills: [F(basket, GREY), F(w1, GREY_D), F(w2, GREY_D)],
  };
};

const trap = (): Shape => {
  const base = roundRect(14, 54, 132, 48, 8), spring = circle(30, 78, 9), coinB = circle(104, 64, 13);
  return {
    viewBox: { w: 160, h: 112 },
    strokes: [base, `M 30 78 L 30 30 L 120 30`, spring, coinB, dollarSign(104, 64, 0.55), line(30, 78, 48, 64)],
    fills: [F(base, BROWN), F(spring, GREY_D), F(coinB, GOLD)],
  };
};

const dice = (): Shape => {
  const d1 = roundRect(18, 28, 72, 72, 12), d2 = roundRect(78, 52, 64, 64, 11);
  const pips1 = [[38, 48], [70, 48], [54, 64], [38, 80], [70, 80]].map(([x, y]) => circle(x!, y!, 5));
  const pips2 = [[96, 70], [124, 70], [96, 98], [124, 98]].map(([x, y]) => circle(x!, y!, 4.5));
  return {
    viewBox: { w: 156, h: 120 },
    strokes: [d1, d2, ...pips1, ...pips2],
    fills: [F(d1, WHITE), F(d2, "#F0F0F0"), ...pips1.map((p) => F(p, INKFILL)), ...pips2.map((p) => F(p, INKFILL))],
  };
};

const slotMachine = (): Shape => {
  const body = roundRect(20, 20, 108, 150, 12), screen = rect(34, 40, 80, 40), tray = rect(34, 120, 80, 20), knob = circle(150, 44, 8);
  const reels = [rect(36, 42, 24, 36), rect(62, 42, 24, 36), rect(88, 42, 24, 36)];
  const coins = [circle(50, 150, 6), circle(74, 150, 6), circle(98, 150, 6)];
  return {
    viewBox: { w: 170, h: 180 },
    strokes: [body, screen, ...reels, line(74, 52, 82, 52), tray, `M 128 60 L 148 48`, knob, `M 128 60 L 128 90`, ...coins],
    fills: [F(body, RED), F(screen, CREAM), ...reels.map((r) => F(r, BOARD)), F(tray, GREY_DD), F(knob, GOLD), ...coins.map((c) => F(c, GOLD))],
  };
};

const PROPS: Record<PropKind, (o?: { variant?: string; state?: string }) => Shape> = {
  door: (o) => door(o?.variant === "open" || o?.state === "open"),
  desk, easel,
  lightbulb: (o) => lightbulb(o?.state === "on"),
  moneybag, book,
  arrow: (o) => arrow(o?.variant ?? "up"),
  speech, house, bridge,
  mountain, path, staircase, scale, hourglass, clock, calendar, trophy, target,
  seedling, sapling, tree, brain, heart, gears, ladder, wall, gift, phone, bed, dumbbell, shoe, coffee, snowball,
  coins, dollar, bargraph, piechart, trendup, percent,
  dominoes, checkmark, brick,
  // money props (Phase 1B)
  coin,
  "coin-stack": coinStack,
  bill,
  "cash-stack": cashStack,
  "money-bag": moneyBag,
  wallet,
  "piggy-bank": piggyBank,
  safe,
  vault,
  atm,
  "credit-card": creditCard,
  receipt,
  invoice,
  "contract-scroll": contractScroll,
  calculator,
  "percent-tag": percentTag,
  "price-tag": priceTag,
  "interest-clock": interestClock,
  "balance-scale": balanceScale,
  funnel,
  "gauge-meter": gaugeMeter,
  "shopping-cart": shoppingCart,
  trap,
  dice,
  "slot-machine": slotMachine,
};

/** Resolve a prop kind (+ optional variant/state) to its drawable shape. */
export function propShape(kind: PropKind, opts?: { variant?: string; state?: string }): Shape {
  return PROPS[kind](opts);
}
