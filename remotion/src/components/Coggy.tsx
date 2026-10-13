import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";

/**
 * Coggy — the MoneyCogs brand mascot. A gold coin with gear teeth, a simple
 * face, and stubby arms. NOT a rig character: it's a lightweight self-contained
 * SVG group used in CTA scenes, end cards and the shorts watermark (wired in a
 * later phase). Four poses: point, wave, thumbs-up, spin.
 */
export type CoggyPose = "point" | "wave" | "thumbsup" | "spin";

const GOLD = COLORS.marker; // coin gold #F5B700
const INK = COLORS.ink;

/** Place one Coggy centered at (cx,cy) with coin radius r. `spin` tilts the coin
 *  (degrees) — pass a frame-driven value for an animated spin. */
export const Coggy: React.FC<{ cx: number; cy: number; r: number; pose?: CoggyPose; spin?: number }> = ({
  cx,
  cy,
  r,
  pose = "wave",
  spin = 0,
}) => {
  const teethN = 12;
  const pt = (ang: number, rad: number) =>
    `${(cx + Math.cos(ang) * rad).toFixed(2)} ${(cy + Math.sin(ang) * rad).toFixed(2)}`;
  const teeth = Array.from({ length: teethN }, (_, i) => {
    const a = (i / teethN) * Math.PI * 2;
    const tw = 0.14;
    const ro = r * 1.17;
    const ri = r * 0.98;
    return `M ${pt(a - tw, ri)} L ${pt(a - tw * 0.6, ro)} L ${pt(a + tw * 0.6, ro)} L ${pt(a + tw, ri)} Z`;
  }).join(" ");

  // stubby arm: a short ink limb from the coin edge to a gold mitt.
  const Arm: React.FC<{ side: -1 | 1; angle: number; raise?: number }> = ({ side, angle, raise = 0 }) => {
    const sx = cx + side * r * 0.9;
    const sy = cy + r * 0.2;
    const ex = sx + side * r * 0.5 * Math.cos((angle * Math.PI) / 180);
    const ey = sy - r * 0.5 * Math.sin((angle * Math.PI) / 180) - raise;
    return (
      <>
        <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={INK} strokeWidth={r * 0.14} strokeLinecap="round" />
        <circle cx={ex} cy={ey} r={r * 0.14} fill={GOLD} stroke={INK} strokeWidth={r * 0.05} />
      </>
    );
  };

  // right-arm gesture per pose
  const right =
    pose === "wave" ? { angle: 70, raise: r * 0.1 }
    : pose === "point" ? { angle: 15, raise: 0 }
    : pose === "thumbsup" ? { angle: 90, raise: r * 0.15 }
    : { angle: 35, raise: 0 }; // spin

  return (
    <g transform={`rotate(${spin} ${cx} ${cy})`}>
      {/* arms behind the coin so the mitts peek out at the rim */}
      <Arm side={-1} angle={35} />
      <Arm side={1} angle={right.angle} raise={right.raise} />
      {pose === "thumbsup" && (
        <circle cx={cx + r * 1.42} cy={cy - r * 0.5} r={r * 0.09} fill={GOLD} stroke={INK} strokeWidth={r * 0.04} />
      )}
      {/* gear teeth + coin body */}
      <path d={teeth} fill={GOLD} stroke={INK} strokeWidth={r * 0.06} strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={r} fill={GOLD} stroke={INK} strokeWidth={r * 0.07} />
      <circle cx={cx} cy={cy} r={r * 0.82} fill="none" stroke={INK} strokeWidth={r * 0.03} opacity={0.45} />
      {/* simple face */}
      <circle cx={cx - r * 0.28} cy={cy - r * 0.12} r={r * 0.1} fill={INK} />
      <circle cx={cx + r * 0.28} cy={cy - r * 0.12} r={r * 0.1} fill={INK} />
      <path
        d={`M ${cx - r * 0.3} ${cy + r * 0.16} Q ${cx} ${cy + r * 0.5} ${cx + r * 0.3} ${cy + r * 0.16}`}
        fill="none"
        stroke={INK}
        strokeWidth={r * 0.07}
        strokeLinecap="round"
      />
    </g>
  );
};

/** Approval sheet — Coggy in all four poses. */
export const CoggySheet: React.FC = () => {
  const poses: CoggyPose[] = ["point", "wave", "thumbsup", "spin"];
  const xs = [360, 760, 1160, 1560];
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <text x={80} y={90} fontFamily={FONTS.heading} fontSize={54} fill={COLORS.ink}>
          Coggy · the MoneyCogs mascot
        </text>
        {poses.map((p, i) => (
          <React.Fragment key={p}>
            <Coggy cx={xs[i]!} cy={520} r={150} pose={p} spin={p === "spin" ? 22 : 0} />
            <text x={xs[i]!} y={760} textAnchor="middle" fontFamily={FONTS.label} fontSize={36} fill={COLORS.flame}>
              {p}
            </text>
          </React.Fragment>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
