#!/usr/bin/env node
import { loadScenario } from "../src/validation/scenario-loader.mjs";
import { validateCrossArtifactScenario } from "../src/validation/cross-artifact-validator.mjs";
import { CrossArtifactError } from "../src/validation/cross-artifact-errors.mjs";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/validate_scenario.mjs <scenario-name-or-path>");
  process.exit(2);
}
try {
  const result = validateCrossArtifactScenario(loadScenario(input));
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status === "PASS" ? 0 : 1;
} catch (error) {
  const result = error instanceof CrossArtifactError
    ? { scenario_id: input, status: "BLOCK", checks: [], errors: [{ stage: "LOAD", code: error.code, status: "BLOCK", message: error.message, details: error.details }], warnings: [], summary: { passed: 0, warnings: 0, blocking: 1 } }
    : { scenario_id: input, status: "BLOCK", errors: [{ stage: "LOAD", code: "UNEXPECTED_VALIDATOR_FAILURE", status: "BLOCK", message: error.message }], summary: { passed: 0, warnings: 0, blocking: 1 } };
  console.error(JSON.stringify(result, null, 2));
  process.exitCode = 1;
}
