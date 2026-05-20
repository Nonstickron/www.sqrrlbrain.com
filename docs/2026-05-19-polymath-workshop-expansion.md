# sqrrlbrain.com — Polymath-Workshop Expansion + Brand-Incubator Shop

> Brainstorm captured 2026-05-19 via Discord. Ronny said "save all this, don't have time to read your responses right now, want to come back to this later." This doc is the durable home for the full thought.
>
> **Status:** NOT STARTED. Wyrdspinner Phase 2 takes precedence. Pick this up after Wyrdspinner Phase 2 stabilizes.

---

## The reframe

**sqrrlbrain.com is Ronny Goodrich's polymath workshop**, not a software studio that also dabbles in other stuff. The visible site currently reads as "indie iOS studio with a portfolio" — but Ronny's actual breadth is much wider, and the site has been hinting at it (Vitruvian Squirrel 404, acorn glyph, "multi-disciplinary" framing in the about page) without ever showing it.

The reframe in one line: **Sqrrlbrain Studio LLC = me.** Stop compartmentalizing the personal-vs-commercial split. Stop apologizing for the breadth. Lean INTO it and take it over the top — in the "Renaissance shop / polymath workshop" register, not the "Geocities chaos" register.

This shift is consistent with prior locked positioning:
- `[[project_sqrrlbrain_positioning]]` — multi-disciplinary indie products studio, NOT a packaging firm
- `[[feedback_full_discipline_breadth]]` — pitch lines must name ALL disciplines
- `[[project_sqrrlbrain_brand]]` — brand system already supports it (vermilion accent + Lora + DM Sans + DM Mono is editorial, not corporate-cold)

---

## Disciplines to surface as first-class on the site

Currently visible: iOS apps (Wyrdspinner), a few client packaging case studies (Illinois / Georgetown / Bruichladdich / Lemon & Orange octagonal box), the brand guide, a couple of teasers (Wyrdspinner + SqrrledAway). That's ~30% of the actual range.

Disciplines to add as first-class:
- **3D modeling** (commission service — design-to-print or design-only)
- **3D printing** (print-from-your-file or print-from-my-catalog)
- **Woodworking + woodburning / pyrography** (commission + ready-to-buy pieces)
- **Graphic design freelance** (small-shop branding, marketing, layout)
- **Personal artwork** (currently invisible — should have equal weight to commercial work)
- **Structural / die-cut packaging design** (the DME-era depth — most of the existing /work portfolio)
- **Brands** (Crucible / future Goblin Almanac, Five Daughters cosmetics, TRACT apparel)
- **Print production tooling** (SqrrlNest when it ships, the impose engine work)

---

## Strategic insight: the shop is a brand incubator

This is the key insight from the Discord brainstorm — the shop isn't just "a nice-to-have addition." It's the **foundational e-commerce + brand incubator** that makes every downstream brand play cheaper, faster, and lower-risk.

**Instead of:** Launch tract.com from scratch with a full dedicated brand site, then launch fivedaughters.com from scratch with a full dedicated brand site, then launch [future-brand].com from scratch...

**The play is:** Run a single Sqrrlbrain Workshop Shop first. Future brands (TRACT, Five Daughters, anything after) are born inside it as categories or product lines. They prove traction with real sales + real customer feedback. **Only then** do they graduate to their own dedicated domains + brand sites — and only if the data says it's worth the investment.

### Why this works

1. **De-risk e-commerce infrastructure first.** Stripe integration, shipping logistics, returns process, sales-tax handling, customer service patterns — all of that gets shaken out on a few prints + woodwork pieces where the stakes are low. By the time TRACT launches "for real," you've already learned everything that goes wrong the first time.
2. **Validate demand cheaply.** Don't spend a single dollar on tract.com infrastructure or marketing until you've seen actual humans pay actual dollars for TRACT apparel via the workshop shop. Real sales data beats every persona doc ever written.
3. **Build the email list early.** Every workshop-shop sale captures an email + marketing-permission. That list is the launch audience for TRACT, then Five Daughters, then whatever comes next — you're not starting from zero each time.
4. **Test fulfillment models per category.** Self-fulfilled (woodwork, 3D prints, signed art) has different logistics than POD (Printful for apparel) which has different logistics than handmade-batched (Five Daughters skincare). Learn each one with a few SKUs before betting a brand on it.
5. **Brands earn their dedicated domains.** A brand only gets its own standalone site once it has enough sales/customers/story to justify the dedicated investment. Brands that don't catch traction sunset quietly — no dead .com lying around as evidence of an experiment that didn't work.

This is also consistent with `[[feedback_frugality_first]]` — test cheap, invest later.

---

## Phased progression

- **Phase 1 — Workshop Shop launch.**
  Sell what Ronny has now: 3D prints, woodwork, woodburn pieces, signed art prints. Stripe-native + Firestore inventory + flat-rate shipping. Couple dozen SKUs to start.

- **Phase 2 — POD-as-a-category.**
  Add a "Wearables" section that's Printful-backed. **TRACT's Heritage 01 becomes the first product line in the workshop's apparel category** — still under the Sqrrlbrain umbrella. Tests POD fulfillment + Printful integration without committing to tract.com yet.

- **Phase 3 — TRACT graduates to its own site** if Heritage 01 + follow-ups prove real demand. Or it stays as a Sqrrlbrain category forever if that's where it lives most happily. Data decides.

- **Phase 4 — Five Daughters and future brands** follow the same incubator pattern. Born in the workshop, graduate out only when they earn it.

---

## Architectural directions (rough, not designed yet)

