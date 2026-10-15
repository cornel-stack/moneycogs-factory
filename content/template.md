# MoneyCogs — the writing template

How to write a MoneyCogs longform script. The channel explains **money &
business mechanisms** — *how credit cards actually make money*, *why insurance
is structurally profitable* — as whiteboard explainers. One video = one machine,
taken apart gear by gear, with worked dollar numbers and the money drawn as it
flows.

The JSON **schema** (every scene type + field + copy-paste examples) lives in
[`content/schema.md`](./schema.md). This guide is the *content system* on top of
it: the skeleton, the number rules, the cast, the scene budget, and SEO. The
topic comes from the bank (`content/topics.json` → `npm run topics:next`); its
`slug` is the video id, and its `mechanism_question` is the one question the
video answers.

> **Visual-first rule (unchanged):** on-screen text is a short keyword *label*,
> never a sentence. The narration carries the words; the canvas carries the
> drawing. The hand draws every hero element; the money moves on screen.

---

## a. Format constants

| Thing | Target |
|-------|--------|
| **Length** | **~14 min** (brand floor is 12; see `config/brands.ts`) |
| **Words** | **~2,000–2,100** (≈145 words per *final* minute — `WORDS_PER_FINAL_MINUTE`, which already counts scene padding + draw-ins) |
| **Scenes** | **40–60** |
| **Sections** | **4–5**, each one **gear** of the machine |
| **Points per section** | **2–3** (a point = one surface-story → hidden-flow beat) |

Word math: `target_words ≈ 145 × target_minutes`. Budget ≈ **500 words per
section** across its 2–3 points, plus ~150 for the hook and ~150 for the
recap/close. Durations are never hardcoded — audio is measured
(`build_manifest.ts`) and the runtime guard hard-fails a mis-paced cut, so write
to the word budget, not to a stopwatch.

---

## b. The skeleton — every longform follows it

