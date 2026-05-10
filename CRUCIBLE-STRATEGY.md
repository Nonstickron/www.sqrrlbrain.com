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

## 9 — Competitive defenses — preventing partners from copying

**The risk:** pitch a supplier (Bramble Berry, FNWL, etc.), they say no, then build their own copycat tool with their recipes and shut Crucible out.

**Structural moats Crucible already has:**

1. **Aggregation, not single-source.** A supplier-built tool only contains *their* recipes/ingredients. Most indie makers use ingredients from 3-4 suppliers in a single recipe. Crucible's value is the cross-supplier library; a single-supplier app fails at the actual job. They can't include their competitors without partnerships their lawyers won't approve.
2. **Cleanup labor.** ~700+ hours of recipe normalization, ingredient-name canonicalization, percentage validation, supplier mapping. A supplier starting from scratch has to redo all that or hire someone — 6-12 months of dev work for a "marketing experiment" budget that won't justify it.
3. **Speed asymmetry.** Suppliers are slow (committee approvals, brand teams, vendor procurement). Crucible is solo and fast. Head-start gap matters.
4. **Conflict of interest.** Supplier-built tools push their products; users discount the recommendations once they catch on. Crucible's supplier-neutrality is the trust users will pay for.
5. **Switching cost.** Once user data (inventory + custom recipes + notes + saves) is in Crucible, leaving for a single-brand alternative loses all of it.

**Pitch tactics that defend against the copy outcome:**

- **Lead with smaller suppliers first.** FNWL, Lotion Crafter — they don't have the in-house tech to build. They say yes because they don't have the option. By the time the bigger names are pitched, the smaller players are signed; the choice for big names becomes "join the consortium that has my competitors" or "build a competitor against them" — different decision.
- **Pitch to marketing / partnerships, not engineering.** Marketing thinks "this is a distribution channel" → signs. Engineering thinks "we could build this" → builds. Frame the deal as a marketing channel for *their brand* with handled ops, not a tech licensing arrangement.
- **Show, don't tell.** Demo the working tool with their recipes already cleaned + structured + browseable. Implicit alternative is *"or I leave them as an unlicensed library and you get nothing."* Not threatening — just real.
- **Low-friction first ask.** First ask is *"let me launch a free 'Sample Pack' with 3 of your recipes, attributed, just to test interest."* Tests their dev-build instinct against a tiny no-risk yes.
- **The 50/50 split itself is a defense.** Their internal cost of building/maintaining/supporting >> $1.50 per bundle sale at low scale. Math doesn't pencil out for them to build solo.

**Things to NOT do in pitches:**

- Don't lead with technical architecture (that's the part they could copy).
- Don't oversell projections ("this could be $1M/yr") — triggers "we should capture that" reflex.
- Don't approach engineering teams or CTOs first — wrong incentives.
- Don't share the strategy doc. Pitch deck stays focused on their lift / your handling / split / brand exposure. Internal strategic framing stays internal.
- Don't talk about other partners in the pitch. Each partner thinks they're the only smart one.

**Worst-case scenario:** a supplier rejects + builds their own. Even then, Crucible still has the multi-supplier library + the other signed partners. The supplier's solo tool is a marketing piece, not a competing platform. Long-term: like Spotify owning music aggregation despite labels having their own apps, Crucible owns the indie-formulator aggregation niche.

---

## 10 — Team & operations — when sales help becomes the right move

**The skill gap is real.** B2B partnerships sales (cold outreach, partner-side political reading, term sheets, persistent follow-up) is a specific muscle. Different from solo founder/builder skills.

**Don't take a co-founder.** Ron's solo by design. Co-founder takes equity + decision-making rights — the trust/dilution cost isn't worth it at this stage.

**Sales-help options ranked by founder-friendliness:**

