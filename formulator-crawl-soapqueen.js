// formulator-crawl-soapqueen.js — Soap Queen (soapqueen.com) recipe scraper
// Usage: node formulator-crawl-soapqueen.js
// Appends to formulator-data.json, commits and pushes after each category.

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'formulator-data.json');
const PROGRESS_FILE = path.join(__dirname, 'formulator-crawl-soapqueen-progress.txt');
const DELAY_MS = 1500;

// Relevant categories only — skip cold-process-soap (lye-based, different % meaning)
const CATEGORIES = [
  { name: 'body',  url: 'https://soapqueen.com/category/bath-and-body-tutorials/lotion/' },
  { name: 'body',  url: 'https://soapqueen.com/category/bath-and-body-tutorials/soaks-and-scrubs/' },
  { name: 'body',  url: 'https://soapqueen.com/category/bath-and-body-tutorials/bath-fizzies/' },
  { name: 'face',  url: 'https://soapqueen.com/category/bath-and-body-tutorials/lip-products/' },
  { name: 'soap',  url: 'https://soapqueen.com/category/bath-and-body-tutorials/melt-and-pour-soap/' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function loadData() { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }

function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) return new Set();
  return new Set(
    fs.readFileSync(PROGRESS_FILE, 'utf8').split('\n')
      .filter(l => l.startsWith('PROCESSED |'))
      .map(l => l.split(' | ')[1]?.trim()).filter(Boolean)
  );
}
function logProgress(url, recipeId) {
  fs.appendFileSync(PROGRESS_FILE, `PROCESSED | ${url} | ${recipeId}\n`);
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&[a-z]+;/g, ' ')
    .replace(/&#\d+;/g, '').replace(/\s+/g, ' ').trim();
}

function capitalizeFirst(s) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function gitCommit(message) {
  try {
    execFileSync('git', ['add', 'formulator-data.json', path.basename(PROGRESS_FILE)], { cwd: __dirname, stdio: 'pipe' });
    execFileSync('git', ['commit', '-m', message], { cwd: __dirname, stdio: 'pipe' });
    execFileSync('git', ['push', 'origin', 'main'], { cwd: __dirname, stdio: 'pipe' });
    console.log('  ✓ Committed & pushed');
  } catch (e) { console.log(`  ⚠ Git error: ${e.message?.slice(0, 100)}`); }
}

// ── URL collection ─────────────────────────────────────────────────────────────

