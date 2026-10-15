# MoneyCogs — video factory

**MoneyCogs** makes daily whiteboard explainers of business & money **mechanisms** —
*how credit cards actually make money*, *why insurance is structurally profitable*,
*where your bank fees really go*. Hand-drawn cast, animated data, one machine per video.

> **How the money machine really works — drawn by hand.**

This repo is the production factory: a script becomes a finished, uploadable video
package with zero per-video code. It is a fork of a general whiteboard-video engine,
re-aimed at MoneyCogs.

---

## How it works (audio-first pipeline)

```
content/videos/<id>.json          ← the script (one JSON file per video)
        │
        ▼  pipeline/generate_audio.py        TTS → per-scene MP3 + per-word timings
        ▼  pipeline/build_manifest.ts        measured audio → frame timing manifest
        ▼  pipeline/build_captions.ts        word timings → captions.srt
        ▼  remotion render (Main)            React/Remotion draws scenes, synced to narration
        ▼  pipeline/package.ts               → output/<id>/ upload package
```

Narration audio is the **source of truth for all timing** — animation and captions
are aligned to the spoken word. Heavy renders fan out across GitHub Actions in
parallel chunks; the daily driver bundles a long-form video + its shorts into one
dated GitHub Release.

**Output per video** (`output/<id>/`): `<id>-video.mp4`, `captions.srt`,
`thumbnail.png` (+ 1280×720), `description.txt`, `upload-notes.txt`,
`retention-map.txt`.

---

## Repo layout

| Path | What |
|------|------|
| `content/videos/*.json` | video scripts (Zod-validated) |
| `content/_fixtures/sample-video.json` | the MoneyCogs sample fixture (also Studio default props) |
| `content/topics.json` | the **topic bank** — 100 money-mechanism topics + queue (Phase 2A) |
| `content/calendar.json` | publishing calendar (brand/format/category per id) |
| `content/template.md` · `content/schema.md` | the **MoneyCogs writing guide** + schema reference (scene types + JSON examples) |
| `config/brands.ts` | **brand identity** (palette, CTA, runtime policy) — the only place it lives |
| `remotion/src/` | the render engine: scenes, cast, drawing hand, effects, `theme.ts` |
| `pipeline/*.ts · *.py` | audio, manifest, captions, package, shorts, calendar, daily driver |
| `.github/workflows/` | `render.yml`, `render-shorts.yml`, `scheduled-render.yml`, `lint.yml` |

---

## Commands

```bash
npm install
npm run studio                       # Remotion Studio (opens on the sample fixture)
npm run build:video -- <id>          # full local build of content/videos/<id>.json
npx tsx pipeline/validate_script.ts <id>   # schema + sync-phrase check (fast, no audio)
npm run typecheck                    # tsc --noEmit
npm run day -- <id>                  # autonomous: shorts → CI → download (Phase 3 cron)
npm run fetch -- --today             # pull today's finished bundle locally
```

---

## Topic engine (Phase 2A)

`content/topics.json` is the **topic bank**: 100 evergreen money-mechanism topics
(~20 per brand category), each with a `working_title`, a `mechanism_question`, the
one-line `payoff`, `demand`/`difficulty` judgments, and an integer `order`
(priority). Each topic is answerable from first principles with worked dollar
examples and names a money-flow a scene can draw. The `slug` becomes the video id.

**Lifecycle:** every topic starts `queued`. Producing it moves it to `done`
(with a `completed_date`); setting it aside moves it to `skipped` (with an
optional `skip_reason`). `npm run day -- <slug>` marks the topic `done`
automatically — _before_ the day's commit, so the status change ships with the
content (never left dirty).

```bash
npm run topics:next                        # the lowest-order queued topic (full entry)
npm run topics:pick  -- <slug>             # print one topic
npm run topics:done  -- <slug>             # mark done + completed_date (Nairobi)
npm run topics:skip  -- <slug> --reason .. # mark skipped
npm run topics:add   -- --slug .. --title .. --question .. \
                        --category .. --payoff .. --demand .. --difficulty ..
npm run topics:list  -- --status queued --category "How Banks Win"
npm run topics:stats                       # counts by status/category + next 5 up
```

Every load **validates** the bank (unique slugs + orders, valid
category/status/demand/difficulty); corruption exits non-zero with a clear
message. `fill_calendar.ts` stamps each calendar entry's `category` from the
topic bank, and `validate_script.ts` warns if a script's declared category
disagrees with its topic.

---

## Writing a video (Phase 2B)

[`content/template.md`](content/template.md) is the MoneyCogs writing system:
one video = one money **machine**, taken apart gear by gear. Every longform
follows a fixed skeleton — **cold hook → money_flow overview → 4-5 sections
(surface story vs hidden flow, with worked dollar numbers) → winners/losers →
recap → disclaimer + Coggy CTA** — and a scene-type budget that keeps it
graphics-heavy (≥2 `money_flow`, ≥1 `waterfall`/`counter`, ≥1 `compare`/`table`).
Scene JSON shapes come from [`content/schema.md`](content/schema.md); the guide
links them rather than repeating them. Section titles use canonical roles
`section`/`point` (the book-era `part`/`principle` still validate as aliases).
Shorts are one point's hidden-flow moment — see
[`scripts/derive-shorts.md`](scripts/derive-shorts.md).

