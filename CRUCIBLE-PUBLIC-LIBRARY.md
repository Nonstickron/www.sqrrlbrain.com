# Crucible Public Library — Schema & Population Spec

**Companion to:** `crucible-public-library.json`
**Strategic basis:** `CRUCIBLE-STRATEGY.md` § 11.5 (locked 2026-05-05)
**Status:** Scaffold shipped 2026-05-11. Zero real recipes yet. Population is a Ron-driven sprint, not a one-shot task.

---

## What this library is

The **publicly-visible** Crucible recipe set. Built fresh with attribution from day one. Distinct from `formulator-data.json` (the 706 scraped private library, never published commercially).

Demo-phase users and eventually paying Pro users see this library. Ron also sees the private 706 from `formulator-data.json`; demo users do not.

## What this library is not

- Not a re-publication of the scraped 706. Those stay private per the locked plan.
- Not a partner-licensed bundle store. Those flow into a separate `bundleLibrary` collection at Phase 6 (bundle marketplace launch).
- Not legal advice. Attribution is necessary but not always sufficient — see "Legal-safety guardrails" below.

---

## Source-type definitions

Each recipe has a `source` field that picks one of four values. Each has its own admission criteria:

### `sqrrlbrain-original`
Original formulations by Ron Goodrich (or future Sqrrlbrain-contracted formulators).
- **Author:** must be a real person who actually developed the recipe.
- **No prior publication elsewhere** under different attribution — otherwise it isn't "original."
- **License/URL:** null.
- **Path to entry:** Ron writes / dictates the recipe; goes straight in.

### `sqrrlbrain-derived`
Modernized reformulations of a `public-domain` or `creative-commons` source. The historic source is preserved in its own entry (verbatim) for legal/attribution integrity; the derived entry is a substantive reformulation by Sqrrlbrain — typically swapping unavailable ingredients (spermaceti, glyconine), reducing or removing now-restricted ingredients (boric acid, mercury salts), adding modern preservatives, and adapting to modern cosmetic emulsion practice.
- **Author:** "Sqrrlbrain Studio formulation team" (or the specific person who did the modernization).
- **License/URL:** null (this is original creative work by Sqrrlbrain).
- **`derivedFrom` field:** REQUIRED — points to the `id` of the source entry (e.g., `"derivedFrom": "pd-003"`).
- **`attribution.notes`:** MUST list the specific modernization changes vs. the original, so the audit trail is clear.
- **Path to entry:** Sqrrlbrain creates the derived entry alongside the preserved historic source. Both entries coexist in the library; tags distinguish them (`historic-archive` vs `modern`).

### `public-domain`
Recipes whose text is in the U.S. public domain.
- **Valid PD bases (US):**
  - **Federal government works** (17 USC § 105) — USDA, NIH, FDA publications. Author = "U.S. Government".
  - **Pre-1930 publications** (in 2026: anything published before 1930 is PD via the 95-year-from-publication rule for pre-1978 works). Verify publication year, not author death year.
  - **Author died before 1956** AND work is unpublished or pre-1978 — life+70 rule. Use with caution; harder to verify.
- **NOT PD:**
  - State extension service publications (varies by state; assume copyrighted unless explicitly waived).
  - "Old-feeling" recipes from modern books. Format/layout/notes added by modern editors get fresh copyright.
  - Anything where author/date can't be pinned down.
- **Path to entry:** Verify the specific PD basis (federal-gov vs pre-1930 vs life+70) before adding. Record the basis in `attribution.notes`.

### `creative-commons`
Recipes published under a Creative Commons license that permits the use we're putting them to.
- **Compatible licenses for free-tier inclusion:**
  - CC0 (any use, no attribution required but we attribute anyway)
  - CC BY 4.0 (attribution required — we always do this)
  - CC BY-SA 4.0 (attribution + share-alike — derivatives must use same license; downstream bundle pitches must respect)
