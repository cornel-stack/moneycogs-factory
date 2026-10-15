# Project status — MoneyCogs video factory

_Last updated: **Phase 2 — COMPLETE** (topic engine + writing system + daily `/make-money` skill + the golden credit-cards reference script). Phase 1 (full visual system) is complete._

## Phase 1 — COMPLETE

The MoneyCogs visual system is now in place. What it contains:
- **Cast (1A):** 10 flat-vector money archetypes (Penny, Ledger, Rosa, Sterling,
  Vera, Joe, Norma, Felix, Slick, Keys) with 5 skin tones, dominant wardrobe
  blocks, big readable faces (happy/worried/shocked/curious), per-role signature
  props, and the **Coggy** coin-gear mascot (point/wave/thumbs-up/spin).
- **Props (1B):** 25 money props + the pre-existing metaphor library, every shape
  explicitly filled (ink is outlines + small darks only).
- **Stages (1B):** 5 money stages (bank-interior, storefront, kitchen-table,
  boardroom, street-market) in light muted tones so foreground pops.
- **Scene types (1C):** the signature **`money_flow`** animated diagram (nodes +
  hand-drawn arrows synced to narration, coins travelling, amount tags) plus
  `stat_chart` **`waterfall`** and **`counter`** modes — all with vertical variants.
- **Drawing hand (1D):** the photographed hand (`remotion/public/hand/`) works and
  is committed; renders must pass `--public-dir=remotion/public` (the pipeline +
  CI already do). A fail-fast check now guards the grip PNGs.
- **Pipeline:** audio → manifest → captions → render (audio muxed) → thumbnails →
  package, proven end-to-end locally (dress rehearsal in `design/rehearsal/`) and
  on GitHub Actions (render.yml + render-shorts.yml smoke test).

**TTS provider situation:** `edge-tts` **403s from this dev machine** but **works on
GitHub's runners** — the Phase 1D CI smoke test confirmed CI synthesized with
`edge` (en-US-ChristopherNeural). Locally, the offline **Kokoro-82M** fallback
(Apache-2.0, CPU torch, native per-word timings) produced every local Phase 1C/1D
render. generate_audio auto-falls back edge → Azure → Kokoro, so narration never
fails either place. **Recommendation:** add `AZURE_SPEECH_KEY`/`AZURE_SPEECH_REGION`
repo secrets for fast, commercially-licensed narration that doesn't depend on edge's
gray-area terms; Kokoro remains the keyless safety net.

**CI smoke test (verified):** `render.yml` (sample-video) and `render-shorts.yml`
(flow-short) both ran green on Actions with `skip_runtime_guard=1`; the published
Releases carried the full package (7 longform files; 6 `flow-short__`-prefixed short
files) and `fetch_release.ts` downloaded both correctly. The temporary
`content-smoke-*` Releases/tags were deleted afterward.

---

