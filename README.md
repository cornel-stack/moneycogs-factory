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
| `content/calendar.json` · `content/launch-plan.json` | publishing calendar + topic queue (empty until Phase 2) |
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
