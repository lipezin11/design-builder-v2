import fs from 'node:fs';
import { 
  detectSourceHueTreatedAsInvariant,
  detectTypographyUnresolved,
  detectDirectorHandoffContradictions,
  detectHighIntensityUndertransfer
} from '../src/reference-translator/validation/reference-transfer-plan-validator.mjs';

const repaired = JSON.parse(fs.readFileSync('.tmp/repaired-plan.json', 'utf8'));

console.log('\n=== STANDALONE DIAGNOSTIC TESTS (NO EXTERNAL CONTEXT) ===\n');

// Test 1: SOURCE_HUE_TREATED_AS_INVARIANT
const hueIssues = detectSourceHueTreatedAsInvariant(repaired, {});
console.log(`SOURCE_HUE_TREATED_AS_INVARIANT: ${hueIssues.length === 0 ? '✅ PASS (0 issues)' : `❌ FAIL (${hueIssues.length} issues)`}`);
if (hueIssues.length > 0) {
  hueIssues.forEach(d => console.log(`  - ${d.path}: ${d.message}`));
}

// Test 2: TYPOGRAPHY_UNRESOLVED
const typoIssues = detectTypographyUnresolved(repaired);
console.log(`TYPOGRAPHY_UNRESOLVED: ${typoIssues.length === 0 ? '✅ PASS (0 issues)' : `❌ FAIL (${typoIssues.length} issues)`}`);
if (typoIssues.length > 0) {
  typoIssues.forEach(d => console.log(`  - ${d.message}`));
}

// Test 3: DIRECTOR_HANDOFF_CONTRADICTION  
const handoffIssues = detectDirectorHandoffContradictions(repaired);
console.log(`DIRECTOR_HANDOFF_CONTRADICTION: ${handoffIssues.length === 0 ? '✅ PASS (0 issues)' : `❌ FAIL (${handoffIssues.length} issues)`}`);
if (handoffIssues.length > 0) {
  handoffIssues.forEach(d => console.log(`  - ${d.path}: ${d.message}`));
}

// Test 4: HIGH_INTENSITY_UNDERTRANSFER
const undertransferIssues = detectHighIntensityUndertransfer(repaired);
console.log(`HIGH_INTENSITY_UNDERTRANSFER: ${undertransferIssues.length === 0 ? '✅ PASS (0 issues)' : `❌ FAIL (${undertransferIssues.length} issues)`}`);
if (undertransferIssues.length > 0) {
  undertransferIssues.forEach(d => console.log(`  - ${d.message}`));
}

const allPassed = hueIssues.length === 0 && typoIssues.length === 0 && handoffIssues.length === 0 && undertransferIssues.length === 0;

console.log(`\n=== RESULT ===`);
console.log(`All targeted diagnostics: ${allPassed ? '✅ FIXED' : '❌ STILL FAILING'}`);

process.exit(allPassed ? 0 : 1);
