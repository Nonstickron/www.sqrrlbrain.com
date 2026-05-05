# Crucible — Product & Revenue Strategy

**Audience for this doc:** Ron. Solo operator. Crucible is the formulation tool he built; this doc captures the model that makes it pay for itself.
**Date:** 2026-05-05
**Status:** v1 — opinionated commitment captured from Discord conversation. Expect revisions as demo-phase data comes in.

---

## 1 — What Crucible is becoming

Crucible is a curated formulation tool for indie skincare and soap makers. 706-recipe library, ingredient inventory tracker, recipe filter (show only what I can make from what I have), batch calculator, custom recipes, notes, swaps. Currently single-user, localStorage-only. About to enter demo phase with whitelisted invitees.

**Hard constraint from Ron (2026-05-05):** Crucible must pay for itself. No loss-leader play. No funnel-only role for 5 Daughters. No ads.

That filter immediately knocks out the "free tool that funnels to consumer brand" and "free tool with banner ads" models. What's left:

1. **Affiliate revenue** — additive on every active user
2. **Pro subscription** — recurring revenue for unlimited tooling
3. **Branded recipe bundles** — partner-curated collections sold as one-time purchases

These three stack. Each is independently worth doing; together they make the math work.

---

## 2 — The three revenue layers (build order)

### Layer 1: Affiliate links — ship near-term

Every recipe has an ingredient list. Every ingredient has a supplier. Every supplier with an affiliate program (most of them do) gives Sqrrlbrain a referral code. Display "Order from [supplier]" links on each recipe with the affiliate code embedded.

**Why first:**
- Doesn't gate users, doesn't require accounts, doesn't require payments
- Doesn't require partner approval — most affiliate programs are open self-service
- Compounds with the other layers (Pro users still click affiliate links; bundle buyers click them too)
- Quick to build (a few hours of data + UI)

**Affiliate programs to sign up for, in priority order:**
- **Bramble Berry** — biggest indie soap-and-skincare supplier. Has formal affiliate program.
- **From Nature With Love** — already represented in our data (per dashboard `crucible` entry)
- **Lotion Crafter** — narrower selection but quality, professional formulator-friendly
- **Wholesale Supplies Plus** — broad catalog, usually open program
- **Soaper's Choice** — bulk oils, often used in big-batch formulations

**Build:**
- Tag each ingredient in `formulator-data.json` with `supplier_url` field (Bramble Berry SKU URL with `?ref=sqrrlbrain` or whatever code they issue)
- UI: small "Order ↗" link beside each ingredient in the recipe view
- One-time data work to add supplier URLs to the most common ingredients (start with the top 50 by frequency, expand as time allows)

**Revenue expectation:** modest — affiliate commissions are typically 5-10% of order value, and most users won't click. But it's pure upside; zero ongoing cost. A handful of clicks a month = pocket change. A few hundred clicks a month = real money.

### Layer 2: Pro subscription — ship after demo phase if signal is good

**Free tier:**
- 50 saved recipes max
- 1 custom recipe max
- Inventory tracking
- All 706 library recipes browseable (read-only)
- Affiliate links visible

**Pro tier — $7/mo or $60/yr:**
- Unlimited saved recipes
- Unlimited custom recipes
- Batch calculator (advanced)
- Ingredient swap engine
- Notes and flags
- Priority email support
- Ad-free (if ads ever become a free-tier thing — lever, not a plan)

**What Pro does NOT include:** the branded bundles. Those stay separate per Layer 3.

**Why $7/mo:** indie skincare hobbyists are accustomed to spending $20-50 on individual bottles of carrier oil; $7 for unlimited tooling feels reasonable. Below the threshold where most users ask "can I afford this" and into "yeah obviously" territory. $60/yr (~14% discount) lifts annual conversion.

**Stripe integration:** Stripe Checkout + Customer Portal handles subscription management. ~half a day of work once Path B (multi-user Firestore backend) is in place.

### Layer 3: Branded recipe bundles — ship when partners are signed

The unlock that makes Crucible meaningfully different from "another formulation tool."