_Prior log: Phase 1A — MoneyCogs cast (10 archetypes + Coggy mascot)._

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
- **Phase 1 — new cast + graphics system.**
  - **1A (✅ DONE)** — replaced the cast ART with 10 money-mechanism archetypes
    (Penny/Customer, Ledger/Banker, Rosa/Merchant, Sterling/CEO, Vera/Investor,
    Joe/Worker, Norma/Regulator, Felix/Taxman, Slick/Hustler, Keys/Landlord) +
    the **Coggy** mascot. Reused the rig/poses/expressions/renderer; only the
    vector appearance changed (new hair `slick`/`bowler`, sunglasses, per-role
    signature props, danger-red accents, new wardrobe). Approval sheets +
    motion-test in `design/cast/`.
  - **1B (✅ DONE)** — money prop library + stages. Added **25 money props**
    (`remotion/src/drawing/props.ts`) — coin/coin-stack/bill/cash-stack/money-bag/
    wallet/piggy-bank/safe/vault/atm, credit-card/receipt/invoice/contract-scroll/
    calculator/percent-tag/price-tag/interest-clock, balance-scale/funnel/
    gauge-meter/shopping-cart/trap/dice/slot-machine — each flat-vector with
    EXPLICIT fills (ink for outlines + small darks only; palette gold `#F5B700`,
    green `#0E7B4F`, danger `#D64545`, plus muted neutrals). Added **5 stages**
    (`stage.ts`) — bank-interior, storefront, kitchen-table, boardroom,
    street-market — in light muted tones so cast/props pop. Registered in
    `schema.ts` (`PROP_KINDS` + `STAGE_NAMES`) and documented in
    `content/schema.md` (full name lists, one-line descriptions, a money
    verb→prop table). Regenerated review sheets → `design/props/prop-sheet.png`
    (all props ≥200px, labeled) and `design/stages/stage-sheet.png` (every stage
    as a panel with Penny + a prop, proving fore/background contrast). Fixture
    now uses the `bank-interior` stage + 6 new props (credit-card, coin-stack,
    percent-tag, vault, receipt, trap); tsc/validate/lint green and the fixture
    renders cast + props correctly colored (no black blobs).
  - **1C (✅ DONE)** — the signature **`money_flow`** scene type + two stat_chart
    variants. `money_flow` (`scenes/MoneyFlow.tsx`, layout in
    `drawing/flowLayout.ts`): nodes (cast / props / text boxes) establish on the
    opening beat, then each edge draws as a hand-drawn arrow **in sync with its
    spoken phrase**, with gold coins travelling along it and an amount tag popping
    at the midpoint (danger-red for `color:"danger"`). Auto-layout hub / chain /
    split (overridable); limits 8 nodes / 10 edges (validation) and 6 / 7 (lint
    crowding warn). New chart modes **`waterfall`** (start bar steps down through
    red deductions to a green remainder) and **`counter`** (gold odometer number
    to a target). Both + `money_flow` have vertical variants in
    `short/VerticalScene.tsx`. Lint counts edge draws for density and warns on a
    narrated $/% that no node/edge shows. Golden snapshots
    (`pipeline/golden_test.ts` → `content/_goldens/`) cover the flow layout,
    waterfall bands + counter, and validate every `schema.md` JSON example. The
    sample fixture gains hub-flow + waterfall + counter scenes; rendered with real
    (offline Kokoro) TTS to `design/scenes/` — 3 horizontal MP4s + 1 vertical hub
    short with burned captions. tsc / validate / lint / goldens green.
  - **1D (✅ DONE)** — drawing hand + full dress rehearsal + CI smoke test
    (Phase 1 closeout). The photographed hand assets were already present and
    committed (`remotion/public/hand/hand.json` + `processed/grip1.png`+`grip2.png`);
    the earlier "handless" 404s were only ad-hoc renders missing
    `--public-dir=remotion/public`. Added a **fail-fast grip-PNG check** to
    `pipeline/build.ts` and both render workflows' first step so a handless render
    can never ship silently. Ran the **complete local pipeline** (real Kokoro TTS →
    manifest → captions → full render with muxed audio → 1080p+720p thumbnails →
    package) for the fixture AND `flow-short`; watchable outputs in
    `design/rehearsal/` (fixture MP4 with sound + hand, vertical short with burned
    captions, thumbnails). **CI smoke test:** added a `skip_runtime_guard` input to
    `render.yml` + `render-shorts.yml` (the short fixtures are under the duration
    floors) and ran both on GitHub Actions; verified the published Release assets
    and `fetch_release.ts` download. Phase 1 is complete.
