# Script JSON schema (v2.0)

Every video is defined by **exactly one** JSON file in `/content/videos/`.
Adding a video never requires code changes — only a new file here. The schema
is enforced at build time by `remotion/src/schema.ts` (Zod); invalid scripts
fail fast with a readable error before any audio or rendering happens.

> **Visual-first rule:** on-screen text other than quotes is a short keyword
> **label**, never a sentence. The narration carries the words; the canvas
> carries the drawing. Word limits are enforced by the schema (see below).

## What changed in v2.0 (vs v1.x) — **breaking**

- **The Cast is the one character system.** Every `kind: "figure"` is a cast
  member: `cast: "penny"|"ledger"|"rosa"|"sterling"|"vera"|"joe"|"norma"|"felix"|"slick"|"keys"`
  (default `penny`). The old LinePeople renderer and its appearance variants are
  **retired** — `hair`, `glasses`, `tie`, and the boolean `flip` are **removed**.
  Identity now comes from the cast member (Ledger has glasses+briefcase, Felix a
  bowler hat, Slick sunglasses, etc.).
- **Facing** `facing: "left"|"right"` (default right) replaces `flip`.
- **View** `view: "front"|"side"` (optional; default auto — `walking`/`sitting`
  render in profile, everything else front). Mainly for standing profiles.
- **Walk-in entrance** `enter: { type: "walk", direction: "left"|"right" }` —
  the figure is drawn in a stride, then walks + **squash-turns** to face front.
- **Seats** `seat: "chair"|"desk"|"none"` (default `chair`) — a seated figure
  always sits ON something, drawn seat-first; `desk` rests the hands on a desk.
- **Held props** `holding: { prop, hand: "left"|"right" }` — a prop gripped in
  the hand that follows the hand through motion.
- **Sync-driven expressions**: `expressions` items may be `{ value, sync }` so a
  mood swings on a spoken phrase (not just a fixed sequence).
- **Thumbnail** + **quote_card** gain `cast` (the thumbnail figure, and an
  author who "delivers" the quote). Both render with the real cast renderer.

Brand palette (unchanged): paper `#FAF6EE`, ink `#1C1A17`, flame `#E8501E`
(the accent), marker `#FFD95C`, slate `#2F6690` (charts only); far-limb tint
`inkFar` `#6A6762`.

## What changed in v1.2 (vs v1.1)

- **Expressive characters.** `character_scene` figures gain `expression` /
  `expressions` (a parallel sequence that advances with `poses`), appearance
  variants `hair` / `glasses` / `tie`, and `flip` (mirror, for facing a second
  character). New poses: `walking`, `shrugging`, `facepalm`, `handshake`,
  `presenting`.
- **Animated effects.** Any character element may declare
  `effects: [{ kind, at?, sync?, loop?, duration? }]`. Effects compose with
  poses/expressions and use the same `sync` phrase mechanism. See the Effects
  section + the verb→pose+effect table below.
- **Thumbnail** gains `expression` (the figure now has a face).
- All additive; existing v1.1 scripts still validate.

## What changed in v1.1 (vs v1)

- **Narration sync** (`sync: { phrase }`) can be added to any drawable element.
  Its draw animation starts when the narrator says that phrase. Resolved from
  edge-tts word timestamps; a phrase that isn't found **fails the build**.
- **Grid placement** (`at: { col, row, w, h }`) over a 12×6 grid for
  `character_scene` elements.
- **Keyword labels + word limits**: labels capped (character ≤6, list ≤5,
  recap ≤4, thumbnail headline ≤5 words).
- **Richer items**: `list_card` / `recap_card` items may be objects (icon +
  sync) or plain strings; `stat_chart` datapoints gain optional `sync` and a
  `mode` (`line` | `bars`).
- **Thumbnail** gains `pose` and `props` (it is now a drawn scene).
- **Backward-compat note:** everything above is additive **except**
  `character_scene.elements`, which changed from placeholder strings to
  structured drawable elements (that scene was placeholder-only in v1).

## Top level

| Field | Type | Req | Notes |
|-------|------|-----|-------|
| `id` | string | ✓ | Slug; must match filename and names the output folder. |
| `title` | string | ✓ | YouTube title (first line of `description.txt`). |
| `book` | `{ title, author, year? }` | ✓ | |
| `description` | string | ✓ | YouTube description body. |
| `tags` | string[] | — | Rendered as `#hashtags`. Default `[]`. |
| `thumbnail` | object | ✓ | see **Thumbnail**. |
| `voice` | string | — | edge-tts voice id. Default `en-US-AndrewNeural`. |
| `scenes` | Scene[] | ✓ | ≥1. Order = play order. |

