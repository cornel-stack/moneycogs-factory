/**
 * money_flow layout (Phase 1C) — pure geometry for the signature money diagram.
 * Shared by the horizontal scene (MoneyFlow.tsx) and the vertical variant so the
 * two can't drift. Picks hub / chain / split (or honors an override) and returns
 * node boxes + edge endpoints/control points in SCENE pixels.
 */

export type FlowNodeIn = { id: string; label: string; kind: "character" | "prop" | "text"; ref?: string; amount?: string };
export type FlowEdgeIn = { from: string; to: string; amount: string; color: "green" | "gold" | "danger"; sync?: { phrase: string } };
export type FlowLayout = "hub" | "chain" | "split";
export type Box = { x: number; y: number; w: number; h: number };
export type Orient = "h" | "v";

export type PlacedNode = { node: FlowNodeIn; cx: number; cy: number; box: Box };
export type PlacedEdge = {
  edge: FlowEdgeIn;
  ax: number; ay: number; // start (on the source box edge)
  bx: number; by: number; // end (just shy of the target box edge, room for the head)
  cx: number; cy: number; // quadratic control point
  mx: number; my: number; // midpoint (for the amount tag)
};
export type FlowPlan = { layout: FlowLayout; nodes: PlacedNode[]; edges: PlacedEdge[]; point: (e: PlacedEdge, t: number) => { x: number; y: number } };

/** Node box size by kind + orientation. */
function nodeBox(kind: FlowNodeIn["kind"], orient: Orient): { w: number; h: number } {
  if (orient === "v") {
    if (kind === "character") return { w: 240, h: 380 };
    if (kind === "prop") return { w: 230, h: 250 };
    return { w: 460, h: 150 };
  }
  if (kind === "character") return { w: 190, h: 300 };
  if (kind === "prop") return { w: 180, h: 200 };
  return { w: 260, h: 120 };
}

/** Auto-pick a layout from the graph shape. */
export function pickLayout(nodes: FlowNodeIn[], edges: FlowEdgeIn[]): FlowLayout {
  const deg = new Map<string, number>();
  const outDeg = new Map<string, number>();
  const inDeg = new Map<string, number>();
  for (const n of nodes) { deg.set(n.id, 0); outDeg.set(n.id, 0); inDeg.set(n.id, 0); }
  for (const e of edges) {
    deg.set(e.from, (deg.get(e.from) ?? 0) + 1);
    deg.set(e.to, (deg.get(e.to) ?? 0) + 1);
    outDeg.set(e.from, (outDeg.get(e.from) ?? 0) + 1);
    inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
  }
  if ([...deg.values()].some((d) => d >= 3)) return "hub";
  const sources = nodes.filter((n) => (inDeg.get(n.id) ?? 0) === 0);
  if (sources.length === 1) {
    const od = outDeg.get(sources[0]!.id) ?? 0;
    if (od >= 2 && od <= 4) return "split";
  }
  return "chain";
}

/** Node whose degree is highest (the hub). */
function hubId(nodes: FlowNodeIn[], edges: FlowEdgeIn[]): string {
  const deg = new Map<string, number>();
  for (const n of nodes) deg.set(n.id, 0);
  for (const e of edges) { deg.set(e.from, (deg.get(e.from) ?? 0) + 1); deg.set(e.to, (deg.get(e.to) ?? 0) + 1); }
  return [...deg.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}

/** Order nodes along a chain (follow edges from the in-degree-0 start). */
function chainOrder(nodes: FlowNodeIn[], edges: FlowEdgeIn[]): FlowNodeIn[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nextOf = new Map<string, string>();
  const inDeg = new Map<string, number>();
  for (const n of nodes) inDeg.set(n.id, 0);
  for (const e of edges) { if (!nextOf.has(e.from)) nextOf.set(e.from, e.to); inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1); }
  const start = nodes.find((n) => (inDeg.get(n.id) ?? 0) === 0) ?? nodes[0]!;
  const out: FlowNodeIn[] = [];
  const seen = new Set<string>();
  let cur: string | undefined = start.id;
  while (cur && byId.has(cur) && !seen.has(cur)) {
    seen.add(cur);
    out.push(byId.get(cur)!);
    cur = nextOf.get(cur);
  }
  for (const n of nodes) if (!seen.has(n.id)) out.push(n); // append any strays
  return out;
}

const DEG = Math.PI / 180;