- **Phase 2 — content system.**
  - **2A (✅ DONE)** — topic engine (queue + CLI; no writing templates yet).
    **`content/topics.json`** is a JSON topic bank of **100 evergreen
    money-mechanism topics** (exactly 20 per brand category), each with
    `slug`/`working_title`/`mechanism_question`/`category`/`payoff`/`demand`/
    `difficulty`/`status`/`order`; first-principles + dollar examples, no company
    filings/news, and each names a money-flow so it stays renderable. First 30
    ordered by launch value (first 10 the strongest broad-appeal mechanisms).
    **`pipeline/topics.ts`** is the queue CLI (`topics:next|pick|done|skip|add|
    list|stats`, wired into `package.json`) with a strict load-time validator
    (unique slugs + orders, valid enums; corruption exits non-zero). Lifecycle
    `queued → done|skipped`. Integrations: `run_day.ts` marks the topic **done
    before the commit** (replacing the Phase-0 `// TODO`, so the status ships with
    the content — no dirty files); `fill_calendar.ts` stamps each entry's
    `category` from the topic bank; `validate_script.ts` warns if a script's
    declared category disagrees with its topic. Documented in README.
  - **2B (✅ DONE)** — MoneyCogs writing template + schema role generalization
    (no skill yet). **`section_title.role`** is now canonical **`section`|`point`**;
    the book-era **`part`|`principle`** still VALIDATE as deprecated aliases and
    map to section/point at parse time (preprocess), so old scripts/goldens don't
    break (asserted by `golden_test.ts` against `content/_fixtures/legacy-roles.json`).
    On-screen labels render **"SECTION n" / numbered point** (never PART/PRINCIPLE)
    in `SectionTitle.tsx` + `short/VerticalScene.tsx`; `Video.tsx` board-memory,
    `package.ts` chapters/retention map, and `derive_shorts.ts` split all key on the
    canonical roles. The mid-recap structural rule now applies only to
    `framing: "book-structure"` (mechanism explainers use per-section re-hooks
    instead). **`content/template.md`** rewritten as the mechanism writing guide
    (format constants, the 6-step skeleton, number rules, cast-archetype table,
    scene-type budget linking `schema.md`, title/SEO formulas, shorts hooks).
    `derive_shorts.ts` + `scripts/derive-shorts.md` carry **money hooks + the Coggy
    CTA**, and require a human pass on every auto-hook. `lint_script.ts` warns on a
    longform with < 2 `money_flow` or no `waterfall`/`counter` (mirrors the budget).
  - **2C (✅ DONE)** — the daily `/make-money` skill + the golden reference
    script. **`.claude/skills/make-money/SKILL.md`** is a self-contained daily
    runbook (pick → study → design the machine → write → validate+lint → fact
    pass → derive+hand-rewrite 3 shorts → ship `npm run day`), with the
    no-news/no-named-company rule, education-not-advice framing, and a failure
    protocol (never `SKIP_RUNTIME_GUARD` in the daily flow). **The golden
    reference** `content/videos/how-credit-cards-make-money.json` — the channel's
    quality bar — is a full **46-scene, ~2,050-word, 12.65-min** longform
    (interchange hub flow, interest counter + waterfall on a $1,000 balance, the
    fee menu, the rewards cross-subsidy, who-wins/who-loses) that is **lint-clean
    with zero warnings**, plus **3 derived shorts with hand-rewritten money
    hooks**. `run_day --dry` proved the full chain (derive → validate → calendar
    with category stamped from the bank) without rendering; the calendar was
    reverted so Phase 3 starts clean. Supporting changes: `derive_shorts` now
    splits on `section` **or** `point` (a gear is the natural short unit); the
    lint enum-not-shown check recognizes `money_flow` as a visual; template.md
    carries the explicit "no digits/$/% in sync phrases" rule.

**Phase 2 is COMPLETE** — topic bank + queue CLI (2A), the mechanism writing
system + schema generalization (2B), and the daily skill + golden script (2C).
The topic → script → shorts → calendar → render → done chain is wired end to end.
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

## Phase 1A revision (art + sheet fixes; rig/engine untouched)

A revision pass corrected a rendering defect and several readability problems in
the 1A cast art. Only the vector appearance, palette, and dev sheets changed —
the joint rig, poses, motion, and FK are untouched.