| Option | Cash up front | Equity given | When to use |
|--------|---------------|--------------|-------------|
| Tink does prep, Ron makes the calls | $0 | 0% | Phase 2 — first 2 partner attempts. Skill develops through reps. |
| Pure commission contractor (20-25% of partnership revenue, 18-24 mo from each close) | $0 | 0% | Phase 3 — once Phase 2 demonstrates capacity-blocked growth |
| Commission + small equity (10-15% commission + 1-2% vesting equity) | $0 | 1-2% | Phase 4 — only if commission-only person produces and you want long-term alignment |
| Deferred cash | $0 (paid later) | 0% | If person is trusted but wants assured cash; tracks as IOU |
| Co-founder | varies | 20-50% | Don't do this |

**Trust-validated lead identified (2026-05-05):** Ron has a sales lead at DME he's "fairly confident" he can trust. Not in skincare industry but skills transfer. Compensation constraint: no cash to pay him. Trial-friendly approach:

1. **Casual conversation first.** *"Working on something that's going to need partnership sales eventually. Different industry from DME, but you'd be good at it. Just sounding you out — would you be interested in early conversations when the time's right?"* No commitment.
2. **Show him Crucible** when Path A is built. Get his read on product, pitch, partner list. Free advice; no risk to either side.
3. **Mock pitch** — let him role-play the FNWL pitch on you. 15 min. Tells you fast if his chops translate.
4. **If chemistry's good after #1-3** — propose 90-day pure-commission trial. After 90 days with closed deals, restructure to commission + small equity for long-term alignment. **Don't lock in equity on a guess about whether you'll work well together.**

---

## 11 — Capital — investor pathway

Ron knows an angel investor type — "plenty of money and he's known to like to invest in new businesses." Worth pitching when demo phase produces signal, NOT before (premature pitching costs credibility).

### Primary use of capital — AI infrastructure for free trials (clarified 2026-05-05)

Ron's main interest in the investor isn't broad runway. It's specifically **funding AI infrastructure for free trials across all three Sqrrlbrain Studio products**. Without trial AI capacity, conversion to paid is zero — users won't subscribe to something they can't try. Ron's personal Google AI account ($20/mo spend cap) cannot underwrite trials at any meaningful scale.

This reframes the investor pitch from vague "runway" to a concrete, measurable ask:

**Per-trial-user AI cost estimates (rough, refine with usage data):**
- **Inkwell:** Gemini API ~$0.01-0.05 per chapter generation. 5-chapter free trial = $0.05-0.25 per user.
- **SqrrledAway:** Gemini ~$0.01-0.02 per generation action; free tier already capped at 5/month per user → ~$0.05-0.10 per trial user/month.
- **Crucible:** AI substitution suggestions, batch scaling, recipe-from-constraints; ~$0.001-0.01 per request → $0.05-0.25 per trial user/month.

**Aggregate at scale:** at 1000 trial users across products = $200-1000/month in AI infra. Annualized: $2,400-12,000. A $25-50K angel check covers 2-4 years of trial AI cost at modest scale, with margin for usage spikes.

**Investor pitch framing (when ready):**

> *"I'm building three products under Sqrrlbrain Studio. Crucible — formulation tool with a locked three-layer revenue model — is my near-term thesis. Inkwell is live, AI-driven storytelling. SqrrledAway is a meal-planning app with multi-user household coordination nobody else has.*
>
> *All three need AI infrastructure for free trials to convert users. Without trials, conversion is zero. With trials, we can validate revenue across the studio. I'm raising $X specifically to underwrite trial AI infra plus a small operational runway. Capital pays back as products convert trial → paid subscriptions, with Crucible's bundle marketplace as the lead revenue line.*
>
> *I've got a sales lead on commission for B2B partner outreach (no cash needed there). I'm not asking for runway to quit my day job. I'm asking for the AI cost stack to be funded so I can offer trials at all."*

That's a sharper pitch than runway-broad. Investor knows exactly what their money buys; revenue ramp is concrete.

### Founder-friendly investor structures, ranked by Ron's "stay solo" constraint

