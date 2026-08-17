#!/usr/bin/env node
import fs from "node:fs";
import { canonicalScenarioRoot, loadScenario } from "../src/validation/scenario-loader.mjs";
import { validateCrossArtifactScenario } from "../src/validation/cross-artifact-validator.mjs";

const names = fs.readdirSync(canonicalScenarioRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
const results = [];
for (const name of names) {
  try { results.push(validateCrossArtifactScenario(loadScenario(name))); }
  catch (error) { results.push({ scenario_id: name, status: "BLOCK", errors: [{ stage: "LOAD", code: error.code ?? "UNEXPECTED_VALIDATOR_FAILURE", status: "BLOCK", message: error.message, details: error.details }], warnings: [], checks: [], summary: { passed: 0, warnings: 0, blocking: 1 } }); }
}
const output = {
  status: results.every((item) => item.status === "PASS") ? "PASS" : "BLOCK",
  scenarios: results.map((item) => ({ scenario_id: item.scenario_id, status: item.status, summary: item.summary })),
  summary: { total: results.length, passed: results.filter((item) => item.status === "PASS").length, blocking: results.filter((item) => item.status === "BLOCK").length }
};
console.log(JSON.stringify(output, null, 2));
process.exitCode = output.status === "PASS" ? 0 : 1;