- **Restricted licenses — flag, don't auto-include:**
  - **CC BY-NC** (non-commercial) — CANNOT go into paid Pro tier or paid bundles. Free-tier only. Tag with `attribution.notes: "BY-NC — free tier only, do not bundle"`.
  - **CC BY-ND** (no derivatives) — can include verbatim but cannot edit/reformat in app. Probably skip.
- **Path to entry:** Visit the URL, confirm license, screenshot the license footer/page for archive. Record the version (CC BY 4.0 vs 3.0 — terms differ).

### `partner-licensed`
Recipes from signed partner agreements (Bramble Berry, FNWL, Lotion Crafter, etc.).
- **Path to entry:** Only after a signed agreement. Per the strategy doc, partner-licensed recipes flow into `bundleLibrary` at Phase 6, NOT the public library. So in practice this category should stay empty in this file until/unless a partner explicitly licenses for the free public library (rare; most will want paid-bundle treatment).

---

## Schema reference (v1.1.0)

```jsonc
{
  "id": "sb-001 | pd-001 | cc-001 | pl-001",  // prefix matches source-type abbreviation
  "name": "Recipe Name",
  "category": "body | face | soap | hair | super-simple | makeup | simple | cleaning",

  // OPEN-ENDED TAG ARRAY (new in v1.1)
  // Free-form; recommended vocabulary in metadata.tagVocabulary in the JSON file.
  // Common patterns:
  //   era tag:          "historic-archive" or "modern"
  //   category-hint:    "cold-cream" | "lip-salve" | "bath-tablet" | "lotion" | "body-butter" | "massage-oil" | "hair-dressing" | "skin-tonic"
  //   readiness:        "ready-to-make" | "needs-substitution" | "shelf-stability-untested"
  //   year of source:   "1907" / "1880" / etc. (for historic entries)
  "tags": ["historic-archive", "cold-cream", "ready-to-make", "1907"],

  "heatRequired": true | false,
  "equipment": [],                              // optional; list of special equipment names
  "description": "Plain-language description.",
  "ingredients": [
    { "name": "Ingredient name", "pct": 0 }     // pct = percentage of total batch by weight; must sum to ~100
  ],
  "notes": "Process notes — order, heat, cure times, etc.",
  "uuid": "<uuid-v4>",                          // stable per recipe; never reuse

  // Optional flags
  "_unavailableIngredient": true,               // OPTIONAL — flag if recipe uses ingredients no longer commonly available
                                                 // (spermaceti, ambergris, civet, etc.); loaders should hide or warn

  // Attribution block (REQUIRED — never null on a real recipe)
  "source": "sqrrlbrain-original | public-domain | creative-commons | partner-licensed",
  "attribution": {
    "displayName": "Short string shown in the app UI under each recipe card",
    "author": "Human author name OR 'U.S. Government' OR null only for true anonymous PD",
    "originalUrl": "Link to source; null for sqrrlbrain-original",
    "originalSource": "Human-readable source name; null for sqrrlbrain-original",

    // VERBATIM PRESERVATION (new in v1.1) — important for legal defense + cross-checking
    "originalRecipe": "Exact verbatim quote of the recipe text from the source, including any historic units.",
    "originalUnits": "Description of the unit system used in originalRecipe (apothecary ounces, drachms, parts, fluidrachms, grains, etc.) — informs unit-conversion behavior in the app.",

    "license": "SPDX-like id: CC-BY-4.0 | CC-BY-SA-4.0 | CC-BY-NC-4.0 | CC0-1.0 | PD-US-gov | PD-US-pre1930 | proprietary-licensed | null",
    "licenseUrl": "URL to the license terms; null when not applicable",
    "dateAdded": "YYYY-MM-DD",
    "verifiedBy": "Who confirmed attribution is correct (usually Ron, or 'Tink (auto-extracted; awaiting Ron review)' for unreviewed entries)",
    "verifiedAt": "YYYY-MM-DD",
    "notes": "Per-recipe attribution notes — PD basis, license version, BY-NC flag, safety adjustments, etc."
  }
}
```

