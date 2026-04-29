// formulator-crawl.js — humblebeeandme recipe scraper
// Usage: node formulator-crawl.js
// Appends to formulator-data.json, commits and pushes after each category.

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'formulator-data.json');
const PROGRESS_FILE = path.join(__dirname, 'formulator-crawl-progress.txt');

const CATEGORIES = [
  { name: 'face',     url: 'https://www.humblebeeandme.com/face-recipes/all-face-recipes/' },
  { name: 'body',     url: 'https://www.humblebeeandme.com/homemade-skin-care-recipes/all-body-recipes/' },
  { name: 'hair',     url: 'https://www.humblebeeandme.com/make-natural-hair-care-products/all-hair-recipes/' },
  { name: 'cleaning', url: 'https://www.humblebeeandme.com/natural-cleaning-recipes/' },
];

const DELAY_MS = 1200;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) return new Set();
  return new Set(
    fs.readFileSync(PROGRESS_FILE, 'utf8')
      .split('\n')
      .filter(l => l.startsWith('PROCESSED |'))
      .map(l => l.split(' | ')[1]?.trim())
      .filter(Boolean)
  );
}

function logProgress(url, recipeId) {
  fs.appendFileSync(PROGRESS_FILE, `PROCESSED | ${url} | ${recipeId}\n`);
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/g, ' ').replace(/&#\d+;/g, '').trim();
}

function gitCommit(message) {
  try {
    execFileSync('git', ['add', 'formulator-data.json', 'formulator-crawl-progress.txt'], { cwd: __dirname, stdio: 'pipe' });
    execFileSync('git', ['commit', '-m', message], { cwd: __dirname, stdio: 'pipe' });
    execFileSync('git', ['push', 'origin', 'main'], { cwd: __dirname, stdio: 'pipe' });
    console.log(`  ✓ Committed & pushed`);
  } catch (e) {
    console.log(`  ⚠ Git error: ${e.message?.slice(0, 100)}`);
  }
}

// ── URL collection ─────────────────────────────────────────────────────────────