/** Build the full placement for a money_flow diagram inside `region`. */
export function layoutFlow(
  nodes: FlowNodeIn[],
  edges: FlowEdgeIn[],
  opts: { layout?: FlowLayout; region: Box; orient?: Orient },
): FlowPlan {
  const orient: Orient = opts.orient ?? "h";
  const layout = opts.layout ?? pickLayout(nodes, edges);
  const R = opts.region;
  const pos = new Map<string, { cx: number; cy: number }>();

  if (layout === "hub") {
    const hid = hubId(nodes, edges);
    const spokes = nodes.filter((n) => n.id !== hid);
    if (orient === "v") {
      // compact: hub near top-center, spokes on a tight ring below it
      const hubCx = R.x + R.w / 2, hubCy = R.y + R.h * 0.3;
      pos.set(hid, { cx: hubCx, cy: hubCy });
      const rx = R.w * 0.36, ry = R.h * 0.3;
      spokes.forEach((n, i) => {
        const a = (spokes.length === 1 ? 90 : 20 + (i * 140) / Math.max(1, spokes.length - 1)) * DEG;
        pos.set(n.id, { cx: hubCx + Math.cos(a) * rx, cy: hubCy + ry * 0.9 + Math.sin(a) * ry * 0.5 });
      });
    } else {
      const hubCx = R.x + R.w * 0.46, hubCy = R.y + R.h / 2;
      pos.set(hid, { cx: hubCx, cy: hubCy });
      const rx = R.w * 0.4, ry = R.h * 0.4;
      // fan spokes across right → bottom → left (skip straight up where the title sits)
      spokes.forEach((n, i) => {
        const a = (spokes.length === 1 ? 0 : -40 + (i * 250) / Math.max(1, spokes.length - 1)) * DEG;
        pos.set(n.id, { cx: hubCx + Math.cos(a) * rx, cy: hubCy + Math.sin(a) * ry });
      });
    }
  } else if (layout === "split") {
    const inDeg = new Map<string, number>();
    for (const n of nodes) inDeg.set(n.id, 0);
    for (const e of edges) inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
    const source = nodes.find((n) => (inDeg.get(n.id) ?? 0) === 0) ?? nodes[0]!;
    const targets = nodes.filter((n) => n.id !== source.id);
    if (orient === "v") {
      pos.set(source.id, { cx: R.x + R.w / 2, cy: R.y + R.h * 0.14 });
      targets.forEach((n, i) => pos.set(n.id, { cx: R.x + R.w / 2, cy: R.y + R.h * (0.45 + (i * 0.5) / Math.max(1, targets.length - 1 || 1)) }));
    } else {
      pos.set(source.id, { cx: R.x + R.w * 0.16, cy: R.y + R.h / 2 });
      targets.forEach((n, i) => pos.set(n.id, { cx: R.x + R.w * 0.82, cy: R.y + R.h * (targets.length === 1 ? 0.5 : 0.16 + (i * 0.68) / (targets.length - 1)) }));
    }
  } else {
    // chain
    const order = chainOrder(nodes, edges);
    order.forEach((n, i) => {
      const t = order.length === 1 ? 0.5 : i / (order.length - 1);
      if (orient === "v") pos.set(n.id, { cx: R.x + R.w / 2, cy: R.y + R.h * (0.1 + t * 0.8) });
      else pos.set(n.id, { cx: R.x + R.w * (0.1 + t * 0.8), cy: R.y + R.h / 2 });
    });
  }

  const placedNodes: PlacedNode[] = nodes.map((node) => {
    const p = pos.get(node.id)!;
    const { w, h } = nodeBox(node.kind, orient);
    return { node, cx: p.cx, cy: p.cy, box: { x: p.cx - w / 2, y: p.cy - h / 2, w, h } };
  });
  const nodeById = new Map(placedNodes.map((p) => [p.node.id, p]));

  const placedEdges: PlacedEdge[] = edges.map((edge) => {
    const a = nodeById.get(edge.from)!;
    const b = nodeById.get(edge.to)!;
    const dx = b.cx - a.cx, dy = b.cy - a.cy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    // start/end offset to the node box rims (approx radius along the direction)
    const ra = Math.min(a.box.w, a.box.h) * 0.46;
    const rb = Math.min(b.box.w, b.box.h) * 0.46 + 14; // extra gap for the arrowhead
    const ax = a.cx + ux * ra, ay = a.cy + uy * ra;
    const bx = b.cx - ux * rb, by = b.cy - uy * rb;
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    // bow hub spokes (and vertical splits) a touch so arrows don't stack
    const bow = layout === "hub" ? 46 : 0;
    const cx = mx + (-uy) * bow;
    const cy = my + ux * bow;
    return { edge, ax, ay, bx, by, cx, cy, mx: (ax + 2 * cx + bx) / 4, my: (ay + 2 * cy + by) / 4 };
  });

  const point = (e: PlacedEdge, t: number) => {
    const u = 1 - t;
    return {
      x: u * u * e.ax + 2 * u * t * e.cx + t * t * e.bx,
      y: u * u * e.ay + 2 * u * t * e.cy + t * t * e.by,
    };
  };

  return { layout, nodes: placedNodes, edges: placedEdges, point };
}

/** The SVG path `d` (in scene coords) for an edge arrow: a quadratic curve + a
 *  two-stroke arrowhead at the target end. */
export function edgeArrowStrokes(e: PlacedEdge): string[] {
  const dx = e.bx - e.cx, dy = e.by - e.cy;
  const ang = Math.atan2(dy, dx);
  const head = 26;
  const spread = 0.42;
  const h1x = e.bx - Math.cos(ang - spread) * head, h1y = e.by - Math.sin(ang - spread) * head;
  const h2x = e.bx - Math.cos(ang + spread) * head, h2y = e.by - Math.sin(ang + spread) * head;
  return [
    `M ${e.ax.toFixed(1)} ${e.ay.toFixed(1)} Q ${e.cx.toFixed(1)} ${e.cy.toFixed(1)} ${e.bx.toFixed(1)} ${e.by.toFixed(1)}`,
    `M ${h1x.toFixed(1)} ${h1y.toFixed(1)} L ${e.bx.toFixed(1)} ${e.by.toFixed(1)} L ${h2x.toFixed(1)} ${h2y.toFixed(1)}`,
  ];
}

export const FLOW_COLORS = { green: "#0E7B4F", gold: "#F5B700", danger: "#D64545" } as const;