### Required fields on every real entry
- `id`, `name`, `category`, `tags[]`, `description`, `ingredients[]`, `notes`, `uuid`
- `source` and the full `attribution` block — never null on a non-template entry
- For historic-archive entries: `attribution.originalRecipe` MUST be present (verbatim quote)

### Templates
- Entries with `_template: true` live in a separate `templates` array (NOT in `recipes`). Loaders MUST NOT include templates in user-facing displays.
- Each source type has one template entry as a shape reference.

### Bundle candidates (per metadata.bundleCandidates)
Added 2026-05-11 to support Ron's IAP bundle direction. The `metadata.bundleCandidates` object lists recipe IDs that could be "pulled and switched over" from the free public library into paid Sqrrlbrain-owned bundles at Phase 6 (bundle marketplace launch — see CRUCIBLE-STRATEGY § 11/12).

**Eligibility rules:**
- `sb-*` (sqrrlbrain-original) entries: ELIGIBLE — Sqrrlbrain owns the formulation.
- `sd-*` (sqrrlbrain-derived) entries: ELIGIBLE — the modernization is original Sqrrlbrain creative work, even though the PD source is public.
- `pd-*` (public-domain) entries: NOT ELIGIBLE — content remains in the public domain regardless of where we publish it. Cannot be "pulled" since the original PD source is already public elsewhere.
- `cc-*` (creative-commons): depends on the specific license. CC-BY-NC entries cannot be in paid bundles. CC-BY entries probably can with attribution. CC-BY-SA might require the bundle to also be CC-BY-SA, which conflicts with paid distribution — treat as ineligible unless re-licensed by author.
- `pl-*` (partner-licensed): TYPICALLY ALREADY IN BUNDLES (the bundleLibrary collection, separate file).

**Suggested initial bundle groupings** are listed in `metadata.bundleCandidates.suggestedGroupings`. These are speculative — Ron decides actual bundle composition when Phase 6 work begins.

**Swap procedure (when Ron triggers a bundle launch):**
1. Move the candidate recipes from `recipes[]` to a new `bundleLibrary[]` collection (separate file or separate key).
2. Add `bundleStatus: "bundle-only"` to each moved entry.
3. Update the public-library loader to NOT serve those IDs to free-tier users.
4. Update Pro-tier and bundle-purchaser loaders to serve them.

### Unit-conversion notes
- The `ingredients[].pct` field is a normalized percentage (0–100) by weight, suitable for the formulator's batch calculator.
- For historic recipes, the `pct` values are **approximate conversions** from the original units. The `attribution.originalRecipe` field preserves the source-of-truth wording.
- Conversion factors used:
  - Apothecary ounce (weight) = 31.1 g
  - Apothecary drachm (weight) = 3.89 g
  - Fluidounce = 29.57 mL (treated as ~29.6 g for water-density liquids; less for ethanol/oils)
  - Fluidrachm = 3.70 mL
  - Grain = 0.0648 g
  - Drop = ~0.05 mL (~0.05 g)
  - "Parts" = proportional; sum all parts to derive percentages
- When the source mixes weight and volume units, the conversion makes a density assumption (~1.0 for water-like) — flag in `attribution.notes` if confidence is low.

---

## Population workflow

For each candidate recipe:

1. **Identify source type.** What's its provenance? If you can't answer that confidently, don't add it.
2. **Confirm legal basis.**
   - `sqrrlbrain-original`: Ron wrote it.
   - `public-domain`: which specific PD rule applies (federal-gov, pre-1930, life+70)? Note in `attribution.notes`.
   - `creative-commons`: which license version? Compatible with our use? Screenshot the license footer.
