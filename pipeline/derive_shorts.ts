/**
 * Derive vertical shorts from a long-form MoneyCogs script (Phase 2B). Each
 * "point" (section_title role:"point", or the legacy alias "principle") becomes
 * one short — one point's HIDDEN-FLOW moment:
 *   HOOK (synthesized money re-hook) → the section's best story scene
 *   → takeaway card (its application list) → Coggy end-card.
 *
 * This is a MECHANICAL first pass: it picks and re-frames scenes and writes a
 * fresh hook. Narration from the source scenes is reused verbatim (so every
 * sync phrase still resolves). The playbook (scripts/derive-shorts.md) REQUIRES
 * a human pass on every auto-hook (tighten + fact-check + trim to ≤55s) before
 * publish.
 *
 *   npx tsx pipeline/derive_shorts.ts <source-id> [--max N]
 *
 * Writes content/videos/<source-id>-s01.json, -s02.json, … and prints the list.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Script } from "../remotion/src/schema.js";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(REPO, "content", "videos");

// MONEY re-hook formulas (varied by index) — one point's hidden-flow tease.
// Every auto-hook gets a human pass before publish (see scripts/derive-shorts.md).
const HOOK_FORMULAS = [
  (t: string) => `Banks hope you never do the math on ${t.toLowerCase()}.`,
  (t: string) => `${t} has a price tag nobody shows you.`,
  (t: string) => `Here's who really pays for ${t.toLowerCase()}.`,
  (t: string) => `This fee inside ${t.toLowerCase()} pays for someone's vacation.`,
  (t: string) => `Follow the dollar — this is where ${t.toLowerCase()} really goes.`,
  (t: string) => `${t} is built so the house always wins.`,
  (t: string) => `The quiet way ${t.toLowerCase()} makes someone rich.`,
  (t: string) => `What ${t.toLowerCase()} costs you isn't on the receipt.`,
  (t: string) => `Your money leaves a trail — watch it move in ${t.toLowerCase()}.`,
  (t: string) => `Sixty seconds on how ${t.toLowerCase()} actually works.`,
];

function wc(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function main() {
  const srcId = process.argv[2];
  if (!srcId) {
    console.error("Usage: npx tsx pipeline/derive_shorts.ts <source-id> [--max N]");
    process.exit(1);
  }
  const maxArg = process.argv.indexOf("--max");
  const max = maxArg >= 0 ? parseInt(process.argv[maxArg + 1]!, 10) : Infinity;

  const src = Script.parse(JSON.parse(readFileSync(join(DIR, `${srcId}.json`), "utf8")));
  const scenes = src.scenes;

  // Split into short-worthy units: a section_title with a role — "section" (one
  // gear of the machine, the natural short unit) or "point" (a sub-beat; legacy
  // alias "principle" maps to "point" at parse time) — plus the scenes up to the
  // next section_title / recap_card.
  type Section = { num: number; title: string; memory?: string; body: typeof scenes };
  const sections: Section[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i]!;
    if (sc.type === "section_title" && (sc.visual.role === "section" || sc.visual.role === "point")) {
      const body: typeof scenes = [];
      for (let j = i + 1; j < scenes.length; j++) {
        const n = scenes[j]!;
        if (n.type === "section_title" || (n.type === "recap_card")) break;
        body.push(n);
      }
      sections.push({ num: sc.visual.number ?? sections.length + 1, title: sc.visual.title, memory: (sc.visual as { memory?: string }).memory, body });
    }
  }

  const written: string[] = [];
  let idx = 0;
  for (const sec of sections) {
    if (idx >= max) break;
    const story = sec.body.find((s) => s.type === "character_scene");
    const takeaway = sec.body.find((s) => s.type === "list_card");
    if (!story) continue; // a section with no visual story isn't short-worthy
    idx++;
    const n = String(idx).padStart(2, "0");
    const id = `${srcId}-s${n}`;
    const hookLine = HOOK_FORMULAS[(idx - 1) % HOOK_FORMULAS.length]!(sec.title);
    const source = src.title;

    const outScenes: unknown[] = [
      {
        id: "hook",
        type: "character_scene",
        narration: `${hookLine} Here's exactly where the money goes.`,
        visual: {
          stage: "plain",
          elements: [
            { kind: "figure", cast: src.thumbnail.cast, at: { col: 3, row: 1, w: 6, h: 5 }, poses: ["presenting"], expression: "happy", label: "watch this" },
          ],
        },
      },
      { ...story, id: "idea" },
    ];
    // Include the takeaway only if the total stays comfortably ≤ ~55s. The
    // end-card adds ~10 words, so cap hook+idea+takeaway at ~120 words (~48s).
    const baseWords = wc(hookLine) + 4 + wc(story.narration);
    if (takeaway && baseWords + wc(takeaway.narration) <= 120) {
      outScenes.push({ ...takeaway, id: "takeaway" });
    }
    outScenes.push({
      id: "end",
      type: "cta",
      narration: "New money machine, every day. Follow so you don't miss the next one.",
      visual: { text: "New money machine, drawn daily", style: "card" },
    });

    const short = {
      id,
      brand: src.brand,
      format: "short",
      title: `${sec.title} — ${source}`.slice(0, 95),
      short_hook: sec.title,
      ...(src.book ? { book: src.book } : {}),
      description: `${hookLine} The hidden money flow, in sixty seconds.`,
      tags: [...new Set([...(src.tags ?? []).slice(0, 4), sec.title.toLowerCase()])],
      thumbnail: { headline: sec.title.split(/\s+/).slice(0, 5).join(" "), cast: src.thumbnail.cast, pose: "presenting", expression: "happy", props: sec.memory ? [sec.memory] : [] },
      voice: src.voice,
      template: { framing: src.template.framing, hook: "direct" },
      scenes: outScenes,
    };

    // Validate the derived short before writing.
    const parsed = Script.safeParse(short);
    if (!parsed.success) {
      console.error(`✖ derived ${id} is invalid:`);
      for (const iss of parsed.error.issues) console.error(`    ${iss.path.join(".")}: ${iss.message}`);
      continue;
    }
    writeFileSync(join(DIR, `${id}.json`), JSON.stringify(short, null, 2) + "\n");
    written.push(id);
    console.log(`  ✓ ${id}  (${outScenes.length} scenes, ~${baseWords} words)  "${sec.title}"`);
  }

  console.log(`\nDerived ${written.length} shorts from ${srcId}.`);
}

main();