When the expansion is built, the visible site likely needs:

- **Home hero** signals breadth on first paint — not "we make apps" but a layered/rotating showcase that puts an app screenshot, a 3D print, a woodburn piece, a brand mark, and an illustration side-by-side. Visual "I do all of this."
- **A new top-nav item** — "Disciplines" or "Workshop" — opens into a gallery of corners: Apps / 3D / Wood / Ink / Brands / Code / Print / Art / Skincare. Each corner is a real gallery (not a single sentence + a stock photo).
- **Personal artwork given the same visual weight as commercial work.** Both are "things Ronny made." Stop apologizing for the personal-vs-client split.
- **Bio rewrite that owns it.** Something like: "Ronny Goodrich makes apps, 3D prints, woodwork, art, branding, and skincare formulations from his workshop in Edgewater, Florida." Not "package designer who also..."
- **Shop + Commissions as first-class top-nav items** — same weight as Work and Services. They're not afterthoughts; they're how the workshop earns.
- **Visual aesthetic doubles down on the workshop/polymath thread.** Sketchbook textures, hand annotations, drawer-label section headers, maybe a Da Vinci-codex inspiration that doesn't go cheesy. The acorn glyph + Vitruvian Squirrel 404 page are already in this vein; build the visual language outward from there.

**Credibility guardrail:** the Apple-resubmit-cleared site was deliberately tightened to look like a real studio. "Over the top" needs to mean "rich, ambitious, polymath-flavored" — think Adam Wathan / Jessica Hische / Frank Chimero range — NOT "cluttered Geocities chaos." Lora + DM Sans + DM Mono brand system stays; it just gets more to do.

---

## Tech architecture lean (decisions to revisit when building)

- **Shop infrastructure: Stripe-native + custom Firestore inventory.**
  Keeps brand on-site, full control, one Stripe relationship serves multiple revenue lines (workshop shop + Crucible Pro subs + future). Fits the Sqrrlbrain hand-built ethos. NOT Shopify embed (loses control + costs %), NOT Etsy embed (loses control + costs %).
- **POD partner: Printful** (already planned for TRACT). Webhook-driven product sync; Firestore caches the catalog.
- **Commissions: form-based quote requests first.** Fixed-price catalog later if volume justifies it.
- **Email capture: Kit** (already integrated for waitlists per `Projects/sqrrlbrain.com/functions/` Cloud Functions). Every workshop sale flows the customer email into Kit with appropriate tags.

---

## Hard constraints that hold

- Per `[[feedback_no_fabricated_portfolio]]` — only real, completed work in every gallery. No invented pieces, no fake clients. Same rule that already governs /work portfolio.
- Per `[[feedback_describe_dont_infer]]` — describe what's verifiable. Don't make a piece's story land harder than the truth supports.
- Per `[[feedback_ron_edits_voice_pages_directly]]` — Tink scaffolds the structure (sections, layout, asset wiring); Ronny writes the voice on every prose-heavy page (Disciplines intros, About rewrite, commission policy, shop product descriptions).
- Per `[[feedback_case_studies_not_cookie_cutter]]` — each piece's case study layout driven by its distinctive angle, not a template.
- Per `[[feedback_full_discipline_breadth]]` — every pitch line + meta description + JSON-LD blurb must name ALL disciplines, not just software.
- Per `[[feedback_frugality_first]]` — when costing this out, free-tier ceiling first column.

---

## Open questions to answer when picking this up

1. Which 3D modeling software does Ronny use? (Blender? Fusion 360? Solidworks? Something else?) — affects how the service is framed.
2. What 3D printer(s) + materials does he have? (FDM PLA/PETG? Resin? Both?) — affects what he can credibly offer.
3. Commission model: per-quote vs. fixed-price catalog vs. both?
4. Shop scope at launch: just 3D prints, or also woodwork + craft + artwork + apparel from day one?
5. Shipping/fulfillment: ship-from-FL only, or POD from day one?
6. Cypress: currently off the public site (per the Apple-resubmit constraints) — does that hold, or does it earn a corner now?
7. Personal artwork + AI-art-controversy considerations — see `[[project_cypress_ai_art_strategy]]` for the pattern that worked there.
8. Sales tax: workshop ships physical goods to FL customers (state sales tax collection required) + other states above their respective thresholds. Etsy/Shopify handle this automatically; Stripe-native means you collect + remit (or use Stripe Tax for ~$0.40/transaction). Worth a CPA conversation when revenue starts.
9. Does the LLC need any additional business licenses (FL or local) for physical-goods retail? — also a CPA question.

---

## Related projects + memory

- `[[project_sqrrlbrain_workshop_incubator]]` (the auto-memory version of this brainstorm — load-bearing for future sessions)
- `[[project_sqrrlbrain_positioning]]` (the multi-disciplinary indie products studio framing)
- `[[project_sqrrlbrain_brand]]` (existing brand system that supports the expansion)
- `[[project_sqrrlbrain_billing_app]]` (the existing internal P&L tracker that future workshop sales will flow into)
- `[[project_tract]]` (the first brand to incubate-then-graduate)
- `[[project_five_daughters_brand]]` (the second brand to incubate-then-graduate)
- `[[project_crucible_strategy]]` (Crucible's three-layer revenue model also lives partially on this same Stripe relationship)
- `[[project_goblin_almanac_brand_decision]]` (Crucible rebrand, deferred until Wyrdspinner ships External TestFlight)

---

**Workspace context:** [[README]] · [[USER]] · [[CHANGELOG]]
**Tags:** `#proj/sqrrlbrain` `#type/strategy` `#type/docs`
