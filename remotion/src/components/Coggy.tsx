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

  // A real, expressive arm: a longer ink limb from the coin edge to a gold
  // mitten hand. `hand` picks the end shape so each pose reads at thumbnail size.
  const Arm: React.FC<{
    side: -1 | 1;
    angle: number; // degrees, 0 = straight out, 90 = straight up
    len?: number; // limb length in units of r
    hand?: "mitt" | "point" | "fist" | "thumb";
  }> = ({ side, angle, len = 0.95, hand = "mitt" }) => {
    const sx = cx + side * r * 0.7; // shoulder at the coin edge (arm drawn in front)
    const sy = cy + r * 0.34;
    const a = (angle * Math.PI) / 180;
    const dx = side * Math.cos(a);
    const dy = -Math.sin(a);
    const ex = sx + dx * r * len;
    const ey = sy + dy * r * len;
    const handR = hand === "mitt" ? r * 0.22 : r * 0.2;
    return (
      <>
        <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={INK} strokeWidth={r * 0.17} strokeLinecap="round" />
        {/* index finger: a gold nub continuing the arm line, ink-outlined */}
        {hand === "point" && (
          <>
            <line x1={ex} y1={ey} x2={ex + dx * r * 0.34} y2={ey + dy * r * 0.34} stroke={INK} strokeWidth={r * 0.18} strokeLinecap="round" />
            <line x1={ex} y1={ey} x2={ex + dx * r * 0.34} y2={ey + dy * r * 0.34} stroke={GOLD} strokeWidth={r * 0.1} strokeLinecap="round" />
          </>
        )}
        {/* thumb: a bold gold nub sticking straight up from a fist */}
        {hand === "thumb" && (
          <>
            <line x1={ex} y1={ey} x2={ex} y2={ey - r * 0.46} stroke={INK} strokeWidth={r * 0.22} strokeLinecap="round" />
            <line x1={ex} y1={ey} x2={ex} y2={ey - r * 0.46} stroke={GOLD} strokeWidth={r * 0.13} strokeLinecap="round" />
          </>
        )}
        <circle cx={ex} cy={ey} r={handR} fill={GOLD} stroke={INK} strokeWidth={r * 0.06} />
      </>
    );
  };

  // Motion arc helper (open-palm wave swishes, spin speed lines).
  const Arc: React.FC<{ ox: number; oy: number; rad: number; a0: number; a1: number }> = ({ ox, oy, rad, a0, a1 }) => {
    const p = (ang: number) => `${(ox + Math.cos((ang * Math.PI) / 180) * rad).toFixed(2)} ${(oy + Math.sin((ang * Math.PI) / 180) * rad).toFixed(2)}`;
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return <path d={`M ${p(a0)} A ${rad.toFixed(2)} ${rad.toFixed(2)} 0 ${large} 1 ${p(a1)}`} fill="none" stroke={INK} strokeWidth={r * 0.06} strokeLinecap="round" />;
  };

  // per-pose right arm + left arm config
  const rightArm =
    pose === "point" ? { angle: 2, len: 1.35, hand: "point" as const }
    : pose === "wave" ? { angle: 76, len: 1.2, hand: "mitt" as const }
    : pose === "thumbsup" ? { angle: 70, len: 1.05, hand: "thumb" as const }
    : { angle: -54, len: 0.78, hand: "mitt" as const }; // spin: tucked
  const leftArm =
    pose === "spin" ? { angle: -126, len: 0.78, hand: "mitt" as const }
    : { angle: -48, len: 0.9, hand: "mitt" as const };
  // spin pose tilts the whole body ~15° and adds speed arcs; an explicit `spin`
  // prop (frame-driven) overrides the static tilt for animation.
  const tilt = spin !== 0 ? spin : pose === "spin" ? 15 : 0;
  // wave-hand position (matches Arm's end math) for the motion arcs
  const waveHx = cx + r * 0.7 + Math.cos((rightArm.angle * Math.PI) / 180) * r * rightArm.len;
  const waveHy = cy + 0.34 * r - Math.sin((rightArm.angle * Math.PI) / 180) * r * rightArm.len;

  return (
    <g transform={`rotate(${tilt} ${cx} ${cy})`}>
      {/* spin: three speed arcs sweeping around the gear (behind the body) */}
      {pose === "spin" && (
        <>
          <Arc ox={cx} oy={cy} rad={r * 1.4} a0={-150} a1={-110} />
          <Arc ox={cx} oy={cy} rad={r * 1.4} a0={-30} a1={10} />
          <Arc ox={cx} oy={cy} rad={r * 1.4} a0={90} a1={130} />
        </>
      )}
      {/* gear teeth + coin body */}
      <path d={teeth} fill={GOLD} stroke={INK} strokeWidth={r * 0.06} strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={r} fill={GOLD} stroke={INK} strokeWidth={r * 0.07} />
      <circle cx={cx} cy={cy} r={r * 0.82} fill="none" stroke={INK} strokeWidth={r * 0.03} opacity={0.45} />
      {/* arms IN FRONT of the coin so the whole limb + gesture reads */}
      <Arm side={-1} angle={leftArm.angle} len={leftArm.len} hand={leftArm.hand} />
      <Arm side={1} angle={rightArm.angle} len={rightArm.len} hand={rightArm.hand} />
      {/* wave: two small motion arcs off the open palm */}
      {pose === "wave" && (
        <>
          <Arc ox={waveHx} oy={waveHy} rad={r * 0.42} a0={-70} a1={12} />
          <Arc ox={waveHx} oy={waveHy} rad={r * 0.6} a0={-62} a1={4} />
        </>
      )}
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
            <Coggy cx={xs[i]!} cy={520} r={150} pose={p} />
            <text x={xs[i]!} y={760} textAnchor="middle" fontFamily={FONTS.label} fontSize={36} fill={COLORS.flame}>
              {p}
            </text>
          </React.Fragment>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
