import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "./theme";
import { CAST, type CastId } from "./drawing/cast";
import type { StickPose } from "./drawing/stick";
import type { Expression } from "./drawing/character";
import { CastStatic } from "./components/CastFigure";

// The full MoneyCogs cast (10 archetypes), one row each.
const IDS: CastId[] = ["penny", "ledger", "rosa", "sterling", "vera", "joe", "norma", "felix", "slick", "keys"];
const W = 1920;
const H = 1560;
// 10 rows packed tightly; feet line per row + a large figure scale (~2x the
// previous sheet). Less whitespace, readable faces/signatures.
const ROW0 = 250;
const ROW_STEP = 128;
const BASE = 0.66;
const rowFeet = (i: number) => ROW0 + i * ROW_STEP;

const Label: React.FC<{ x: number; y: number; text: string; size?: number; color?: string }> = ({
  x,
  y,
  text,
  size = 32,
  color = COLORS.inkSoft,
}) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={FONTS.label} fontSize={size} fill={color}>
    {text}
  </text>
);

/** Page 1 — every cast member in 4 key poses. */
export const CastSheetPoses: React.FC = () => {
  const poses: StickPose[] = ["standing", "pointing", "walking", "sitting"];
  const colX = [640, 1030, 1410, 1740];
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <text x={80} y={74} fontFamily={FONTS.heading} fontSize={58} fill={COLORS.ink}>
          MoneyCogs Cast · Poses
        </text>
        {poses.map((p, c) => (
          <Label key={p} x={colX[c]!} y={140} text={p} size={34} color={COLORS.flame} />
        ))}
        {IDS.map((id, rI) => (
          <React.Fragment key={id}>
            <Label x={260} y={rowFeet(rI) - 44} text={`${CAST[id].name} · ${CAST[id].role}`} size={32} color={COLORS.ink} />
            {poses.map((p, c) => (
              <CastStatic key={p} id={id} pose={p} expression="happy" cx={colX[c]!} feetY={rowFeet(rI)} base={BASE} />
            ))}
          </React.Fragment>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** Page 2 — every cast member across 4 expressions (+ a silhouette lineup). */
export const CastSheetExpr: React.FC = () => {
  const exprs: Expression[] = ["happy", "worried", "shocked", "curious"];
  const colX = [620, 950, 1280, 1600];
  const silX = 1850;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <text x={80} y={74} fontFamily={FONTS.heading} fontSize={58} fill={COLORS.ink}>
          MoneyCogs Cast · Expressions
        </text>
        {exprs.map((e, c) => (
          <Label key={e} x={colX[c]!} y={140} text={e} size={34} color={COLORS.flame} />
        ))}
        <Label x={silX} y={140} text="silhouette" size={30} color={COLORS.inkSoft} />
        {IDS.map((id, rI) => (
          <React.Fragment key={id}>
            <Label x={240} y={rowFeet(rI) - 44} text={CAST[id].name} size={32} color={COLORS.ink} />
            {exprs.map((e, c) => (
              <CastStatic key={e} id={id} pose="standing" expression={e} cx={colX[c]!} feetY={rowFeet(rI)} base={BASE * 0.92} />
            ))}
            {/* silhouette at the far right — identifiable with no face */}
            <CastStatic id={id} pose="standing" expression="happy" silhouette cx={silX} feetY={rowFeet(rI)} base={BASE * 0.92} />
          </React.Fragment>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
