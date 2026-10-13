import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "./theme";
import { stageShapes, GROUND_Y, type StageName } from "./drawing/stage";
import { CAST, castFigureRender, type CastId } from "./drawing/cast";
import { castFillColor } from "./components/CastFigure";
import { useBrand } from "./brand";
import { propShape, type PropKind } from "./drawing/props";

// Every stage, each with Penny (or a themed member) + one prop composited in
// front, to prove the background stays quieter than the foreground.
const STAGES: { name: StageName; who: CastId; prop: PropKind }[] = [
  { name: "bank-interior", who: "penny", prop: "coin-stack" },
  { name: "storefront", who: "penny", prop: "price-tag" },
  { name: "kitchen-table", who: "penny", prop: "piggy-bank" },
  { name: "boardroom", who: "penny", prop: "balance-scale" },
  { name: "street-market", who: "penny", prop: "cash-stack" },
  { name: "plain", who: "penny", prop: "coin" },
  { name: "outdoor", who: "penny", prop: "safe" },
  { name: "room", who: "penny", prop: "calculator" },
  { name: "desk-office", who: "penny", prop: "atm" },
  { name: "street", who: "penny", prop: "credit-card" },
  { name: "stage-spotlight", who: "penny", prop: "slot-machine" },
];

const COLS = 2;
const CW = 1920 / COLS; // 960
const CH = CW * (1080 / 1920); // 540
const TOP = 70;
const ROWS = Math.ceil(STAGES.length / COLS);
export const STAGE_SHEET_H = TOP + ROWS * CH + 20;

/** A stage drawn full-frame-scaled into a cell, with a cast figure + prop. */
const Cell: React.FC<{ name: StageName; who: CastId; prop: PropKind; x: number; y: number; s: number }> = ({ name, who, prop, x, y, s }) => {
  const brand = useBrand();
  const shapes = stageShapes(name);
  // figure: feet on GROUND_Y, left-of-center
  const r = castFigureRender(CAST[who], "standing", {});
  const cc = castFillColor(who, "full-top", { accent: brand.accentOnInk, paper: brand.paper });
  const fscale = 2.7 * CAST[who].heightScale;
  const fx = 720 - 50 * fscale;
  const fy = GROUND_Y + 40 - 192 * fscale;
  const fsw = 2 / fscale;
  // prop: composited to the right, standing in front near the ground
  const ps = propShape(prop);
  const pbox = 360;
  const psc = Math.min(pbox / ps.viewBox.w, pbox / ps.viewBox.h);
  const px = 1240 - (ps.viewBox.w * psc) / 2;
  const py = GROUND_Y - 30 - ps.viewBox.h * psc;
  const psw = 3 / psc;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={0} y={0} width={1920} height={1080} fill={COLORS.paper} />
      {shapes.map((sh, i) => (
        <path key={i} d={sh.d} fill={sh.fill ?? "none"} fillRule="evenodd" stroke={sh.stroke ?? "none"} strokeWidth={sh.sw ?? 0} strokeLinecap="round" opacity={sh.opacity ?? 1} />
      ))}
      {/* prop in front */}
      <g transform={`translate(${px} ${py}) scale(${psc})`}>
        {ps.fills?.map((f, i) => (
          <path key={`pf${i}`} d={f.d} fill={f.color} fillRule="evenodd" opacity={f.opacity ?? 1} />
        ))}
        {ps.strokes.map((d, i) => (
          <path key={`ps${i}`} d={d} fill="none" stroke={COLORS.ink} strokeWidth={psw} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </g>
      {/* figure in front */}
      <g transform={`translate(${fx} ${fy}) scale(${fscale})`}>
        {r.fills.map((p, i) => (
          <path key={i} d={p.d} fill={cc(p.fill)} fillRule="evenodd" stroke={COLORS.ink} strokeWidth={fsw} strokeLinejoin="round" />
        ))}
        {r.face.map((d, i) => (
          <path key={`f${i}`} d={d} fill="none" stroke={COLORS.ink} strokeWidth={fsw * 1.6} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="none" stroke={COLORS.inkSoft} strokeWidth={5} opacity={0.4} />
    </g>
  );
};

export const StageSheet: React.FC = () => {
  const s = CW / 1920;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <svg width={1920} height={STAGE_SHEET_H} viewBox={`0 0 1920 ${STAGE_SHEET_H}`}>
        <text x={50} y={50} fontFamily={FONTS.heading} fontSize={40} fill={COLORS.ink}>
          MoneyCogs Stages · background + foreground contrast
        </text>
        {STAGES.map((st, i) => {
          const x = (i % COLS) * CW;
          const yTop = TOP + Math.floor(i / COLS) * CH;
          return (
            <React.Fragment key={st.name}>
              <Cell name={st.name} who={st.who} prop={st.prop} x={x} y={yTop} s={s} />
              <text x={x + 18} y={yTop + 36} fontFamily={FONTS.label} fontSize={28} fill={COLORS.flame}>
                {st.name} · {st.prop}
              </text>
            </React.Fragment>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
