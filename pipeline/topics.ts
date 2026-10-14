/**
 * MoneyCogs topic engine (Phase 2A) — the queue + CLI over content/topics.json.
 * Replaces the old xlsx launch-plan + ingest/mark-done scripts; everything is
 * JSON in the repo. Topic lifecycle: queued → done | skipped.
 *
 *   npm run topics:next                       lowest-order queued topic
 *   npm run topics:pick -- <slug>             print a topic
 *   npm run topics:done -- <slug>             mark done + completed_date
 *   npm run topics:skip -- <slug> [--reason]  mark skipped
 *   npm run topics:add  -- --slug .. --title .. --question .. --category .. \
 *                          --payoff .. --demand .. --difficulty ..
 *   npm run topics:list -- [--status S] [--category C]
 *   npm run topics:stats
 *
 * Every load validates the bank (unique slugs/orders, valid enums); corruption
 * exits non-zero with a clear message.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CATEGORIES } from "../remotion/src/schema.js";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOPICS = join(REPO, "content", "topics.json");

export const DEMANDS = ["high", "medium", "low"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const STATUSES = ["queued", "done", "skipped"] as const;
type Demand = (typeof DEMANDS)[number];
type Difficulty = (typeof DIFFICULTIES)[number];
type Status = (typeof STATUSES)[number];

export type Topic = {
  slug: string;
  working_title: string;
  mechanism_question: string;
  category: string;
  payoff: string;
  demand: Demand;
  difficulty: Difficulty;
  status: Status;
  order: number;
  completed_date?: string;
  skip_reason?: string;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Today's date (Nairobi) — matches run_day/fetch_release so bundles line up. */
export function nairobiDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}

function die(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

/** Read + VALIDATE the topic bank. Any corruption exits non-zero. */
export function loadTopics(): Topic[] {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(TOPICS, "utf8"));
  } catch (e) {
    die(`content/topics.json is missing or not valid JSON: ${(e as Error).message}`);
  }
  if (!Array.isArray(raw)) die("content/topics.json must be a JSON array of topics");
  const errs: string[] = [];
  const slugs = new Set<string>();
  const orders = new Set<number>();
  const topics: Topic[] = [];
  (raw as unknown[]).forEach((t, i) => {
    const o = t as Record<string, unknown>;
    const where = `topic[${i}]${typeof o.slug === "string" ? ` "${o.slug}"` : ""}`;
    const str = (k: string) => (typeof o[k] === "string" && (o[k] as string).length ? (o[k] as string) : (errs.push(`${where}: missing/empty "${k}"`), ""));
    const slug = str("slug");
    if (slug && !SLUG_RE.test(slug)) errs.push(`${where}: slug must be kebab-case`);
    if (slug && slugs.has(slug)) errs.push(`${where}: duplicate slug "${slug}"`);
    if (slug) slugs.add(slug);
    str("working_title"); str("mechanism_question"); str("payoff");
    const category = str("category");
    if (category && !(CATEGORIES as readonly string[]).includes(category)) errs.push(`${where}: category "${category}" is not one of ${CATEGORIES.join(" | ")}`);
    const demand = str("demand");
    if (demand && !(DEMANDS as readonly string[]).includes(demand)) errs.push(`${where}: demand "${demand}" is not ${DEMANDS.join("|")}`);
    const difficulty = str("difficulty");
    if (difficulty && !(DIFFICULTIES as readonly string[]).includes(difficulty)) errs.push(`${where}: difficulty "${difficulty}" is not ${DIFFICULTIES.join("|")}`);
    const status = str("status");
    if (status && !(STATUSES as readonly string[]).includes(status)) errs.push(`${where}: status "${status}" is not ${STATUSES.join("|")}`);
    const order = o.order;
    if (typeof order !== "number" || !Number.isInteger(order) || order < 1) errs.push(`${where}: order must be a positive integer`);
    else if (orders.has(order)) errs.push(`${where}: duplicate order ${order}`);
    else orders.add(order);
    topics.push(o as unknown as Topic);
  });
  if (errs.length) {
    console.error("✖ content/topics.json is corrupt:");
    for (const e of errs) console.error(`    • ${e}`);
    process.exit(1);
  }
  // next-integrity: the queue must be orderable (no duplicate orders — checked
  // above — so `next` always resolves a single lowest-order queued topic).
  return topics.sort((a, b) => a.order - b.order);
}

