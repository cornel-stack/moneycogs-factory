import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "./theme";
import { CAST, castRender, type CastId } from "./drawing/cast";
import { getPose } from "./drawing/castPose";
import { castFillColor } from "./components/CastFigure";
import { useBrand } from "./brand";
import type { Expression } from "./drawing/character";

/**
 * FaceSheet — a big-head-only approval grid: all 10 cast members × 5 expressions,
 * cropped to head + shoulders and drawn large so the facial acting reads. Each
 * cell is a nested <svg> whose viewBox frames the head region of a full figure.
 */
const IDS: CastId[] = ["penny", "ledger", "rosa", "sterling", "vera", "joe", "norma", "felix", "slick", "keys"];
const EXPRS: Expression[] = ["neutral", "happy", "worried", "shocked", "curious"];

const W = 1920;
const H = 1600;
const GRID_X = 250; // left edge of the first column
const GRID_Y = 200; // top of the first row
const COL_W = (W - GRID_X - 40) / EXPRS.length;
const ROW_H = (H - GRID_Y - 30) / IDS.length;
// Local (100×200 figure) head+shoulders window the nested svg frames.
const VIEW = { x: 18, y: -16, w: 64, h: 94 };

/** One head+shoulders portrait. `tilt` cocks the head (curious). */
const FaceCell: React.FC<{
  id: CastId;
  expr: Expression;
  x: number;
  y: number;
  w: number;
  h: number;
}> = ({ id, expr, x, y, w, h }) => {
  const brand = useBrand();
  const r = castRender(CAST[id], getPose("standing", "front"), { expression: expr });
  const cc = castFillColor(id, "full-top", { accent: brand.accentOnInk, paper: brand.paper });
  const [nx, ny] = r.neck;
  const tilt = expr === "curious" ? -12 : 0; // cocked head for curiosity
  const head = (
    <g transform={tilt ? `rotate(${tilt} ${nx} ${ny})` : undefined}>
      {r.headFills.map((p, i) => (
        <path key={`h${i}`} d={p.d} fill={cc(p.fill)} fillRule="evenodd" stroke={COLORS.ink} strokeWidth={1.3} strokeLinejoin="round" />
      ))}
      {r.face.map((d, i) => (
        <path key={`f${i}`} d={d} fill="none" stroke={COLORS.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </g>
  );
  return (
    <>
      <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx={14} fill="#FFFFFF" stroke="#E4DFD2" strokeWidth={2} />
      <svg x={x + 6} y={y + 6} width={w - 12} height={h - 12} viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} preserveAspectRatio="xMidYMid meet">
        {r.bodyFills.map((p, i) => (
          <path key={`b${i}`} d={p.d} fill={cc(p.fill)} fillRule="evenodd" stroke={COLORS.ink} strokeWidth={1.3} strokeLinejoin="round" />
        ))}
        {head}
      </svg>
    </>
  );
};

export const CastFaceSheet: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <text x={80} y={80} fontFamily={FONTS.heading} fontSize={58} fill={COLORS.ink}>
          MoneyCogs Cast · Faces
        </text>
        {/* column headers */}
        {EXPRS.map((e, c) => (
          <text key={e} x={GRID_X + c * COL_W + COL_W / 2} y={GRID_Y - 24} textAnchor="middle" fontFamily={FONTS.label} fontSize={34} fill={COLORS.flame}>
            {e}
          </text>
        ))}
        {/* row labels + cells */}
        {IDS.map((id, rI) => (
          <React.Fragment key={id}>
            <text x={GRID_X - 30} y={GRID_Y + rI * ROW_H + ROW_H / 2} textAnchor="end" fontFamily={FONTS.label} fontSize={32} fill={COLORS.ink}>
              {CAST[id].name}
            </text>
            {EXPRS.map((e, c) => (
              <FaceCell key={e} id={id} expr={e} x={GRID_X + c * COL_W} y={GRID_Y + rI * ROW_H} w={COL_W} h={ROW_H} />
            ))}
          </React.Fragment>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
