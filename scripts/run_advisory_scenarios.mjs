import { runCanonicalAdvisoryScenarios } from "../src/advisory/canonical-advisory-scenarios.mjs";

const results = runCanonicalAdvisoryScenarios();
for (const result of results) {
  console.log(`${result.passed ? "PASS" : "FAIL"} ${result.scenario_id}`);
  for (const check of result.checks) console.log(`  ${check.passed ? "PASS" : "FAIL"} ${check.check}`);
  if (result.error) console.error(`  ${result.error.name}: ${result.error.message}`);
}
const failed = results.filter((result) => !result.passed);
console.log(`\nCanonical advisory scenarios: ${results.length - failed.length}/${results.length} passed.`);
if (failed.length) process.exitCode = 1;

