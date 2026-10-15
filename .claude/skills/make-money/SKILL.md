---
name: make-money
description: >-
  The MoneyCogs daily production runbook. Invoke as /make-money (optionally with
  a topic slug to override the queue pick) to produce one full day: pick a topic
  from the bank, write the longform mechanism-explainer script, validate + lint
  it clean, fact-check it, derive and hand-rewrite 3 shorts, then ship with
  `npm run day`. Use when the user wants to make today's MoneyCogs video, run the
  daily flow, or produce a specific topic.
---

# /make-money — the MoneyCogs daily runbook

Produce ONE complete day of MoneyCogs content from a topic to a rendered,
downloaded longform + 3 shorts. This runbook is self-contained: a fresh Claude
Code session can run the whole day from it. **Do the steps in order. Don't skip
the validate/lint/fact gates.**

MoneyCogs explains **money & business mechanisms** as whiteboard explainers —
one video = one *machine*, taken apart gear by gear, with worked dollar numbers
and the money drawn as it flows. The reference quality bar is the golden script
`content/videos/how-credit-cards-make-money.json`.

**Argument:** `/make-money [<topic-slug>]`. With no slug, the topic is the
queue's next pick; with a slug, that topic (via `topics:pick`).

---

## Non-negotiable rules (read first)

