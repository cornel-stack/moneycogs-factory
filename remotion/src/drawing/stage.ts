import { SCENE_PALETTE as P, SCENE_TINT as T, VIDEO } from "../theme";

/**
 * Staging layer (Phase 7). A `stage` is a named, data-driven environment —
 * composed flat-vector SVG in SCENE coordinates (1920×1080) with muted
 * SCENE_PALETTE fills. Stages are AMBIENT: they wash in (soft fade, ~0.4s)
 * rather than being hand-drawn, so a scene feels full instantly without
 * spending pen time. Every stage lays a ground/floor so characters stand ON
 * something. flame is NOT used here — it stays reserved for the hero/emphasis.
 */

export type StageName =
  | "plain" | "outdoor" | "room" | "desk-office" | "street" | "stage-spotlight"
  // money stages (Phase 1B)
  | "bank-interior" | "storefront" | "kitchen-table" | "boardroom" | "street-market";

export type StageShape = { d: string; fill?: string; stroke?: string; sw?: number; opacity?: number };

/** Shared horizon: characters placed with feet near the lower third stand on
 *  the floor region that runs from here to the bottom of the frame. */
export const GROUND_Y = 905;
const W = VIDEO.width;
const H = VIDEO.height;
const PAPER = "#FAF6EE";
const INK = "#1C1A17";
const GREEN = "#0E7B4F"; // cog green (muted chart line)
const BOARD = "#FBFAF6"; // chart panel
const GREY_L = "#CDCDCD"; // light vault metal

