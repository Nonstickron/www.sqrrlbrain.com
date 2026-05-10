# Acorn Glyph — Design Spec

**Date:** 2026-05-05
**Status:** Draft, awaiting implementation plan
**Project:** sqrrlbrain.com

## Purpose

Replace the abandoned atomic-age glyph concept (from `palette-test.html`) with a brand-appropriate acorn silhouette used as a recurring editorial mark across sqrrlbrain.com. "Sqrrlbrain" reads as squirrel-brain; an acorn is the obvious symbolic anchor and fits the existing editorial aesthetic without requiring any palette refactor.

The acorn appears sparingly — three placements only — to retain its signal value. It is *not* a mascot. It has no face, no animation, no personality beyond its silhouette.

## Silhouette

A single SVG, ~24×24 viewBox, rendered as a leaning solid silhouette inheriting `currentColor`. Canonical source is the `<symbol>` snippet in the **Implementation Pattern** section below.

Anatomy: scalloped cap (heraldic), stout rounded nut, short stem. Whole acorn rotated 11° to break the rigid upright feel — reads as an acorn that has settled at rest, not a stamped icon. Selected by Ron after iterating from four base shapes (Heraldic / Tall / Stout / Geometric) → A×C blend with four asymmetry treatments → three cap-size variants on the leaning A×C blend, settling on size **3a** (cap width ~16, slightly trimmed from the original).

## Color

Default: `var(--accent)` (vermilion `#c8421a`) — matches the existing brand accent the atomic glyph was using. The SVG inherits `currentColor`, so any container can override.

Reserved for future: `var(--warm-yellow)` (`#f4bc43`) on dark/vermilion backgrounds where contrast warrants it, matching the established yellow-on-vermilion pattern from `ffe00fa`. **Not in scope for this spec** — only vermilion is wired in initial rollout.

## Surfaces

Three placements only.

### 1. End-of-post mark — `notes/<slug>.html` posts

A single 28px acorn, centered, in the editorial position after the last paragraph of each notes post. Print-convention "the end" marker.

