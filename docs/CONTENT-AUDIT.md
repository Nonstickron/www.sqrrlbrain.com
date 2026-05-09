# sqrrlbrain.com — Content Audit

**Auditor:** Tink (Claude Opus 4.7) · **Date:** 2026-05-08 (overnight) · **Scope:** all public-facing prose pages

This document is a triage list — issues are flagged by page with line refs and a one-line "why," ranked by **severity** within each page:

- 🔴 **High** — voice mismatch likely to read AI-generated to Apple reviewers, or factual error / cross-page inconsistency
- 🟡 **Medium** — pattern matches Tink-default register, not Ron's voice; worth rewriting when energy allows
- 🟢 **Low** — minor stylistic note; only fix if the line annoys you

**How to use this:** open the file in Dreamweaver Live View, jump to the line, decide if the rewrite is worth your time. Ignore anything that's clearly not bothering you when you read it.

**Voice contract** (per established memory):
- Ron's voice = plainer, rougher, more direct. Less polished editorial.
- Avoid: em-dash drama, three-beat aphorisms ("X. Y. Z."), "deliberately oriented away from"-style framing, "owned as a punchline" / "carries the joke", smooth transitions like "What that means is", marketing-y closers ("real craft", "if it ships, it works").
- Keep: contractions, concrete numbers, plain-spoken claims, italic-em emphasis on key terms, period-with-acorn closers on H1/H2.

---

## about.html