1. **Revenue-share loan** — he loans cash; repaid as % of monthly gross revenue (e.g., 5-10%) until repayment cap (e.g., 1.3-1.5x). No equity given up. No board seat. Hardest to find a willing investor for; most prefer equity upside. **Best fit for the AI-infra-for-trials pitch** — investor sees direct mapping between dollars in and revenue ramp out.
2. **SAFE note** with high valuation cap ($1M+) — defers valuation, simplest paperwork, low legal cost. Equity converts at future priced round at the cap. Minimal current dilution if cap is high.
3. **Convertible note** — slightly worse than SAFE (interest accrual) but mainstream.
4. **Direct priced equity** — last resort, requires valuation now (hard pre-revenue).

### The killer combination

**Investor capital (covers trial AI infra) + commission-only salesperson (covers B2B partnerships) + Ron's solo execution (covers everything else)** = three-product studio operating without burning Ron's personal capital, without diluting equity to a salesperson, with concrete unit economics on trial → paid conversion.

### What you need before pitching

- Demo phase signal data (active users, return rate, willingness-to-pay survey results)
- Tight 10-slide deck (problem, solution, traction, model, team, ask)
- Financial projections (12-24 mo, revenue + cost; trial AI cost as the largest variable line)
- Use-of-funds breakdown — **specifically: $X for trial AI infra, $Y for operational runway, $Z for legal/Stripe setup**
- Term sheet draft (revenue-share loan preferred)

**Tink can draft all of this** when the time is right. The bottleneck is signal data, not preparation.

### Pitch the synthesis, not a single product

(See §12.5 below — Studio-as-umbrella with Crucible-as-lead-horse.)

---

## 11.5 — Two-library model (decided 2026-05-05)

Original plan was: clean up the existing 706 scraped recipes + use them as the public Crucible library. Ron pivoted to a much cleaner model:

### Private library
- The existing 706 cleaned/scraped recipes stay as **Ron's personal lab notebook + family/friends recipe library**
- Used by Ron + select invitees (the demo whitelist)
- **Never published, never sold, never re-licensed**
- Acceptable use under most fair-use interpretations — personal collection of factual data, not commercial redistribution

