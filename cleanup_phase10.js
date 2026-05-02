// cleanup_phase10.js — provenance + claims scrubbing pass
// Idempotent: safe to re-run.
// Steps:
//   1. Strip `source` field from every recipe.
//   2. Flip `notesRewritten:true` on every record whose notes are empty (nothing to rewrite).
//   3. Replace 24 placeholder descriptions ("DIY ... from Soap Queen") with clinical text.
//   4. Soften 10 drug-claim phrases.
//   5. Rewrite Vinolia/Titanic description to remove brand name.
//   6. Strip scrape-origin slug fragments from IDs; resolve collisions with -2, -3, ...
//
// Usage: node cleanup_phase10.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'formulator-data.json');

const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const recipes = raw.recipes || raw;

const stats = {
  sourceStripped: 0,
  notesFlagFlipped: 0,
  placeholderReplaced: 0,
  drugClaimsSoftened: 0,
  vinoliaRewritten: 0,
  idsRenamed: 0,
  collisionsResolved: 0,
};

// -- Step 1: strip `source` field
for (const r of recipes) {
  if ('source' in r) { delete r.source; stats.sourceStripped++; }
}

// -- Step 2: flip notesRewritten on empty notes
for (const r of recipes) {
  const notes = (r.notes || '').trim();
  if (notes === '' && r.notesRewritten !== true) {
    r.notesRewritten = true;
    stats.notesFlagFlipped++;
  }
}

// -- Step 3: replace 24 placeholder descriptions (keyed by id)
const placeholderRewrites = {
  'moringa-clay-mask-diy': 'Clay-based body mask featuring kaolin clay and avocado oil. Formulated with moringa seed oil and leaf powder for botanical content and BTMS-50 for conditioning.',
  'rose-clay-face-mask-diy': 'Clay-based body mask featuring kaolin and rose clays with avocado and rosehip seed oils. Formulated with chamomile extract for botanical content.',
  'sultry-jasmine-lotion-tutorial': 'Floral-scented body lotion featuring rosehip seed oil and jasmine essential water. Formulated with stearic acid for a thicker consistency.',
  'diy-turmeric-clay-face-mask': 'Clay-based body mask featuring kaolin clay with turmeric powder and meadowfoam oil. Formulated with carrot extract for botanical content.',
  'diy-sea-clay-face-mask': 'Dual-clay body mask featuring kaolin and sea clays with hazelnut and avocado oils. Formulated for mineral-rich application.',
  'diy-lavender-clay-face-mask': 'Clay-based body mask featuring kaolin and purple Brazilian clays with argan and avocado oils. Formulated with evening primrose extract.',
  'rose-quartz-cold-process-soap-tutorial': 'Cold process soap formulated with olive, palm, and coconut oils. Green tea seed and castor oils included for lather modification.',
  'rose-clay-charcoal-soap-tutorial': 'Cold process soap built on a high-lather oil quick mix base. Scented with a rose-jasmine fragrance oil.',
  'how-to-make-charcoal-facial-soap': 'Cold process soap formulated with olive, palm, and coconut oils. Tamanu oil included for skin conditioning.',
  'clover-aloe-spin-swirl-cold-process-on-soap-queen-tv': 'Cold process soap formulated with canola, palm, and coconut oils. Rice bran and sweet almond oils provide additional skin emolliency.',
  'how-to-make-whipped-body-butter-on-soap-queen-tv': 'Whipped anhydrous body butter featuring avocado butter and meadowfoam oil. Green tea extract included for antioxidant content.',
  'argan-shea-lotion': 'Aloe-based body lotion featuring sweet almond, argan, and shea butter. Formulated with sodium lactate for added hydration and stearic acid for body.',
  'how-to-make-perfume-video': 'Solid perfume formulated with coconut oil, beeswax, and a custom essential oil blend. Designed for portable application.',
  'emulsified-scrub-from-scratch-on-soap-queen-tv': 'Emulsified body scrub formulated with sweet almond oil, mango butter, and beeswax. Includes a phenonip preservative for water-tolerant stability.',
  'baby-massage-oil-video': 'Lightweight infant-friendly massage oil featuring calendula-infused sweet almond oil and argan oil. Fractionated coconut oil included for low-residue application.',
  '3-scrub-recipes-on-soap-queen-tv': 'Solid sugar scrub formulated with shea butter, beeswax, and avocado oil. Vitamin E oil included as an antioxidant.',
  'cleansing-clay-masks-on-soap-queen-tv': 'Anhydrous clay-based mask featuring bentonite and kaolin clays with meadowfoam and tamanu oils. Designed for deep-cleansing application.',
  'how-to-make-solid-bubble-bath': 'Solid bubble bath bar featuring SLSA, baking soda, and cream of tartar. Castor oil and glycerin provide humectant emolliency.',
  'making-bath-truffles-on-soap-queen-tv': 'Anhydrous bath truffles featuring melted cocoa and shea butters. Scented with a layered vanilla and chocolate fragrance blend.',
  'labeling-your-products-lip-balm': 'Two-ingredient lip balm featuring sweet almond oil and white beeswax. Formulated for a firm, classic consistency.',
  'caramel-apple-soap-diy': 'Layered melt-and-pour soap featuring white and clear soap bases. Scented with a hot apple pie fragrance for seasonal variation.',
  'star-anise-melt-pour-bar-tutorial': 'Layered melt-and-pour soap featuring shea and clear soap bases. Designed for an opaque/translucent contrast.',
  'domino-soap-video-tutorial': 'Layered melt-and-pour soap featuring honey and goat milk soap bases. Scented with tobacco and bay leaf fragrance.',
  'how-to-make-petit-four-soap-video': 'Layered melt-and-pour soap featuring white and clear soap bases. Designed for a contrasting opaque/translucent appearance.',
};
for (const r of recipes) {
  if (placeholderRewrites[r.id]) {
    r.description = placeholderRewrites[r.id];
    r.descriptionRewritten = true;
    stats.placeholderReplaced++;
  }
}

