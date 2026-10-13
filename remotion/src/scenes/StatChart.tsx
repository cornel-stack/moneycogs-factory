import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CHART_COLORS, COLORS, FONTS, LAYOUT, VIDEO } from "../theme";
import { useBrand } from "../brand";
import { QuietBackdrop } from "../components/QuietBackdrop";
import { DrawingBoard } from "../components/DrawingBoard";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { syncStartFrame } from "../drawing/layout";
import { waterfallBars } from "../drawing/charts";
import type { BoardElement, Shape } from "../drawing/types";
import type { WordTiming } from "../schema";

type Point = { label: string; value: number; sync?: { phrase: string } };
type Mode = "line" | "bars" | "area" | "pie" | "number" | "waterfall" | "counter";

const full = (strokes: string[]): Shape => ({ viewBox: { w: VIDEO.width, h: VIDEO.height }, strokes });

/** SVG arc path for a pie wedge (angles in degrees, 0 = up, clockwise). */
function wedgePath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p = (a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [sx, sy] = p(a0);
  const [ex, ey] = p(a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
}

export const StatChart: React.FC<{
  visual: { label: string; mode: Mode; prefix?: string; suffix?: string; decimals?: number; datapoints: Point[] };
  words: WordTiming[];
}> = ({ visual, words }) => {
  const { fps } = useVideoConfig();
  const brand = useBrand();
  const frame = useCurrentFrame();
  const pts = visual.datapoints;
  const mode: Mode = visual.mode;
  const { prefix, suffix, decimals } = visual;

  const startOf = (i: number) => syncStartFrame(words, pts[i]?.sync, fps, 16 + i * 16);
  const seriesColor = (i: number) => [brand.accent, ...CHART_COLORS][i % (CHART_COLORS.length + 1)]!;

  const titleOpacity = interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const title = (
    <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center", fontFamily: FONTS.heading, fontSize: LAYOUT.subtitleSize, color: COLORS.ink, opacity: titleOpacity }}>
      {visual.label}
    </div>
  );
  const numFont = { fontFamily: FONTS.heading, fontWeight: 700, color: COLORS.ink } as const;

  // ---- mode: NUMBER — one big kinetic figure -----------------------------
  if (mode === "number") {
    const hero = pts.reduce((a, b) => (Math.abs(b.value) > Math.abs(a.value) ? b : a), pts[0]!);
    const start = startOf(pts.indexOf(hero));
    const pop = spring({ frame: frame - start, fps, config: { damping: 12, stiffness: 140, mass: 0.8 } });
    return (
      <AbsoluteFill style={{ backgroundColor: brand.paper }}>
        <QuietBackdrop />
        {title}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...numFont, fontSize: 320, color: brand.accent, transform: `scale(${Math.max(0.01, Math.min(1.06, pop))})` }}>
            <AnimatedNumber value={hero.value} startFrame={start} prefix={prefix} suffix={suffix} decimals={decimals} />
          </div>
          <div style={{ fontFamily: FONTS.heading, fontSize: 84, color: COLORS.ink, marginTop: 10, opacity: interpolate(frame, [start + 8, start + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            {hero.label}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---- mode: COUNTER — one odometer number counting to a target ----------
  if (mode === "counter") {
    const target = pts[0]!;
    const start = startOf(0);
    const pop = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 150, mass: 0.8 } });
    const digits = String(Math.round(Math.abs(target.value))).replace(/\d/g, "0").length + (prefix?.length ?? 0) + (suffix?.length ?? 0) + 2;
    return (
      <AbsoluteFill style={{ backgroundColor: brand.paper }}>
        <QuietBackdrop />
        {title}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              ...numFont,
              fontSize: 260,
              color: COLORS.marker,
              background: COLORS.ink,
              borderRadius: 28,
              padding: "20px 56px",
              letterSpacing: 8,
              minWidth: digits * 120,
              textAlign: "center",
              transform: `scale(${Math.max(0.01, Math.min(1.06, pop))})`,
              boxShadow: "inset 0 0 0 10px rgba(255,255,255,0.06)",
            }}
          >
            <AnimatedNumber value={target.value} startFrame={start} prefix={prefix} suffix={suffix} decimals={decimals} />
          </div>
          <div style={{ fontFamily: FONTS.heading, fontSize: 84, color: COLORS.ink, marginTop: 24, opacity: interpolate(frame, [start + 8, start + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            {target.label}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---- mode: WATERFALL — start bar steps down to a remainder -------------
  if (mode === "waterfall") {
    const wx0 = LAYOUT.safeMargin + 80;
    const wx1 = VIDEO.width - LAYOUT.safeMargin - 40;
    const wy0 = LAYOUT.safeMargin + 180;
    const wy1 = VIDEO.height - LAYOUT.safeMargin - 110;
    const startVal = Math.abs(pts[0]!.value);
    const top = startVal * 1.08 || 1;
    const yAt = (v: number) => wy1 - (v / top) * (wy1 - wy0);
    const bw = Math.min(170, ((wx1 - wx0) / pts.length) * 0.6);
    const cx = (i: number) => (pts.length === 1 ? (wx0 + wx1) / 2 : wx0 + bw / 2 + (i * (wx1 - wx0 - bw)) / (pts.length - 1));
    const lastIdx = pts.length - 1;

    // running total → each bar's [topVal, botVal] band + its color (shared math)
    const bandColor = { start: COLORS.inkSoft, deduction: COLORS.danger, remainder: COLORS.flame } as const;
    const bars = waterfallBars(pts.map((p) => p.value)).map((b) => ({ p: pts[b.index]!, i: b.index, topV: b.topV, botV: b.botV, color: bandColor[b.kind] }));

    return (
      <AbsoluteFill style={{ backgroundColor: brand.paper }}>
        <QuietBackdrop />
        {title}
        <svg width={VIDEO.width} height={VIDEO.height} viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`} style={{ position: "absolute", inset: 0 }}>
          <path d={`M ${wx0 - 30} ${wy1} L ${wx1 + 20} ${wy1}`} stroke={COLORS.ink} strokeWidth={5} fill="none" />
          {bars.map((b) => {
            const x = cx(b.i);
            const yTop = yAt(b.topV);
            const yBot = yAt(b.botV);
            const grow = interpolate(frame, [startOf(b.i), startOf(b.i) + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const h = Math.max(0, (yBot - yTop) * grow);
            // connector from previous bar's bottom to this bar's top (dashed)
            const prev = b.i > 0 ? bars[b.i - 1]! : null;
            const conn = prev && frame >= startOf(b.i) ? `M ${cx(prev.i) + bw / 2} ${yAt(prev.i === 0 ? prev.botV : prev.botV)} L ${x - bw / 2} ${yAt(b.topV)}` : null;
            return (
              <g key={b.i}>
                {conn && <path d={conn} stroke={COLORS.inkSoft} strokeWidth={3} strokeDasharray="8 8" fill="none" opacity={0.6} />}
                <rect x={x - bw / 2} y={yTop} width={bw} height={h} rx={8} fill={b.color} />
              </g>
            );
          })}
        </svg>
        {/* amount labels (count-up) above each bar */}
        {bars.map((b) => {
          const x = cx(b.i);
          const yTop = yAt(b.topV);
          const sign = b.i !== 0 && b.i !== lastIdx ? "−" : "";
          return (
            <div key={`v${b.i}`} style={{ position: "absolute", left: x - 150, top: yTop - 66, width: 300, textAlign: "center", ...numFont, fontSize: 54, color: b.color, opacity: interpolate(frame, [startOf(b.i), startOf(b.i) + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
              {sign}
              <AnimatedNumber value={Math.abs(b.p.value)} startFrame={startOf(b.i)} prefix={prefix} suffix={suffix} decimals={decimals} />
            </div>
          );
        })}
        {/* x labels */}
        {bars.map((b) => (
          <div key={`l${b.i}`} style={{ position: "absolute", left: cx(b.i) - 140, top: wy1 + 16, width: 280, textAlign: "center", fontFamily: FONTS.label, fontSize: LAYOUT.labelSize * 0.8, color: COLORS.inkSoft, opacity: interpolate(frame, [startOf(b.i), startOf(b.i) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            {b.p.label}
          </div>
        ))}
      </AbsoluteFill>
    );
  }

  // ---- mode: PIE — wedges sweep in ---------------------------------------
  if (mode === "pie") {
    const cx = VIDEO.width * 0.38;
    const cy = VIDEO.height * 0.56;
    const r = 260;
    const total = pts.reduce((s, p) => s + Math.abs(p.value), 0) || 1;
    let acc = 0;
    const wedges = pts.map((p, i) => {
      const frac = Math.abs(p.value) / total;
      const a0 = acc * 360;
      acc += frac;
      const a1 = acc * 360;
      const s = startOf(i);
      const cur = interpolate(frame, [s, s + 24], [a0, a1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return { d: wedgePath(cx, cy, r, a0, Math.max(a0 + 0.01, cur)), color: seriesColor(i), frac, p, s };
    });
    return (
      <AbsoluteFill style={{ backgroundColor: brand.paper }}>
        <QuietBackdrop />
        {title}
        <svg width={VIDEO.width} height={VIDEO.height} viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`} style={{ position: "absolute", inset: 0 }}>
          {wedges.map((w, i) => (
            <path key={i} d={w.d} fill={w.color} stroke={brand.paper} strokeWidth={6} />
          ))}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.ink} strokeWidth={5} />
        </svg>
        {/* legend with animated percentages */}
        <div style={{ position: "absolute", left: VIDEO.width * 0.68, top: cy - pts.length * 44, display: "flex", flexDirection: "column", gap: 26 }}>
          {wedges.map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, opacity: interpolate(frame, [w.s, w.s + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
              <div style={{ width: 34, height: 34, background: w.color, borderRadius: 8 }} />
              <div style={{ ...numFont, fontSize: 56 }}>
                <AnimatedNumber value={Math.round(w.frac * 100)} startFrame={w.s} suffix="%" />
              </div>
              <div style={{ fontFamily: FONTS.label, fontSize: 48, color: COLORS.inkSoft }}>{w.p.label}</div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  // ---- line / bars / area: hand-drawn axes + animated data ----------------
  const x0 = LAYOUT.safeMargin + 150;
  const x1 = VIDEO.width - LAYOUT.safeMargin;
  const y0 = LAYOUT.safeMargin + 180;
  const y1 = VIDEO.height - LAYOUT.safeMargin - 110;
  const values = pts.map((p) => p.value);
  const minV = Math.min(...values, 0);
  const maxV = Math.max(...values);
  const pad = maxV === minV ? Math.max(1, Math.abs(maxV) * 0.2) : (maxV - minV) * 0.18;
  const lo = minV;
  const hi = maxV + pad;
  const yFor = (v: number) => y1 - ((v - lo) / (hi - lo)) * (y1 - y0);
  const xFor = (i: number) => (pts.length === 1 ? (x0 + x1) / 2 : x0 + (i * (x1 - x0)) / (pts.length - 1));

  const axes: BoardElement = {
    key: "axes",
    shape: full([`M ${x0} ${y0 - 20} L ${x0} ${y1}`, `M ${x0} ${y1} L ${x1 + 10} ${y1}`]),
    box: { x: 0, y: 0, w: VIDEO.width, h: VIDEO.height },
    startFrame: 0,
    strokeColor: COLORS.ink,
    strokeWidth: 5,
  };

  // Line/area geometry + progressive reveal following narration.
  const coords = pts.map((p, i) => [xFor(i), yFor(p.value)] as const);
  const lineProgress = interpolate(frame, [startOf(0), startOf(pts.length - 1) + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const revealX = x0 + lineProgress * (x1 - x0);
  const polyD = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const areaD = `${polyD} L ${coords[coords.length - 1]![0]} ${y1} L ${coords[0]![0]} ${y1} Z`;

  return (
    <AbsoluteFill style={{ backgroundColor: brand.paper }}>
      <QuietBackdrop />
      {title}
      <DrawingBoard elements={[axes]} />

      <svg width={VIDEO.width} height={VIDEO.height} viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="chart-reveal">
            <rect x={x0 - 4} y={0} width={Math.max(0, revealX - x0 + 8)} height={VIDEO.height} />
          </clipPath>
        </defs>

        {mode === "bars" &&
          pts.map((p, i) => {
            const cx = xFor(i);
            const bw = Math.min(150, ((x1 - x0) / pts.length) * 0.55);
            const top = yFor(p.value);
            const grow = interpolate(frame, [startOf(i), startOf(i) + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const curTop = y1 - (y1 - top) * grow;
            return <rect key={i} x={cx - bw / 2} y={curTop} width={bw} height={Math.max(0, y1 - curTop)} rx={8} fill={seriesColor(i)} />;
          })}

        {(mode === "line" || mode === "area") && (
          <g clipPath="url(#chart-reveal)">
            {mode === "area" && <path d={areaD} fill={brand.accent} opacity={0.18} />}
            <path d={polyD} fill="none" stroke={brand.accent} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
            {coords.map(([x, y], i) => frame >= startOf(i) && <circle key={i} cx={x} cy={y} r={11} fill={brand.accent} />)}
          </g>
        )}
      </svg>

      {/* count-up value labels */}
      {pts.map((p, i) => {
        const [cx, cy] = mode === "bars" ? [xFor(i), yFor(p.value) - 56] : [xFor(i), yFor(p.value) - 58];
        return (
          <div key={i} style={{ position: "absolute", left: cx - 150, top: cy, width: 300, textAlign: "center", ...numFont, fontSize: 62, opacity: interpolate(frame, [startOf(i), startOf(i) + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            <AnimatedNumber value={p.value} startFrame={startOf(i)} prefix={prefix} suffix={suffix} decimals={decimals} />
          </div>
        );
      })}

      {/* x-axis category labels */}
      {pts.map((p, i) => (
        <div key={`l${i}`} style={{ position: "absolute", left: xFor(i) - 120, top: y1 + 16, width: 240, textAlign: "center", fontFamily: FONTS.label, fontSize: LAYOUT.labelSize * 0.8, color: COLORS.inkSoft, opacity: interpolate(frame, [startOf(i), startOf(i) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          {p.label}
        </div>
      ))}
    </AbsoluteFill>
  );
};
