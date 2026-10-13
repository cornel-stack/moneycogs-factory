/**
 * Pure chart math (Phase 1C) — shared by the horizontal + vertical stat_chart
 * renderers and the golden snapshot test, so the logic can't drift.
 */

export type WaterfallBar = {
  index: number;
  topV: number; // band top value (toward the baseline-relative max)
  botV: number; // band bottom value
  kind: "start" | "deduction" | "remainder";
};

/**
 * Turn waterfall datapoint VALUES into stacked bands: index 0 is the starting
 * total (full bar), the middle entries are deductions that step the running
 * total down, and the last entry is the remainder (drawn from the baseline).
 */
export function waterfallBars(values: number[]): WaterfallBar[] {
  const start = Math.abs(values[0] ?? 0);
  const last = values.length - 1;
  let run = start;
  return values.map((v, i) => {
    if (i === 0) return { index: i, topV: start, botV: 0, kind: "start" };
    if (i === last) return { index: i, topV: Math.abs(v), botV: 0, kind: "remainder" };
    const before = run;
    run = before - Math.abs(v);
    return { index: i, topV: before, botV: run, kind: "deduction" };
  });
}