// -- Step 4: soften drug-claim phrases (apply to description and notes)
const claimSwaps = [
  [/\banti-inflammatory\b/gi, 'skin-soothing'],
  [/\btherapeutic massage oil\b/gi, 'rich massage oil'],
  [/\bskin healing\b/gi, 'skin conditioning'],
  [/\baromatherapeutic\b/gi, 'aromatic'],
  [/\bintensive overnight treatment for\b/gi, 'overnight balm for'],
  [/\btreatment for\b/gi, 'rich balm for'],
];
for (const r of recipes) {
  for (const [re, repl] of claimSwaps) {
    if (r.description && re.test(r.description)) {
      r.description = r.description.replace(re, repl);
      stats.drugClaimsSoftened++;
    }
    if (r.notes && re.test(r.notes)) {
      r.notes = r.notes.replace(re, repl);
      stats.drugClaimsSoftened++;
    }
  }
}

// -- Step 5: Vinolia / Titanic — strip brand and historical-vessel reference
for (const r of recipes) {
  if (r.id === 'vinolia-soap-re-creation-the-soap-on-the-rms-titanic') {
    r.description = 'A historically-styled rose-scented cold process soap. Formulated to recreate the character of early-20th-century luxury toilet soaps.';
    r.descriptionRewritten = true;
    stats.vinoliaRewritten++;
  }
}

// -- Step 6: rename IDs that contain scrape-origin slug fragments
// Strip these fragments, normalize, resolve collisions
const stripPatterns = [
  /-on-soap-queen-tv\b/g,
  /-soap-queen-tv\b/g,
  /-tutorial\b/g,
  /-video\b/g,
  /-diy\b/g,
  /^diy-/,
  /^how-to-make-/,
];
const seen = new Set(recipes.map(r => r.id));
const renames = [];
for (const r of recipes) {
  let newId = r.id;
  for (const pat of stripPatterns) newId = newId.replace(pat, '');
  newId = newId.replace(/--+/g, '-').replace(/^-+|-+$/g, '');
  if (newId === '' || newId === r.id) continue;

  // Resolve collisions
  if (seen.has(newId) && newId !== r.id) {
    let suffix = 2;
    while (seen.has(`${newId}-${suffix}`)) suffix++;
    newId = `${newId}-${suffix}`;
    stats.collisionsResolved++;
  }
  seen.delete(r.id);
  renames.push([r.id, newId]);
  r.id = newId;
  seen.add(newId);
  stats.idsRenamed++;
}

// Vinolia ID is also a scrape slug — handle explicitly
for (const r of recipes) {
  if (r.id === 'vinolia-soap-re-creation-the-soap-on-the-rms-titanic') {
    let newId = 'historical-rose-toilet-soap';
    if (seen.has(newId)) { let s = 2; while (seen.has(`${newId}-${s}`)) s++; newId = `${newId}-${s}`; }
    seen.delete(r.id);
    renames.push([r.id, newId]);
    r.id = newId;
    seen.add(newId);
    stats.idsRenamed++;
  }
}

fs.writeFileSync(DATA_FILE, JSON.stringify(raw, null, 2) + '\n');

console.log('CLEANUP STATS:');
for (const [k,v] of Object.entries(stats)) console.log(' ', k.padEnd(22), v);
console.log('\nID RENAMES (first 25):');
renames.slice(0, 25).forEach(([a,b]) => console.log(`  ${a}\n    -> ${b}`));
if (renames.length > 25) console.log(`  ... and ${renames.length-25} more`);
fs.writeFileSync(path.join(__dirname, 'cleanup_phase10_renames.json'), JSON.stringify(renames, null, 2));
console.log('\nFull rename map written to cleanup_phase10_renames.json');