1. **Ink-fill bug fixed.** Figures previously read as black silhouettes: the
   torso wardrobe covered only a narrow trapezoid while sleeves, legs, hair and
   feet were all ink. Now the default wardrobe mode is **`full-top`** (torso +
   sleeves take the member's dominant garment color), legs render a trouser
   **slate** (`COLORS.trouser`, not pure ink), and the dominant color covers
   most of the figure. The default flipped in every cast entry point
   (`CastStatic`, `AliveCast`, `CastFillWipe`, `castBoardElement`, `Thumbnail`).
2. **Skin tones.** `SKIN` is now five named tones (`fair #F2C9A0`, `tan #D9A066`,
   `bronze #B07B4F`, `brown #8C5A33`, `deep #5C3A21`) assigned across the cast;
   skin is never near-black so the ink face always reads.
3. **Wardrobe.** `CAST_WARDROBE` holds one dominant color per member (penny sky
   blue, ledger charcoal, rosa cream + terracotta apron, sterling navy, vera
   purple, joe grey + hi-vis, norma teal, felix dark grey, slick black, keys
   olive). New `Fill` tags `pants`/`bag`/`case`/`apronC` carry trouser/prop
   colors through the fill mappers.
4. **Bigger heads + faces.** `headR` 22 → 26 (≈1:3.5–4 head-to-body); face
   strokes thickened (sw ×1.4 → ×1.7); `worried` is now angled brows + a small
   frown, `shocked` raised brows + round mouth, `curious` one raised brow + small
   o (+ head tilt on the FaceSheet). Eyes enlarged for 120px readability.
5. **Signatures recolored to read.** Props were `paper` (cream on cream, nearly
   invisible); now tote = green, briefcase = brown, apron = terracotta, with a
   phone (penny), price tag (rosa), gold chain (slick, new `chain` signature),
   green up-chart (vera). Builds/heights varied (ledger short+round, sterling
   tall+lean, joe broad).
6. **Grey chair.** Seated figures sit on a `#9A9A9A` chair (`COLORS.chair`) with
   an ink outline, so figure and chair never merge.
7. **Coggy gestures.** Longer arms with mitten hands, drawn in front of the coin:
   point = extended arm + index finger; wave = raised open palm + 2 motion arcs;
   thumbsup = fist + large gold thumb; spin = ~15° body tilt + 3 speed arcs.
8. **Sheets.** `CastSheetPoses`/`CastSheetExpr` enlarged ~2× on a taller
   (1920×1560) canvas; new **`CastFaceSheet`** (1920×1600) — a head+shoulders
   grid of all 10 × 5 expressions. Re-exported `cast-poses.png`,
   `cast-expressions.png`, `face-sheet.png`, `coggy.png`, and `motion-test.mp4`
   to `design/cast/`; re-rendered the 90-frame fixture check
   (`output/_phase0-check/`). tsc / validate / lint green.

## Phase 1A decisions

1. **Coggy is NOT a rig character.** It's a lightweight self-contained component
   (`components/Coggy.tsx`), not a `CastId`, so `CAST_IDS` stays at the 10 humans.
   It'll be wired into CTA/end-card/watermark in a later phase.
2. **Signature props are front-view only.** The baked role props (tote, apron,
   hi-vis, briefcase, tablet, clipboard, folder, keyring) render in the front
   view; walk/sit (side view) rely on body build + headwear (bowler/slick) +
   accents for recognition. Full side-view signature art is deferred.
3. **Per-character accent colour** is gold by default (`flame` → brand accent);
   `danger: true` members (Slick, Felix) use alert red via a new `danger` fill
   (`COLORS.danger`). The `HairKind` value `sage` was renamed `fringe` (it was a
   hairstyle name colliding with an old cast id).
4. **Dev-sheet cast ids** in the `Cast*/Motion/Wardrobe/Crowd/Peeps/Stage` demo
   compositions were remapped old→new so they compile; they are approval tooling,
   not shipped video.