---

## The daily flow — `/make-money` (Phase 2C)

The whole day runs from one skill. In a Claude Code session, invoke
**`/make-money`** (optionally `/make-money <topic-slug>` to override the queue
pick). The runbook ([`.claude/skills/make-money/SKILL.md`](.claude/skills/make-money/SKILL.md))
walks a fresh session through: **pick** (`topics:next`) → **study**
(`template.md` + `schema.md` + the golden script) → **design the machine** (the
money_flow map + worked numbers, all arithmetic verified) → **write** the
longform → **validate + lint until clean** → **fact pass** (nothing stale or
company-specific) → **derive + hand-rewrite 3 shorts** → **ship**
(`npm run day -- <slug>`). Hard rules baked in: no news / no named-company
facts, education-not-advice framing, numbers verifiable from the script's own
arithmetic, and a failure protocol (never `SKIP_RUNTIME_GUARD` in the daily
flow; fix the sync/narration pair, don't skip it).

The **golden reference script** is
[`content/videos/how-credit-cards-make-money.json`](content/videos/how-credit-cards-make-money.json)
— a full ~14-min longform + 3 shorts, lint-clean with zero warnings. It is the
quality bar every new video is written against.

---

## Daily operations (Phase 3)

Two ways a day ships, both landing in one dated GitHub Release `content-<date>`:

- **Automatic** — `scheduled-render.yml` runs on cron **weekdays 03:47 UTC
  (06:47 EAT)** and renders every calendar entry with `publish_date <= today` and
  `status: "scheduled"` (it self-heals a missed day). On success each entry flips
  to `rendered` via a bot commit; failures open an issue and the entry retries the
  next weekday. A day with nothing due simply renders nothing.
- **Hands-on** — `npm run day -- <slug>` (used for the first production day) runs
  the whole chain from your machine: keep/derive 3 shorts → **hook-review gate** →
  validate → schedule the calendar → mark the topic done → commit + push → trigger
  CI → watch the **exact** dispatched runs → download the bundle into
  `output/<date>/` → flip the calendar to `rendered`. Add `--skip-hook-review` only
  in emergencies; never `SKIP_RUNTIME_GUARD` in the daily flow.

**Guardrails baked in:** a short won't ship with an un-rewritten auto hook
(hook-review gate); a scheduled entry with a missing script is skipped with a
warning + issue, never fatal (calendar sanity); a rendered day can't be
re-rendered (double-render guard flips it to `rendered`); `run_day` watches only
the runs it dispatched (stale-run guard); and CI opens an issue if TTS ever falls
all the way back to the offline Kokoro voice (add Azure secrets to avoid it). The
longform runtime guard allows **±15%** of the 14-min target to absorb the ~15%
duration spread between the edge-tts (CI) and Kokoro (offline) voices.

**Fetch any day's bundle** (if you didn't run `npm run day` locally):

```bash
npm run fetch -- --today            # today's content-<date> Release → output/<date>/
```

**A production day in numbers** (the first one, credit cards): ~7.5 min
wall-clock, ~43 billed CI minutes; one 14:30 longform (1920×1080) + three 31–36s
shorts (1080×1920), with captions, two thumbnails, description (A/B titles +
chapters + hashtags), upload notes, a retention map, and per-platform shorts text.

---

## Brand & configuration

All brand identity lives in **`config/brands.ts`** (brand id `moneycogs`):

- **Palette** — primary `#0E7B4F` cog green · accent `#F5B700` coin gold ·
  danger `#D64545` · ink `#1C1C1C` · board `#FBFAF6`. These flow into every scene
  via the brand layer; shared `remotion/src/theme.ts` constants are kept aligned.
- **Voice** — `en-US-ChristopherNeural` at rate `-12%` (default; override per script).
- **Runtime** — long-form ≥ 12 min (target 14); shorts 20–70s, 3/day.
- **Playlists** — Everyday Money Machines · How Banks Win · The Business Behind It ·
  Investing Mechanics · Traps & Fine Print.

## Secrets

The pipeline runs with **no secrets by default**: TTS uses free Edge voices, and
public GitHub Releases are fetched without auth. **Azure Speech is an optional
fallback** — set `AZURE_SPEECH_KEY` (+ `AZURE_SPEECH_REGION`) as repo secrets to make
CI narration resilient if Edge is rate-limited (it auto-falls back edge → azure →
offline Kokoro). Nothing else needs a key.

---

## Status

**Phases 0–3 complete.** MoneyCogs is a working daily factory: brand + visual
system (0–1), topic bank + writing system + `/make-money` skill (2), and the
hardened, cron-driven daily pipeline (3). The first production day shipped the
golden credit-cards longform + 3 shorts, rendered on CI and verified. The
scheduler runs weekdays at 03:47 UTC. Next is **Phase 4 — inventory & launch**
(scale the topic backlog, channel art, publishing calendar, launch). See
[`PROJECT_STATUS.md`](./PROJECT_STATUS.md) for the full roadmap and per-phase
decisions.