function saveTopics(topics: Topic[]): void {
  topics.sort((a, b) => a.order - b.order);
  writeFileSync(TOPICS, JSON.stringify(topics, null, 2) + "\n");
}

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** Mark a topic done (status + completed_date). Returns false if not found.
 *  Used by the CLI and by run_day.ts (before it commits the day's content). */
export function markDone(slug: string): boolean {
  const topics = loadTopics();
  const t = topics.find((x) => x.slug === slug);
  if (!t) return false;
  t.status = "done";
  t.completed_date = nairobiDate();
  delete t.skip_reason;
  saveTopics(topics);
  return true;
}

// ---------- subcommands ----------
function cmdNext(): void {
  const q = loadTopics().filter((t) => t.status === "queued");
  if (!q.length) {
    console.log("(no queued topics)");
    return;
  }
  const t = q[0]!;
  console.log(`next → ${t.slug}  [#${t.order} · ${t.category} · ${t.demand} demand · ${t.difficulty}]`);
  console.log(JSON.stringify(t, null, 2));
}

function cmdPick(slug: string): void {
  const t = loadTopics().find((x) => x.slug === slug);
  if (!t) die(`no topic with slug "${slug}"`);
  console.log(JSON.stringify(t, null, 2));
}

function cmdDone(slug: string): void {
  if (!markDone(slug)) die(`no topic with slug "${slug}"`);
  const t = loadTopics().find((x) => x.slug === slug)!;
  console.log(`✓ done: ${slug} (completed ${t.completed_date})`);
}

function cmdSkip(slug: string): void {
  const topics = loadTopics();
  const t = topics.find((x) => x.slug === slug);
  if (!t) die(`no topic with slug "${slug}"`);
  t.status = "skipped";
  const reason = flag("reason");
  if (reason) t.skip_reason = reason;
  delete t.completed_date;
  saveTopics(topics);
  console.log(`✓ skipped: ${slug}${reason ? ` (${reason})` : ""}`);
}

function cmdAdd(): void {
  const slug = flag("slug");
  const title = flag("title");
  const question = flag("question");
  const category = flag("category");
  const payoff = flag("payoff");
  const demand = flag("demand");
  const difficulty = flag("difficulty");
  const missing = Object.entries({ slug, title, question, category, payoff, demand, difficulty })
    .filter(([, v]) => !v)
    .map(([k]) => `--${k}`);
  if (missing.length) die(`add needs: ${missing.join(" ")}`);
  if (!SLUG_RE.test(slug!)) die(`--slug must be kebab-case`);
  if (!(CATEGORIES as readonly string[]).includes(category!)) die(`--category must be one of ${CATEGORIES.join(" | ")}`);
  if (!(DEMANDS as readonly string[]).includes(demand!)) die(`--demand must be ${DEMANDS.join("|")}`);
  if (!(DIFFICULTIES as readonly string[]).includes(difficulty!)) die(`--difficulty must be ${DIFFICULTIES.join("|")}`);
  const topics = loadTopics();
  if (topics.some((t) => t.slug === slug)) die(`slug "${slug}" already exists`);
  const order = topics.reduce((m, t) => Math.max(m, t.order), 0) + 1;
  const entry: Topic = {
    slug: slug!, working_title: title!, mechanism_question: question!, category: category!,
    payoff: payoff!, demand: demand as Demand, difficulty: difficulty as Difficulty, status: "queued", order,
  };
  topics.push(entry);
  saveTopics(topics);
  console.log(`✓ added: ${slug} [#${order} · ${category}]`);
}

function cmdList(): void {
  const fStatus = flag("status");
  const fCategory = flag("category");
  let topics = loadTopics();
  if (fStatus) topics = topics.filter((t) => t.status === fStatus);
  if (fCategory) topics = topics.filter((t) => t.category === fCategory);
  console.log(`${"#".padStart(3)}  ${"slug".padEnd(40)}  ${"category".padEnd(24)}  ${"dem".padEnd(6)}  ${"diff".padEnd(6)}  status`);
  for (const t of topics) {
    console.log(`${String(t.order).padStart(3)}  ${t.slug.padEnd(40)}  ${t.category.padEnd(24)}  ${t.demand.padEnd(6)}  ${t.difficulty.padEnd(6)}  ${t.status}`);
  }
  console.log(`\n${topics.length} topic(s)`);
}

function cmdStats(): void {
  const topics = loadTopics();
  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const t of topics) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
  }
  console.log(`Topic bank: ${topics.length} total`);
  console.log("  by status:   " + STATUSES.map((s) => `${s} ${byStatus[s] ?? 0}`).join("   "));
  console.log("  by category:");
  for (const c of CATEGORIES) console.log(`    ${c.padEnd(24)} ${byCategory[c] ?? 0}`);
  const next5 = topics.filter((t) => t.status === "queued").slice(0, 5);
  console.log("  next 5 up:");
  for (const t of next5) console.log(`    #${String(t.order).padStart(3)} ${t.slug.padEnd(40)} (${t.category})`);
}

function main(): void {
  const cmd = process.argv[2];
  const arg = process.argv[3];
  switch (cmd) {
    case "next": return cmdNext();
    case "pick": return arg ? cmdPick(arg) : die("pick needs a <slug>");
    case "done": return arg ? cmdDone(arg) : die("done needs a <slug>");
    case "skip": return arg ? cmdSkip(arg) : die("skip needs a <slug>");
    case "add": return cmdAdd();
    case "list": return cmdList();
    case "stats": return cmdStats();
    default:
      console.error("Usage: tsx pipeline/topics.ts <next|pick|done|skip|add|list|stats> [args]");
      process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