**The model:**
- Partner formulator brand (Bramble Berry, From Nature With Love, etc.) has 20-50 of their published recipes packaged into a "collection" inside Crucible
- Each collection sold as a one-time purchase: **$3 per bundle, 50/50 revenue split** with partner
- User buys the bundle → recipes unlock in their account → recipes are tagged with partner branding
- Bundle recipes' affiliate links go to that partner's store (compounding revenue + their incentive)

**Examples:**
- "Soap Queen — 2024 Holiday Cold Process Collection" — 12 recipes, $3
- "From Nature With Love — Beginner's Lotion Lab" — 8 recipes, $3
- "Bramble Berry — Melt & Pour Mastery" — 15 recipes, $3
- "Lotion Crafter — Preservation-First Formulating" — 10 recipes, $3

**Why partners say yes:**
- They already publish these recipes free as content marketing — packaging them as a paid bundle is **incremental revenue with zero engineering work on their side**
- Brand exposure to active makers (paying customers, not just lurkers)
- Affiliate revenue compounds (their bundle drives their store traffic)
- Sqrrlbrain handles all the curation/cleanup/UI/payments — they just license the recipes

**Why users say yes:**
- Trust signal — official Soap Queen recipes carry weight; random scraped recipes don't
- Curation — they don't have to find/clean recipes themselves
- Cheap — $3 per bundle is impulse-buy territory
- Brand affinity — Soap Queen fans want to support Soap Queen

**Why this solves the legal/attribution gap from earlier scraping:**
The 706-recipe library was cleaned/scraped from various sources. Selling those raw recipes as "Crucible's library" is murky. Selling them as **partner-licensed bundles with revenue share back to the source** is legally clean and morally clean — your scraping/cleaning labor becomes the curation work that justifies the platform's cut, and the source brand gets paid every time.

---

## 3 — The subscription/bundle conflict — RESOLVED

**The conflict Ron flagged 2026-05-05:** "If Pro includes the bundles, how do bundle partners stay happy?"

**The answer: Pro does NOT include bundles.** They stay separate, always paid à la carte. Specifically:

| What | Free | Pro ($7/mo) | Bundle ($3 each) |
|------|------|-------------|------------------|
| 706-recipe library (read-only) | ✅ | ✅ | ✅ |
| Save up to 50 recipes | ✅ | unlimited | unlimited |
| Custom recipes | 1 | unlimited | unlimited |
| Inventory + filtering | ✅ | ✅ | ✅ |
| Batch calculator | basic | advanced | advanced |
| Ingredient swap engine | — | ✅ | ✅ |
| Notes + flags | ✅ | ✅ | ✅ |
| Affiliate links | ✅ | ✅ | ✅ |
| Branded bundle recipes | — | — | ✅ for purchased bundles only |

**Why this works:**
- Partners always get paid per bundle sale (50/50 of $3 = $1.50 to them, $1.50 to Sqrrlbrain). No mystery revenue-pool math.
- Pro subscribers still have a clear value prop (unlimited tooling on the public 706-recipe library + their own custom recipes + advanced features) — easily worth $7/mo.
- Bundles are pure upside on top of Pro, OR can be bought without Pro.
- Pitch to partners is dead simple: *"Every bundle sale is $1.50 to you. We never give them away free."*

**Edge case to address later:** if a partner *wants* to be included in Pro for higher exposure (instead of à la carte), that's a one-off negotiation. Default model is à la carte.

---

## 4 — Demo phase: what to validate

The next 4-8 weeks (demo phase with whitelisted invitees) is **product-market-fit signal collection**. Specific things to listen for:

1. **Do invitees come back unprompted after the demo?**
   - If yes → they find it useful. Path B build is justified.
   - If no → it's a personal tool, not a product. Don't build Path B.

2. **What features do they ask for that don't exist?**
   - "Can I import my own recipes from a CSV?" → import feature
   - "Can I print this for my notebook?" → print stylesheet
   - "Can I see this on my phone?" → mobile UX polish
   - These signal real use cases