- **No news, no current events, no named-company facts.** No live prices,
  "today's" interest rates, market levels, or filings/inside stories about a
  named company. A famous business *model* as a generic mechanism is fine ("why
  razors are cheap and blades aren't"); an exposé about a named company is not.
  The script must survive **"is this still true in five years?"**
- **Education, not advice.** Explain how the machine works; never tell the viewer
  what to do with their money. Every longform ends with a brief spoken
  "this is how the machine works, not financial advice" + the Coggy CTA.
- **Numbers must be self-consistent and verifiable from the script's own
  arithmetic.** Use round anchors ($100 purchase, $1,000 balance, $2,000/yr
  habit) and compute every derived figure.
- **Sync phrases are spelled-out words only** — never digits, `$`, or `%`.
- **Treat lint warnings as errors** for the daily flow (step 5).

---

## Step 1 — PICK

```bash
npm run topics:next            # no-slug: the lowest-order queued topic
npm run topics:pick -- <slug>  # slug given: that topic
```
Read the entry: `mechanism_question` (the one question the video answers),
`payoff` (the takeaway), `category` (stamp it on the script), `difficulty` (how
much worked-numeric material to budget). The `slug` is the video id.

## Step 2 — STUDY (before writing anything)

Read, end to end:
- `content/template.md` — the writing system (skeleton, number rules, cast,
  scene budget, SEO). This is the law.
- `content/schema.md` — the scene-type JSON shapes + copy-paste examples
  (`section_title`, `character_scene`, `money_flow`, `stat_chart`
  waterfall/counter, `compare`, `table`, `list_card`, `recap_card`, `cta`).
- `content/videos/how-credit-cards-make-money.json` — the golden reference, for
  structure + texture (this is the quality bar, match it).

## Step 3 — DESIGN THE MACHINE (in the session, as notes — not a file)

Before any scenes, write the mechanism map:
- the **money_flow OVERVIEW**: nodes (who), edges (what flows), amounts;
- the **4 sections**, each with **one worked example** (surface story → hidden
  flow with numbers);
- **who wins / who loses**.

**Verify all arithmetic by computing it.** Every amount on an edge/step/counter
must add up ($100 = $97.10 + $1.80 + $1.10; a $1,000 balance at "around twenty
percent" ≈ $200/yr interest). If the numbers don't reconcile, fix the design
before writing a single scene.

## Step 4 — WRITE  → `content/videos/<slug>.json`

Per `content/template.md`:
- `brand: "moneycogs"`, `format: "longform"`, `template.framing: "explainer"`.
- **~2,000–2,100 words**, **40–60 scenes**, **~14 min** (brand floor 12).
- The skeleton: cold hook (promise within 15s) → money_flow overview →
  SECTIONS 1..4 (`section_title` `role:"section"`; surface `character_scene` then
  hidden flow via money_flow/waterfall/counter/compare/table with worked numbers;
  one-line re-hook to close each) → who wins/who loses (`compare`/`list_card`) →
  `recap_card` `scope:"final"` → disclaimer + Coggy `cta`.
- **Scene-type budget:** ≥2 `money_flow` (overview + ≥1 section), ≥1
  `waterfall`/`counter`, ≥1 `compare`/`table`.
- `promise` = the verbatim core-promise sentence (spoken by 15s).
- 3 `title_variants` from the formulas (search-led / curiosity-led / benefit-led);
  `thumbnail.punch_words` (2–4, include a number); `category` from the topic;
  `pinned_comment` (one engagement question); `description` (keyword-rich first
  two lines, ≤3 hashtags).
- **Cast:** 2–4 recurring members by archetype (penny=customer, ledger=banker,
  rosa=merchant, sterling=CEO, vera=investor, joe=worker, norma=regulator,
  felix=tax, slick=traps, keys=landlord); **same character = same role**; **Coggy
  only in the CTA**.
- **Sync phrases copied word-for-word from that scene's narration**; spelled-out
  words only (no digits/$/%). Numbers spelled out in narration.
- **Density:** something new on screen every ≤8s. In each scene, spread synced
  elements/poses/datapoints/edges across its narration so there's no dead window
  (longer scenes need 2–3 synced beats).

## Step 5 — VALIDATE LOOP (fix until clean)

```bash
npx tsx pipeline/validate_script.ts <slug>   # schema + sync phrases (no audio)
# then generate audio + manifest so lint can measure timing:
TTS_PROVIDER=auto npx tsx pipeline/generate_audio.py <slug>   # (uses .venv python)
npx tsx pipeline/build_manifest.ts <slug>                     # NO SKIP_RUNTIME_GUARD
npx tsx pipeline/lint_script.ts <slug>
```
Fix until `validate` exits 0 and `lint` shows **zero warnings** (density OK, no
collisions, promise ≤15s, scene budget met, no lone figures, no narrated list
that isn't shown). **Treat every lint warning as an error.** Tip: density/budget
fixes that only add/retime **synced elements** (not narration) don't require
re-synthesizing audio — only a narration change does.

## Step 6 — FACT PASS (re-read as a skeptic)

Re-read the finished narration and flag any claim that is (a) **stale-able**
(current rates/prices), (b) **company-specific**, or (c) **numerically
unverifiable** from the script's own arithmetic. Rewrite to typical/range
framing ("around two percent", "roughly half") or cut. Re-validate if narration
changed.

## Step 7 — SHORTS

```bash
npx tsx pipeline/derive_shorts.ts <slug> --max 3
```
One short per short-worthy unit — each **section (gear)**, or a `role:"point"`
sub-beat. Then **hand-rewrite every auto-hook** per `scripts/derive-shorts.md` (mandatory —
the auto-hooks are drafts). For each short: fix the hook into a real
scroll-stopper for that point, confirm it's true + non-stale, trim to ≤55s,
recenter the figure if needed. **Report the before/after hooks.** Re-validate the
shorts: `npx tsx pipeline/validate_script.ts <slug>-s01` (…-s02, -s03).

## Step 8 — SHIP

```bash
npm run day -- <slug>          # derive → validate → calendar → commit/push → CI → fetch → topic done
npm run day -- <slug> --dry    # when asked: local only, stops before CI
```
`run_day` marks the topic **done** before it commits (status ships with the
content). Confirm: the render completed, `fetch_release` downloaded into
`output/<date>/`, the topic is `done` (`npm run topics:pick -- <slug>`).
**Report** the output paths, the final durations (longform + each short), and the
three title variants.

---

## FAILURE PROTOCOL

- **Runtime guard rejects the duration** (longform must land ≈ ±10% of 14 min and
  ≥ 12 min; a short 20–70s). **Do NOT set `SKIP_RUNTIME_GUARD` in the daily flow.**
  Too short → **expand a section's worked example** (add a chart step, a second
  worked number, a who-wins beat) — never pad narration with filler. Too long →
  tighten the weakest section or merge two thin scenes; cut adjectives, not
  numbers.
- **A sync phrase fails the manifest** ("sync phrase not found in narration").
  **Fix the narration/sync pair** so the phrase is a verbatim spelled-out
  substring of that scene's narration — never work around it by skipping the
  guard or deleting the sync. Re-synthesize that script's audio and rebuild the
  manifest.
- **Lint density dead window.** Add a synced beat (a pose swing, a reveal prop, a
  datapoint, a money_flow edge) in the gap — anchored to a phrase already spoken
  in that window.
- **Scene-budget warning** (<2 money_flow, or no waterfall/counter). Add the
  missing graphic where a section's hidden flow belongs — don't just relabel.
- **TTS:** `generate_audio` auto-falls back edge → Azure → Kokoro; narration never
  fails. (edge works in CI; Kokoro is the offline local fallback.)