### Thumbnail
| Field | Type | Req | Notes |
|-------|------|-----|-------|
| `headline` | string ≤5 words | ✓ | Huge Caveat headline with marker underline. |
| `subline` | string | — | Small line under the headline. |
| `cast` | CastId | — | Which cast member is the figure. Default `penny`. |
| `pose` | Pose | — | Figure pose. Default `thinking`. |
| `expression` | Expression | — | Figure face. Default `shocked`. |
| `props` | PropKind[] (≤2) | — | 1–2 drawn props flanking the figure. |

## Scene (common)

| Field | Type | Req | Notes |
|-------|------|-----|-------|
| `id` | string | ✓ | Unique; names the scene's audio file. |
| `type` | enum | ✓ | one of the six below. |
| `narration` | string | ✓ | Exact spoken text. **Source of truth for scene duration and for `sync` phrases.** |
| `visual` | object | ✓ | shape depends on `type`. |

### Shared: `sync`
`sync: { phrase: "a few words" }` — a short phrase copied from this scene's
`narration`. Matching is case/punctuation-insensitive on whole words. The
element begins drawing when the narrator reaches that phrase. **If the phrase
is not found in the narration, the build fails** with the scene id + phrase.
Elements without `sync` draw in listed order, chaining right after the previous
one (so put an un-synced "anchor" element first to avoid a dead opening).

### Shared: `at` (grid)
`at: { col, row, w?, h? }` — a cell on a 12-col × 6-row grid over the safe
content area. `w`/`h` are spans (default 3×3). Fractions allowed.

## Scene types

### `section_title`
Big Caveat headline; the hand underlines or circles it; optional number badge
drawn as a circle.
```json
{ "number": 1, "title": "The Real Lesson", "emphasis": "circle", "sync": { "phrase": "the lesson" } }
```
- `number?` int · `title` string · `emphasis` `"underline"|"circle"` (default underline) · `sync?`.

### `character_scene` — the centerpiece
Cast figures + props drawn by the hand, then **alive** (breathing, pose
transitions, walk-ins, turns). `elements` positioned on the grid.
```json
{
  "title": "Meet Mr. Market",
  "elements": [
    { "kind": "figure", "cast": "ledger", "at": { "col": 5, "row": 1, "w": 4, "h": 5 },
      "enter": { "type": "walk", "direction": "right" }, "poses": ["standing","presenting"], "label": "The Bank" },
    { "kind": "figure", "cast": "penny", "at": { "col": 0, "row": 2, "w": 3, "h": 4 }, "facing": "right", "label": "You" }
  ]
}
```
Element fields: `kind` (`figure` or a PropKind) · `at` · `scale?` · `color?`
(`ink|accent`, props only) · `label?` (≤6 words) · `sync?`.
Figure-only: `cast` (default `penny`) · `pose?` / `poses?` (pose or transition
sequence) · `expression?` / `expressions?` (bare names, or `{ value, sync }`
to swing on a phrase) · `view?` (`front|side`) · `facing?` (`left|right`) ·
`seat?` (`chair|desk|none`) · `holding?` (`{ prop, hand }`) ·
`enter?` (`{ type:"walk", direction }`) · `effects?`.
Prop-only: `variant?` (arrow: `up|down|curved`) · `state?` (lightbulb: `on`).
`title?` ≤6 words.

**Characters** are **the Cast** — flat-filled proprietary figures (big readable
head, a face, chunky limbs, one flame accent each: Alex sneakers, Sage
glasses+beard+bowtie, Max tie, Maya hairband, Pip beanie). They are hand-drawn
by outline → fill-wipe → **face last** (it starts emoting the moment it
appears), seats draw first (the figure sits onto them), then become **alive**:
breathing, blinking, pose transitions, a weighted side walk, a squash-turn from
profile to front on arrival, seated lap/desk hands, and held props that follow
the hand. Sitting and walking render in **profile**; most other poses front.

