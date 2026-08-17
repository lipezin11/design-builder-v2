import fs from 'node:fs';
import { validateReferenceTransferPlanSchema, validateReferenceTransferPlanSemantics, validateReferenceTransferPlanQuality } from '../src/reference-translator/validation/reference-transfer-plan-validator.mjs';

const repairedPlan = JSON.parse(fs.readFileSync('.tmp/repaired-plan.json', 'utf8'));

console.log('\n=== VALIDATING REPAIRED PLAN ===\n');

const schemaValidation = validateReferenceTransferPlanSchema(repairedPlan);
const semanticValidation = validateReferenceTransferPlanSemantics(repairedPlan, {});
const qualityValidation = validateReferenceTransferPlanQuality(repairedPlan);

console.log(`SCHEMA: ${schemaValidation.valid ? '✅ PASS' : '❌ FAIL'}`);
if (!schemaValidation.valid) {
  console.log('Schema errors:', schemaValidation.errors);
}

console.log(`SEMANTIC: ${semanticValidation.valid ? '✅ PASS' : '❌ FAIL'}`);
if (semanticValidation.diagnostics.length > 0) {
  console.log('Semantic diagnostics:');
  semanticValidation.diagnostics.forEach(d => {
    console.log(`  - ${d.code}: ${d.message}`);
    if (d.path) console.log(`    Path: ${d.path}`);
  });
}

console.log(`QUALITY: ${qualityValidation.valid ? '✅ PASS' : '❌ FAIL'}`);
if (qualityValidation.diagnostics.length > 0) {
  console.log('Quality diagnostics:');
  qualityValidation.diagnostics.forEach(d => {
    console.log(`  - ${d.code}: ${d.message}`);
    if (d.path) console.log(`    Path: ${d.path}`);
  });
}

const allValid = schemaValidation.valid && semanticValidation.valid && qualityValidation.valid;
console.log(`\nOVERALL: ${allValid ? '✅ ALL PASS' : '❌ SOME FAILURES'}`);
console.log(`READY_FOR_DIRECTOR: ${allValid ? 'YES' : 'NO'}`);

process.exit(allValid ? 0 : 1);