async function getRecipeUrls(indexUrl) {
  let html;
  try {
    const res = await fetch(indexUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return [];
    html = await res.text();
  } catch { return []; }

  // Extract links from <article> elements — each article is a recipe card
  const urls = [...new Set(
    [...html.matchAll(/<article[^>]*>[\s\S]{0,800}?href="(https:\/\/www\.humblebeeandme\.com\/[^"?#]+\/)"/g)]
      .map(m => m[1])
  )];
  return urls;
}

// ── Recipe parsing ─────────────────────────────────────────────────────────────

// Matches: "15g | 5% shea butter (USA / Canada)"
const ING_LINE = /(\d+(?:\.\d+)?)\s*g\s*\|\s*(\d+(?:\.\d+)?)%\s+([^(|\n<]+)/i;
// Matches plain: "5% shea butter"
const PCT_ONLY = /^(\d+(?:\.\d+)?)%\s+([^(|\n<]{3,})/;

function capitalizeFirst(s) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function parseIngredients(paragraphs) {
  const ingredients = [];
  for (const para of paragraphs) {
    const lines = para.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      let m = line.match(ING_LINE);
      if (m) {
        const name = m[3].replace(/\(.*?\)/g, '').trim().replace(/\s+/g, ' ');
        const pct = parseFloat(m[2]);
        if (name.length > 2 && pct > 0 && pct <= 100) {
          ingredients.push({ name: capitalizeFirst(name), pct });
        }
        continue;
      }
      m = line.match(PCT_ONLY);
      if (m) {
        const name = m[2].replace(/\(.*?\)/g, '').trim().replace(/\s+/g, ' ');
        const pct = parseFloat(m[1]);
        if (name.length > 2 && pct > 0 && pct <= 100) {
          ingredients.push({ name: capitalizeFirst(name), pct });
        }
      }
    }
  }
  return ingredients;
}

function detectHeat(text) {
  return /heated?\s+(water|oil|phase)|double\s+boiler|melt\s+the|heat\s+to\s+\d|hot\s+process/i.test(text);
}

function detectEquipment(text) {
  const eq = [];
  if (/immersion\s+blender|stick\s+blender/i.test(text)) eq.push('Immersion blender');
  if (/stand\s+mixer|hand\s+mixer/i.test(text)) eq.push('Stand/hand mixer');
  if (/\bblender\b/i.test(text) && !eq.includes('Immersion blender')) eq.push('Blender');
  if (/stove|double\s+boiler/i.test(text)) eq.push('Stove');
  return [...new Set(eq)];
}

function getDescription(paragraphs, title) {
  for (const para of paragraphs) {
    const t = para.trim();
    if (t.length > 60 && t.length < 400 && !/^\d+%/.test(t) && !t.includes('|') &&
        !/^(Heated|Cool|Water|Oil)\s+phase/i.test(t) && !/^\d+g\s*\|/.test(t)) {
      return t.slice(0, 250).replace(/\s+/g, ' ') + (t.length > 250 ? '…' : '');
    }
  }
  return `DIY ${title} recipe from Humblebee & Me.`;
}

function getNotes(paragraphs) {
  const notePara = paragraphs.find(p =>
    /substitut|swap|replac|tip:|note:|if you (can't|don't|want)/i.test(p) &&
    p.length > 30 && p.length < 500
  );
  return notePara ? notePara.trim().slice(0, 400).replace(/\s+/g, ' ') : '';
}

async function parseRecipePage(url) {
  let html;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    html = await res.text();
  } catch { return null; }

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? stripHtml(titleMatch[1]).replace(/\s*\|.*$/, '').trim() : 'Untitled';

  const contentMatch = html.match(/class="entry-content[^"]*"[^>]*>([\s\S]{0,30000})/);
  if (!contentMatch) return null;
  const contentHtml = contentMatch[1];
  const contentText = contentHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '');

  const paragraphs = contentText.split(/\n{2,}/).map(p => p.replace(/\s+/g, ' ').trim()).filter(p => p.length > 5);
  const ingredients = parseIngredients(paragraphs);
  if (ingredients.length < 2) return null;

  const heatRequired = detectHeat(contentText);
  const equipment = detectEquipment(contentText);
  if (heatRequired && !equipment.includes('Stove')) equipment.unshift('Stove');

  return {
    id: slugify(title),
    name: title,
    source: 'humblebeeandme.com',
    sourceUrl: url,
    heatRequired,
    equipment,
    description: getDescription(paragraphs, title),
    ingredients,
    notes: getNotes(paragraphs),
  };
}

const _normIng = s => s.replace(/[™®]/g, '').trim().toLowerCase();
function registerIngredients(data, recipe) {
  const existing = new Set(data.ingredients.map(_normIng));
  for (const ing of recipe.ingredients) {
    if (!existing.has(_normIng(ing.name))) {
      data.ingredients.push(ing.name);
      existing.add(_normIng(ing.name));
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const done = loadProgress();
  const data = loadData();
  const existingIds = new Set(data.recipes.map(r => r.id));
  let totalAdded = 0;

  for (const { name: catName, url: catUrl } of CATEGORIES) {
    console.log(`\n── Category: ${catName} ──`);

    const urls = await getRecipeUrls(catUrl);
    console.log(`  Found ${urls.length} URLs, ${urls.filter(u => !done.has(u)).length} unprocessed`);

    const newUrls = urls.filter(u => !done.has(u));
    let addedThisCat = 0;

    for (const url of newUrls) {
      const slug = url.split('/').filter(Boolean).pop() ?? url;
      process.stdout.write(`  ${slug} … `);
      await sleep(DELAY_MS);

      const recipe = await parseRecipePage(url);
      if (!recipe) {
        console.log('skip');
        logProgress(url, 'SKIPPED');
        done.add(url);
        continue;
      }

      let id = recipe.id;
      let suffix = 2;
      while (existingIds.has(id)) { id = `${recipe.id}-${suffix++}`; }
      recipe.id = id;

      registerIngredients(data, recipe);
      data.recipes.push(recipe);
      existingIds.add(recipe.id);
      logProgress(url, recipe.id);
      done.add(url);
      addedThisCat++;
      totalAdded++;
      console.log(`✓ (${recipe.ingredients.length} ings)`);
    }

    if (addedThisCat > 0) {
      saveData(data);
      gitCommit(`Add humblebeeandme ${catName} (${addedThisCat} added, ${data.recipes.length} total)`);
    } else {
      console.log(`  Nothing new in ${catName}`);
    }
  }

  console.log(`\n✅ Done. Added this run: ${totalAdded}. Total in file: ${data.recipes.length}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
