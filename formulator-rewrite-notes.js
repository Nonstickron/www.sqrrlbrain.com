// formulator-rewrite-notes.js — rewrite scraped/personal recipe notes through Gemini
// Rewrites notes to be clinical: substitutions, technique tips, storage, cautions.
// Usage: GOOGLE_API_KEY=xxx node formulator-rewrite-notes.js
// Skips recipes already marked notesRewritten:true unless --force flag is passed.

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'formulator-data.json');
const DELAY_MS  = 1200;
const BATCH_SIZE = 50;

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) { console.error('GOOGLE_API_KEY not set'); process.exit(1); }

const FORCE = process.argv.includes('--force');

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const PROMPT = `You are cleaning up recipe notes for a professional cosmetic formulation database.

Rewrite the following notes to be brief and clinical. Keep only:
- Substitution suggestions (ingredient swaps and why)
- Technique tips (mixing order, temperatures, timing)
- Storage or preservation notes
- Skin type or sensitivity cautions

Rules:
- Use neutral, third-person, factual language
- No first person ("I", "we"), no enthusiasm ("love", "great", "amazing", "beautiful")
- No references to the source blog, author, or website
- Strip HTML entities and tags if present
- If there is no useful technical information, output only: none
- Output ONLY the rewritten notes, nothing else. 2–4 sentences maximum.

Notes to rewrite:
`;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Detect notes that need rewriting
function needsRewrite(notes) {
  if (!notes || notes.trim().length < 10) return false;
  // HTML entities or tags — always rewrite
  if (/&[a-z#0-9]+;|<[a-z]/i.test(notes)) return true;
  // Personal/fluffy language
  if (/\b(I |we |love|amazing|beautiful|perfect|enjoy|feel free|hope you|try it|so good|delicious|wonderful|favorite|favourite|inspired|excited|obsessed|pleased|happy|great way|really easy|super easy|quite easy)\b/i.test(notes)) return true;
  // Clearly scraped intro phrases
  if (/\b(in this post|click here|shop now|read more|visit|follow me|subscribe|formulation overview|the inspiration|relevant links|further reading|similar formulations)\b/i.test(notes)) return true;
  return false;
}

async function rewriteNotes(text) {
  const body = {
    contents: [{ parts: [{ text: PROMPT + text }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
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
    execFileSync('git', ['commit', '-m', `Rewrite notes: ${count}/${total} recipes`], { cwd: __dirname, stdio: 'pipe' });
    execFileSync('git', ['push', 'origin', 'main'], { cwd: __dirname, stdio: 'pipe' });
    console.log('  ✓ Committed & pushed');
  } catch (e) { console.log('  ⚠ Git:', e.message?.slice(0, 80)); }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  const toProcess = data.recipes.filter(r =>
    (FORCE || !r.notesRewritten) && needsRewrite(r.notes)
  );

  const alreadyDone = data.recipes.filter(r => r.notesRewritten).length;
  console.log(`Notes to rewrite: ${toProcess.length}  (${alreadyDone} already done)`);
  if (toProcess.length === 0) { console.log('Nothing to do.'); return; }

  let updated = 0, batch = 0, errors = 0;

  for (const recipe of toProcess) {
    process.stdout.write(`  ${recipe.name.slice(0, 55).padEnd(55)} … `);
    await sleep(DELAY_MS);

    try {
      const rewritten = await rewriteNotes(recipe.notes);
      recipe.notes = rewritten === 'none' ? '' : rewritten;
      recipe.notesRewritten = true;
      updated++;
      batch++;
      console.log('✓');
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

  console.log(`\nDone. Rewritten: ${updated} / ${toProcess.length}. Errors: ${errors}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
