import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, LAYOUT, VIDEO } from "../theme";
import { useBrand } from "../brand";
import { QuietBackdrop } from "../components/QuietBackdrop";
import { DrawingBoard } from "../components/DrawingBoard";
import { AliveCast } from "../components/CastCharacter";
import { propShape, type PropKind } from "../drawing/props";
import { buildPlan } from "../drawing/plan";
import { syncStartFrame } from "../drawing/layout";
import type { BoardElement, Shape } from "../drawing/types";
import type { CastId } from "../drawing/cast";
import type { WordTiming } from "../schema";
import {
  layoutFlow,
  edgeArrowStrokes,
  FLOW_COLORS,
  type FlowNodeIn,
  type FlowEdgeIn,
  type FlowLayout,
  type FlowPlan,
  type Orient,
  type Box,
} from "../drawing/flowLayout";

export type MoneyFlowVisualT = {
  title?: string;
  nodes: FlowNodeIn[];
  edges: FlowEdgeIn[];
  layout?: FlowLayout;
};

const EDGE_STROKE = 7;
const NODE_STAGGER = 4;
const CHAR_STAGGER = 8;
const EDGE_BEAT = 18;

const roundRect = (w: number, h: number, r: number): string =>
  `M ${r} 0 h ${w - 2 * r} a ${r} ${r} 0 0 1 ${r} ${r} v ${h - 2 * r} a ${r} ${r} 0 0 1 ${-r} ${r} h ${-(w - 2 * r)} a ${r} ${r} 0 0 1 ${-r} ${-r} v ${-(h - 2 * r)} a ${r} ${r} 0 0 1 ${r} ${-r} Z`;

/** A text node as a cream rounded box (ink outline). */
function textNodeShape(box: Box): Shape {
  const d = roundRect(box.w, box.h, 18);
  return { viewBox: { w: box.w, h: box.h }, strokes: [d], fills: [{ d, color: "#EFE7D2" }] };
}

/**
 * The money-flow diagram: nodes draw on the opening beat, edge arrows draw in
 * sync with coins travelling along them + an amount tag popping at the midpoint.
 * Reused by the horizontal scene and the vertical variant (different region/orient).
 */
