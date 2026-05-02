import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'formulator-data.json'), 'utf8'));
const r = raw.recipes || raw;

console.log('records:', r.length);
console.log('with source field:', r.filter(x => 'source' in x).length);
console.log('descriptionRewritten=true:', r.filter(x => x.descriptionRewritten === true).length);
console.log('notesRewritten=true:', r.filter(x => x.notesRewritten === true).length);
console.log('"DIY ... from" desc remaining:', r.filter(x => /^DIY .+ from /i.test(x.description || '')).length);

const blob = r.map(x => `${x.id} | ${x.name} | ${x.description || ''} | ${x.notes || ''}`).join('\n').toLowerCase();

console.log('\n-- source/brand leak recheck --');
for (const t of ['humblebee', 'soap queen', 'soapqueen', 'from soap', 'vinolia', 'rms titanic', 'titanic', 'her blog', 'his blog', 'this tutorial', 'in this video']) {
  const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const c = (blob.match(re) || []).length;
  if (c > 0) console.log(`  ${t.padEnd(18)} ${c}`);
}

console.log('\n-- drug claim recheck --');
for (const t of ['cure', 'heals', 'treats', 'treatment for', 'anti-inflammatory', 'therapeutic', 'aromatherapeutic', 'antibacterial', 'eczema', 'psoriasis', 'medicinal', 'clinically']) {
  const c = (blob.match(new RegExp(t, 'g')) || []).length;
  if (c > 0) console.log(`  ${t.padEnd(20)} ${c}`);
}

console.log('\n-- ID slug fragments recheck --');
for (const t of ['-on-soap-queen-tv', '-soap-queen-tv', '-tutorial', '-video', '-diy', 'diy-', 'how-to-make-', '-tv']) {
  const c = r.filter(x => x.id.includes(t)).length;
  if (c > 0) console.log(`  ${t.padEnd(20)} ${c}`);
}

console.log('\n-- first-person recheck --');
let fpHits = 0;
for (const x of r) {
  const txt = (x.description || '') + ' ' + (x.notes || '');
  if (/\bI\b/.test(txt) || /\bmy /i.test(txt) || /\bwe /i.test(txt)) fpHits++;
}
console.log('  first-person hits:', fpHits);

console.log('\n-- ID uniqueness --');
const ids = r.map(x => x.id);
const uniq = new Set(ids);
console.log('  total ids:', ids.length, ' unique:', uniq.size, ' duplicates:', ids.length - uniq.size);
