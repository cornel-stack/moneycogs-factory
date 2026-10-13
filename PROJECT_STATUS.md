# Project status — MoneyCogs video factory

_Last updated: **Phase 0** — rebrand to MoneyCogs + legacy scrub + cron disabled._

MoneyCogs is a daily whiteboard-explainer channel about business & money
**mechanisms**. This repo is a fork of a general whiteboard-video engine; we are
converting it, phase by phase, into the MoneyCogs factory. The render engine,
cast, pipeline, and CI are reused; the brand, content system, and automation are
being rebuilt.

---

## Phase roadmap

- **Phase 0 — identity & scrub (✅ DONE).** New brand config (`moneycogs`), palette,
  voice/runtime policy, playlists. All legacy channel content and dead references
  removed. Scheduled cron disabled. Repo green (install, typecheck, validate, lint,
  a dev render of the sample fixture).
- **Phase 1 — new cast + graphics system.** MoneyCogs cast art, a money/mechanism
  prop & diagram library (cogs, cash-flow arrows, funnels, balance sheets), and any
  new scene types the mechanism format needs.
- **Phase 2 — content system.** Rewrite `template.md` / `schema.md` for mechanism
  explainers; generalize the `part`/`principle` roles and framing; build the topic
  queue (replacing the removed launch-plan/xlsx machinery) and the daily
  `/make-money` authoring skill; re-add the "mark topic done" step in `run_day.ts`.
- **Phase 3 — hardening & cron.** Re-enable `scheduled-render.yml` (add the
  `schedule:` trigger back), end-to-end CI render on real content, failure alerting.
- **Phase 4 — inventory & launch.** Topic backlog at scale, channel art, publishing
  calendar, launch.

---

## Phase 0 — what changed

- **Brand (`config/brands.ts`):** sole brand `moneycogs` (name, wordmark,
  `moneycogs.com`, palette, CTA, disclaimer, `min_minutes` 12 / target 14,
  `prelaunch: true`). `BrandId`/`DEFAULT_BRAND` updated; the prior brand removed entirely.
- **Schema (`remotion/src/schema.ts`):** `BRAND_IDS = ["moneycogs"]`; `CATEGORIES`
  = the 5 MoneyCogs playlists; default `voice` `en-US-ChristopherNeural`, default
  `rate` `-12%`; default framing `explainer`. The `book` object stays **optional**;
  all book-dependent validation is gated on `book` being present, so bookless
  scripts validate cleanly. `part`/`principle` roles kept (Phase 2 generalizes).
- **Audio (`generate_audio.py`):** default voice + `DEFAULT_RATE = "-12%"`.
- **Content scrub:** deleted all videos/articles/tweets, the topic spreadsheet,
  `ingest_launch_plan.py`, `mark_book_done.py`, and the `make-today` skill; reset
  `calendar.json` + `launch-plan.json` to `[]`.
- **Pipeline strings:** `--brand moneycogs` everywhere; `package.ts` emits
  `<id>-video.mp4`, drops the book-attribution line, uses the disclaimer footer, and
  labels the final chapter "The whole machine"; `fetch_release.ts` defaults to
  `~/Videos/moneycogs-factory` and repo `cornel-stack/moneycogs-factory`; removed the
  `launch:ingest` npm script and the daily mark-done step (left a `// TODO Phase 2`).
- **Theme (`remotion/src/theme.ts`):** `COLORS` hexes aligned to the MoneyCogs
  palette (board/ink/cog-green/coin-gold). Layout, fps, draw-speed, and word-rate
  constants untouched.
- **Fixture:** `content/_fixtures/sample-video.json` is now a 10-scene, bookless
  MoneyCogs sample ("How Credit Cards Actually Make Money"); `Root.tsx` default props
  render it.
- **Automation:** `scheduled-render.yml` cron trigger removed (keeps
  `workflow_dispatch`, `dry_run` default true). `render.yml` / `render-shorts.yml` /
  `lint.yml` untouched.
- **Docs:** README + this file rewritten; `package.json` renamed
  `moneycogs-video-factory`; corrected the "no secrets" claim (Azure TTS is an
  optional fallback).

---

## Phase 0 decisions (ambiguities resolved to the smallest green change)

1. **New repo, no origin yet.** This fork was created fresh with no git remote. The
   acceptance asked to hardcode `FETCH_REPO` from `git remote get-url origin`; since
   none exists, it is set to **`cornel-stack/moneycogs-factory`** (owner inferred
   from the source repo). Update it when the real GitHub repo is created.
2. **`danger` color.** The spec's `#D64545` had no slot in the `Brand` shape, so a
   `danger?` field was added to the interface and populated. Not yet consumed by any
   scene (Phase 1 graphics will use it for fees / fine print).
3. **Fixture lives in two places.** The canonical fixture is
   `content/_fixtures/sample-video.json` (imported by `Root.tsx`). A copy is kept at
   `content/videos/sample-video.json` so the CLI tools (`validate_script`,
   `lint_script`, `package`) — which read `content/videos/` — can run against it.
   Phase 2 replaces this with real topics.
4. **Residual "book".** `rg -i book` is intentionally non-empty; the remaining
   matches are all legitimate, not leftover channel identity: (a) the optional
   `book` field + its handling (the `book-structure` framing value,
   lint/thumbnail/derive-shorts fallbacks) — inert when `book` is absent; (b) the
   `book` **drawable prop** (a physical book a character can hold — a prop, not a
   format); (c) `content/template.md`, the legacy writing guide left for Phase 2
   (banner added); (d) this file. Phase 2 rewrites the template and can generalize
   framing/roles.
5. **Default framing → `explainer`.** Since MoneyCogs is not book-based, the schema
   default framing was switched from `book-structure` to `explainer` so bookless
   scripts are the clean default.