const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
const circ = (cx: number, cy: number, r: number) => `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const ln = (x1: number, y1: number, x2: number, y2: number) => `M ${x1} ${y1} L ${x2} ${y2}`;
const groundLine: StageShape = { d: `M 0 ${GROUND_Y} L ${W} ${GROUND_Y}`, stroke: INK, sw: 2.5, opacity: 0.28 };

/** A rounded background bush (all one leaf tone), sitting on the ground. */
function tree(x: number, scale: number): StageShape[] {
  const cy = GROUND_Y - 66 * scale;
  return [
    { d: circ(x, cy, 72 * scale), fill: P.leaf, opacity: 0.8 },
    { d: circ(x - 44 * scale, cy + 22 * scale, 46 * scale), fill: P.leaf, opacity: 0.8 },
    { d: circ(x + 44 * scale, cy + 22 * scale, 46 * scale), fill: P.leaf, opacity: 0.8 },
  ];
}

/** A potted plant for interior stages (pot = sand to keep the palette tight). */
function plant(x: number, baseY: number, scale: number): StageShape[] {
  return [
    { d: `M ${x - 26 * scale} ${baseY} L ${x + 26 * scale} ${baseY} L ${x + 20 * scale} ${baseY + 46 * scale} L ${x - 20 * scale} ${baseY + 46 * scale} Z`, fill: P.sand, opacity: 0.95 },
    { d: circ(x, baseY - 36 * scale, 44 * scale), fill: P.leaf, opacity: 0.9 },
    { d: circ(x - 34 * scale, baseY - 14 * scale, 26 * scale), fill: P.leaf, opacity: 0.9 },
    { d: circ(x + 34 * scale, baseY - 14 * scale, 26 * scale), fill: P.leaf, opacity: 0.9 },
  ];
}

/** A window (sky-tinted) with a frame + cross panes, on a back wall. */
function window(x: number, y: number, w: number, h: number): StageShape[] {
  return [
    { d: rect(x, y, w, h), fill: T.sky },
    { d: rect(x, y, w, h), stroke: INK, sw: 4, opacity: 0.6 },
    { d: `M ${x + w / 2} ${y} L ${x + w / 2} ${y + h}`, stroke: INK, sw: 4, opacity: 0.6 },
    { d: `M ${x} ${y + h / 2} L ${x + w} ${y + h / 2}`, stroke: INK, sw: 4, opacity: 0.6 },
  ];
}

/** A striped market/shop awning (alternating coral + paper), with a scalloped
 *  lower edge. Kept pale (low opacity) so it stays a background element. */
function awning(x: number, y: number, w: number, h: number, segW: number): StageShape[] {
  const out: StageShape[] = [];
  let i = 0;
  for (let sx = x; sx < x + w - 1; sx += segW, i++) {
    const sw2 = Math.min(segW, x + w - sx);
    const fill = i % 2 ? PAPER : P.coral;
    out.push({ d: rect(sx, y, sw2, h), fill, opacity: 0.5 });
    out.push({ d: `M ${sx} ${y + h} L ${sx + sw2} ${y + h} L ${sx + sw2 / 2} ${y + h + 16} Z`, fill, opacity: 0.5 });
  }
  out.push({ d: rect(x, y, w, h), stroke: INK, sw: 2.5, opacity: 0.25 });
  return out;
}

/** A small hanging sign (board + two hang-lines + a gold $ or price bars). */
function hangSign(cx: number, topY: number, w: number, h: number): StageShape[] {
  const x = cx - w / 2, y = topY + 22;
  return [
    { d: ln(x + 14, topY, x + 14, y), stroke: INK, sw: 2.5, opacity: 0.4 },
    { d: ln(x + w - 14, topY, x + w - 14, y), stroke: INK, sw: 2.5, opacity: 0.4 },
    { d: rect(x, y, w, h), fill: T.sun, opacity: 0.6 },
    { d: rect(x, y, w, h), stroke: INK, sw: 2.5, opacity: 0.35 },
    { d: ln(cx - 10, y + h / 2, cx + 10, y + h / 2), stroke: INK, sw: 4, opacity: 0.4 },
  ];
}

export function stageShapes(name: StageName): StageShape[] {
  const floor = (fill: string, op: number): StageShape => ({ d: rect(0, GROUND_Y, W, H - GROUND_Y), fill, opacity: op });
  switch (name) {
    case "plain":
      return [floor(P.sand, 0.14), groundLine];

    case "outdoor":
      // palette: sky + leaf only, so a hero metaphor prop (sand path, sand/sky
      // mountain, coral target) adds the one focal 3rd colour (+ flame).
      return [
        { d: rect(0, 0, W, 640), fill: T.sky, opacity: 0.6 }, // sky
        { d: circ(1600, 165, 54), fill: PAPER }, { d: circ(1670, 155, 66), fill: PAPER }, { d: circ(1740, 165, 48), fill: PAPER }, // cloud R
        { d: circ(320, 150, 42), fill: PAPER }, { d: circ(386, 142, 52), fill: PAPER }, { d: circ(262, 142, 36), fill: PAPER }, // cloud L
        { d: `M -60 ${GROUND_Y} Q 420 660 960 ${GROUND_Y} Z`, fill: P.leaf, opacity: 0.4 }, // hill L
        { d: `M 760 ${GROUND_Y} Q 1360 640 1990 ${GROUND_Y} Z`, fill: P.leaf, opacity: 0.55 }, // hill R
        floor(P.leaf, 0.6), // grass
        groundLine,
        ...tree(180, 1.05),
        ...tree(1760, 0.9),
      ];

    case "room":
      return [
        { d: rect(0, 0, W, GROUND_Y), fill: T.sand, opacity: 0.4 }, // wall
        floor(P.sand, 0.5), // wood floor
        { d: `M 0 ${GROUND_Y} L ${W} ${GROUND_Y}`, stroke: INK, sw: 3, opacity: 0.3 },
        ...window(1360, 150, 380, 360),
        ...plant(170, GROUND_Y - 46, 1.1),
      ];

    case "desk-office":
      return [
        { d: rect(0, 0, W, GROUND_Y), fill: T.sky, opacity: 0.32 }, // cool wall
        floor(P.sand, 0.45),
        { d: `M 0 ${GROUND_Y} L ${W} ${GROUND_Y}`, stroke: INK, sw: 3, opacity: 0.3 },
        ...window(1340, 120, 430, 390),
        { d: circ(300, 230, 64), fill: T.sky }, { d: rect(236, 166, 128, 128), stroke: INK, sw: 4, opacity: 0.5 }, // wall clock in a frame
        { d: `M 300 230 L 300 190`, stroke: INK, sw: 4, opacity: 0.6 }, { d: `M 300 230 L 334 244`, stroke: INK, sw: 4, opacity: 0.6 },
        ...plant(1810, GROUND_Y - 46, 1.0),
      ];

    case "street": {
      const b = (x: number, w: number, top: number, fill: string): StageShape[] => {
        const out: StageShape[] = [{ d: rect(x, top, w, GROUND_Y - top), fill, opacity: 0.55 }];
        for (let wy = top + 40; wy < GROUND_Y - 60; wy += 90)
          for (let wx = x + 24; wx < x + w - 40; wx += 80) out.push({ d: rect(wx, wy, 42, 52), fill: T.sun, opacity: 0.8 });
        return out;
      };
      return [
        { d: rect(0, 0, W, GROUND_Y), fill: T.sky, opacity: 0.4 }, // sky
        ...b(40, 300, 360, P.sand),
        ...b(360, 260, 250, P.sky),
        ...b(640, 220, 430, P.sand),
        ...b(1180, 300, 300, P.sky),
        ...b(1500, 260, 330, P.sand),
        floor(P.sand, 0.6), // road
        groundLine,
        { d: `M 0 ${GROUND_Y + 90} L ${W} ${GROUND_Y + 90}`, stroke: PAPER, sw: 6 }, // road line
      ];
    }

    case "stage-spotlight":
      return [
        { d: rect(0, GROUND_Y, W, H - GROUND_Y), fill: P.sand, opacity: 0.4 }, // stage floor
        { d: `M 820 0 L 1100 0 L 1480 ${GROUND_Y} L 440 ${GROUND_Y} Z`, fill: P.sun, opacity: 0.16 }, // light cone
        { d: `M 960 ${GROUND_Y} m -300 0 a 300 60 0 1 0 600 0 a 300 60 0 1 0 -600 0`, fill: P.sun, opacity: 0.28 }, // light pool
        groundLine,
      ];

    // ---------- money stages (Phase 1B) — kept LIGHT/muted so cast + props pop ----------
    case "bank-interior":
      return [
        { d: rect(0, 0, W, GROUND_Y), fill: T.sky, opacity: 0.22 }, // cool back wall
        floor(P.sand, 0.4), groundLine,
        // round vault door on the back wall (left), muted metal + gold dial
        { d: circ(330, 430, 150), fill: GREY_L, opacity: 0.7 },
        { d: circ(330, 430, 150), stroke: INK, sw: 4, opacity: 0.4 },
        { d: circ(330, 430, 112), stroke: INK, sw: 3, opacity: 0.35 },
        { d: circ(330, 430, 30), fill: T.sun, opacity: 0.85 }, { d: circ(330, 430, 30), stroke: INK, sw: 3, opacity: 0.4 },
        { d: `M 330 400 L 330 460 M 300 430 L 360 430 M 309 409 L 351 451 M 351 409 L 309 451`, stroke: INK, sw: 3, opacity: 0.35 }, // spokes
        // teller counter across the back + a glass screen with mullions
        { d: rect(560, 548, 820, 110), fill: T.sky, opacity: 0.18 }, // glass screen
        { d: ln(760, 548, 760, 658), stroke: INK, sw: 2.5, opacity: 0.3 }, { d: ln(1000, 548, 1000, 658), stroke: INK, sw: 2.5, opacity: 0.3 }, { d: ln(1200, 548, 1200, 658), stroke: INK, sw: 2.5, opacity: 0.3 },
        { d: rect(540, 658, 860, 86), fill: P.sand, opacity: 0.6 }, // wood counter
        { d: rect(540, 658, 860, 14), fill: P.sand, opacity: 0.85 }, // counter ledge
        { d: rect(540, 658, 860, 86), stroke: INK, sw: 3, opacity: 0.3 },
        ...hangSign(960, 150, 240, 92),
        ...plant(1800, GROUND_Y - 46, 1.0),
      ];

    case "storefront":
      return [
        { d: rect(0, 0, W, GROUND_Y), fill: T.sand, opacity: 0.3 }, // shop wall
        floor(P.sand, 0.5), groundLine,
        // big shop window with frame + mullions
        ...window(1120, 300, 620, 440),
        // shelf with goods (muted boxes + jars)
        { d: rect(150, 560, 540, 18), fill: P.sand, opacity: 0.8 }, { d: rect(150, 560, 540, 18), stroke: INK, sw: 2.5, opacity: 0.3 },
        { d: rect(190, 496, 70, 64), fill: T.coral, opacity: 0.6 }, { d: rect(280, 486, 60, 74), fill: T.sky, opacity: 0.6 },
        { d: rect(360, 500, 64, 60), fill: T.sun, opacity: 0.7 }, { d: circ(480, 526, 34), fill: T.leaf, opacity: 0.6 },
        { d: rect(540, 492, 60, 68), fill: T.coral, opacity: 0.55 },
        { d: `M 190 496 L 600 496 M 280 486 L 280 560 M 360 500 L 360 560 M 540 492 L 540 560`, stroke: INK, sw: 2, opacity: 0.25 },
        // striped awning across the top
        ...awning(120, 190, 820, 70, 92),
        ...hangSign(1430, 190, 220, 86),
      ];

    case "kitchen-table":
      return [
        { d: rect(0, 0, W, GROUND_Y), fill: T.coral, opacity: 0.24 }, // warm wall
        floor(P.sand, 0.35),
        // window with curtains
        ...window(720, 150, 440, 320),
        { d: rect(690, 140, 70, 350), fill: P.coral, opacity: 0.45 }, { d: rect(1120, 140, 70, 350), fill: P.coral, opacity: 0.45 }, // curtains
        { d: `M 690 140 Q 724 230 690 340`, stroke: INK, sw: 2.5, opacity: 0.25 }, { d: `M 1190 140 Q 1156 230 1190 340`, stroke: INK, sw: 2.5, opacity: 0.25 },
        // table surface across the lower foreground (wood)
        { d: rect(0, 842, W, H - 842), fill: P.sand, opacity: 0.8 },
        { d: ln(0, 842, W, 842), stroke: INK, sw: 3, opacity: 0.35 },
        // a mug on the table
        { d: `M 1480 772 L 1486 822 Q 1488 834 1502 834 L 1524 834 Q 1538 834 1540 822 L 1546 772 Z`, fill: T.sky, opacity: 0.8 },
        { d: `M 1546 782 Q 1568 782 1566 800 Q 1564 816 1546 814`, stroke: INK, sw: 3, opacity: 0.4 },
        { d: `M 1480 772 L 1546 772`, stroke: INK, sw: 3, opacity: 0.4 },
        { d: `M 1480 772 L 1486 822 Q 1488 834 1502 834 L 1524 834 Q 1538 834 1540 822 L 1546 772`, stroke: INK, sw: 3, opacity: 0.4 },
      ];

    case "boardroom":
      return [
        { d: rect(0, 0, W, GROUND_Y), fill: T.sky, opacity: 0.26 }, // cool wall
        floor(P.sand, 0.4), groundLine,
        // tall window (right)
        ...window(1500, 110, 320, 640),
        // framed wall chart (left) with a rising green trend line
        { d: rect(170, 170, 380, 270), fill: BOARD, opacity: 0.9 }, { d: rect(170, 170, 380, 270), stroke: INK, sw: 4, opacity: 0.4 },
        { d: `M 210 400 L 300 340 L 360 360 L 510 220`, stroke: GREEN, sw: 7, opacity: 0.8 },
        { d: `M 210 210 L 210 400 L 510 400`, stroke: INK, sw: 3, opacity: 0.35 },
        // long conference table (foreground, wood)
        { d: `M 360 858 L 1560 858 Q 1660 900 1560 942 L 360 942 Q 260 900 360 858 Z`, fill: P.sand, opacity: 0.75 },
        { d: `M 360 858 L 1560 858 Q 1660 900 1560 942 L 360 942 Q 260 900 360 858 Z`, stroke: INK, sw: 3, opacity: 0.3 },
      ];

    case "street-market": {
      const stall = (x: number): StageShape[] => [
        { d: ln(x, 470, x, 850), stroke: INK, sw: 4, opacity: 0.35 }, // posts
        { d: ln(x + 420, 470, x + 420, 850), stroke: INK, sw: 4, opacity: 0.35 },
        ...awning(x - 10, 410, 440, 66, 88),
        { d: rect(x + 20, 720, 380, 20), fill: P.sand, opacity: 0.75 }, // stall table
        { d: rect(x + 20, 740, 380, 110), fill: T.sand, opacity: 0.4 }, // stall front cloth
        { d: rect(x + 20, 720, 380, 130), stroke: INK, sw: 2.5, opacity: 0.3 },
        ...hangSign(x + 210, 486, 130, 60),
      ];
      return [
        { d: rect(0, 0, W, GROUND_Y), fill: T.sky, opacity: 0.4 }, // sky
        { d: circ(980, 165, 54), fill: PAPER }, { d: circ(1050, 155, 66), fill: PAPER }, { d: circ(1120, 165, 48), fill: PAPER }, // cloud
        floor(P.sand, 0.55), groundLine,
        ...stall(140),
        ...stall(1340),
      ];
    }
  }
}
