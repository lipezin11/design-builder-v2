import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  evaluateReferenceTranslatorCognitiveFixture,
  evaluateReferenceTranslatorCognitiveFixtures
} from "../../src/reference-translator/evaluation/reference-translator-cognitive-evaluator.mjs";

const suite = JSON.parse(fs.readFileSync("tests/fixtures/reference-translator/cognitive-eval-v1.1.json", "utf8"));

test("all v1.1 synthetic cognitive fixtures pass categorical evaluation", () => {
  assert.equal(suite.suite_id, "REFERENCE_TRANSLATOR_COGNITIVE_EVAL_V1_1");
  assert.equal(suite.scoring, "CATEGORICAL_ONLY");
  assert.equal(suite.live_model_invoked, false);
  assert.equal(suite.fixtures.length, 38);
  assert.equal(new Set(suite.fixtures.map((fixture) => fixture.fixture_id)).size, 38);
  assert.ok(suite.fixtures.every((fixture) => fixture.epistemic_status.startsWith("SYNTHETIC_")));

  const report = evaluateReferenceTranslatorCognitiveFixtures(suite.fixtures);
  assert.equal(report.status, "PASS", JSON.stringify(report.results.filter((result) => result.status !== "PASS"), null, 2));
  assert.deepEqual(report.summary, {
    fixture_count: 38,
    passed_fixtures: 38,
    blocking_fixtures: 0,
    category_check_count: 375,
    passed_category_checks: 375,
    failed_category_checks: 0
  });
  assert.equal(report.scoring, "CATEGORICAL_ONLY");
  assert.equal(report.numeric_design_scores_created, 0);
  assert.equal(report.weights_created, 0);
  assert.equal(report.rankings_created, 0);
  assert.equal(report.automatic_approvals_created, 0);
  assert.equal(report.live_model_invoked, false);
});

test("cognitive fixture families cover the required translation risks and domains", () => {
  const families = new Set(suite.fixtures.map((fixture) => fixture.family));
  for (const family of [
    "product_adaptation", "cross_domain_substitution", "format_translation", "identity",
    "hierarchy", "depth", "lighting", "color", "material", "typography", "objects",
    "complexity", "convergence", "cards_positive", "cards_generic_assembly",
    "generic_assembly", "microdetail", "undertransfer", "overtransfer",
    "irrelevant_reference", "no_reference", "conflict", "advisory_conflict",
    "target_native_adaptation", "editorial_adaptation", "service_translation",
    "selective_transfer", "minimalism", "maximalism", "effects"
  ]) assert.equal(families.has(family), true, family);
});

test("literal-copy mutation is categorically blocked without a numeric score", () => {
  const fixture = structuredClone(suite.fixtures.find((item) => item.fixture_id === "perfume_skincare_bag"));
  fixture.candidate.target_native_expression = "Copy the handbag beside the perfume.";
  const result = evaluateReferenceTranslatorCognitiveFixture(fixture);
  assert.equal(result.status, "BLOCK");
  assert.equal(result.checks.find((check) => check.category === "LITERAL_COPY_AVOIDED").passed, false);
});

test("no-reference control forbids hallucinated analysis", () => {
  const fixture = structuredClone(suite.fixtures.find((item) => item.fixture_id === "no_reference"));
  assert.equal(evaluateReferenceTranslatorCognitiveFixture(fixture).status, "PASS");
  fixture.candidate.visual_function = "Invented cinematic hierarchy from an absent reference.";
  assert.equal(evaluateReferenceTranslatorCognitiveFixture(fixture).status, "BLOCK");
});

