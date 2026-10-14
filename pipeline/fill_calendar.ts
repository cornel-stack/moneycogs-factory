/**
 * Fill the content calendar with WEEKDAY publish dates (Phase 13 — brand+format).
 * Assigns consecutive Mon–Fri dates (Sat/Sun skipped) to a list of renderable
 * ids and upserts them into content/calendar.json. Each entry carries brand +
 * format so the scheduler knows what/how to render.
 *
 *   # one long-form per weekday for a brand
 *   npm run calendar:fill -- --start 2026-10-12 --brand moneycogs --format longform --ids credit-card-interchange,overdraft-fees
 *
 *   # shorts: 3 per weekday for a brand (groups ids into days of 3)
 *   npm run calendar:fill -- --start 2026-10-12 --brand moneycogs --format short --per-day 3 \
 *     --ids credit-card-interchange-s01,credit-card-interchange-s02,credit-card-interchange-s03,...
 *
 * Existing "rendered"/"published" entries are never clobbered.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND_IDS, FORMATS } from "../remotion/src/schema.js";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CAL = join(REPO, "content", "calendar.json");
const TOPICS = join(REPO, "content", "topics.json");

/** slug → category from the topic bank (best-effort; never hard-fails here). */
function topicCategories(): Map<string, string> {
  if (!existsSync(TOPICS)) return new Map();
  try {
    const arr = JSON.parse(readFileSync(TOPICS, "utf8")) as { slug: string; category?: string }[];
    return new Map(arr.filter((t) => t.category).map((t) => [t.slug, t.category!]));
  } catch {
    return new Map();
  }
}
/** Category for a calendar id — direct match, else the parent slug of a short. */
function categoryFor(id: string, m: Map<string, string>): string | undefined {
  return m.get(id) ?? m.get(id.replace(/-s\d+$/, ""));
}

type Status = "scheduled" | "rendered" | "published";
type Entry = {
  video_id: string;
  brand: string;
  format: string;
  publish_date: string;
  status: Status;
  // Phase 14 — session-time machinery: category drives playlists + end-screen
  // grouping; the dates let end-screen picks use true render/publish history.
  category?: string;
  rendered_date?: string;
  published_date?: string;
};

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const DAY_MS = 86_400_000;
const isWeekend = (d: Date) => d.getUTCDay() === 0 || d.getUTCDay() === 6;
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const nextWeekday = (d: Date) => {
  let x = d;
  while (isWeekend(x)) x = new Date(x.getTime() + DAY_MS);
  return x;
};

function main() {
  const start = arg("start");
  const idsRaw = arg("ids");
  const brand = arg("brand") ?? "moneycogs";
  const format = arg("format") ?? "longform";
  const perDay = Math.max(1, parseInt(arg("per-day") ?? "1", 10));
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !idsRaw) {
    console.error("Usage: npm run calendar:fill -- --start YYYY-MM-DD --ids id1,id2,... [--brand moneycogs] [--format longform|short] [--per-day N]");
    process.exit(1);
  }
  if (!(BRAND_IDS as readonly string[]).includes(brand)) { console.error(`✖ bad --brand ${brand}`); process.exit(1); }
  if (!(FORMATS as readonly string[]).includes(format)) { console.error(`✖ bad --format ${format}`); process.exit(1); }

  const ids = idsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!ids.length) { console.error("✖ --ids is empty"); process.exit(1); }

  const cal: Entry[] = existsSync(CAL) ? JSON.parse(readFileSync(CAL, "utf8")) : [];
  const byId = new Map(cal.map((e) => [e.video_id, e]));
  const topicCat = topicCategories();

  let cursor = nextWeekday(new Date(`${start}T00:00:00Z`));
  let onDay = 0;
  for (const id of ids) {
    const date = fmt(cursor);
    const category = categoryFor(id, topicCat); // stamp from the topic bank
    const existing = byId.get(id);
    if (existing && (existing.status === "rendered" || existing.status === "published")) {
      console.warn(`⚠ "${id}" is already ${existing.status} (${existing.publish_date}) — leaving it untouched`);
    } else if (existing) {
      existing.publish_date = date; existing.brand = brand; existing.format = format; existing.status = "scheduled";
      if (category) existing.category = category;
      console.log(`  re-dated  ${format.padEnd(8)} ${brand.padEnd(9)} ${id.padEnd(26)} → ${date}${category ? `  [${category}]` : ""}`);
    } else {
      const e: Entry = { video_id: id, brand, format, publish_date: date, status: "scheduled", ...(category ? { category } : {}) };
      cal.push(e); byId.set(id, e);
      console.log(`  queued    ${format.padEnd(8)} ${brand.padEnd(9)} ${id.padEnd(26)} → ${date}${category ? `  [${category}]` : ""}`);
    }
    // advance to the next weekday every `perDay` ids
    if (++onDay >= perDay) {
      onDay = 0;
      do { cursor = new Date(cursor.getTime() + DAY_MS); } while (isWeekend(cursor));
    }
  }

  cal.sort((a, b) => a.publish_date.localeCompare(b.publish_date) || a.brand.localeCompare(b.brand) || a.format.localeCompare(b.format) || a.video_id.localeCompare(b.video_id));
  writeFileSync(CAL, JSON.stringify(cal, null, 2) + "\n");
  console.log(`\n✓ wrote ${cal.length} entries → content/calendar.json`);
}

main();