### Public library
- Built from scratch with **proper attribution from day one**
- Smaller initially (start with 50 recipes, grow over time)
- Sources tagged: `sqrrlbrain-original` (Ron's own formulations), `partner-licensed` (signed partner recipes), `public-domain` (older non-copyrighted), `creative-commons` (with proper credit + license link)
- Multi-tenant; this is the recipe set that demo invitees and eventually paying users see

### Why this is dramatically better

- **Eliminates the legal/attribution gap.** Public library is clean from day one. No retroactive cleanup needed across 706 recipes.
- **The bundle pitch becomes cleaner.** Public library is intentionally small. Bundles don't compete with a free 706-recipe alternative — they expand a deliberately curated foundation. *"Crucible's free library has 50 vetted recipes. Add the Soap Queen Holiday Pack for 12 more, branded and licensed. That's the model."*
- **Ron's personal collection retains its full value to him.** No deletion, no awkward retroactive attribution.
- **Clean separation of concerns:** private = lab notebook, public = product surface.

### Implementation impact on Phase 1

Phase 1 (Path A demo build) ships with:
- Multi-user auth (already covered)
- localStorage namespacing per user (already covered)
- **Two recipe sources visible in the app:**
  - "My Library" — user's own custom recipes, scoped by uid
  - "Sqrrlbrain Library" — the (initially small) clean public library
- Ron's account, in addition, has access to "Personal Collection" — the 706-recipe private library, only visible to him + whitelisted family/friends. Implemented as a special collection only-loaded for whitelisted private-library users.

### Implementation impact on data schema

`formulator-data.json` becomes two-collections-aware:

```json
{
  "publicLibrary": [
    { "id": "sb-001", "title": "...", "source": "sqrrlbrain-original", "attribution": "Sqrrlbrain Studio", ... }
  ],
  "personalLibrary": [
    { "id": "p-001", "title": "...", "source": "scraped", "originalUrl": "...", "originalSource": "soap-queen", ... }
  ]
}
```

### Migration plan

1. **Now:** rename existing data to `personalLibrary` collection. Build minimal `publicLibrary` (start with maybe 5 of Ron's original formulations or public-domain recipes).
2. **Demo phase:** demo users see only `publicLibrary` + their own custom recipes. Ron sees everything.
3. **Bundle launch:** partner-licensed recipes flow into a third collection, `bundleLibrary`, gated by purchased-bundle ownership in user account.

---

## 11.6 — Embedded local models: making investor capital optional (thesis, unvalidated 2026-05-05)

**Status:** thesis recorded for tracking. **NOT yet validated.** Ron will download Gemma 4 and test it locally before this changes any strategic decisions. Captured here so the idea isn't lost; nothing in §11 (Capital) or §12 (Sequencing) is rewritten until validation completes.

### The thesis

Gemma 4 (Google's open-weight LLM family, current generation as of 2026) ships in size tiers small enough to embed directly in mobile apps:

| Tier | Params | Q4 size | RAM needed | Mobile feasibility |
|------|--------|---------|------------|-------------------|
| Small | ~1B | 600-800 MB | ~1.5 GB | Any modern phone |
| Mid | ~4B | 2.5-3 GB | ~3-4 GB | Modern phones (iPhone 13+, recent Android) |
| Large | ~12B | 6-7 GB | ~7-8 GB | Flagship only (iPhone 15 Pro+, 8GB Android) |
| Flagship | ~27B | 14-16 GB | ~16+ GB | Desktop only |

If a Gemma 4 mid (~4B params, ~2.5-3GB at Q4 quantization) can handle Crucible's AI features at acceptable quality, **the studio's primary investor ask — trial AI infrastructure — drops to near-zero.**

### Crucible-specific viability

| Feature | Local Gemma 4 viable? | Cloud needed? |
|---------|----------------------|---------------|
| Ingredient substitution suggestions | Likely yes (mid tier) | No |
| Batch scaling math | No LLM needed at all | No |
| Recipe-from-constraints generation | Maybe (large tier, slower) | Possibly Pro-tier only |
| Recipe organization / search | No LLM needed | No |
| Notes extraction / cleanup | Likely yes (small tier) | No |

For Crucible specifically, **most of the AI surface is structured tasks at moderate quality bar** — exactly where local models perform well. Cloud fallback is only needed for the heaviest generative tasks, which can stay Pro-tier-only and pay for themselves through subscription revenue.

### Capital implications

- **If Gemma 4 viability confirms across all three products:** the trial-AI-infra ask in §11 ($25-50K of the synthesis investor ask) drops out almost entirely. Studio runs on revenue from day one of public launch, not on investor runway.
- **The investor question reframes from necessity to optionality.** Stronger negotiating position if Ron does take investment — "we don't need this, but we'd accelerate with it" beats "we need this to survive."
- **Trade-off: capital is replaced by engineering time.** Budget ~3-6 weeks per platform per app to integrate local inference (WebLLM for web, MLX/Core ML on iOS, ExecuTorch as alternative). That time has to come from Ron's hours or a contractor.

### Validation gate — required before this changes any strategy

1. Download Gemma 4 (small + mid + large variants) via Ollama or LM Studio on dev machine
2. Test on Crucible's actual prompt patterns: ingredient substitution, swap suggestions, recipe-from-constraints
3. Compare output quality vs. cloud Gemini Flash
4. Test inference speed on a representative phone, not just dev laptop
5. Confirm Q4-quantized model holds quality vs. fp16 baseline

**If validation passes:** rewrite §11 (Capital) and §12 (Sequencing) to reflect local-first architecture. Update synthesis investor pitch in §12.5 to soften from "we need capital for AI infra" to "capital accelerates timeline; revenue covers AI infra at modest scale."

**If validation fails:** leave §11.6 as a recorded-and-rejected thesis. Original investor-funded path stands.

### Why record this even if we may not pursue it

- Ron's "no risk in recording ideas we don't have to follow through on" principle.
- If the investor pitch happens, having evaluated local models and recorded the trade-off math **strengthens credibility** — investor sees cost-conscious thinking, not money requested by default.
- If a future generation makes this viable later (Gemma 5, etc.), the analysis is already half-done.

### Sister analyses

- Inkwell viability and per-device-class hybrid model: see `Projects/Inkwell/inkwell-story-engine/docs/STRATEGY.md` ("Embedded Local Models" section).
- SqrrledAway viability (best fit of the three): see `Projects/SqrrledAway/docs/2026-05-05-investor-framing-and-studio-synthesis.md` ("Embedded Local Models" section).

---

## 12 — Recommended sequencing (revised 2026-05-05)

| Phase | Timeline | Sales help | Capital |
|-------|----------|------------|---------|
| Phase 1 — Path A demo build + affiliate layer | This week (~2-3 hr) | Tink-only | Self-funded |
| Phase 2 — Demo phase data collection | 4-8 weeks | None — Ron observes | Self-funded |
| Phase 3 — Path B + Pro tier (only if signal validates) | 1-2 wk build, when ready | Casual conversation w/ sales lead — gauge interest | Investor casual conversation — gauge interest |
| Phase 4 — Partner outreach begins | Q3 2026 | Sales lead trial: 90 days pure commission | Pitch investor (revenue-share loan or SAFE) |
| Phase 5 — Bundle marketplace launches | Q4 2026 | Full sales engagement | Capital deployed if raised |
| Phase 6 — Scale | 2027+ | Hire/contract additional sales as needed | Series A or bootstrap from revenue |

**Critical:** don't rush sales/capital decisions before demo phase produces signal. Premature operational structure. Premature investor pitches kill future credibility.

---

## 12.5 — The synthesis investor pitch (decided 2026-05-05)

Ron's wrestling with: pitch a single product to investor, or pitch the studio? My honest read after walking through each option:

### The recommendation: Studio-as-umbrella with Crucible-as-lead-horse

> *"I'm Ron Goodrich. I run Sqrrlbrain Studio — a one-operator multi-disciplinary studio with three things in flight: Inkwell (live, AI storytelling), SqrrledAway (in development, family-coordination meal planner), and Crucible (formulation tool entering demo). I'm raising $X to underwrite trial AI infrastructure across all three plus operational runway. Crucible is my near-term revenue thesis — locked three-layer model (affiliate + Pro subscription + branded bundles) with a niche-but-defensible market position. Inkwell and SqrrledAway have monetization paths defined and capital lets me actually offer the trials that convert. Capital allocation: 60-70% trial AI infra, 30-40% Ron's reduced-DME-hours runway."*

**Why this beats single-product pitches:**

- **You're an operator with shipping muscle** — Inkwell live = proof of capability. Single-product pitch loses this proof.
- **You have focus** (Crucible is THE near-term thesis, not vague "studio")
- **Optionality reduces investor's downside** (if Crucible underperforms, Inkwell or SqrrledAway is the backup path)
- **The capital ask is concrete** (specific dollars to AI infra; investor knows what they're buying)

**Why this beats studio-only pitches:**

- Studio-only feels unfocused; angels reject it
- Lead-horse framing gives them a single thesis to bet on while keeping optionality

**Self-test for which product is actually the lead horse**

Ron answers honestly:

1. *If I had 12 hours/day instead of 3, which product would I pour them into?*
2. *Which product, when I think about it shipping at scale, gives me the most energy?*
3. *Which product has the most decisive market signal I trust?*

If all three answers are Crucible → synthesis pitch as written.

If any answer is NOT Crucible → reconsider. Lead horse should be the one you're actually motivated to grind. Capital won't fix the lack of motivation.

---

## 13 — Living document

This is v1, written 2026-05-05 from the Discord conversation that sealed the strategic direction. Revisit at:

- **End of Phase 1 build:** any architecture decisions worth recording.
- **End of demo phase (4-8 weeks in):** signal data — does the bundle hypothesis hold? What features do users actually ask for? Adjust pricing/scope based on what we learn.
- **First partner signed:** record terms, learnings from outreach.
- **First $1 of revenue:** affiliate, sub, bundle — whichever rings first. That's a milestone worth noting.

When something in this doc proves wrong, fix it here. Don't preserve out-of-date thinking.


---

**Workspace context:** [[project_crucible_strategy]] · [[project_sqrrlbrain]] · [[USER]]
**Tags:** `#proj/crucible` `#proj/sqrrlbrain` `#type/docs`