- **Size:** 28px (slight refinement from mockup's 22px — looks more deliberate at body-text width)
- **Color:** vermilion default (`color: var(--accent)`)
- **Spacing:** ~2rem top margin, ~1rem bottom margin before any post-footer chrome
- **Pages affected:** all files under `notes/` (currently `flute-direction.html`)

### 2. Inline section separator — `notes/<slug>.html` long-form posts

A 48px acorn, centered, between major section breaks within long-form posts. Direct conceptual replacement for the atomic glyph slot. Used **sparingly** — only when a post has 3+ distinct sections that warrant visible separation. Author judgment call per post; not auto-inserted.

- **Size:** 48px
- **Color:** vermilion default
- **Spacing:** ~2.4rem top and bottom (more air than the end-of-post mark since it interrupts mid-content)
- **Pages affected:** notes posts on a per-post basis. Pattern is available; not every post must use it.
- **Markup pattern:** `<div class="acorn-sep"><svg ...><use href="#acorn"/></svg></div>` between paragraph blocks

### 3. Page-title flourish — selected hero pages

A ~28px acorn under the eyebrow text, above the H1, on three editorial-feeling pages. Adds an editorial mark to the page hero without disturbing the existing eyebrow → h1 → intro vertical rhythm.

- **Size:** 28px
- **Color:** vermilion default
- **Spacing:** sits between the eyebrow and the H1, ~0.6rem top margin (sub-eyebrow), ~1rem bottom margin (above h1)
- **Class names per page (they differ — implementer must use the right pair):**
  - `notes.html` — `.eyebrow` + `h1` inside `.page-hero`. Insert flourish as a child of `.page-hero` between the two.
  - `about.html` — `.eyebrow` + `h1` inside `.page-hero > .hero-left` (two-column grid). Insert flourish **inside `.hero-left`** between the two — *not* as a child of `.page-hero`, which would land it in a third grid cell and break the layout.
  - `notes/<slug>.html` posts — `.post-eyebrow` + `h1.post-title`. Insert flourish between them.
- **Pages affected:**
  - `notes.html` (notes index)
  - each post under `notes/` — every post gets **both** the flourish (above the title) **and** the end-of-post mark (after the body). The pair is the standard treatment for a post page.
  - `about.html`
- **Excluded:** `index.html` (carousel hero already strong), `projects.html`, `work.html`, `services.html`, `inkwell.html` (busy heroes), utility pages (`privacy`, `support`, `contact`, auth pages).

## Implementation Pattern

The acorn lives as one inline SVG `<symbol>` per page that uses it. Pages reference it via `<use href="#acorn">`. This keeps the silhouette source-of-truth in a single shared snippet, lets it inherit `currentColor` from any container, and avoids a separate file fetch.

**Shared snippet** (to be inserted once per page that uses the acorn, immediately after `<body>`):

```html
<svg width="0" height="0" style="position:absolute;" aria-hidden="true">
  <symbol id="acorn" viewBox="0 0 24 24">
    <g transform="rotate(11 12 16)" fill="currentColor">
      <rect x="11.3" y="2.6" width="1.4" height="2.2" rx=".5"/>
      <path d="M4 8.6 Q4 4.8 12 4.8 Q20 4.8 20 8.6 L19.3 10.4 Q17.3 11 15.3 10.4 Q13.5 11 12 10.4 Q10.5 11 8.7 10.4 Q6.7 11 4.7 10.4 Z"/>
      <path d="M5.5 10.3 Q5 16 8 19.5 Q10 22 12 22.5 Q14 22 16 19.5 Q19 16 18.5 10.3 Z"/>
    </g>
  </symbol>
</svg>
```

**Usage at each surface:**

```html
<!-- Page-title flourish (under .eyebrow, above h1) -->
<div class="acorn-flourish" aria-hidden="true">
  <svg width="28" height="28"><use href="#acorn"/></svg>
</div>

<!-- Inline section separator (between paragraph blocks) -->
<div class="acorn-sep" aria-hidden="true">
  <svg width="48" height="48"><use href="#acorn"/></svg>
</div>

<!-- End-of-post mark (after last paragraph) -->
<div class="acorn-end" aria-hidden="true">
  <svg width="28" height="28"><use href="#acorn"/></svg>
</div>
```

**CSS (added to each affected page's `<style>`, or pulled into a shared utility block if/when one exists):**

```css
.acorn-flourish, .acorn-sep, .acorn-end {
  display: flex;
  justify-content: center;
  color: var(--accent);
}
.acorn-flourish { margin: 0.6rem 0 1rem; }
.acorn-sep      { margin: 2.4rem 0; }
.acorn-end      { margin: 2rem 0 1rem; }
```

All instances are decorative — `aria-hidden="true"` on each container so screen readers ignore them.

## Surface Inventory (Implementation Targets)

| Page | Flourish | End-of-post mark | Inline separator |
|------|----------|------------------|------------------|
| `notes.html` | ✅ | — | — |
| `notes/flute-direction.html` | ✅ | ✅ | optional (per content) |
| Future `notes/*.html` posts | ✅ | ✅ | optional (per content) |
| `about.html` | ✅ | — | — |

Symbol snippet must be added to each affected page's `<body>`. Three surfaces × three pages currently = small, contained change.

## Out of Scope (Explicitly Deferred)

- Acorn in footer signature on every page (rejected — too pervasive for "here and there")
- Acorn as active tag-chip marker (rejected — adds noise to the chip system that's already differentiated by color/italic)
- Acorn as list bullets (rejected — turns the glyph into wallpaper)
- Yellow color variant on dark backgrounds (deferred — pattern exists in brand but not needed at initial rollout)
- Acorn favicon (deferred — current favicon strategy unchanged; revisit later if desired)
- Animation, hover states, or interactive treatment (out of scope — glyph is static editorial mark only)

## Constraints / Non-Goals

- Acorn must read as "acorn" at 14px and at 64px without redrawing.
- Silhouette stays solid — no detail strokes, no inner texture, no two-tone fills.
- The 11° lean is a fixed property of the symbol — surfaces should not re-rotate or override the transform.
- This change does not gate Apple Developer Program resubmit and does not require any palette or layout refactor.

## Rollback

The acorn is purely additive markup + CSS. To remove: delete the `<symbol>` snippet, the per-surface `<div class="acorn-*">` blocks, and the `.acorn-flourish/.acorn-sep/.acorn-end` CSS rules from each affected page. No data, no JS, no dependencies touched.


---

**Workspace context:** [[project_sqrrlbrain]] · [[CHANGELOG]]
**Tags:** `#proj/sqrrlbrain` `#type/docs`
