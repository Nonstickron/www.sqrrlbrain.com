// formulator-add-instructions.js — backfill 'process' field on all recipes
// Usage: node formulator-add-instructions.js
// Reads formulator-data.json, fetches each recipe page that lacks process text,
// extracts the method section, saves, and commits.

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'formulator-data.json');
const DELAY_MS = 1200;

const ING_LINE = /\d+(?:\.\d+)?\s*g\s*\|\s*\d+(?:\.\d+)?%/;
const STOP = /\bhow\s+(can|to|do)\b|start\s+custom|where\s+to\s+buy|want\s+to\s+learn|patreon|sign\s+up|newsletter|disclaimer|shelf\s+life\s+&\s+storage|^\s*shelf\s+life\b/i;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#[0-9]+;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[ \t]+/g, ' ');
}

function extractProcess(html) {
  const contentMatch = html.match(/class="entry-content[^"]*"[^>]*>([\s\S]{0,80000})/);
  if (!contentMatch) return '';

  const text = stripHtml(contentMatch[1]);
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 15);

  // Find last ingredient line
  let lastIng = -1;
  lines.forEach((l, i) => { if (ING_LINE.test(l)) lastIng = i; });
  if (lastIng === -1) return '';

  // Collect method lines after last ingredient until stop section
  const method = [];
  for (let i = lastIng + 1; i < lines.length; i++) {
    if (STOP.test(lines[i])) break;
    const l = lines[i];
    // Skip very long lines (editorial prose) and short fluff
    if (l.length > 350 || l.length < 20) continue;
    // Skip lines that are clearly not instructions
    if (/^\s*(try\s+a\s+different|you\s+can\s+have|read\s+more:|learn\s+more:|want\s+to\s+watch|spring\s+20\d\d)/i.test(l)) continue;
    method.push(l);
  }

  return method.join('\n').trim().slice(0, 2000);
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const toFetch = data.recipes.filter(r => r.source !== 'custom' && r.sourceUrl && !r.process);
  console.log(`Recipes needing process text: ${toFetch.length}`);

  let updated = 0;
  let batch = 0;

  for (const recipe of toFetch) {
    process.stdout.write(`  ${recipe.id.slice(0, 50)} … `);
    await sleep(DELAY_MS);

    let html;
    try {
      const res = await fetch(recipe.url || recipe.sourceUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) { console.log('skip (HTTP ' + res.status + ')'); continue; }
      html = await res.text();
    } catch { console.log('skip (fetch error)'); continue; }

    const process_text = extractProcess(html);
    if (process_text) {
      recipe.process = process_text;
      updated++;
      batch++;
      console.log(`✓ (${process_text.split('\n').length} lines)`);
    } else {
      console.log('skip (no method found)');
    }

    // Save and commit every 50 recipes
    if (batch >= 50) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      try {
        execFileSync('git', ['add', 'formulator-data.json'], { cwd: __dirname, stdio: 'pipe' });
        execFileSync('git', ['commit', '-m', `Add process text: ${updated} recipes`], { cwd: __dirname, stdio: 'pipe' });
        execFileSync('git', ['push', 'origin', 'main'], { cwd: __dirname, stdio: 'pipe' });
        console.log(`  ✓ Committed (${updated} total so far)`);
      } catch (e) { console.log('  ⚠ Git error:', e.message?.slice(0, 80)); }
      batch = 0;
    }
  }

  // Final save + commit
  if (batch > 0 || updated > 0) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    try {
      execFileSync('git', ['add', 'formulator-data.json'], { cwd: __dirname, stdio: 'pipe' });
      execFileSync('git', ['commit', '-m', `Add process text to recipes (${updated} total)`], { cwd: __dirname, stdio: 'pipe' });
      execFileSync('git', ['push', 'origin', 'main'], { cwd: __dirname, stdio: 'pipe' });
    } catch (e) { console.log('Git error:', e.message?.slice(0, 80)); }
  }

  console.log(`\n✅ Done. Updated: ${updated} / ${toFetch.length}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