async function getRecipeUrls(categoryUrl) {
  const allUrls = new Set();
  for (let page = 1; page <= 50; page++) {
    const pageUrl = page === 1 ? categoryUrl : `${categoryUrl}page/${page}/`;
    let html;
    try {
      const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) break;
      html = await res.text();
    } catch { break; }

    // Extract recipe links — full /bath-and-body-tutorials/[cat]/[slug]/ paths
    // Exclude category index pages and non-recipe pages
    const urls = [...new Set(
      [...html.matchAll(/href="(https:\/\/soapqueen\.com\/bath-and-body-tutorials\/[^"?#]+\/)"/g)]
        .map(m => m[1])
        .filter(u => !/\/category\//.test(u) && u.split('/').filter(Boolean).length >= 3)
    )];

    if (urls.length === 0) break;
    const prev = allUrls.size;
    urls.forEach(u => allUrls.add(u));
    if (allUrls.size === prev) break;
    if (page < 50) await sleep(DELAY_MS);
  }
  return [...allUrls];
}

// ── Recipe parsing ─────────────────────────────────────────────────────────────

function parseIngredients(html) {
  const ingredients = [];
  const weightItems = [];

  // Try WPRM plugin structure first
  const wprmMatch = html.match(/class="wprm-recipe-ingredients[^"]*"[^>]*>([\s\S]{0,10000}?)<\/ul>/);
  const liSource = wprmMatch ? wprmMatch[1] : html;

  // Extract all <li> text
  const lis = [...liSource.matchAll(/<li[^>]*>([\s\S]{0,300}?)<\/li>/gi)].map(m => stripHtml(m[1]));

  for (const text of lis) {
    // Match percentage in parens: (X%) or (X% )
    const pctMatch = text.match(/\((\d+(?:\.\d+)?)%\s*\)/);
    // Or percentage at end: Ingredient Name X%
    const pctEndMatch = !pctMatch && text.match(/^.+\s+(\d+(?:\.\d+)?)%\s*$/);
    const pct = pctMatch ? parseFloat(pctMatch[1]) : pctEndMatch ? parseFloat(pctEndMatch[1]) : 0;

    // Strip weight prefix to get name
    let name = text
      .replace(/^\d+(?:\.\d+)?\s*(?:oz\.|oz|g|ml|mL)\s*/i, '')
      .replace(/\(\d+(?:\.\d+)?%\s*\)\s*$/, '')
      .replace(/\s+\d+(?:\.\d+)?%\s*$/, '')
      .trim();
    if (name.length < 2) continue;

    if (pct > 0 && pct <= 100) {
      ingredients.push({ name: capitalizeFirst(name), pct });
    } else {
      // Try weight-only fallback: extract oz or g value
      const wtMatch = text.match(/^(\d+(?:\.\d+)?)\s*(?:oz\.|oz|g)\b/i);
      if (wtMatch) weightItems.push({ name: capitalizeFirst(name), wt: parseFloat(wtMatch[1]) });
    }
  }

  // Compute percentages from weights if no % format found
  if (ingredients.length < 2 && weightItems.length >= 2) {
    const total = weightItems.reduce((s, i) => s + i.wt, 0);
    if (total > 0) {
      for (const { name, wt } of weightItems) {
        ingredients.push({ name, pct: Math.round(wt / total * 1000) / 10 });
      }
    }
  }

  return ingredients;
}

function extractProcess(html) {
  const instrMatch = html.match(/class="wprm-recipe-instructions[^"]*"[^>]*>([\s\S]{0,15000}?)<\/(?:ul|ol)>/);
  if (!instrMatch) return '';
  const steps = [...instrMatch[1].matchAll(/<li[^>]*>([\s\S]{0,500}?)<\/li>/gi)]
    .map(m => stripHtml(m[1]).trim())
    .filter(s => s.length > 15 && s.length < 400);
  return steps.join('\n').slice(0, 2000);
}

function detectHeat(text) {
  return /heated?\s+(water|oil|phase)|double\s+boiler|melt\s+the|heat\s+to\s+\d|hot\s+process|microwave/i.test(text);
}

function detectEquipment(text) {
  const eq = [];
  if (/immersion\s+blender|stick\s+blender/i.test(text)) eq.push('Immersion blender');
  if (/stand\s+mixer|hand\s+mixer/i.test(text)) eq.push('Stand/hand mixer');
  if (/\bblender\b/i.test(text) && !eq.includes('Immersion blender')) eq.push('Blender');
  if (/stove|double\s+boiler|microwave/i.test(text)) eq.push('Stove');
  return [...new Set(eq)];
}

function getDescription(html, title) {
  const contentMatch = html.match(/class="(?:entry-content|tve-content-box)[^"]*"[^>]*>([\s\S]{0,5000})/);
  if (contentMatch) {
    const text = stripHtml(contentMatch[1]);
    const paras = text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 60 && p.length < 400);
    for (const p of paras) {
      if (!/\d+(?:\.\d+)?\s*(?:oz|g)\b|%|bramble berry/i.test(p)) return p.slice(0, 250).replace(/\s+/g, ' ');
    }
  }
  return `DIY ${title} from Soap Queen.`;
}

async function parseRecipePage(url) {
  let html;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    html = await res.text();
  } catch { return null; }

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? stripHtml(titleMatch[1]).replace(/\s*[|\-].*$/, '').trim() : 'Untitled';

  const ingredients = parseIngredients(html);
  if (ingredients.length < 2) return null;

  const plainText = stripHtml(html);
  const heatRequired = detectHeat(plainText);
  const equipment = detectEquipment(plainText);
  if (heatRequired && !equipment.includes('Stove')) equipment.unshift('Stove');

  return {
    id: slugify(title),
    name: title,
    source: 'soapqueen.com',
    sourceUrl: url,
    heatRequired,
    equipment,
    description: getDescription(html, title),
    ingredients,
    notes: '',
    process: extractProcess(html),
  };
}

// ── Ingredient registry ────────────────────────────────────────────────────────

const _norm = s => s.replace(/[™®]/g, '').trim().toLowerCase();
function registerIngredients(data, recipe) {
  const existing = new Set(data.ingredients.map(_norm));
  for (const ing of recipe.ingredients) {
    if (!existing.has(_norm(ing.name))) {
      data.ingredients.push(ing.name);
      existing.add(_norm(ing.name));
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
    console.log(`\n── Category: ${catName} (${catUrl}) ──`);

    const urls = await getRecipeUrls(catUrl);
    console.log(`  Found ${urls.length} URLs, ${urls.filter(u => !done.has(u)).length} unprocessed`);

    const newUrls = urls.filter(u => !done.has(u));
    let addedThisCat = 0;

    for (const url of newUrls) {
      const slug = url.split('/').filter(Boolean).pop() ?? url;
      process.stdout.write(`  ${slug.slice(0, 50)} … `);
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
      recipe.category = catName;

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
      gitCommit(`Add soapqueen.com ${catName} recipes (${addedThisCat} added, ${data.recipes.length} total)`);
    } else {
      console.log(`  Nothing new in ${catName}`);
    }
  }

  console.log(`\n✅ Done. Added this run: ${totalAdded}. Total in file: ${data.recipes.length}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
