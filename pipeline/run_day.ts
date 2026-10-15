/**
 * The daily driver. Given a topic <slug> whose longform script ALREADY exists at
 * content/videos/<slug>.json (written + lint-clean via /make-money), it ships the
 * day hands-off:
 *
 *   derive/keep 3 shorts → HOOK-REVIEW GATE → validate → schedule calendar →
 *   mark topic done → commit + push → trigger CI (render.yml + render-shorts.yml
 *   into one content-<date> bundle) → wait for the EXACT dispatched runs →
 *   download into output/<date>/ → flip calendar entries to "rendered" (2nd commit).
 *
 *   npm run day -- <slug>                      full run (blocks ~30-45 min on CI)
 *   npm run day -- <slug> --dry                stop before CI (local check only)
 *   npm run day -- <slug> --skip-hook-review   ship even if a short's hook is still
 *                                              the auto-generated one (emergencies)
 *
 * TTS in CI auto-falls back edge → Azure → Kokoro, so narration never fails.
 *
 * HARDENING (Phase 3):
 *  - Hook-review gate: refuses to ship a short whose hook is byte-identical to
 *    derive_shorts' auto output (the /make-money skill mandates a human rewrite).
 *  - Stale-run guard: watches the run DISPATCHED BY THIS PROCESS (created after
 *    our dispatch timestamp), never just "the latest run on the branch".
 *  - Double-render guard: after a successful render+fetch, flips this day's
 *    calendar entries from "scheduled" to "rendered" and commits — so the
 *    scheduler never re-renders the same ids. (This is a SECOND commit because the
 *    render happens after the day's push; see PROJECT_STATUS Phase 3.)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { markDone } from "./topics.js";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const argv = process.argv.slice(2);
const dry = argv.includes("--dry");
const skipHookReview = argv.includes("--skip-hook-review");
const slug: string = argv.find((a) => !a.startsWith("--")) ?? "";
if (!slug) {
  console.error("Usage: npm run day -- <slug> [--dry] [--skip-hook-review]");
  process.exit(1);
}

const sleep = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const run = (cmd: string, args: string[], env?: NodeJS.ProcessEnv) =>
  execFileSync(cmd, args, { cwd: REPO, stdio: "inherit", env: env ?? process.env });
const cap = (cmd: string, args: string[]) =>
  execFileSync(cmd, args, { cwd: REPO, encoding: "utf8" }).trim();
const step = (n: string) => console.log(`\n▶ ${n}`);

type CalEntry = { video_id: string; brand: string; format: string; publish_date: string; status: string; category?: string; rendered_date?: string };

function main() {
  const scriptPath = join(REPO, "content", "videos", `${slug}.json`);
  if (!existsSync(scriptPath)) {
    console.error(`✖ ${scriptPath} not found — write the longform script first (/make-money).`);
    process.exit(1);
  }
  const date = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  const tag = `content-${date}`;
  const branch = cap("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  console.log(`Day run: ${slug}  →  bundle ${tag}  (branch ${branch})`);

  // 1. derive shorts (keeps existing hand-written shorts — never clobbers hooks)
  step("1/8 derive 3 shorts");
  run("npx", ["tsx", "pipeline/derive_shorts.ts", slug, "--max", "3"]);
  const shortIds = readdirSync(join(REPO, "content", "videos"))
    .filter((f) => new RegExp(`^${slug}-s\\d+\\.json$`).test(f))
    .map((f) => f.replace(/\.json$/, ""))
    .sort()
    .slice(0, 3);
  if (shortIds.length === 0) {
    console.error('✖ derive_shorts produced no shorts (does the longform have section/point markers — section_title role:"section" or "point"?)');
    process.exit(1);
  }
  console.log(`  shorts: ${shortIds.join(", ")}`);

  // 1b. HOOK-REVIEW GATE — refuse to ship an un-rewritten (auto) hook.
  step("1b/8 hook-review gate");
  if (skipHookReview) {
    console.warn("  ⚠ --skip-hook-review: shipping without the hook check (emergency only)");
  } else {
    const autoRaw = cap("npx", ["tsx", "pipeline/derive_shorts.ts", slug, "--max", "3", "--print-hooks"]);
    const auto = new Map<string, string>();
    for (const line of autoRaw.split("\n")) {
      const [id, ...rest] = line.split("\t");
      if (id && rest.length) auto.set(id.trim(), rest.join("\t").trim());
    }
    const stale: string[] = [];
    for (const id of shortIds) {
      const sc = JSON.parse(readFileSync(join(REPO, "content", "videos", `${id}.json`), "utf8")) as { scenes: { narration: string }[] };
      const hook = (sc.scenes[0]?.narration ?? "").trim();
      if (auto.get(id) && hook === auto.get(id)) stale.push(id);
    }
    if (stale.length) {
      console.error(`✖ hook-review gate: these shorts still have the auto-generated hook — rewrite them (see scripts/derive-shorts.md) or pass --skip-hook-review:`);
      for (const id of stale) console.error(`    • ${id}`);
      process.exit(1);
    }
    console.log(`  ✓ all ${shortIds.length} short hooks are hand-written`);
  }

  // 2. validate (schema + sync phrases) — longform + shorts
  step("2/8 validate");
  for (const id of [slug, ...shortIds]) run("npx", ["tsx", "pipeline/validate_script.ts", id]);

  // 3. schedule the calendar (today); category is stamped from the topic bank.
  step("3/8 schedule calendar");
  run("npx", ["tsx", "pipeline/fill_calendar.ts", "--start", date, "--brand", "moneycogs", "--format", "longform", "--ids", slug]);
  run("npx", ["tsx", "pipeline/fill_calendar.ts", "--start", date, "--brand", "moneycogs", "--format", "short", "--per-day", "3", "--ids", shortIds.join(",")]);

  if (dry) {
    console.log("\n✓ dry run complete — local only (no commit/push/CI). Shorts, hook gate, validation, and calendar are ready.");
    return;
  }

  // 3b. mark the topic done BEFORE the commit, so the status change ships WITH the
  // day's content (never left dirty).
  step("3b/8 mark topic done");
  if (markDone(slug)) console.log(`  topics.json: ${slug} → done`);
  else console.warn(`  (⚠ ${slug} is not in content/topics.json — skipping mark-done)`);

  // 4. commit + push the day's content (calendar entries are "scheduled" here)
  step("4/8 commit + push");
  run("git", ["add", "-A"]);
  if (cap("git", ["status", "--porcelain"]).length) run("git", ["commit", "-q", "-m", `day: ${slug} + ${shortIds.length} shorts (${date})`]);
  else console.log("  (nothing to commit)");
  run("git", ["push"]);

  // 5. trigger CI into one bundle Release (stale-run guarded: remember when we
  // dispatch, then match the run created after that timestamp).
  step("5/8 trigger CI");
  const sinceLong = dispatchStamp();
  run("gh", ["workflow", "run", "render.yml", "--ref", branch, "-f", `video_id=${slug}`, "-f", `release_tag=${tag}`]);
  const longRun = runAfter("render.yml", branch, sinceLong);
  const sinceShort = dispatchStamp();
  run("gh", ["workflow", "run", "render-shorts.yml", "--ref", branch, "-f", `ids=${shortIds.join(",")}`, "-f", `release_tag=${tag}`]);
  const shortRun = runAfter("render-shorts.yml", branch, sinceShort);
  console.log(`  render.yml run ${longRun ?? "?"}, render-shorts.yml run ${shortRun ?? "?"}`);
  if (!longRun || !shortRun) {
    console.error("✖ could not identify the dispatched run(s) — check the Actions tab; not watching a possibly-wrong run.");
    process.exit(1);
  }

  // 6. wait for BOTH exact runs (exit non-zero on failure)
  step("6/8 wait for CI");
  run("gh", ["run", "watch", shortRun, "--exit-status"]);
  run("gh", ["run", "watch", longRun, "--exit-status"]);

  // 7. download the finished bundle into output/<date>/
  step("7/8 download → output/" + date);
  run("npx", ["tsx", "pipeline/fetch_release.ts", "--today"], { ...process.env, FETCH_DIR: join(REPO, "output", date) });

  // 8. DOUBLE-RENDER GUARD — flip this day's calendar entries to "rendered" and
  // commit, so a later scheduled run won't render the same ids again.
  step("8/8 flip calendar → rendered");
  flipRendered([slug, ...shortIds], date);
  run("git", ["add", "content/calendar.json"]);
  if (cap("git", ["status", "--porcelain", "content/calendar.json"]).length) {
    run("git", ["commit", "-q", "-m", `calendar: ${tag} rendered [skip ci]`]);
    run("git", ["push"]);
    console.log("  ✓ calendar entries flipped to rendered + pushed");
  } else {
    console.log("  (calendar already up to date)");
  }

  console.log(`\n✅ ${slug}: longform + ${shortIds.length} shorts rendered → output/${date}/  (topic done, calendar rendered)`);
}

/** A timestamp a few seconds in the past (UTC ISO) to absorb clock skew when
 *  matching the run we just dispatched. */