export const FlowDiagram: React.FC<{
  nodes: FlowNodeIn[];
  edges: FlowEdgeIn[];
  layout?: FlowLayout;
  region: Box;
  orient?: Orient;
  words: WordTiming[];
  labelScale?: number;
}> = ({ nodes, edges, layout, region, orient = "h", words, labelScale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps, width: SW, height: SH } = useVideoConfig();
  const plan: FlowPlan = layoutFlow(nodes, edges, { layout, region, orient });

  // Nodes are established on the opening beat. Prop + text nodes are hand-drawn
  // (fast); CHARACTERS pop in alive (via CastCharacter) so the whole pen budget
  // is reserved for the signature arrows — the star of the scene.
  const nodeKey = (id: string) => `node-${id}`;
  const charNodes = plan.nodes.filter((p) => p.node.kind === "character");
  const drawNodes = plan.nodes.filter((p) => p.node.kind !== "character");
  const charStart = new Map(charNodes.map((pn, i) => [pn.node.id, i * CHAR_STAGGER]));

  const drawEls: BoardElement[] = drawNodes.map((pn, i) => {
    const k = nodeKey(pn.node.id);
    if (pn.node.kind === "prop") {
      return { key: k, shape: propShape(pn.node.ref as PropKind), box: pn.box, startFrame: i * NODE_STAGGER, strokeColor: COLORS.ink, strokeWidth: 6, label: pn.node.label, labelAnchor: "bottom" };
    }
    return { key: k, shape: textNodeShape(pn.box), box: pn.box, startFrame: i * NODE_STAGGER, strokeColor: COLORS.ink, strokeWidth: 4, label: pn.node.label, labelAnchor: "inside" };
  });

  const charEstablish = charNodes.length * CHAR_STAGGER + 16;
  const drawNodesEnd = Math.max(0, ...Object.values(buildPlan(drawEls, fps).drawEndByKey), 0);
  const nodesEnd = Math.max(drawNodesEnd, charEstablish);

  // ---- edge scheduling: synced to phrase; else an even beat after the synced ----
  const syncedStarts = plan.edges.filter((e) => e.edge.sync).map((e) => syncStartFrame(words, e.edge.sync, fps, 0));
  const base = Math.max(nodesEnd + 6, (syncedStarts.length ? Math.max(...syncedStarts) : 0) + 6);
  let unsynced = 0;
  const edgeKey = (i: number) => `edge-${i}`;
  const edgeEls: BoardElement[] = plan.edges.map((pe, i) => {
    const start = pe.edge.sync ? syncStartFrame(words, pe.edge.sync, fps, base + unsynced * EDGE_BEAT) : base + unsynced++ * EDGE_BEAT;
    return {
      key: edgeKey(i),
      shape: { viewBox: { w: SW, h: SH }, strokes: edgeArrowStrokes(pe) },
      box: { x: 0, y: 0, w: SW, h: SH },
      startFrame: start,
      strokeColor: FLOW_COLORS[pe.edge.color],
      strokeWidth: EDGE_STROKE,
    };
  });

  const all = [...drawEls, ...edgeEls];
  const fullPlan = buildPlan(all, fps);
  const windowOf = (key: string): [number, number] => {
    const segs = fullPlan.segments.filter((s) => s.elementKey === key);
    const s = segs.length ? Math.min(...segs.map((x) => x.startFrame)) : 0;
    return [s, fullPlan.drawEndByKey[key] ?? s + 12];
  };
  const nodeDone = (pn: (typeof plan.nodes)[number]): number =>
    pn.node.kind === "character" ? (charStart.get(pn.node.id) ?? 0) + 16 : windowOf(nodeKey(pn.node.id))[1];

  return (
    <>
      {/* character nodes: pop in alive (no pen) */}
      {charNodes.map((pn) => {
        const start = charStart.get(pn.node.id) ?? 0;
        const op = interpolate(frame, [start, start + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        if (op <= 0) return null;
        const s = Math.min(pn.box.w / 100, pn.box.h / 200);
        const tx = pn.box.x + (pn.box.w - 100 * s) / 2;
        const ty = pn.box.y + (pn.box.h - 192 * s) / 2;
        return (
          <svg key={`char-${pn.node.id}`} width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ position: "absolute", inset: 0, opacity: op }}>
            <g transform={`translate(${tx} ${ty}) scale(${s})`}>
              <AliveCast castId={(pn.node.ref ?? "penny") as CastId} poses={["standing"]} expression="happy" frame={Math.max(0, frame - start)} scale={s} seat="none" seed={pn.node.id} />
            </g>
          </svg>
        );
      })}

      <DrawingBoard elements={all} />

      {/* character node labels (prop/text labels come from the DrawingBoard) */}
      {charNodes.map((pn) => {
        const start = charStart.get(pn.node.id) ?? 0;
        const t = interpolate(frame, [start + 10, start + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        if (t <= 0) return null;
        return (
          <div key={`clab-${pn.node.id}`} style={{ position: "absolute", left: pn.cx - 160, top: pn.box.y + pn.box.h + 2, width: 320, textAlign: "center", fontFamily: FONTS.label, fontSize: LAYOUT.labelSize * labelScale, color: COLORS.ink, opacity: t }}>
            {pn.node.label}
          </div>
        );
      })}

      {/* coins travelling along each arrow while it draws */}
      <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {plan.edges.map((pe, i) => {
          const [s, e] = windowOf(edgeKey(i));
          if (frame < s) return null;
          const p = Math.max(0, Math.min(1, (frame - s) / Math.max(1, e - s)));
          const fade = frame <= e ? 1 : Math.max(0, 1 - (frame - e) / 10);
          if (fade <= 0) return null;
          return (
            <g key={i} opacity={fade}>
              {[0, 1, 2].map((kk) => {
                const t = Math.max(0, Math.min(1, p - kk * 0.14));
                const { x, y } = plan.point(pe, t);
                return (
                  <g key={kk}>
                    <circle cx={x} cy={y} r={13} fill={COLORS.marker} stroke={COLORS.ink} strokeWidth={2.5} />
                    <circle cx={x} cy={y} r={7} fill="none" stroke={COLORS.ink} strokeWidth={1.5} opacity={0.5} />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* amount tags pop at each arrow's midpoint */}
      {plan.edges.map((pe, i) => {
        const [s, e] = windowOf(edgeKey(i));
        const popStart = s + 0.5 * (e - s);
        if (frame < popStart) return null;
        const pop = spring({ frame: frame - popStart, fps, config: { damping: 13, stiffness: 160, mass: 0.7 } });
        const bg = pe.edge.color === "danger" ? COLORS.danger : COLORS.marker;
        const fg = pe.edge.color === "danger" ? "#FFFFFF" : COLORS.ink;
        return (
          <div
            key={`tag${i}`}
            style={{
              position: "absolute",
              left: pe.mx,
              top: pe.my,
              transform: `translate(-50%, -50%) scale(${Math.max(0.01, Math.min(1.08, pop))})`,
              background: bg,
              color: fg,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              fontSize: 52 * labelScale,
              padding: `${6 * labelScale}px ${18 * labelScale}px`,
              borderRadius: 14,
              border: `3px solid ${COLORS.ink}`,
              whiteSpace: "nowrap",
            }}
          >
            {pe.edge.amount}
          </div>
        );
      })}

      {/* optional amount strings under each node */}
      {plan.nodes.map((pn) => {
        if (!pn.node.amount) return null;
        const e = nodeDone(pn);
        const t = interpolate(frame, [e, e + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        if (t <= 0) return null;
        return (
          <div
            key={`amt-${pn.node.id}`}
            style={{
              position: "absolute",
              left: pn.cx - 160,
              top: pn.box.y + pn.box.h + 44 * labelScale,
              width: 320,
              textAlign: "center",
              fontFamily: FONTS.heading,
              fontWeight: 700,
              fontSize: 46 * labelScale,
              color: COLORS.flame,
              opacity: t,
            }}
          >
            {pn.node.amount}
          </div>
        );
      })}
    </>
  );
};

export const MoneyFlow: React.FC<{ visual: MoneyFlowVisualT; words: WordTiming[] }> = ({ visual, words }) => {
  const brand = useBrand();
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const region: Box = { x: 120, y: 230, w: VIDEO.width - 240, h: VIDEO.height - 230 - 120 };
  return (
    <AbsoluteFill style={{ backgroundColor: brand.paper }}>
      <QuietBackdrop />
      {visual.title && (
        <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily: FONTS.heading, fontSize: LAYOUT.subtitleSize, color: COLORS.ink, opacity: titleOpacity }}>
          {visual.title}
        </div>
      )}
      <FlowDiagram nodes={visual.nodes} edges={visual.edges} layout={visual.layout} region={region} orient="h" words={words} />
    </AbsoluteFill>
  );
};
