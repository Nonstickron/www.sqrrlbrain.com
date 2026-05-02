import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'formulator-data.json');
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('GOOGLE_API_KEY not set');
  process.exit(1);
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const PROMPT_PREFIX = `Rewrite the following DIY skincare/cosmetic recipe description to be concise and factual.
Rules:
- State what the product IS and its key properties or purpose in 1–2 sentences.
- Strip ALL: personality, first person ("I", "we"), enthusiasm, blog storytelling, seasonal references, and source-site phrasing.
- Include: product type, key ingredients or their function, finish/texture/benefit if clearly stated.
- No introductory text, no markdown, just the rewritten description.

Original description:
`;

async function rewriteDescription(text) {
  const body = {
    contents: [{ parts: [{ text: PROMPT_PREFIX + text }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 128 },
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API ${res.status}: ${err.slice(0, 200)}`);
  }

  const json = await res.json();
  const output = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!output) throw new Error('Empty response from Gemini');
  return output;
}

function needsRewrite(desc) {
  if (!desc) return false;
  const lower = desc.toLowerCase();
  if (/\b(i|i've|i'm|we|me|my|our)\b/.test(lower)) return true;
  if (/\b(love|amazing|beautiful|great|wonderful|fantastic|gorgeous|excited|thrilled|delighted)\b/.test(lower)) return true;
  if (/&#\d+;|&[a-z]+;/i.test(desc)) return true;
  if (/\b(today|this week|this month|summer|spring|fall|winter|holiday|season)\b/.test(lower)) return true;
  if (lower.includes('welcome') || lower.includes('tribute') || lower.includes('inspired by') || lower.includes('in this post')) return true;
  if (lower.includes('blog') || lower.includes('click here') || lower.includes('recipe post')) return true;
  return false;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const targets = data.recipes.filter(r => !r.descriptionRewritten && needsRewrite(r.description));

  console.log(`Found ${targets.length} descriptions needing rewrite.`);

  let count = 0;
  for (const recipe of targets) {
    console.log(`[${++count}/${targets.length}] ${recipe.name || recipe.id}`);
    try {
      recipe.description = await rewriteDescription(recipe.description);
      recipe.descriptionRewritten = true;

      if (count % 20 === 0) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log('  (Auto-saved)');
      }

      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.error(`  Error on ${recipe.id}: ${e.message}`);
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`\nDone. ${count} descriptions updated. Run: git add formulator-data.json && git commit -m "feat(crucible): Phase 9 clinical description rewrite" && git push`);
}

main().catch(console.error);
