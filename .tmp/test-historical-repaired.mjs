import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReferenceTransferPlanSchema, validateReferenceTransferPlanSemantics, validateReferenceTransferPlanQuality } from '../src/reference-translator/validation/reference-transfer-plan-validator.mjs';

const repaired = JSON.parse(fs.readFileSync('data/reference-translator/user-live-tests/subject-reference-20260816_11_kie_gemini_2_5_flash_single_persisted_candidate/plans/plan_tech_thumbnail_001_repaired.json', 'utf8'));

console.log('\n=== VALIDATING REPAIRED HISTORICAL PLAN ===\n');

const schemaResult = validateReferenceTransferPlanSchema(repaired);
console.log(`SCHEMA: ${schemaResult.valid ? '✅ PASS' : '❌ FAIL'}`);
if (!schemaResult.valid) {
  console.log('  Errors:', schemaResult.errors);
}

const semanticResult = validateReferenceTransferPlanSemantics(repaired, {});
console.log(`SEMANTIC: ${semanticResult.valid ? '✅ PASS' : '❌ FAIL'}`);
if (semanticResult.diagnostics.length > 0) {
  console.log('  Diagnostics:');
  semanticResult.diagnostics.forEach(d => {
    console.log(`    - ${d.code}: ${d.message}`);
  });
}

const qualityResult = validateReferenceTransferPlanQuality(repaired);
console.log(`QUALITY: ${qualityResult.valid ? '✅ PASS' : '❌ FAIL'}`);
if (qualityResult.diagnostics.length > 0) {
  console.log('  Diagnostics:');
  qualityResult.diagnostics.forEach(d => {
    console.log(`    - ${d.code}: ${d.message}`);
  });
}

const allValid = schemaResult.valid && semanticResult.valid && qualityResult.valid;
console.log(`\nOVERALL: ${allValid ? '✅ ALL PASS' : '❌ SOME FAILURES'}`);
console.log(`READY_FOR_DIRECTOR: ${allValid ? 'YES' : 'NO'}`);
