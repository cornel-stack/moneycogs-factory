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
| `content/template.md` · `content/schema.md` | writing guide + schema reference (Phase 2 rewrites for mechanisms) |
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

**Phase 0 complete** — rebranded to MoneyCogs, legacy channel content scrubbed, cron
disabled. See [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) for the phase roadmap and
Phase 0 decisions. The content system, topic queue, and daily `/make-money` skill
arrive in Phase 2.
