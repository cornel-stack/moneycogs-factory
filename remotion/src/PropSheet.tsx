import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "./theme";
import { propShape, type PropKind } from "./drawing/props";

// Money props (Phase 1B) shown first/large, then the rest of the library.
const MONEY: PropKind[] = [
  "coin", "coin-stack", "bill", "cash-stack", "money-bag", "wallet", "piggy-bank", "safe", "vault", "atm",
  "credit-card", "receipt", "invoice", "contract-scroll", "calculator", "percent-tag", "price-tag", "interest-clock",
  "balance-scale", "funnel", "gauge-meter", "shopping-cart", "trap", "dice", "slot-machine",
];
const LIBRARY: PropKind[] = [
  "coins", "dollar", "bargraph", "piechart", "trendup", "percent", "scale", "clock", "calendar", "gears",
  "house", "book", "moneybag", "phone", "gift", "target", "trophy", "lightbulb", "speech", "arrow",
  "dominoes", "checkmark", "brick", "mountain", "tree",
];
const KINDS: PropKind[] = [...MONEY, ...LIBRARY];

const COLS = 5;
const CELL_W = 1920 / COLS;
const BOX = 206; // ≥200px prop art
const ROW_H = 300;
const TOP = 150;
const ROWS = Math.ceil(KINDS.length / COLS);
export const PROP_SHEET_H = TOP + ROWS * ROW_H + 30;

const Cell: React.FC<{ kind: PropKind; cx: number; cy: number; box: number }> = ({ kind, cx, cy, box }) => {
  const s = propShape(kind, { state: "on", variant: kind === "door" ? "open" : undefined });
  const sc = Math.min(box / s.viewBox.w, box / s.viewBox.h);
  const tx = cx - (s.viewBox.w * sc) / 2;
  const ty = cy - (s.viewBox.h * sc) / 2;
  const sw = 3 / sc;
  return (
    <g transform={`translate(${tx} ${ty}) scale(${sc})`}>
      {s.fills?.map((f, i) => (
        <path key={`fl${i}`} d={f.d} fill={f.color} fillRule="evenodd" opacity={f.opacity ?? 1} />
      ))}
      {s.strokes.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={COLORS.ink} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </g>
  );
};

export const PropSheet: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <svg width={1920} height={PROP_SHEET_H} viewBox={`0 0 1920 ${PROP_SHEET_H}`}>
        <text x={60} y={74} fontFamily={FONTS.heading} fontSize={54} fill={COLORS.ink}>
          MoneyCogs Prop Library
        </text>
        <text x={60} y={116} fontFamily={FONTS.label} fontSize={28} fill={COLORS.inkSoft}>
          money props (Phase 1B) first, then the general library
        </text>
        {KINDS.map((k, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const cx = col * CELL_W + CELL_W / 2;
          const cyTop = TOP + row * ROW_H;
          const isMoney = i < MONEY.length;
          return (
            <React.Fragment key={k}>
              <Cell kind={k} cx={cx} cy={cyTop + BOX / 2} box={BOX} />
              <text x={cx} y={cyTop + ROW_H - 34} textAnchor="middle" fontFamily={FONTS.label} fontSize={30} fill={isMoney ? COLORS.flame : COLORS.inkSoft}>
                {k}
              </text>
            </React.Fragment>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
