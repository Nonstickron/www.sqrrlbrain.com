# Sqrrlbrain Shop — Spec (Phase 1)

**Date:** 2026-09-29
**Status:** Draft for review
**Goal:** A simple, $0-fixed-cost way to sell Ronny's physical art on sqrrlbrain.com — carvings, 3D prints, and relief prints (on paper *and* on hand-printed apparel) — plus a tip button and a commissions inquiry surface. **Everything in phase 1 is made and shipped by Ronny himself — no third-party print-on-demand.**

## Principles
- **$0 fixed cost.** No monthly fees; pay only Stripe's per-sale card fee (~2.9% + 30¢).
- **No new backend.** Pure static page on the existing Firebase Hosting — no Functions, no Firestore, no login. Does not touch existing auth or Firestore rules.
- **YAGNI.** Build for what exists now (a few carvings). Prints and everything else slot in later with no rebuild.
- **On-brand.** Matches sqrrlbrain.com — vermilion `#c8421a` accent, DM Sans / DM Mono (no serif except the site's standing Lora).

## Phase 1 product types (all made & shipped by Ronny)
- **Carvings** — one-of-a-kind. Stock = **1** → auto "sold out" when bought.
- **3D prints** — **made to order**: Ronny prints each on sale, then ships. No stock cap; "made to order — ships in ~N days" note. (This is *his* printing on demand — NOT a third-party POD service.)
- **Relief prints on paper** — edition (stock = run size) or unique pull (stock = 1), decided per listing.
- **Relief prints on apparel** — Ronny **hand-prints shirts to order** and ships them. Made to order; carries **sizes** (see variants). No stock cap.

## Phase 1 scope (build now)
1. **`/shop` page** — a branded product grid. Each product: image(s), title, short description, price, category, availability.
2. **Products** defined in a small repo data file (e.g. `shop-products.json`) the page renders. Adding/editing an item = one entry there + a matching product/Payment Link in the Stripe dashboard. No CMS, no database.
3. **Checkout** — each product's "Buy" opens **Stripe's hosted checkout** (a Stripe Payment Link per product). Stripe collects the shipping address + payment, emails the receipt, and notifies Ronny to make/pack + ship. **Single-item checkout** (no multi-item cart in phase 1).
4. **Inventory / made-to-order** — Stripe tracks stock per product: one-of-a-kind (carvings) = qty **1** (auto sold-out); made-to-order items (3D prints, apparel, print-to-order paper) = no cap + a "made to order — ships in ~N days" note.
5. **Variants (apparel sizes)** — apparel needs sizes (S/M/L…). Stripe's hosted checkout has no native size-dropdown, so each size maps to its own Stripe price behind a size selector / per-size button on the page. Non-apparel items have no variants.
6. **Shipping** — **baked into each item's price; shown as "Free shipping." US-only** to start. No shipping-rate config in the build. Ronny sets each price to cover the real packed cost (measured once via USPS / Pirate Ship). Reversible to shown rates later.
7. **Tip button** — a "pay-what-you-want" Stripe link (buyer enters the amount), on the shop page + site footer.
8. **Commissions** — an info section/page describing what Ronny offers + an **inquiry form** (reusing the existing contact-form setup). No online payment in phase 1 (checks / agreed invoice handled off-page). A Stripe "deposit" link is an easy later add.

## Launch inventory
- **Carvings** Ronny has ready now (qty-1 each) — the concrete day-one inventory.
- **3D prints** — listable as soon as there are photos + pricing (made to order, so no stock needed up front).
- **Relief prints (paper)** — added once pulled (2 plates done; prints not yet produced; edition-vs-unique decided per listing).
- **Relief apparel** — added once Ronny is set up to print shirts to order (blanks + sizes chosen).

## Explicitly NOT in phase 1 (deferred)
- **Third-party print-on-demand apparel (Printful/Printify)** — Phase 2, as **separate products** from the hand-printed apparel. Manual fulfillment first; automation only if volume justifies.
- Multi-item cart (needs a small backend; add if buyers want to combine items).
- Commission deposits / online payment.
- International shipping.
- Sales-tax collection (Stripe Tax) — enable once volume/nexus warrants; not a launch blocker, not a substitute for a CPA.
- Shopify / automated multi-POD — the "graduate once it's earning" path, not the starting bet.

## Build outline
1. `/shop` page + `shop-products.json` + render logic, styled to the brand.
2. "Buy" buttons wired to Stripe Payment Links (incl. per-size links for apparel); the tip link.
3. Commissions section + inquiry form (reuse contact-form infra).
4. "Shop" link in the main site nav.
5. Ronny-side setup (documented): create the Stripe account, add products + Payment Links, set prices (shipping baked in), set carvings' stock to 1, set apparel sizes + made-to-order lead-time notes.

## Ronny-side prerequisite
A **Stripe account** (none yet — the one commission was a check). Free to create; only charges the per-sale card fee. This is the one thing that has to exist before the shop can take money.