3. **The bundle question — ask explicitly:**
   - "If there were curated 'Bramble Berry Holiday Pack' inside this for $3, would you buy it?"
   - At least 3 yes-es out of ~5-10 invitees = signal.
   - Pay attention to which named brand they say yes to — that's your first outreach target.

4. **The subscription question:**
   - "If this had unlimited custom recipes + advanced features for $7/month, would you subscribe?"
   - Convert hesitation into useful info: "what would make it worth $7?" → roadmap input.

5. **Affiliate-link CTR:**
   - Track clicks on supplier links (basic counter in Firestore)
   - If users actually click through, the affiliate model works. If nobody clicks, it's noise.

---

## 5 — B2B partner outreach pipeline

When Pro tier is live + demo signal validates the bundle hypothesis (probably ~Q3 2026), start outreach.

**Pitch structure (≤200 words):**

> Hi [Partner],
>
> I'm building Crucible — a formulation tool for indie skincare/soap makers. 706 curated recipes, ingredient inventory tracking, batch calculator. Currently in Pro-tier rollout.
>
> I want to package some of [Partner]'s published recipes as a branded bundle inside Crucible. Users buy the bundle ($3), they get [Partner]-attributed recipes with your branding visible throughout. We split 50/50.
>
> You don't have to do anything. I handle the curation, formatting, payments, support. You get:
> - Incremental revenue per sale (~$1.50/bundle)
> - Affiliate clicks driving traffic to your store from each recipe
> - Brand exposure to active formulators (paying customers, not lurkers)
>
> If you've got 20-30 recipes from a specific collection (a holiday set, a beginner pack, a technique-specific series), that's a perfect bundle.
>
> Want to talk? I can demo Crucible in 15 minutes.
>
> — Ronny Goodrich, Sqrrlbrain Studio

**Outreach order (most likely yes → least likely):**

1. **From Nature With Love** — already in your data. Smaller. More agile decision-making.
2. **Lotion Crafter** — formulator-friendly, narrower focus but quality. Likely receptive.
3. **Wholesale Supplies Plus** — broad catalog, usually responsive to revenue partnerships.
4. **Bramble Berry / Soap Queen** — the prize. Big enough that getting them legitimizes the platform. Hardest to land. Pitch only after you have 1-2 smaller partners signed as proof.
5. **MakingSkincare.com** — operates a competing paid education model. Risk of "no, you're competition." But also potential to license their content.

