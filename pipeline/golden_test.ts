/**
 * Golden snapshot tests (Phase 1C). Deterministic structural snapshots of the
 * new signature graphics — money_flow layout geometry, waterfall bands, and the
 * counter target — computed with the SAME pure helpers the renderer uses, so a
 * regression in the layout/chart math fails here before any render.
 *
 * Usage:
 *   tsx pipeline/golden_test.ts            # compare against committed goldens
 *   tsx pipeline/golden_test.ts --update   # (re)write the goldens
 *
 * Goldens live in content/_goldens/<video-id>.flow.json.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Script, Scene, StatChartVisual, MoneyFlowVisual } from "../remotion/src/schema.js";
import { layoutFlow, edgeArrowStrokes } from "../remotion/src/drawing/flowLayout.js";
import { waterfallBars } from "../remotion/src/drawing/charts.js";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VIDEO_IDS = ["sample-video"];
// The SAME region MoneyFlow.tsx hands to the horizontal diagram (1920×1080).
const FLOW_REGION = { x: 120, y: 230, w: 1920 - 240, h: 1080 - 230 - 120 };
const r1 = (n: number) => Math.round(n * 10) / 10;

function snapshotScene(scene: any): unknown {
  if (scene.type === "money_flow") {
    const v = scene.visual;
    const plan = layoutFlow(v.nodes, v.edges, { layout: v.layout, region: FLOW_REGION, orient: "h" });
    return {
      type: "money_flow",
      layout: plan.layout,
      nodes: plan.nodes.map((p: any) => ({ id: p.node.id, kind: p.node.kind, cx: r1(p.cx), cy: r1(p.cy), w: p.box.w, h: p.box.h })),
      edges: plan.edges.map((e: any) => ({ from: e.edge.from, to: e.edge.to, color: e.edge.color, mx: r1(e.mx), my: r1(e.my), strokes: edgeArrowStrokes(e) })),
    };
  }
  if (scene.type === "stat_chart" && (scene.visual.mode === "waterfall" || scene.visual.mode === "counter")) {
    const v = scene.visual;
    if (v.mode === "counter") return { type: "counter", prefix: v.prefix ?? null, suffix: v.suffix ?? null, target: v.datapoints[0].value, label: v.datapoints[0].label };
    return {
      type: "waterfall",
      prefix: v.prefix ?? null,
      bars: waterfallBars(v.datapoints.map((d: any) => d.value)).map((b) => ({ index: b.index, kind: b.kind, topV: r1(b.topV), botV: r1(b.botV), label: v.datapoints[b.index].label })),
    };
  }
  return null;
}

function snapshotVideo(id: string): Record<string, unknown> {
  const raw = JSON.parse(readFileSync(join(REPO, "content", "videos", `${id}.json`), "utf8"));
  const script = Script.parse(raw);
  const out: Record<string, unknown> = {};
  for (const scene of script.scenes) {
    const snap = snapshotScene(scene);
    if (snap) out[scene.id] = snap;
  }
  return out;
}

/** Validate every ```json fenced block in schema.md that is a scene or a known
 *  visual, so the copy-paste examples stay valid verbatim. Returns failure count. */
function validateDocs(): number {
  const md = readFileSync(join(REPO, "content", "schema.md"), "utf8");
  const blocks = [...md.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => m[1]!.trim());
  let fails = 0;
  let ok = 0;
  for (const block of blocks) {
    let obj: any;
    try { obj = JSON.parse(block); } catch { continue; } // skip non-JSON / snippet blocks
    let res: { success: boolean; error?: any } | null = null;
    let kind = "";
    if (obj && typeof obj === "object" && typeof obj.type === "string" && obj.visual) { res = Scene.safeParse(obj); kind = `scene:${obj.type}`; }
    else if (obj && obj.mode && obj.datapoints) { res = StatChartVisual.safeParse(obj); kind = "stat_chart.visual"; }
    else if (obj && obj.nodes && obj.edges) { res = MoneyFlowVisual.safeParse(obj); kind = "money_flow.visual"; }
    if (!res) continue;
    if (res.success) { ok++; }
    else {
      fails++;
      console.error(`✖ schema.md example (${kind}) is INVALID:`);
      for (const i of res.error.issues) console.error(`    • ${i.path.join(".") || "(root)"}: ${i.message}`);
    }
  }
  if (fails === 0) console.log(`✓ schema.md examples validate (${ok} block(s))`);
  return fails;
}

function main() {
  const update = process.argv.includes("--update");
  const goldDir = join(REPO, "content", "_goldens");
  if (!existsSync(goldDir)) mkdirSync(goldDir, { recursive: true });
  let failed = 0;
  let checked = 0;
  for (const id of VIDEO_IDS) {
    const actual = snapshotVideo(id);
    const goldPath = join(goldDir, `${id}.flow.json`);
    const actualStr = JSON.stringify(actual, null, 2);
    if (update) {
      writeFileSync(goldPath, actualStr + "\n");
      console.log(`✎ wrote golden ${id} (${Object.keys(actual).length} scenes)`);
      continue;
    }
    if (!existsSync(goldPath)) {
      console.error(`✖ missing golden for ${id} — run: tsx pipeline/golden_test.ts --update`);
      failed++;
      continue;
    }
    const expected = readFileSync(goldPath, "utf8").trim();
    checked += Object.keys(actual).length;
    if (actualStr.trim() !== expected) {
      console.error(`✖ golden mismatch for ${id}. Scenes: ${Object.keys(actual).join(", ")}`);
      // show the first differing line
      const a = actualStr.split("\n");
      const b = expected.split("\n");
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] !== b[i]) {
          console.error(`  first diff at line ${i + 1}:\n    expected: ${b[i] ?? "(none)"}\n    actual:   ${a[i] ?? "(none)"}`);
          break;
        }
      }
      failed++;
    } else {
      console.log(`✓ golden ${id}: ${Object.keys(actual).length} scene snapshot(s) match (${Object.keys(actual).join(", ")})`);
    }
  }
  if (!update) failed += validateDocs();
  if (!update && failed === 0) console.log(`✓ all goldens match (${checked} scene snapshot(s)) + docs valid`);
  if (failed > 0) process.exit(1);
}

main();
