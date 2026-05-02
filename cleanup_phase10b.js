// cleanup_phase10b.js — second pass after schema discovery
// Idempotent.
//   1. Delete the scraped FAQ record (super-simple-all-natural-lotion-follow-up-qa) — not a recipe.
//   2. Strip `sourceUrl` from every recipe (had been missed in pass 1).
//   3. Strip `ratioShifted` flag (revealing metadata; not user-facing).
//   4. Rename `vinolia-lemon-rose-bath-bombs` → `lemon-rose-bath-bombs`.
//   5. Strip `pemberley-` prefix from 4 IDs.
//   6. Final scan for any remaining brand-name slugs in IDs.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'formulator-data.json');

const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const recipes = raw.recipes || raw;

const stats = { deleted: 0, sourceUrlStripped: 0, ratioShiftedStripped: 0, idsRenamed: 0, collisionsResolved: 0 };
const renames = [];

// 1. Delete FAQ record (pure scraped Q&A post, not a recipe)
const faqIdx = recipes.findIndex(x => x.id === 'super-simple-all-natural-lotion-follow-up-qa');
if (faqIdx >= 0) { recipes.splice(faqIdx, 1); stats.deleted++; }

// 2. Strip sourceUrl
for (const r of recipes) if ('sourceUrl' in r) { delete r.sourceUrl; stats.sourceUrlStripped++; }

// 3. Strip ratioShifted flag
for (const r of recipes) if ('ratioShifted' in r) { delete r.ratioShifted; stats.ratioShiftedStripped++; }

// 4 + 5. Rename specific IDs
const seen = new Set(recipes.map(r => r.id));
function renameTo(record, newId) {
  if (newId === record.id) return;
  if (seen.has(newId)) {
    let s = 2;
    while (seen.has(`${newId}-${s}`)) s++;
    newId = `${newId}-${s}`;
    stats.collisionsResolved++;
  }
  seen.delete(record.id);
  renames.push([record.id, newId]);
  record.id = newId;
  seen.add(newId);
  stats.idsRenamed++;
}

for (const r of recipes) {
  if (r.id === 'vinolia-lemon-rose-bath-bombs') renameTo(r, 'lemon-rose-bath-bombs');
  else if (r.id.startsWith('pemberley-')) renameTo(r, r.id.replace(/^pemberley-/, ''));
}

// 6. Sweep for any remaining IDs with obvious brand/literary identifiers
const suspectFragments = ['vinolia', 'titanic', 'pemberley', 'darcy', 'soapqueen', 'humblebee', 'brambleberry'];
const suspects = recipes.filter(r => suspectFragments.some(t => r.id.toLowerCase().includes(t)));

fs.writeFileSync(DATA_FILE, JSON.stringify(raw, null, 2) + '\n');

console.log('PASS 10b STATS:');
for (const [k, v] of Object.entries(stats)) console.log(` ${k.padEnd(22)} ${v}`);
console.log('\nRENAMES:');
renames.forEach(([a, b]) => console.log(`  ${a}\n    -> ${b}`));
console.log('\nREMAINING SUSPECT IDs:', suspects.length);
suspects.forEach(s => console.log(' ', s.id));
console.log('\nrecipe count after delete:', recipes.length);