### Effects (on character elements)
`effects: [{ kind, at?, sync?, loop?, duration? }]`
- `kind` — one of the effect kinds below.
- `at?` — grid cell to anchor the effect (default: above the element's head).
- `sync?` — start when this phrase is spoken (gated to never fire before the
  element finishes drawing). Without `sync`, starts right after the draw.
- `loop?` / `duration?` — looping vs one-shot, and how long (frames).

Overlay kinds: `thought_bubble`, `question_marks`, `exclamation`,
`idea_flash`, `sweat_drop`, `anger_marks`, `zzz`, `sparkles`, `motion_lines`,
`money`. Character-action kinds (animate the figure itself): `shake`, `nod`,
`headshake`.

### `quote_card` (the one text-heavy scene)
Oversized hand-drawn quote marks, quote fades in line by line, attribution in
Caveat with a drawn underline.
```json
{ "quote": "Price is what you pay...", "attribution": "Warren Buffett", "cast": "vera" }
```
- `quote` · `attribution` · optional `cast` (a cast member presents the line
  from the left margin, hand-drawn then alive).

### `list_card`
Each item = a drawn icon + a short label, revealed item-by-item (sync-able).
```json
{ "title": "When he knocks", "items": [ { "label": "Price is just an offer", "icon": "tick" }, "or a bare string" ] }
```
- `title?` ≤6 words · items: `{ label ≤5 words, icon tick|box|arrow, sync? }` or a string.

### `stat_chart`
Axes + line/bars drawn by the hand; values written in Caveat as the hand
reaches each point. Great for "100 → 142 → 78 → 115" swing stories.
```json
{ "label": "Mr. Market's price ($)", "mode": "line",
  "datapoints": [ { "label": "Q1", "value": 100, "sync": { "phrase": "one hundred" } } ] }
```
- `label` string · `mode` `line|bars|area|pie|number|waterfall|counter` (default line) ·
  `prefix?`/`suffix?` (e.g. `"$"`, `"%"`) · `decimals?` 0–2 ·
  datapoints `{ label ≤3 words, value:number, sync? }`.

#### `mode: "waterfall"` (Phase 1C)
A starting bar steps DOWN through labeled deductions (danger-red) to a final
remainder bar (green). Convention: **datapoint 0 = the starting total**, the
**middle datapoints = deductions** (each subtracts its value), the **last
datapoint = the remainder** (drawn from the baseline). Steps draw left→right and
each is `sync`-able like bars.
```json
{
  "label": "Where the $100 goes",
  "mode": "waterfall",
  "prefix": "$",
  "decimals": 2,
  "datapoints": [
    { "label": "Purchase", "value": 100 },
    { "label": "Bank fee", "value": 1.8, "sync": { "phrase": "bank fee" } },
    { "label": "Network fee", "value": 1.1, "sync": { "phrase": "network fee" } },
    { "label": "Shop keeps", "value": 97.1, "sync": { "phrase": "shop actually keeps" } }
  ]
}
```

#### `mode: "counter"` (Phase 1C)
One large odometer-style number counts to a target (gold digits on an ink plate)
in sync with its phrase, with the label beneath and an optional `prefix`/`suffix`.
Uses the FIRST datapoint as the target.
```json
{
  "label": "A year of card fees",
  "mode": "counter",
  "prefix": "$",
  "datapoints": [ { "label": "yearly fees", "value": 1247, "sync": { "phrase": "twelve hundred" } } ]
}
```

### `money_flow` — the signature animated diagram (Phase 1C)
Nodes (cast / props / labeled text boxes) draw on the opening beat; then each
edge draws as a hand-drawn arrow **in sync with its spoken phrase**, with 2–3
gold coins travelling along it and an amount tag popping at the midpoint
(danger-red tag for `color:"danger"`). The completed diagram holds for the rest
of the scene. Layout auto-picks **hub** (a node with ≥3 connections), **chain**
(a linear path) or **split** (one source → 2–4 targets); override with `layout`.

Fields:
- `title?` ≤6 words.
- `nodes[]` (2–8): `{ id, label ≤4 words, kind: "character"|"prop"|"text", ref?, amount? }`.
  `ref` is a **cast id** for `character` nodes and a **PropKind** for `prop`
  nodes (ignored for `text`). `amount?` is a display string shown under the node.
- `edges[]` (1–10): `{ from, to, amount, color?: "green"|"gold"|"danger" (default gold), sync? }`.
  `amount` is a display string (e.g. `"$1.80"` or `"2.9%"`); `from`/`to` are node ids.
- Hard limits: >8 nodes or >10 edges is a validation error; >6 nodes or >7 edges
  is a lint crowding WARNING. `sync` phrases must appear verbatim in THIS scene's
  narration (build fails otherwise, like every other sync draw).

```json
{
  "id": "flow",
  "type": "money_flow",
  "narration": "When you spend a hundred dollars on your card, the money splits several ways. The shop keeps most of it. Your bank takes a small cut. The card network takes a slice too. And if you slip, a late fee lands on you.",
  "visual": {
    "title": "Where $100 goes",
    "layout": "hub",
    "nodes": [
      { "id": "you", "kind": "character", "ref": "penny", "label": "you", "amount": "$100" },
      { "id": "shop", "kind": "character", "ref": "rosa", "label": "the shop", "amount": "$97.10" },
      { "id": "bank", "kind": "character", "ref": "ledger", "label": "your bank", "amount": "$1.80" },
      { "id": "network", "kind": "text", "label": "Card network", "amount": "$1.10" },
      { "id": "late", "kind": "text", "label": "Late fee" }
    ],
    "edges": [
      { "from": "you", "to": "shop", "amount": "$97.10", "color": "green", "sync": { "phrase": "the shop keeps" } },
      { "from": "you", "to": "bank", "amount": "$1.80", "color": "gold", "sync": { "phrase": "your bank takes" } },
      { "from": "you", "to": "network", "amount": "$1.10", "color": "gold", "sync": { "phrase": "the card network" } },
      { "from": "you", "to": "late", "amount": "$35", "color": "danger", "sync": { "phrase": "a late fee" } }
    ]
  }
}
```

### `recap_card`
Numbered circles drawn in sequence, each ticked, with a short label.
```json
{ "title": "Remember this", "items": [ { "label": "Buy his fear", "sync": { "phrase": "when he is fearful" } } ] }
```
- `title?` ≤6 words · items: `{ label ≤4 words, sync? }` or a string.

## Enums

- **CastId**: `alex` (everyman, flame sneakers), `sage` (mentor; glasses+beard+bowtie), `max` (volatile; stocky+tie), `maya` (A-line + ponytail+hairband), `pip` (small/round + flame beanie).
- **Pose**: `standing`, `sitting`, `pointing`, `thinking`, `celebrating`, `panicking`, `walking`, `shrugging`, `facepalm`, `handshake`, `presenting`.
- **Expression**: `neutral`, `happy`, `worried`, `shocked`, `angry`, `tired`, `curious`.
- **PropKind** (names must match `PROP_KINDS` in `remotion/src/schema.ts` exactly):
  - _general / metaphor:_ `door`, `desk`, `easel`, `lightbulb`, `moneybag`, `book`, `arrow`, `speech`, `house`, `bridge`, `mountain`, `path`, `staircase`, `scale`, `hourglass`, `clock`, `calendar`, `trophy`, `target`, `seedling`, `sapling`, `tree`, `brain`, `heart`, `gears`, `ladder`, `wall`, `gift`, `phone`, `bed`, `dumbbell`, `shoe`, `coffee`, `snowball`, `coins`, `dollar`, `bargraph`, `piechart`, `trendup`, `percent`, `dominoes`, `checkmark`, `brick`.
  - _money props (Phase 1B):_
    - `coin` — single gold coin with a `$` (matches Coggy's coin face).
    - `coin-stack` — a tall stack of gold coins.
    - `bill` — a green banknote with a `$` disc.
    - `cash-stack` — a bundle of green notes with a gold band.
    - `money-bag` — a brown sack with a `$`.
    - `wallet` — a brown bifold wallet with a green bill peeking out.
    - `piggy-bank` — a pink piggy bank with a coin dropping into the slot.
    - `safe` — a grey strongbox with a gold combination dial.
    - `vault` — a grey wall with a big round gold vault door.
    - `atm` — a grey cash machine with a green screen + keypad.
    - `credit-card` — a green card with a gold chip and number rows.
    - `receipt` — a cream till receipt with wavy text + a torn bottom.
    - `invoice` — a cream bill with a red "DUE" stamp.
    - `contract-scroll` — a cream scroll whose fine print shrinks toward the bottom.
    - `calculator` — a grey calculator with a green display + button grid.
    - `percent-tag` — a gold tag with an ink `%`.
    - `price-tag` — a cream swing-tag on a string.
    - `interest-clock` — a cream clock face with `$`-tipped hands.
    - `balance-scale` — gold pans on an ink balance arm.
    - `funnel` — a grey funnel with gold coins falling in.
    - `gauge-meter` — a cream dial with a needle on a green→red arc.
    - `shopping-cart` — a grey shopping cart.
    - `trap` — a mousetrap (brown base, grey spring) baited with a gold coin.
    - `dice` — two white dice with ink pips.
    - `slot-machine` — a red slot machine with a gold lever + coin tray.
- **StageName** (background environments; names must match `STAGE_NAMES`): `plain`, `outdoor`, `room`, `desk-office`, `street`, `stage-spotlight`, and the Phase 1B money stages:
  - `bank-interior` — teller counter, round vault door, hanging sign.
  - `storefront` — striped awning, shop window, a shelf of goods.
  - `kitchen-table` — table edge, a mug, a curtained window (home-finance scenes).
  - `boardroom` — long conference table, framed wall chart, tall window.
  - `street-market` — two awninged stalls with hanging price signs.
  Stages wash in softly (not hand-drawn) and are drawn in LIGHT muted tones so cast + props stay the focus.
- **EffectKind**: `thought_bubble`, `question_marks`, `exclamation`, `idea_flash`, `sweat_drop`, `anger_marks`, `zzz`, `sparkles`, `motion_lines`, `money`, `shake`, `nod`, `headshake`.

## Verb → pose + effect cheat-sheet

When the narration says… reach for:

| Narration beat | pose / expression | effect |
|----------------|-------------------|--------|
| thinking / wondering / considering | `thinking` + `curious` | `thought_bubble`, `nod` |
| confused / unsure / what? | `shrugging` + `worried` | `question_marks` |
| realises / has an idea | `standing` + `happy` | `idea_flash` |
| excited / celebrates / wins | `celebrating` + `happy` | `sparkles` |
| shocked / surprised / bad news | `standing` + `shocked` | `exclamation` |
| worried / nervous / stressed | `standing` + `worried` | `sweat_drop` |
| angry / frustrated | `facepalm` + `angry` | `anger_marks` |
| bored / tired / asleep | `sitting` + `tired` | `zzz` |
| agrees / yes | `standing` + `happy` | `nod` |
| disagrees / no | `standing` + `worried` | `headshake` |
| afraid / panics / trembles | `panicking` + `worried` | `shake`, `sweat_drop` |
| money / profit / gets rich | `celebrating` + `happy` | `money` |
| walks in / arrives | `enter: {type:"walk"}` + `poses:["standing",…]` | `motion_lines` |
| makes a deal / meets someone | two figures, one `facing:"left"` | `sparkles` |
| presents / points to a chart | `presenting` + `happy` | — |
| sits / reads / works | `sitting` + `seat:"desk"` (+ `holding`) | `nod`, `zzz` |
| carries / offers an object | `holding: { prop, hand }` | `money`, `sparkles` |

### Money verbs → prop (Phase 1B)

When the narration is about a money mechanism, reach for:

| Narration beat | prop(s) | pose / effect |
|----------------|---------|---------------|
| pays / spends / hands over cash | `coin` or `bill` handed off (`holding`) | `presenting` + `money` |
| swipes / taps a card | `credit-card` (`holding`) | `standing` + `money` |
| saves / puts money aside | `piggy-bank` (+ `coin`) | `standing` + `happy` |
| invests / grows / returns | `trendup` / `bargraph` (chart-up), `coin-stack` | `presenting` + `sparkles` |
| earns interest / compounds over time | `interest-clock`, `coin-stack` | `standing` + `money` |
| borrows / takes a loan / signs | `contract-scroll` (fine print) | `sitting` + `worried` |
| owes / overdue bill | `invoice` (red DUE), `receipt` | `standing` + `worried`, `sweat_drop` |
| taxed / fees skimmed | `percent-tag` + Felix (`cast:"felix"`) stamping a `folder`/`invoice` | `presenting` + `anger_marks` |
| the catch / debt trap | `trap` (coin bait) | `standing` + `shocked`, `exclamation` |
| gambles / bets / odds | `dice`, `slot-machine` | `standing` + `worried` |
| banks it / locks it away | `vault` / `safe`, `atm` | `standing` + `happy` |
| weighs a trade-off / risk vs reward | `balance-scale`, `gauge-meter` | `thinking` + `curious` |
| shops / prices a purchase | `shopping-cart`, `price-tag`, `percent-tag` | `standing` + `curious` |
| money drains away / fees add up | `funnel` (coins in) | `standing` + `worried`, `sweat_drop` |

Money stages set the scene: `bank-interior` for banks/loans, `storefront` /
`street-market` for merchants + spending, `kitchen-table` for household finance,
`boardroom` for corporate/investor beats.

Cast capability cheat-sheet: `cast` picks who; `facing` which way; `view`
front/side; `seat` chair/desk/none (seated poses); `holding` a gripped prop;
`enter:{type:"walk"}` a walk-in with a turn; `expressions:[{value,sync}]` a
mood that swings on a spoken phrase.

## Timing manifest (generated, not authored)

`build_manifest.ts` measures each scene's narration and emits
`.build/<id>/manifest.json` (per-scene `startFrame`, `durationInFrames` @30fps,
`audioFile`, `audioDurationSec`, per-word timings). Scenes are sized from this
manifest — durations are never hardcoded — and the composition resolves `sync`
phrases against the same per-word timings at render time.
