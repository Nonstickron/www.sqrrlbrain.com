# Sqrrlbrain Shop (Phase 1) — Implementation Plan

> **For agentic workers:** implement task-by-task; each task ends in a commit + a browser verification. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ship a branded `shop.html` on sqrrlbrain.com that sells Ronny's physical art (carvings, 3D prints, relief prints on paper + hand-printed apparel) via Stripe Payment Links, with a tip button and a commissions inquiry path — all static, $0 fixed cost.

**Architecture:** A single self-contained static page (`shop.html`) matching the site's existing page pattern (copied chrome from `contact.html`). It renders a product grid from `shop-products.json`; each "Buy" is a link to that product's Stripe Payment Link (Stripe hosts checkout, collects the address, emails receipts). No backend, no Firestore, no Functions for the shop itself. Commissions reuse the existing `contact.html` form (writes to the `contact_messages` Firestore collection — no rules change). Deploy = merge `shop-phase-1` → `main` (GitHub Pages serves it live).

**Tech stack:** Static HTML/CSS/vanilla JS. Google Fonts (Lora / DM Sans / DM Mono). Stripe Payment Links (no SDK, just URLs). GitHub Pages hosting.

**Testing note (deviation from the skill's TDD default):** This is a static marketing page on a repo with no JS test harness. Forcing a test runner here would be over-engineering (YAGNI). Verification is therefore **browser-based**: open the page locally (`file://` or a quick `python -m http.server`) and confirm the stated behavior. Each task lists exactly what to check.

**Reference files (existing patterns to follow):**
- `contact.html` — the canonical page template: `<head>` fonts + `:root` design tokens + `<header>`/hamburger + `<footer>` + the Firebase/Firestore contact-form JS. **Copy its chrome verbatim** for `shop.html`.
- `formulator.html` + `formulator-data.json` — the existing "page renders from a JSON data file" precedent.
- Brand tokens (from `contact.html:19-34`): `--accent #c8421a` (vermilion), `--ink #3a1a00`, `--paper #faf6f0`, `--brown-mid`, `--brown-light`, `--mono` DM Mono, `--serif` Lora, `--sans` DM Sans. h1 uses Lora (the site's standing serif exception).

---

## File structure

- **Create** `shop.html` — the shop page (chrome copied from `contact.html`; shop-specific `<main>` + product-grid CSS + render script).
- **Create** `shop-products.json` — product catalog + `tipUrl`. The single place Ronny edits to add/change products.
- **Create** `images/shop/` — product photos (Ronny supplies).
- **Create** `docs/SHOP-STRIPE-SETUP.md` — step-by-step Stripe dashboard instructions for Ronny (create product → Payment Link → paste URL into JSON; set carving stock to 1; make the tip link).
- **Modify** each content page's inline `.mobile-nav` to add `<a href="/shop.html">Shop</a>` — pages: `index.html`, `about.html`, `contact.html`, `notes.html`, `services.html`, `projects.html`, `work.html` (whichever exist; grep for `mobile-nav` to enumerate).
- **Modify** (optional) `contact.html` — read a `?subject=` query param to pre-fill the subject, so the commissions CTA can deep-link "Commission inquiry".

---

## Data contract: `shop-products.json`

```json
{
  "tipUrl": "https://buy.stripe.com/REPLACE_TIP_LINK",
  "products": [
    {
      "id": "carving-owl-01",
      "title": "Hand-carved Owl",
      "category": "Carvings",
      "price": "$120",
      "image": "images/shop/carving-owl-01.jpg",
      "description": "One-of-a-kind basswood carving, ~6in.",
      "type": "original",
      "status": "available",
      "buyUrl": "https://buy.stripe.com/REPLACE"
    },
    {
      "id": "fox-3d-01",
      "title": "3D-printed Fox",
      "category": "3D Prints",
      "price": "$35",
      "image": "images/shop/fox-3d-01.jpg",
      "description": "PLA, hand-finished.",
      "type": "made-to-order",
      "leadTime": "made to order — ships in ~5 days",
      "status": "available",
      "buyUrl": "https://buy.stripe.com/REPLACE"
    },
    {
      "id": "tee-raven",
      "title": "Raven Relief Tee",
      "category": "Apparel",
      "price": "$28",
      "image": "images/shop/tee-raven.jpg",
      "description": "Hand block-printed on a cotton tee.",
      "type": "made-to-order",
      "leadTime": "printed to order — ships in ~7 days",
      "status": "available",
      "variants": [
        { "label": "S", "buyUrl": "https://buy.stripe.com/REPLACE_S" },
        { "label": "M", "buyUrl": "https://buy.stripe.com/REPLACE_M" },
        { "label": "L", "buyUrl": "https://buy.stripe.com/REPLACE_L" }
      ]
    }
  ]
}
```

**Field rules:**
- `type`: `"original"` (unique — sells out at 1) or `"made-to-order"` (no stock cap; show `leadTime`).
- `status`: `"available"` or `"sold"` (sold → render a disabled "Sold" state; used for originals after they sell).
- `variants` (apparel only): each size has its own `buyUrl` (its own Stripe price/Payment Link). A product has EITHER `buyUrl` OR `variants`, never both.
- `image`: a path under `images/shop/`.

---

## Task 1: `shop.html` skeleton (site chrome + empty grid + sections)

**Files:** Create `shop.html`

- [ ] **Step 1 — Copy the chrome.** Start `shop.html` from `contact.html`: keep its entire `<head>` (fonts + `<style>` `:root` tokens + header/footer/hamburger/responsive CSS + skip-link), the `<header>` block, the hamburger `<script>`, and the `<footer>` block **unchanged**. Change `<title>` to `Shop — Sqrrlbrain Studio` and the meta description to something shop-appropriate. Add `<a href="/shop.html">Shop</a>` into this page's own `.mobile-nav` too.

- [ ] **Step 2 — Replace `<main>`** with the shop scaffold (intro + empty grid container + commissions section + tip section):

```html
<main id="main">
  <div class="page-wrap" style="max-width: 1000px;">
    <p class="eyebrow">Shop</p>
    <h1>Original art &amp; prints.</h1>
    <p class="lede">Hand-carved pieces, relief prints, and made-to-order goods — each one made and shipped by me. Free shipping within the US.</p>

    <div id="shop-grid" class="shop-grid"><p id="shop-loading" class="status">Loading…</p></div>

    <section id="commissions" class="shop-section">
      <h2>Commissions</h2>
      <p>Want something custom — a carving, a relief print, a piece for a specific space? Tell me what you have in mind and I'll follow up with options and a quote.</p>
      <a class="shop-btn" href="/contact.html?subject=Commission%20inquiry">Request a commission →</a>
    </section>

    <section id="tip" class="shop-section">
      <h2>Enjoy the work?</h2>
      <p>Tips are never expected and always appreciated — they help keep new pieces coming.</p>
      <a class="shop-btn" id="tip-btn" href="#" target="_blank" rel="noopener">Leave a tip</a>
    </section>
  </div>
</main>
```

- [ ] **Step 3 — Add shop-specific CSS** inside the existing `<style>` (after the shared rules). Grid + card + button + badge styles, all using the existing tokens:

```css
.shop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 2rem; margin: 2.5rem 0 3.5rem; }
.shop-card { border: 1px solid var(--rule); display: flex; flex-direction: column; background: var(--paper); }
.shop-card img { width: 100%; aspect-ratio: 4/5; object-fit: cover; display: block; background: var(--warm); }
.shop-card-body { padding: 1rem 1.1rem 1.3rem; display: flex; flex-direction: column; gap: .5rem; flex: 1; }
.shop-cat { font-family: var(--mono); font-size: .58rem; letter-spacing: .16em; text-transform: uppercase; color: var(--brown-light); }
.shop-title { font-family: var(--serif); font-size: 1.15rem; font-weight: 600; line-height: 1.2; }
.shop-desc { font-size: .9rem; line-height: 1.55; color: var(--brown-mid); }
.shop-price { font-family: var(--mono); font-size: .95rem; color: var(--ink); }
.shop-badge { font-family: var(--mono); font-size: .58rem; letter-spacing: .1em; text-transform: uppercase; color: var(--brown-mid); }
.shop-btn { align-self: flex-start; font-family: var(--mono); font-size: .7rem; letter-spacing: .14em; text-transform: uppercase; color: var(--paper); background: var(--accent); border: none; padding: .8rem 1.4rem; cursor: pointer; text-decoration: none; display: inline-block; transition: background .2s; margin-top: auto; }
.shop-btn:hover { background: var(--ink); }
.shop-btn.sold { background: var(--brown-light); pointer-events: none; cursor: default; }
.shop-sizes { display: flex; gap: .4rem; flex-wrap: wrap; }
.shop-size { font-family: var(--mono); font-size: .7rem; border: 1px solid var(--rule); padding: .35rem .6rem; cursor: pointer; background: var(--paper); }
.shop-size.active { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.shop-section { border-top: 1px solid var(--rule-soft); padding-top: 2rem; margin-top: 1rem; }
.shop-section h2 { font-family: var(--serif); font-size: 1.5rem; font-weight: 700; margin-bottom: .6rem; }
.shop-section p { font-size: .98rem; line-height: 1.7; color: var(--brown-mid); margin-bottom: 1rem; }
```

- [ ] **Step 4 — Commit.**
```bash
git add shop.html
git commit -m "feat(shop): shop.html skeleton — chrome, sections, grid/card styles"
```

- [ ] **Step 5 — Verify (browser).** Open `shop.html` locally. Confirm: header/logo/hamburger + footer match the rest of the site; the "Loading…" placeholder, Commissions, and Tip sections render; the "Request a commission" link points at `/contact.html?subject=…`. (Buttons don't work yet — next task.)

---

## Task 2: Render products from `shop-products.json` + Available filter

**Files:** Create `shop-products.json` (with the 3 example items above), add a render script to `shop.html`.

**Brand conformance (per `work/sqrrlbrain-brand-guide.html`):** cards use `--warm` background (card/inset tone) with `border-color:var(--accent)` on hover; product titles in Lora; category/price/badges in DM Mono; the H1 carries one italic-vermilion phrase + the acorn-period glyph; grain overlay via `body::before`.

**Sold-out + filter (Ronny 2026-09-29):** sold items STAY in the grid with a "Sold" badge + disabled action (never removed). A filter chip row — **All** (default) / **Available** — sits above the grid, styled like the Notes-page tag filter (DM Mono chips, **warm-yellow active state**). "Available" hides `status:"sold"` items; "All" shows everything.

- [ ] **Step 1 — Create `shop-products.json`** using the Data contract above (keep the 3 examples as placeholders; Ronny swaps in real items + URLs in Task 5).

- [ ] **Step 2 — Add the render script** before `</body>` in `shop.html`:

```html
<script>
(async function () {
  const grid = document.getElementById('shop-grid');
  try {
    const res = await fetch('shop-products.json', { cache: 'no-store' });
    const data = await res.json();

    const tip = document.getElementById('tip-btn');
    if (data.tipUrl) tip.href = data.tipUrl; else tip.closest('.shop-section').style.display = 'none';

    if (!data.products || !data.products.length) { grid.innerHTML = '<p class="status">New pieces coming soon.</p>'; return; }

    grid.innerHTML = data.products.map(p => {
      const sold = p.status === 'sold';
      const badge = sold ? '<span class="shop-badge">Sold</span>'
                  : (p.type === 'made-to-order' && p.leadTime) ? `<span class="shop-badge">${p.leadTime}</span>` : '';
      let action;
      if (sold) {
        action = '<span class="shop-btn sold">Sold</span>';
      } else if (p.variants && p.variants.length) {
        const sizes = p.variants.map((v, i) =>
          `<button type="button" class="shop-size${i===0?' active':''}" data-url="${v.buyUrl}">${v.label}</button>`).join('');
        action = `<div class="shop-sizes" data-variant-group>${sizes}</div>
                  <a class="shop-btn" data-buy target="_blank" rel="noopener" href="${p.variants[0].buyUrl}">Buy</a>`;
      } else {
        action = `<a class="shop-btn" target="_blank" rel="noopener" href="${p.buyUrl}">Buy</a>`;
      }
      return `<div class="shop-card">
        <img src="${p.image}" alt="${p.title}" loading="lazy" />
        <div class="shop-card-body">
          <span class="shop-cat">${p.category}</span>
          <span class="shop-title">${p.title}</span>
          <p class="shop-desc">${p.description || ''}</p>
          <span class="shop-price">${p.price}</span>
          ${badge}
          ${action}
        </div>
      </div>`;
    }).join('');

    // Apparel: clicking a size updates the Buy link.
    grid.querySelectorAll('[data-variant-group]').forEach(group => {
      const buy = group.parentElement.querySelector('[data-buy]');
      group.querySelectorAll('.shop-size').forEach(btn => btn.addEventListener('click', () => {
        group.querySelectorAll('.shop-size').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        buy.href = btn.dataset.url;
      }));
    });
  } catch (e) {
    console.error(e);
    grid.innerHTML = '<p class="status error">Couldn\'t load the shop. Please refresh, or email hello@sqrrlbrain.com.</p>';
  }
})();
</script>
```

- [ ] **Step 3 — Commit.**
```bash
git add shop.html shop-products.json
git commit -m "feat(shop): render product grid from shop-products.json + apparel size selector"
```

- [ ] **Step 4 — Verify (browser, via a local server so fetch works).** Run `python -m http.server` in the repo, open `http://localhost:8000/shop.html`. Confirm: three cards render; the carving shows a plain Buy; the fox shows a "made to order" badge; the tee shows S/M/L (clicking a size flips `.active` and the Buy link's `href`); the tip button's href = `tipUrl`. Set one product's `"status":"sold"` and confirm it renders a disabled "Sold". (Buy links go to placeholder Stripe URLs until Task 5.)

---

## Task 3: Optional — pre-fill subject on `contact.html`

**Files:** Modify `contact.html`

- [ ] **Step 1** — In the contact-form script, after the field consts, add:
```js
const qs = new URLSearchParams(location.search);
const presetSubject = qs.get('subject');
if (presetSubject) document.getElementById('cf-subject').value = presetSubject.slice(0, 200);
```
- [ ] **Step 2 — Commit.** `git add contact.html && git commit -m "feat(contact): prefill subject from ?subject= (commissions deep-link)"`
- [ ] **Step 3 — Verify.** Open `contact.html?subject=Commission%20inquiry`; the Subject field shows "Commission inquiry".

---

## Task 4: Add "Shop" to site nav

**Files:** Modify the inline `.mobile-nav` in each content page.

- [ ] **Step 1 — Enumerate pages.** `grep -rl 'class="mobile-nav"' *.html` to list every page carrying the nav.
- [ ] **Step 2 — In each,** insert `<a href="/shop.html">Shop</a>` into the `.mobile-nav` list (a sensible slot: right after `Home`, or before `Contact`). Keep ordering consistent across pages.
- [ ] **Step 3 — Commit.** `git add *.html && git commit -m "feat(nav): add Shop link to site navigation"`
- [ ] **Step 4 — Verify.** Open two or three pages; the hamburger menu now lists Shop and it links to `/shop.html`.

---

## Task 5: Ronny-side Stripe setup + real products (DOC + manual)

**Files:** Create `docs/SHOP-STRIPE-SETUP.md`; Ronny edits `shop-products.json` + adds `images/shop/*`.

- [ ] **Step 1 — Write `docs/SHOP-STRIPE-SETUP.md`** with exact click-paths:
  - dashboard.stripe.com → **Product catalog → Add product** (name, price; upload image optional). For a one-of-a-kind carving: after creating, create a **Payment Link** for it and set **limited inventory / quantity = 1** (so it closes after one sale).
  - For apparel: create one product **per size** (or one product with per-size prices) and a Payment Link each → those become the `variants[].buyUrl`.
  - For made-to-order (3D prints, apparel): no inventory cap; the "made to order" note lives in the JSON `leadTime`, and optionally in the Payment Link's description.
  - **Tip link:** Product catalog → Payment Link → enable **"Let customers choose amount"** → that URL is `tipUrl`.
  - **Shipping:** baked into price (Free-shipping model) → in each Payment Link, enable **"Collect shipping address"** but add **no shipping fee**; restrict to the US.
  - Copy each `buy.stripe.com/...` URL into the matching entry in `shop-products.json`.
- [ ] **Step 2 — Ronny adds real products** to `shop-products.json` (starting with the ready carvings) + drops photos into `images/shop/`.
- [ ] **Step 3 — Commit** (Tink or Ronny): `git add shop-products.json images/shop docs/SHOP-STRIPE-SETUP.md && git commit -m "content(shop): real carving listings + Stripe setup doc"`
- [ ] **Step 4 — Verify.** Locally, every Buy link opens the correct Stripe checkout; a test carving shows the right price + collects a US shipping address; buying it once flips it toward sold-out in Stripe.

---

## Task 6: Go live

- [ ] **Step 1 — Final review** on the branch: page matches brand, grid renders, all links resolve, mobile layout is clean (≤760px), commissions + tip work.
- [ ] **Step 2 — Merge + deploy.**
```bash
git checkout main
git merge --no-ff shop-phase-1 -m "feat(shop): launch Phase 1 art shop"
git push origin main
```
GitHub Pages redeploys `main` automatically (~1–2 min).
- [ ] **Step 3 — Verify live.** Visit `https://sqrrlbrain.com/shop.html`: grid loads, a Buy link reaches Stripe, the commissions form submits (check the `contact_messages` collection in the Firebase console), the tip button works. Do one real (or Stripe test-mode) purchase end-to-end before announcing.

---

## Out of scope (per spec) — do NOT build here
Multi-item cart · third-party POD (Printful/Printify) apparel · 3D-print automation · commission deposits/online payment · international shipping · Stripe Tax · Shopify. These are Phase 2+ and layer on without redoing Phase 1.