**What to have ready:**
- Live working Crucible (you have it — show via screen share)
- Demo user count (build during demo phase — even 10 active demo users is enough)
- Curation example: walk through a recipe in Crucible vs the same recipe on the partner's site. Show how cleaned + structured the data is.
- Mock bundle: pre-build "[Partner] Sample Pack" with 3-5 of their recipes, password-protected. Show "this is what your bundle would look like."
- Term sheet: 50/50 split, 90-day exclusivity (they don't sell same bundle elsewhere for 90 days), perpetual license to recipes (so revenue continues if they later pull out).

---

## 6 — Build phases & timing

### Phase 1: Path A demo build — this week (~1-2 hours)
- Multi-user via existing Firebase whitelist (already works)
- localStorage namespacing per user email — `5daughters_inventory:${email}` instead of `5daughters_inventory`
- Visible auth state in formulator UI ("Signed in as X" + Sign Out button)
- Sign-out handler clears scoped state
- **Goal:** Ron can give a demo URL to whitelisted invitees and they each get their own state without interfering with his

### Phase 2: Affiliate-link layer — same build session as Phase 1 (~30 min if data is ready)
- `supplier_url` field added to top-50 ingredients in `formulator-data.json`
- "Order ↗" link rendered on each recipe view next to ingredient names
- Sign up for Bramble Berry affiliate program first (most common supplier)
- **Goal:** affiliate revenue starts trickling on day one of demo

### Phase 3: Demo signal collection — 4-8 weeks
- Whitelist invitees (Ron adds emails to `site_approved_users` Firestore)
- Pay attention to: returning visits, feature requests, willingness-to-pay signals
- Track basic engagement: how many recipes saved, how many affiliate clicks
- **Goal:** decide whether Path B + Pro tier is justified

### Phase 4: Path B + Pro tier — 1-2 weeks of build (only if Phase 3 signal is strong)
- Migrate localStorage → Firestore for all 5 user-data buckets
- Stripe Checkout + Customer Portal for subscription billing
- Free tier limits enforced (50 saves, 1 custom)
- Pro feature gates
- **Goal:** Pro launches; first paying subscriber

### Phase 5: B2B partner outreach — concurrent with Phase 4
- Outreach pitches go out (3-5 partners initial wave)
- One mock bundle pre-built for demo
- Term sheet ready
- **Goal:** 1-2 partners signed by end of Phase 4

### Phase 6: Bundle marketplace — 1 week of build
- Bundle listing page in Crucible
- Stripe one-time-purchase integration
- Bundle ↔ user-account ownership tracking in Firestore
- Bundle recipes appear in user's library when purchased
- Partner branding visible throughout bundle recipes
- **Goal:** first bundle goes live; first sale rings the cash register

### Phase 7+: Native app — defer indefinitely
- Web app already works on mobile (responsive). Native app makes sense only when:
  - Mobile usage is documented to be the dominant access pattern, AND
  - Specific native-only features are demanded (offline kitchen-lab notes with photos, push notifications for batch timers, etc.)
- Likely Capacitor wrap (same path as Inkwell) when the time comes — keeps the web codebase as source of truth.

---

## 7 — Pricing thoughts

**Anchored at $7/mo for Pro** because:
- Indie maker tool ecosystem benchmarks: SoapCalc is ad-supported free, Formula Botanica's lowest course is $97. There's a wide gap; $7/mo lands in it cleanly.
- Skincare hobbyists routinely spend $30-50 on a single supply order. $7/mo is "less than one premium oil" framing.
- $84/yr lifetime value at 100 users = $8400/yr — covers infra + meaningful additional revenue.
- Annual at $60 (~14% discount) lifts retention.

**Bundles at $3** because:
- Impulse-buy threshold (everyone has $3)
- Math works: 1000 bundle sales/yr × $1.50 to Sqrrlbrain = $1500 additive — modest but real
- Bundle of 8-15 recipes at $3 = ~$0.20-0.40 per recipe — feels like a fair value compared to free recipes that lack curation/structure

**Don't:**
- Don't price Pro at $5 — too low to feel like a real product, too high vs. $0
- Don't price bundles above $5 — kills the impulse-buy psychology
- Don't bundle Pro into bundles ("buy this bundle, get a month of Pro free") — confuses the value prop and erodes the partner pitch

---

## 8 — What NOT to do

- **No ads.** Ever. Brand-poisoning, low CPM, irrelevant to the audience.
- **Don't position Crucible as a 5 Daughters loss leader.** Crucible has to stand on its own. (5 Daughters can later cross-sell from Crucible if/when both exist — but Crucible's revenue model can't depend on it.)
- **Don't include bundles in Pro.** Breaks the partner pitch. Solved above.
- **Don't try to compete with Formula Botanica on education.** They've got a 10-year head start. Crucible is a tool, not a school.
- **Don't sell raw scraped recipes as Sqrrlbrain's own.** Murky legally + morally. The bundle model fixes this — recipes are partner-licensed, attributed, revenue-shared.
- **Don't go native-app first.** Engineering tax with no return until you have signal mobile users specifically need offline/native features.
- **Don't price Pro low to "get traction."** Lifetime value depends on price; cheap Pro just trains users that the tool is cheap. $7 is the floor.

---

## 9 — Living document

This is v1, written 2026-05-05 from the Discord conversation that sealed the strategic direction. Revisit at:

- **End of Phase 1 build:** any architecture decisions worth recording.
- **End of demo phase (4-8 weeks in):** signal data — does the bundle hypothesis hold? What features do users actually ask for? Adjust pricing/scope based on what we learn.
- **First partner signed:** record terms, learnings from outreach.
- **First $1 of revenue:** affiliate, sub, bundle — whichever rings first. That's a milestone worth noting.

When something in this doc proves wrong, fix it here. Don't preserve out-of-date thinking.
