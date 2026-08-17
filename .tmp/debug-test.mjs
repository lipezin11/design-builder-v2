import fs from 'node:fs';
import { validateReferenceTransferPlanSemantics, validateReferenceTransferPlanQuality } from '../src/reference-translator/validation/reference-transfer-plan-validator.mjs';

const plan = JSON.parse(fs.readFileSync('data/reference-translator/user-live-tests/subject-reference-20260816_11_kie_gemini_2_5_flash_single_persisted_candidate/plans/plan_tech_thumbnail_001.json', 'utf8'));

const histBrief = {
  schema_version: "1.0.0",
  user_request: "Create a personal brand technology thumbnail for a creator.",
  commercial_objective: "Drive clicks for technology content creator.",
  communication_goal: "Authority and technical expertise.",
  target_context: "YouTube thumbnail, technology creator"
};

const histAsset = {
  asset_id: "primary_tech_reference",
  role: "PRIMARY_REFERENCE",
  visual_access: "STRUCTURED_TEST",
  visually_accessible: true,
  mime_type: "image/jpeg",
  product_category: null,
  product_support_observation_ids: [],
  literal_support_elements: [],
  visible_reference_text: [],
  brand_markers: [],
  reference_subject_identities: []
};

const histContext = {
  briefSpec: histBrief,
  referenceAssets: [histAsset],
  targetProductCategory: null,
  projectId: plan.project_id,
  protectedSemantics: [],
  identityConstraints: []
};

console.log('\n=== DEBUGGING TEST ===\n');

const semantic = validateReferenceTransferPlanSemantics(plan, histContext);
const quality = validateReferenceTransferPlanQuality(plan);

console.log(`Semantic valid: ${semantic.valid}`);
console.log(`Semantic diagnostics (${semantic.diagnostics.length}):`);
semantic.diagnostics.forEach(d => {
  console.log(`  - ${d.code}: ${d.message}`);
  if (d.path) console.log(`    Path: ${d.path}`);
});

console.log(`\nQuality valid: ${quality.valid}`);
console.log(`Quality diagnostics (${quality.diagnostics.length}):`);
quality.diagnostics.forEach(d => {
  console.log(`  - ${d.code}: ${d.message}`);
  if (d.path) console.log(`    Path: ${d.path}`);
});

console.log(`\nOverall: ${semantic.valid && quality.valid ? 'PASS' : 'FAIL'}`);
