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
const H = 1080;
// 10 rows packed into the page; feet line per row + a small figure scale.
const rowFeet = (i: number) => 212 + i * 86;

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
  const colX = [620, 980, 1340, 1680];
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <text x={80} y={60} fontFamily={FONTS.heading} fontSize={48} fill={COLORS.ink}>
          MoneyCogs Cast · Poses
        </text>
        {poses.map((p, c) => (
          <Label key={p} x={colX[c]!} y={96} text={p} size={26} color={COLORS.flame} />
        ))}
        {IDS.map((id, rI) => (
          <React.Fragment key={id}>
            <Label x={270} y={rowFeet(rI) - 26} text={`${CAST[id].name} · ${CAST[id].role}`} size={26} color={COLORS.ink} />
            {poses.map((p, c) => (
              <CastStatic key={p} id={id} pose={p} expression="happy" cx={colX[c]!} feetY={rowFeet(rI)} base={0.4} />
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
  const colX = [660, 1000, 1340, 1620];
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <text x={80} y={60} fontFamily={FONTS.heading} fontSize={48} fill={COLORS.ink}>
          MoneyCogs Cast · Expressions
        </text>
        {exprs.map((e, c) => (
          <Label key={e} x={colX[c]!} y={96} text={e} size={26} color={COLORS.flame} />
        ))}
        {IDS.map((id, rI) => (
          <React.Fragment key={id}>
            <Label x={250} y={rowFeet(rI) - 26} text={CAST[id].name} size={26} color={COLORS.ink} />
            {exprs.map((e, c) => (
              <CastStatic key={e} id={id} pose="standing" expression={e} cx={colX[c]!} feetY={rowFeet(rI)} base={0.4} />
            ))}
            {/* silhouette at the far right — identifiable with no face */}
            <CastStatic id={id} pose="standing" expression="happy" silhouette cx={1850} feetY={rowFeet(rI)} base={0.4} />
          </React.Fragment>
        ))}
        <Label x={1850} y={96} text="silhouette" size={24} color={COLORS.inkSoft} />
      </svg>
    </AbsoluteFill>
  );
};
