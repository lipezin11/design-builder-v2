import fs from 'node:fs';

// Read with explicit encoding and strip BOM
const raw = fs.readFileSync('.tmp/repair-response-gemini.json', 'utf8');
const cleaned = raw.replace(/^\uFEFF/, ''); // Remove BOM

fs.writeFileSync('.tmp/repair-response-gemini-clean.json', cleaned, 'utf8');
console.log('Cleaned response written');
