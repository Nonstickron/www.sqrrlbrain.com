// formulator-rewrite-process.js — rewrite extracted process text through Gemini
// Converts raw scraped blog prose into clean numbered steps in original language.
// Usage: GOOGLE_API_KEY=xxx node formulator-rewrite-process.js
// Skips recipes already marked processRewritten:true unless --force flag passed.

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'formulator-data.json');
const DELAY_MS = 1500;
const BATCH_SIZE = 50;

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) { console.error('GOOGLE_API_KEY not set'); process.exit(1); }

const FORCE = process.argv.includes('--force');

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const PROMPT_PREFIX = `Rewrite the following DIY skincare recipe instructions as clean numbered steps.
Rules:
- Use your own words throughout — do not copy any phrases from the original
- Keep all technical details: temperatures, timing, order of addition, techniques
- Each step should be one clear action
- Remove any editorial commentary, tips, or non-instructional content
- Output ONLY the numbered steps, nothing else

Original instructions:
`;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function rewriteProcess(text) {
  const body = {
    contents: [{ parts: [{ text: PROMPT_PREFIX + text }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
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

function gitCommit(count, total) {
  try {
    execFileSync('git', ['add', 'formulator-data.json'], { cwd: __dirname, stdio: 'pipe' });
    execFileSync('git', ['commit', '-m', `Rewrite process text: ${count}/${total} recipes`], { cwd: __dirname, stdio: 'pipe' });
    execFileSync('git', ['push', 'origin', 'main'], { cwd: __dirname, stdio: 'pipe' });
    console.log(`  ✓ Committed & pushed`);
  } catch (e) { console.log(`  ⚠ Git error: ${e.message?.slice(0, 80)}`); }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const toProcess = data.recipes.filter(r => r.process && (FORCE || !r.processRewritten));
  console.log(`Recipes to rewrite: ${toProcess.length} (${data.recipes.filter(r => r.processRewritten).length} already done)`);

  let updated = 0;
  let batch = 0;
  let errors = 0;

  for (const recipe of toProcess) {
    process.stdout.write(`  ${recipe.id.slice(0, 50)} … `);
    await sleep(DELAY_MS);

    try {
      const rewritten = await rewriteProcess(recipe.process);
      recipe.process = rewritten;
      recipe.processRewritten = true;
      updated++;
      batch++;
      console.log(`✓ (${rewritten.split('\n').filter(l => /^\d+\./.test(l.trim())).length} steps)`);
    } catch (e) {
      errors++;
      console.log(`skip (${e.message.slice(0, 60)})`);
    }

    if (batch >= BATCH_SIZE) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      gitCommit(updated, toProcess.length);
      batch = 0;
    }
  }

  if (batch > 0) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    gitCommit(updated, toProcess.length);
  }

  console.log(`\n✅ Done. Rewritten: ${updated} / ${toProcess.length}. Errors: ${errors}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