### 🔴 The "no junior / no offshore / no account" triplet repeats three times
- **Line 443** (hero-intro): *"No junior designers, no offshore handoffs, no agency layer."*
- **Line 504** (main copy): *"no junior designers, no offshore production, no account layer between client and designer."*
- **Lines 525-526** (approach #03 "No Junior Handoffs"): *"There are no account managers between us, no junior designers finishing the file, and no offshore production."*

  **Why it matters:** The same idea appears three times in the same page, with slight word swaps each time. Reads like a writer running the same idea through a paraphrase pass. Pick the strongest instance, kill the others. Approach #03 is the most natural place for it; gut it from the hero and main copy.

### 🟡 "We" pronoun appears in a first-person page
- **Line 516** (approach #01): *"We build the chassis first."* — every other paragraph on the page is third-person about Ronny or first-person from Ronny. The "we" sounds like a corporate site for a multi-person agency, which contradicts the whole "solo, independent practice" pitch.

  **Fix:** *"I build the chassis first."* Or just *"The chassis comes first."*

### 🟡 Three-beat aphorism: "Making things. Building things. Fixing things."
- **Line 503**: pattern matches Tink default. Feels constructed. Ron-voice version might be: *"I see something I like and want to make it. Once a solution is in my head, it doesn't leave me alone until it exists."* — drop the triplet, keep the rest.

### 🟡 "If it ships, it works." closer
- **Line 505**: tacked-on aphoristic closer. The paragraph would land cleaner ending at "the print work."

### 🟢 "Now extended into software" + "also builds digital products"
- Hero (443) says studio now extends into software; main copy (505) says it also builds digital products. Same idea twice. Dropping one tightens the page.

### 🟢 "Real craft" in the contact CTA
- **Line 532**: *"Got a project that needs *real craft?*"* — "real craft" reads slightly marketing-y. Optional rewrite: *"Got a project that needs *the structural side?*"* or just *"Got a project that needs *engineering?*"*

---

## index.html

### 🔴 Services-grid copy reads agency-template
- **Lines 800-815** (4 service descriptions): every one of them is structured as a list of nouns with a generic closer.
  - 800: *"Structural dielines, retail-ready graphics, and print production for folding cartons, corrugated, and specialty packaging across consumer markets."*
  - 805: *"Logo systems, typography, color, and brand guidelines built to scale — from startup concept to shelf-ready visual identity."* — "built to scale" is generic
  - 810: *"Campaign concepting, layout design, and creative direction for print, digital, and product marketing collateral."*
  - 815: *"Press-ready file preparation, prepress review, and production management with deep expertise in commercial print standards."* — "deep expertise" is filler

  **Why it matters:** This is the most "agency template" copy on the home page, which is the page Apple reviewers will hit first. The about-page voice is plainer and more specific. These 4 descriptions could each lose a clause and gain a concrete claim. Example for #04: *"Press-ready files. Spot-color setup, bleeds, trapping. I know what your printer needs because I've spent 25 years being that printer."*

### 🟡 Hero pitch is dense and slightly tech-jargon
- **Line 739**: *"One operator, AI-augmented, solo by design. 25 years of commercial craft now extending across software, packaging, brand systems, and original work."*

  "AI-augmented" reads as tech-jargon. "Now extending across" is corporate. The 4-item list packs a lot. Possible plainer version: *"One operator, solo by design. 25 years of print and packaging craft, now extended into software."*

### 🟡 Roadmap intro: em-dash drama
- **Line 823**: *"Milestones, not implementations — quarter-granular dates that flex when reality says so."*

  "Quarter-granular dates that flex when reality says so" reads constructed. Ron-voice version: *"Milestones, not commitments. Dates flex."*

### 🟢 "Slips happen. Reality wins." closer is borderline
- **Line 943**: matches Tink's three-beat-aphorism pattern, BUT *"Reality wins"* is genuinely Ron-spirit and the line might be doing real work. Leave it unless it bothers you.

---

## services.html

### 🔴 "We" pronoun inconsistent with first-person about page
- **Line 387** eyebrow: *"What We Do · Sqrrlbrain Studio"*
- **Line 498** note strip: *"between us"* and *"You get 25 years..."*

  about.html is first-person + third-person Ronny ("the practice of Ronny Goodrich"). services.html shifts to "we" and "us." Pick one and be consistent across pages — given the solo-by-design pitch, first-person ("What I Do" / "between us" → "between you and me") tracks better than the agency-implying "we."

### 🔴 The "no junior / no offshore / no account" triplet repeats AGAIN
- **Line 498** "Note on scope": *"no junior staff, no offshore production, no account layer between us"*

  This is the **fourth** instance on the site (about.html has it three times, services adds a fourth). It's the strongest line you have when it appears once; it loses force every time it repeats. Pick one home for it. Recommend: keep it on services.html as the closer (where prospective clients evaluate it before hiring), strip the three about-page instances down to a single mention.

### 🟡 Hero subhead three-beat
- **Line 389**: *"Work built to survive contact with the printer, the retailer, and the real world."*

  Three-beat list pattern ("the printer, the retailer, and the real world"). The "real world" finish is a Tink-default flourish. Possible plainer: *"Work built to survive the press, the retailer, and the box on a shelf for six months."*

### 🟡 Service overview copy has em-dash drama in every section
- **Line 403** (Packaging): *"physical constraints — dimensions, material, fold sequence, print method — and works forward from there"* — em-dashes used as parenthetical, fine, but the closer "The result: packaging that actually functions at production scale" is colon-aphorism, Tink default
- **Line 428** (Brand): *"before the presentation deck is even opened"* — slightly performative
- **Line 453** (Art Direction): *"what goes where, what gets cut, what the visual hierarchy actually communicates to a person with four seconds at a retail fixture"* — three-beat anaphora, Tink default
- **Line 478** (Print Production): *"This is the work most designers don't know how to do — or don't know they're doing wrong"* — em-dash with reversal, Tink default

  Each one is technically accurate but reads like the same author smoothing four different topics. Ron-voice rewrite would tighten each to 2-3 plain sentences with a concrete claim.

---

## projects.html

### 🟡 Page-desc reads template
- **Line 386**: *"An independent studio building tools and products at the intersection of craft, AI, and maker culture. Details are available to approved collaborators."*

  "At the intersection of [X], [Y], and [Z]" is a tech-pitch template. The card descriptions below it are mostly Ron-direct (TRACT "no noise," 5 Daughters "real maker knowledge, not marketing," SqrrlNest "Optimizes layout for irregular and die-cut shapes"), so the page-desc reads slightly more polished than the cards. Plain version: *"An independent studio building tools, products, and brands. Detail pages are gated to approved collaborators."*

### 🟢 Card copy is mostly already in your voice
- TRACT, 5 Daughters, SqrrlNest descriptions are concrete and direct — leave them.
- Inkwell card: *"Characters remember. Worlds evolve."* — three-beat pattern but matches the inkwell.html marketing line, intentional.

---

## work.html

This page is the cleanest Ron-voice page on the site. Concrete claims, specific dimensions, plain phrasing. Body copy on individual work items reads as the practitioner. Few minor flags only:

### 🟢 Section-desc on Studio Identity
- **Line 380**: *"Self-as-client — the brand system underneath this site, broken open as both reference and case study."*

  *"Broken open as both reference and case study"* reads slightly performative. Plainer: *"Self-as-client. The brand system that runs this site, written up as both reference and case study."*

### 🟢 Featured Piece blurb
- **Line 403**: *"SketchUp first, dieline second, print designed in-house. Full-stack from 3D model to finished box."*

  Three-beat works here as procedural sequence (it's literally the order). Leave.

### Work-item paragraphs (DME, Bruichladdich, Charger, Lemon & Orange) — all clean
Direct, specific, practitioner-voice. No flags.

---

## work/sqrrlbrain-brand-guide.html

Body prose is **explicitly placeholder** per the brand-guide voice memory. Ron edits via Dreamweaver Live View when he has brain energy. Tink should not pre-emptively rewrite. Only flag here:

### 🟡 Voice rules section line 529 reads slightly meta
- *"Plain, direct, technical when the work is technical. I describe what got built and why. No 'we believe,' no 'we're passionate about,' no 'innovative solutions.' Personality shows up in the visual choices (the acorn period, the squirrel) and in italic vermilion phrases — not in performative writing."*

  This is GOOD content (it documents the voice contract clearly), but the page itself is also a place where the voice contract is being modeled. If the rest of the brand-guide reads polished-Tink and this section reads "no marketing speak," there's a tension. Either tighten the rest of the page to match this section's plainness, or move this paragraph elsewhere (a NOTES.md entry, the studio AGENTS.md, etc.).

---

## work/illinois-courtside.html / georgetown-hoyas.html / bruichladdich.html / lemon-orange.html

These four case studies were tightened over multiple sessions to your rougher register (per `feedback_rons_voice_rougher` and `feedback_describe_dont_infer` memories). Each picks its own structural spine per the cookie-cutter rule. They mostly read clean.

### Targeted re-reads recommended
Instead of re-auditing every paragraph, do one read-through of each in Dreamweaver Live View at full size and look for:
- Anywhere I wrote a phrase that doesn't sound like you (your existing edits caught most of these but a few may remain)
- Any "we" pronoun (should all be "I" per the solo-practitioner voice)
- Any inferred fact that doesn't match reality — `feedback_describe_dont_infer` was a real failure mode

### 🟡 Featured Piece spine on lemon-orange specifically
The case study explicitly walks the SketchUp-first → dieline-second → print process. That's strong. The "one dieline, two fruits" insight (added 2026-05-07 per memory) is a Ron-voice rewrite that landed cleanly — keep an eye on whether the surrounding paragraphs still read smoother than this insight does. If they do, gut them.

---

## inkwell.html / sqrrledaway.html

Both shipped today by Tink as **structural placeholders** with marketing prose. Voice is the Tink default polished register, not yours. **Both pages need a Ron voice pass via Dreamweaver Live View** before they're production-ready.

### Highest-priority lines (likely the most jarring at next read):

**inkwell.html:**
- Line 519 lede: *"Inkwell is an AI-powered interactive fiction app that puts you inside a living narrative. Characters remember what you did three chapters ago. Worlds evolve based on the choices you make. No two playthroughs are the same."* — three-beat aphorism cluster + "puts you inside a living narrative" reads marketing
- Line 532 What it is: *"Most interactive fiction has been the same trick for forty years..."* — "the same trick for forty years" is Tink-default editorial framing
- Line 534: *"You bring the campaign. Inkwell brings the world."* — three-beat reversal pattern, Tink default
- Line 562 Pick a world body: long paragraph, reads polished
- Line 590 Themes section: *"Some stories want candlelight. Others want neon."* — short Tink-aphorism pattern

**sqrrledaway.html:**
- Hero lede line 540 (approx): *"SqrrledAway is meal planning built around how households actually cook — multiple cooks, kid plates, presence at the table, real ingredients in the pantry. Manual where you want it. AI when you don't."* — em-dash list + three-beat cluster ("Manual where you want it. AI when you don't.")
- "What it is" 3-paragraph framing — long, polished
- "How it works" feature copy — each is "X. Y. Z." pattern
- "Pantry to plate" body — long
- "After the cooking" body — long, ends *"who's been quietly skipping the broccoli"* — Tink-flourish closer

### Recommendation
Pick ONE of these two pages for a voice pass first (Inkwell is higher priority since it has a public waitlist and ships earlier). Do the pass in Dreamweaver. Use the brand-guide voice rules block as a checklist while editing. Save SqrrledAway for after, since it's auth-gated and sees fewer eyes.

---

## notes.html (Q&A scaffold)

The 15-question scaffold is structural; awaits your voice answers. No flags on the scaffold itself.

### 🟡 Hero lede
- *"Notes from a working practice — questions I've been asked over the years and what I actually think the answer is."*

  Em-dash + "what I actually think the answer is" — slightly conversational-Tink. Plainer: *"Notes from a working practice. Questions I've been asked over the years; my real answers."*

### Cross-page consistency note
Every notes post you write going forward gets the acorn-period treatment if it ends in italic em — already established pattern.

---

## notes/flute-direction.html

Already in your voice (you wrote the body, including the closing paragraph about not mixing flute orientations). No flags.

---

## 404.html / contact.html / privacy.html / support.html

Quick scan: these are utility pages, structural copy. Privacy and support are templated necessary text. 404 has the Vitruvian Squirrel and the *"Off the dieline."* H1 with acorn period — already approved.

### 🟢 contact.html — quick check recommended
Hero copy on contact pages tends to drift toward "Get in touch!" generic register. Worth a 2-minute Dreamweaver scan.

---

## Cross-page consistency

### 🟡 Founding date is correct (2025) but framed differently each time
- about.html sidebar: *"Est. 2025"*
- about.html main copy: *"Sqrrlbrain Studio LLC was founded in 2025"*
- index.html / projects.html / sqrrledaway.html footers: *"© 2026 Sqrrlbrain Studio LLC"* (correct — current year, not founding year)

  All correct, but the about-page treats founding as factual and the footer treats 2026 as current-year. Worth verifying nothing on the site says the studio was "founded 2026" by mistake.

### 🟡 "We" vs "I" pronoun inconsistency across pages
- about.html: third-person "Ronny" + first-person "I"
- services.html: "We" / "us"
- work.html: first-person "I" (mostly)
- case studies: first-person "I" (mostly, after voice pass)

  Pick one register and apply across all pages. Recommend: first-person "I" everywhere, since the studio is solo-by-design and "we" undercuts that pitch every time it shows up.

### 🟡 Em-dash density
81 em-dashes site-wide across 15 files. Many are legitimate parenthetical use (fine), but a substantial portion are dramatic-pause em-dashes ("X — Y" where a period would do). When you're rewriting any page in Dreamweaver, do one find-and-eyeball pass on em-dashes specifically: if the line works with a period instead, use the period. Em-dashes are an AI-prose tell when they cluster.

---

## Recommended order to attack this list

If you do a single editing session across these issues, ranked by impact-per-hour:

1. **services.html**: rewrite the 4 service overviews and the note-strip in your voice. ~30 min. This is the highest Apple-rejection-risk page after the home page services grid. (~15 min for all 4 overviews if you're moving fast.)
2. **about.html**: kill the no-junior triplet in two of three places, change "we" to "I" on approach #01, drop the "real craft" closer. ~15 min.
3. **inkwell.html voice pass**: full read-through, tighten the 5-6 most polished sentences. ~30 min.
4. **index.html services-grid**: rewrite the 4 service descriptions to match the about-page voice. ~15 min.
5. **sqrrledaway.html voice pass**: same approach as Inkwell. Defer; auth-gated, fewer eyes. ~30 min when you get to it.
6. **Em-dash sweep across all pages**: 5-minute pass per page; demote any dramatic-pause em-dash to a period or comma.

Total ~2-3 hours of focused Dreamweaver editing to clear most of the AI-prose risk on the site.
