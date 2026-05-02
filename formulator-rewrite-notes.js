import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'formulator-data.json');
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('GOOGLE_API_KEY not set');
  process.exit(1);
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const PROMPT_PREFIX = `Rewrite the following DIY skincare recipe notes to be brief and clinical.
Rules:
- Keep ONLY: substitution suggestions, technique tips (mixing order, temperatures, timing), storage/preservation notes, skin type cautions.
- Strip ALL: personality, first person ("I"), enthusiasm (love/amazing/great/beautiful), blog filler, and source-site references.
- Use 2–4 sentences max.
- If there is no useful technical/safety content, respond with "EMPTY".
- Do not use any markdown formatting or introductory text, just the clinical notes.

Original notes:
`;

async function rewriteNotes(text) {
  const body = {
    contents: [{ parts: [{ text: PROMPT_PREFIX + text }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
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
  let output = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!output) throw new Error('Empty response from Gemini');
  
  if (output === 'EMPTY') return '';
  return output;
}

function needsRewrite(notes) {
  if (!notes) return false;
  const lower = notes.toLowerCase();
  
  // Blog phrases / personality
  if (/\b(i|i've|i'm|me|my)\b/.test(lower)) return true;
  if (/\b(love|amazing|beautiful|great|wonderful|fantastic|gorgeous)\b/.test(lower)) return true;
  if (lower.includes('in this post') || lower.includes('click here') || lower.includes('the inspiration')) return true;
  if (lower.includes('post on') || lower.includes('blog post')) return true;
  
  // HTML entities
  if (/&[a-z0-9#]+;/i.test(notes)) return true;
  
  return false;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const targets = data.recipes.filter(r => needsRewrite(r.notes) && !r.notesRewritten);
  
  console.log(`Found ${targets.length} recipes needing clinical notes rewrite.`);
  
  let count = 0;
  for (const recipe of targets) {
    console.log(`[${++count}/${targets.length}] Rewriting notes for: ${recipe.name || recipe.id}`);
    try {
      const clinicalNotes = await rewriteNotes(recipe.notes);
      recipe.notes = clinicalNotes;
      recipe.notesRewritten = true;
      
      // Save every 20 recipes to prevent data loss
      if (count % 20 === 0) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log(`  (Auto-saved progress)`);
      }
      
      // Rate limiting: small pause
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`  Error rewriting notes for ${recipe.id}: ${e.message}`);
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`\nRewrite complete. ${count} recipes updated.`);

  try {
    console.log('Committing and pushing changes...');
    execSync('git add formulator-data.json', { cwd: __dirname });
    execSync('git commit -m "feat(crucible): Phase 8 clinical notes rewrite"', { cwd: __dirname });
    execSync('git push origin main', { cwd: __dirname });
    console.log('✓ Committed & pushed.');
  } catch (e) {
    console.error(`Git error: ${e.message}`);
  }
}

main().catch(console.error);
