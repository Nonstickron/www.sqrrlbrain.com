/**
 * Crucible Phase 7 — Final data cleanup
 * Run: node formulator-phase7.js
 *
 * Operations (in order):
 *   1. Extract first variant from 34 multi-variant recipes (ingredient list loops back)
 *   2. Normalize off-sum recipes to exactly 100% via proportional scaling
 *   3. Fix garbled names where same ingredient appears on both sides of " & "
 *   4. Deduplicate 64 name groups by appending numeric suffixes
 *
 * Does NOT commit to git — commit manually after reviewing output.
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'formulator-data.json');
const BACKUP_PATH = path.join(__dirname, 'formulator-data.phase6.backup.json');

// ─── load ────────────────────────────────────────────────────────────────────

const raw = fs.readFileSync(DATA_PATH, 'utf8');
const store = JSON.parse(raw);
const recipes = store.recipes;
console.log(`Loaded ${recipes.length} recipes`);

// ─── backup ──────────────────────────────────────────────────────────────────

if (!fs.existsSync(BACKUP_PATH)) {
  fs.writeFileSync(BACKUP_PATH, raw, 'utf8');
  console.log('Backup written:', BACKUP_PATH);
} else {
  console.log('Backup already exists, skipping');
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function ingredientSum(ingredients) {
  return ingredients.reduce((s, i) => s + (i.pct || 0), 0);
}

/**
 * Extract the first variant from a multi-variant ingredient list.
 * A variant boundary = when an ingredient name appears for the second time.
 */
function extractFirstVariant(ingredients) {
  const seen = new Set();
  const first = [];
  for (const ing of ingredients) {
    if (seen.has(ing.name)) break;
    seen.add(ing.name);
    first.push(ing);
  }
  return first;
}

/**
 * Scale ingredient percentages so they sum to exactly 100.
 */
function normalizeTo100(ingredients) {
  const sum = ingredientSum(ingredients);
  if (sum === 0) return ingredients;
  return ingredients.map(ing => ({
    ...ing,
    pct: Math.round((ing.pct / sum) * 10000) / 100,  // 2 decimal places
  }));
}

/**
 * Given an ingredient list, return the top-N unique ingredient names by pct.
 */
function topIngredients(ingredients, n = 2) {
  const sorted = [...ingredients].sort((a, b) => b.pct - a.pct);
  const seen = new Set();
  const result = [];
  for (const ing of sorted) {
    if (!seen.has(ing.name)) {
      seen.add(ing.name);
      result.push(ing.name);
      if (result.length >= n) break;
    }
  }
  return result;
}

/**
 * Derive a category suffix word from existing name (last word before nothing,
 * or the category field).
 */
function categorySuffix(recipe) {
  // grab last word of existing name (e.g. "Balm", "Serum", "Butter")
  const words = recipe.name.split(/\s+/);
  return words[words.length - 1] || recipe.category || 'Formula';
}

// ─── step 1: extract first variant from multi-variant recipes ────────────────

let step1Fixed = 0;
recipes.forEach(recipe => {
  const sum = ingredientSum(recipe.ingredients);
  if (sum > 150) {
    const first = extractFirstVariant(recipe.ingredients);
    if (first.length < recipe.ingredients.length) {
      recipe.ingredients = first;
      step1Fixed++;
    }
  }
});
console.log(`\nStep 1 — Extracted first variant: ${step1Fixed} recipes fixed`);

// ─── step 2: normalize off-sum recipes to 100% ──────────────────────────────

let step2Fixed = 0;
recipes.forEach(recipe => {
  const sum = ingredientSum(recipe.ingredients);
  if (Math.abs(sum - 100) > 2) {
    recipe.ingredients = normalizeTo100(recipe.ingredients);
    step2Fixed++;
  }
});
console.log(`Step 2 — Normalized to 100%: ${step2Fixed} recipes fixed`);

// ─── step 3: fix garbled names (same ingredient on both sides of " & ") ──────

let step3Fixed = 0;
recipes.forEach(recipe => {
  if (!recipe.name.includes(' & ')) return;
  const ampIdx = recipe.name.indexOf(' & ');
  const part1 = recipe.name.slice(0, ampIdx).trim();
  const rest = recipe.name.slice(ampIdx + 3);
  if (!rest.startsWith(part1)) return;

  // Name is garbled — rebuild from top ingredients
  const suffix = categorySuffix(recipe);
  const top = topIngredients(recipe.ingredients, 3);
  // use top 2, but ensure they're different
  const [a, b] = top;
  if (b && a !== b) {
    recipe.name = `${a} & ${b} ${suffix}`;
  } else if (top[1]) {
    // fallback: use top 1 + suffix only
    recipe.name = `${a} ${suffix}`;
  }
  step3Fixed++;
});
console.log(`Step 3 — Fixed garbled names: ${step3Fixed} recipes fixed`);

// ─── step 4: deduplicate names with numeric suffixes ─────────────────────────

// Build name → [indices] map
const nameGroups = {};
recipes.forEach((recipe, idx) => {
  if (!nameGroups[recipe.name]) nameGroups[recipe.name] = [];
  nameGroups[recipe.name].push(idx);
});

let step4Groups = 0;
let step4Recipes = 0;
Object.entries(nameGroups).forEach(([name, indices]) => {
  if (indices.length < 2) return;
  step4Groups++;
  step4Recipes += indices.length;
  // sort by source so ordering is stable
  const sorted = indices.sort((a, b) => {
    const ra = recipes[a], rb = recipes[b];
    return (ra.source || '').localeCompare(rb.source || '');
  });
  sorted.forEach((recipeIdx, n) => {
    recipes[recipeIdx].name = `${recipes[recipeIdx].name} ${n + 1}`;
  });
});
console.log(`Step 4 — Deduplicated: ${step4Groups} groups, ${step4Recipes} recipes renamed`);

// ─── verify ──────────────────────────────────────────────────────────────────

const sums = recipes.map(r => ingredientSum(r.ingredients));
const stillOff = sums.filter(s => Math.abs(s - 100) > 2);
const finalNames = recipes.map(r => r.name);
const finalDupes = finalNames.filter((n, i) => finalNames.indexOf(n) !== i);
console.log(`\nVerification:`);
console.log(`  Recipes still off-sum (>2%): ${stillOff.length}`);
console.log(`  Duplicate names remaining: ${finalDupes.length}`);
if (stillOff.length > 0) {
  const samples = recipes.filter(r => Math.abs(ingredientSum(r.ingredients) - 100) > 2).slice(0, 3);
  samples.forEach(r => console.log(`    - ${r.name}: ${ingredientSum(r.ingredients).toFixed(2)}%`));
}

// ─── write output ────────────────────────────────────────────────────────────

store.recipes = recipes;
fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), 'utf8');
console.log(`\nDone — ${DATA_PATH} updated.`);
console.log('Commit manually when satisfied: git add formulator-data.json && git commit -m "feat: Phase 7 data cleanup"');
