import assert from "node:assert/strict";
import test from "node:test";
import { validateArtifact } from "../../src/compiler/schema-validator.mjs";
import { loadJson } from "./test-helpers.mjs";

const load = (relativePath) => structuredClone(loadJson(relativePath));

test("visual critic contracts accept representative positive fixtures", () => {
  const critic = load("tests/fixtures/critic_report/premium_image_pass.json");
  const delta = load("tests/fixtures/delta_fix_plan/surgical_technical_fix.json");
  assert.equal(validateArtifact("critic_report", critic).valid, true);
  assert.equal(validateArtifact("delta_fix_plan", delta).valid, true);
});

test("My Eyes cannot assert preference when evidence is unavailable", () => {
  const report = load("tests/fixtures/critic_report/my_eyes_evidence_unavailable.json");
  report.my_eyes.preference_findings.push({
    preference_id: "invented-preference",
    statement: "This preference has no evidence.",
    verdict: "ALIGN",
    confidence: "HIGH",
    evidence_ids: ["missing-evidence"],
    assertion_scope: "PROJECT_SPECIFIC"
  });
  assert.equal(validateArtifact("critic_report", report).valid, false);
});

test("My Eyes evidence-available state requires evidence and findings", () => {
  const report = load("tests/fixtures/critic_report/my_eyes_evidence_available.json");
  report.my_eyes.evidence_ids = [];
  report.my_eyes.preference_findings = [];
  assert.equal(validateArtifact("critic_report", report).valid, false);
});

test("PASS critic status requires accept routing and passing review phases", () => {
  const report = load("tests/fixtures/critic_report/premium_image_pass.json");
  report.routing.action = "CREATE_DELTA_FIX_PLAN";
  assert.equal(validateArtifact("critic_report", report).valid, false);
});

test("Delta Fix forbids whole-pipeline regeneration", () => {
  const plan = load("tests/fixtures/delta_fix_plan/surgical_technical_fix.json");
  plan.execution_constraints.regenerate_entire_pipeline = true;
  assert.equal(validateArtifact("delta_fix_plan", plan).valid, false);
});

test("Delta Fix requires explicit protected fields and fields that must not change", () => {
  const plan = load("tests/fixtures/delta_fix_plan/surgical_technical_fix.json");
  plan.fixes[0].protected_fields = [];
  plan.fixes[0].fields_that_must_not_change = [];
  assert.equal(validateArtifact("delta_fix_plan", plan).valid, false);
});

test("REFERENCE_TRANSLATOR return depth requires the translator as a responsible node", () => {
  const plan = load("tests/fixtures/delta_fix_plan/reference_level_fix.json");
  plan.responsible_nodes = ["GENERATOR_COMPILER"];
  assert.equal(validateArtifact("delta_fix_plan", plan).valid, false);
});