3. **Capture the recipe text in our schema.** Don't paraphrase to dodge attribution — that's worse than honest attribution. Use the original wording (it's licensed for it) and credit it.
4. **Generate a UUID.** Don't reuse `formulator-data.json` UUIDs even for similar recipes.
5. **Set `dateAdded` and `verifiedAt`** to today. Set `verifiedBy` to whoever did the legal check.
6. **Increment `metadata.recipeCount`** in the JSON.
7. **Update `metadata.lastUpdatedAt`.**

---

## Legal-safety guardrails

Per `feedback_legal_procedural_safety` (Tink is safety-check, not lawyer):

- **Attribution alone does NOT grant rights.** A copyrighted recipe attributed correctly is still copyright-infringing if used without license. Attribution is necessary, not sufficient.
- **Recipe text vs functional formula:** US courts have held that ingredient lists and functional procedures are generally not copyrightable, but recipe **descriptions, headnotes, narrative instructions, and creative arrangements** are. The safer path: re-express the procedural steps in our own structured `notes` field, BUT keep the attribution to the original recipe origin. This is still derivative — the safest path is the four source types above where rights are clear.
- **"It's been on the internet a long time" is not a license.** Wayback Machine doesn't grant rights.
- **When in doubt, exclude.** This library is intentionally small to start. One legally-clean recipe beats ten murky ones.
- **For an actual launch-readiness review:** consult an IP attorney. Tink isn't one. This spec encodes the rules we've agreed on; an attorney would confirm them.

---

## Phase plan (from CRUCIBLE-STRATEGY.md § 11.5)

| Phase | What happens | Public library state |
|-------|--------------|----------------------|
| Now (scaffolded 2026-05-11) | Schema + spec shipped; 8 PD recipes extracted from Henley's 1907 | 8 historic-archive entries (cold cream, lip salve, bath tablets, hand lotion, cosmetic jelly, massage cream, astringent wash, tragacanth cold cream) — awaiting Ron review |
| Near-term | Ron reviews PD batch; adds first `sqrrlbrain-original` entries for modern formats (sparkly mica lip gloss, micellar water, setting spray, modern bath bomb) | 12–20 recipes, mix of historic-archive + sqrrlbrain-original |
| Demo phase prep | Grow to ~50 across categories so the public surface looks populated when first demo invitees see it | 50 recipes, mix of types |
| Demo phase | Whitelisted invitees use the public library; signal collection on which categories matter | 50–100 |
| Phase 6 (bundle marketplace) | Partner-licensed recipes flow into separate `bundleLibrary` collection, NOT this file | 50–150; bundles are separate |
| Steady state | Grows via Ron's originals + verified PD sweeps + partner free-tier offers | Open-ended |

---

## What's NOT in scope for this scaffold

- **Loading code in `formulator.html`.** This file is data; wiring it into the Crucible tool's UI is Phase 1 Path A demo build work, not data scaffold work.
- **Migration of `formulator-data.json` → renamed `personalLibrary` collection.** The strategy doc's data-schema example (§ 11.5) shows a merged file with both `publicLibrary` and `personalLibrary` keys. Ron explicitly asked for a **separate file** instead, so this scaffold lives standalone. The merge can happen later if needed.
- **Firestore collection setup.** Path A demo build is localStorage-only; Firestore migration is Phase 3. This JSON is the source of truth until then.
- **Bundle store / Pro tier billing.** Separate phases (4–6).

---

## When this spec changes

- If `CRUCIBLE-STRATEGY.md` § 11.5 changes, update this doc to match — don't let them drift.
- If a new source type emerges (e.g., a federally-funded research recipe — different from federal-gov-work) add it explicitly to the enum, not via `notes` field.
- If attorney review changes the legal-safety guardrails, update the guardrails section and flag the change in `CHANGELOG.md`.

---

**See also:** [[CRUCIBLE-STRATEGY]] · [[project_crucible_strategy]] · [[feedback_legal_procedural_safety]] · [[feedback_no_fabricated_portfolio]]

**Tags:** `#proj/crucible` `#proj/sqrrlbrain` `#type/spec`