1. **COLD HOOK** — 2–3 scenes, **≤20s**. Open on a concrete, surprising **number
   or question** ("You spend a hundred dollars. The shop only keeps ninety-seven.
   Where do the other three go?"). State the **core promise within the first
   15s** and tag it: set the script's `promise` to the verbatim promise sentence
   (a substring of early narration). *Lint hard-fails if the promise isn't spoken
   by 15s.* Use `section_title` (no role) + a `character_scene` or a `stat_chart`
   `counter`.

2. **THE MACHINE AT A GLANCE** — 1–2 scenes. A **`money_flow` OVERVIEW** of the
   whole mechanism: the thesis drawn **once, fast** — every major party as a node,
   the headline flows as arrows. This is the map the rest of the video zooms into.

3. **SECTIONS 1..4** — each is one gear. Each section:
   - opens with a `section_title` **`role: "section"`** (renders "SECTION n");
   - then **WHAT YOU SEE vs WHAT ACTUALLY HAPPENS**: a `character_scene` (the cast
     acting the surface story the viewer recognises), then the **hidden flow** via
     `money_flow` / `stat_chart` (`waterfall` | `counter`) / `compare` / `table`
     **with WORKED NUMBERS**;
   - ends with a **one-line re-hook** into the next gear ("But the real money isn't
     the swipe — it's what happens when you *don't* pay in full."). No mid-recaps.

4. **WHO WINS, WHO LOSES** — 1–2 scenes. A `compare` or `list_card` tallying
   **winners (gold)** vs **losers (danger red)** — who the machine is built for.

5. **RECAP** — a `recap_card` `scope: "final"`: the mechanism in **3–4 bullets**.

6. **DISCLAIMER + CTA** — one scene: "This is how the machine works, not
   financial advice" spoken briefly, then the **Coggy** end-card
   ("New money machine, drawn daily"). Coggy appears **only here**.

Re-hook rhythm: something *new* on screen at least every ~8s (the density lint
flags dead windows). Every section boundary is a mini-cliffhanger.

---

## c. Number rules

- **Every mechanism claim gets a worked dollar example** with round, checkable
  arithmetic. Reuse the house examples: **a $100 purchase**, **a $1,000 balance**,
  **a $2,000/year habit**. Keep the math addable on screen ($100 → $97.10 + $1.80
  + $1.10 + late fee).
- **Spell numbers out in narration** exactly as spoken ("ninety-seven dollars and
  ten cents", "around two percent") — `sync` phrases match *spoken words*, so a
  phrase like `"two percent"` must appear verbatim in that scene's narration.
- **A `sync` phrase is spelled-out words ONLY — never digits, `$`, or `%`.** The
  matcher tokenizes on words, so `"$100"` or `"2%"` can never resolve. Write
  `sync: { phrase: "one hundred dollars" }`, not `"$100"`. (The visual's `amount`
  field is still a display string like `"$1.80"` — that rule is only about `sync`.)
- **Every narrated $ or % must appear in a visual** — as a `money_flow` edge/node
  `amount`, a `waterfall` step, a `counter`, or a tag. *(This is the Phase-1C lint
  warning promoted to a writing rule: a narrated number with no on-screen home is
  a miss.)*
- Use **ranges / typical figures** ("around 2%", "roughly half", "a few dollars")
  — never a rate or price presented as *today's*. **No** current prices, live
  interest rates, market levels, or named-company facts/filings/inside stories. A
  famous business *model* as a generic mechanism is fine ("why razors are cheap
  and blades aren't"); an exposé about a named company is not.
- US / global-audience framing: **dollar** examples, no country-specific tax or
  legal detail.

---

## d. Cast usage

Pick **2–4 recurring characters** per video. **Same character = same role**
throughout (consistency is the brand). **Coggy** is the mascot — CTA / end-card
/ watermark **only**, never a scene actor.

| cast | archetype | plays |
|------|-----------|-------|
| `penny` | **The Customer** | you — the person the machine runs on |
| `ledger` | **The Banker** | banks, lenders, card issuers |
| `rosa` | **The Merchant** | shops, sellers, small business |
| `sterling` | **The CEO** | the company / platform / the house |
| `vera` | **The Investor** | markets, funds, shareholders |
| `joe` | **The Worker** | wages, labor, the payer-of-last-resort |
| `norma` | **The Regulator** | rules, disclosure, oversight |
| `felix` | **The Taxman** | tax, mandatory cuts (danger-red accent) |
| `slick` | **Scams & Traps** | the hustle, the catch (shades, danger-red) |
| `keys` | **The Landlord** | rent, property, recurring dues |

Facing + staging convey the flow: the party *receiving* money faces the source;
hand the prop (coin / bill / credit-card) toward whoever gets paid.

---

## e. Scene-type budget (makes it graphics-heavy by construction)

Per longform, at minimum:

- **≥ 2 `money_flow`** — the GLANCE overview **and** at least one in a section.
- **≥ 1 `stat_chart` `waterfall` or `counter`** — the worked-number moment (where
  the money splits, or the total that stacks up over a year).
- **≥ 1 `compare` or `table`** — the winners/losers or side-by-side.
- the rest: `character_scene`s (surface story) + cards (`list_card`, `recap_card`).

*(The lint mirrors this: a longform with < 2 `money_flow`, or no
`waterfall`/`counter`, gets a warning.)*

For the exact JSON of each scene type, **do not re-type shapes here** — copy from
[`content/schema.md`](./schema.md): `section_title`, `character_scene`,
`money_flow`, `stat_chart` (`waterfall` / `counter`), `compare`, `table`,
`list_card`, `recap_card`, `cta`.

---

## f. Titles / SEO

Fill `title_variants` (**exactly 3**, YouTube A/B). Mechanism formulas:

1. **SEARCH-LED:** `How {X} Actually Makes Money` (the topic verbatim, ≤70 chars).
2. **CURIOSITY-LED:** `Why {X} Is Designed to {Y}` (open the loop).
3. **BENEFIT-LED:** `The Real Reason {X} Costs ${Z}` (outcome / number first).

- **`thumbnail.punch_words`** — **2–4** big words, **include a number when
  possible** ("WHERE $100 GOES", "2% · EVERY SWIPE"). `thumbnail.headline` ≤5
  words; pick the `cast` that owns the mechanism; `expression` usually `shocked`
  or `curious`.
- **`description`** — first two lines keyword-rich and search-visible (the topic +
  the payoff); then the value summary. **≤3 hashtags.**
- **`pinned_comment`** — one engagement question tied to the mechanism ("Did you
  know your bank takes a cut of every swipe? What surprised you?").
- **`category`** — must match the topic bank's category for this slug (validate
  warns on a mismatch).

---

## g. Shorts

Every longform spins off vertical shorts — **one short = one point's
hidden-flow moment**. The mechanical first pass is `derive_shorts.ts`; the full
playbook (what to tighten, the human pass) is
[`scripts/derive-shorts.md`](../scripts/derive-shorts.md).

**Money hook formulas** (the auto-hook pool — rotate, then rewrite by hand):

1. "Banks hope you never do the math on this."
2. "Your free app has a price tag."
3. "This fee pays for someone's vacation."
4. "Here's who really pays for it."
5. "Follow the dollar — it doesn't go where you think."
6. "It's built so the house always wins."
7. "The quiet way this makes someone rich."
8. "What it costs you isn't on the receipt."
9. "Your money leaves a trail. Watch it move."
10. "Nobody shows you this part of the price."
11. "One hundred dollars in. Guess what comes out."
12. "The catch is in the fine print — let's draw it."

**Rule:** auto-generated hooks are a *draft*. A human **rewrites + fact-checks**
every hook (and trims to ≤55s) before publish — never ship a machine hook raw.

---

## Quick checklist (before `npm run day`)

- [ ] `promise` tagged + spoken within 15s; cold hook opens on a number/question.
- [ ] A `money_flow` overview in the first ~30s; ≥2 money_flow total.
- [ ] ≥1 `waterfall`/`counter`; ≥1 `compare`/`table`.
- [ ] Every narrated $ / % shows up in a visual; all math is addable + checkable.
- [ ] 2–4 cast, consistent roles; Coggy only in the CTA.
- [ ] No current prices / live rates / named-company facts.
- [ ] 3 `title_variants`; `punch_words` with a number; `category` matches the topic.
- [ ] `npx tsx pipeline/validate_script.ts <id>` clean; `lint_script.ts` warnings reviewed.
