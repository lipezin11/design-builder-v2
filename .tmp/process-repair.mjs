import fs from 'node:fs';

// Read the response and strip BOM
const responseText = fs.readFileSync('.tmp/repair-response-gemini.json', 'utf8').replace(/^\uFEFF/, '');
const response = JSON.parse(responseText);

// Extract the JSON from the response
const repairedJsonText = response.candidates[0].content.parts[0].text;
const repairedPlan = JSON.parse(repairedJsonText);

// Write the repaired plan
fs.writeFileSync('.tmp/repaired-plan.json', JSON.stringify(repairedPlan, null, 2));

// Load the original plan for comparison
const originalPlan = JSON.parse(fs.readFileSync('data/reference-translator/user-live-tests/subject-reference-20260816_11_kie_gemini_2_5_flash_single_persisted_candidate/plans/plan_tech_thumbnail_001.json', 'utf8'));

// Report token usage
console.log('\n=== TOKEN USAGE ===');
console.log(`Prompt tokens: ${response.usageMetadata.promptTokenCount}`);
console.log(`Completion tokens: ${response.usageMetadata.candidatesTokenCount}`);
console.log(`Thinking tokens: ${response.usageMetadata.thinkingTokenCount}`);
console.log(`Total tokens: ${response.usageMetadata.totalTokenCount}`);
console.log(`Credits consumed: ${response.credits_consumed}`);

// Compare specific paths
console.log('\n=== AUTHORIZED PATH CHANGES ===');

const paths = [
  { path: 'design_decision_map.2.target_in_new_composition', get: (obj) => obj.design_decision_map[2].target_in_new_composition },
  { path: 'design_decision_map.2.rationale', get: (obj) => obj.design_decision_map[2].rationale },
  { path: 'director_handoff.what_should_survive.0', get: (obj) => obj.director_handoff.what_should_survive[0] },
  { path: 'director_handoff.what_should_survive.1', get: (obj) => obj.director_handoff.what_should_survive[1] },
  { path: 'director_handoff.recommended_anchors.1', get: (obj) => obj.director_handoff.recommended_anchors[1] }
];

paths.forEach(({ path, get }) => {
  const oldVal = get(originalPlan);
  const newVal = get(repairedPlan);
  if (oldVal !== newVal) {
    console.log(`\n${path}:`);
    console.log(`  BEFORE: ${oldVal}`);
    console.log(`  AFTER:  ${newVal}`);
  }
});

// Deep equality check for unauthorized changes
function deepEqual(obj1, obj2, currentPath = '') {
  const changes = [];
  
  if (obj1 === obj2) return changes;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return [currentPath];
  }
  if (obj1 === null || obj2 === null) return [currentPath];
  
  const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  
  for (const key of keys) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    if (!(key in obj1) || !(key in obj2) || obj1[key] !== obj2[key]) {
      if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
        changes.push(...deepEqual(obj1[key], obj2[key], newPath));
      } else {
        changes.push(newPath);
      }
    }
  }
  
  return changes;
}

const allChanges = deepEqual(originalPlan, repairedPlan);
const authorizedPaths = [
  'design_decision_map.2.target_in_new_composition',
  'design_decision_map.2.rationale',
  'director_handoff.what_should_survive.0',
  'director_handoff.what_should_survive.1',
  'director_handoff.recommended_anchors.1'
];

const unauthorizedChanges = allChanges.filter(path => !authorizedPaths.includes(path));

console.log('\n=== DIFF GUARD ===');
if (unauthorizedChanges.length > 0) {
  console.log('❌ UNAUTHORIZED CHANGES DETECTED:');
  unauthorizedChanges.forEach(path => console.log(`  - ${path}`));
  process.exit(1);
} else {
  console.log('✅ All changes are within authorized paths');
}

console.log('\nRepaired plan written to: .tmp/repaired-plan.json');
