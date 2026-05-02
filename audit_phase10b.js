import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'formulator-data.json'), 'utf8'));
const r = raw.recipes || raw;

console.log('--- sourceUrl SAMPLES (first 10) ---');
r.filter(x => x.sourceUrl).slice(0, 10).forEach(x => console.log(' ', x.sourceUrl));

const domains = {};
for (const x of r) {
  if (x.sourceUrl) {
    try { const u = new URL(x.sourceUrl); domains[u.hostname] = (domains[u.hostname] || 0) + 1; }
    catch (e) { domains['(invalid)'] = (domains['(invalid)'] || 0) + 1; }
  }
}
console.log('\n--- sourceUrl domains ---');
Object.entries(domains).forEach(([k, v]) => console.log(' ', v, k));

const u = r.filter(x => x.process && !x.processRewritten);
console.log('\n--- unrewritten process count:', u.length, '---');
u.slice(0, 5).forEach(x => {
  console.log('  id:', x.id);
  console.log('   ', x.process.slice(0, 300).replace(/\n/g, ' / '));
});

console.log('\n--- process source-name leak scan (all process fields) ---');
const blob = r.filter(x => x.process).map(x => x.id + '|' + x.process).join('\n').toLowerCase();
const terms = ['humblebee', 'soap queen', 'soapqueen', 'bramble', 'marie ', 'tania', "i'm ", ' i ', ' my ', ' we ', ' our ', 'this tutorial', 'this video', 'her recipe', 'his recipe', 'my blog', 'my post', 'as i mentioned'];
for (const t of terms) {
  const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const c = (blob.match(re) || []).length;
  if (c > 0) console.log(`  ${t.padEnd(18)} ${c}`);
}

console.log('\n--- ratioShifted distribution ---');
console.log('  shifted:', r.filter(x => x.ratioShifted).length, ' / ', r.length);

console.log('\n--- ID still containing brand-name fragments ---');
for (const t of ['vinolia', 'titanic', 'pemberley', 'darcy']) {
  const c = r.filter(x => x.id.toLowerCase().includes(t)).length;
  if (c > 0) console.log(`  ${t.padEnd(18)} ${c}`);
}