function dispatchStamp(): string {
  return new Date(Date.now() - 20_000).toISOString();
}

/** The workflow_dispatch run on `branch` created at/after `since` (ours), not
 *  merely "the latest run" — avoids latching onto a pre-existing run. */
function runAfter(workflow: string, branch: string, since: string): string | null {
  for (let i = 0; i < 10; i++) {
    sleep(5000);
    try {
      const out = cap("gh", ["run", "list", "--workflow", workflow, "--branch", branch, "--event", "workflow_dispatch", "--limit", "15", "--json", "databaseId,createdAt"]);
      const arr = (JSON.parse(out) as { databaseId: number; createdAt: string }[])
        .filter((r) => r.createdAt >= since)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      if (arr[0]) return String(arr[0].databaseId);
    } catch {
      /* retry */
    }
  }
  return null;
}

/** Flip the day's entries from "scheduled" to "rendered" (+rendered_date). */
function flipRendered(ids: string[], date: string): void {
  const calPath = join(REPO, "content", "calendar.json");
  if (!existsSync(calPath)) return;
  const cal = JSON.parse(readFileSync(calPath, "utf8")) as CalEntry[];
  for (const e of cal) {
    if (ids.includes(e.video_id) && e.status === "scheduled") {
      e.status = "rendered";
      e.rendered_date = date;
    }
  }
  writeFileSync(calPath, JSON.stringify(cal, null, 2) + "\n");
}

main();
