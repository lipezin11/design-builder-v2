import assert from "node:assert/strict";
import test from "node:test";
import { ScriptedCognitiveModelAdapter } from "../../src/reference-translator/model/cognitive-model-adapter.mjs";
import { ReferenceTranslatorEvaluationHarness } from "../../src/reference-translator/evaluation/reference-translator-evaluation-harness.mjs";
import {
  buildCanonicalReferenceTranslatorScenarios,
  REFERENCE_TRANSLATOR_CANONICAL_SCENARIO_IDS
} from "../../src/reference-translator/scenarios/canonical-reference-translator-scenarios.mjs";
import { loadJson } from "./test-helpers.mjs";
import { crossAsset, crossBrief, crossContext, crossPlan, fixedClock } from "./reference-translator-test-helpers.mjs";

const createReferenceRequest = (responses, runId) => ({
  context: crossContext(),
  brief_spec: crossBrief(),
  reference_assets: [crossAsset()],
  model_adapter: new ScriptedCognitiveModelAdapter({ responses }),
  run_options: {
    run_id: runId,
    project_id: "project_cross_category_perfume",
    target_product_category: "fragrance",
    max_attempts: 3,
    clock: fixedClock
  }
});

const createNoReferenceRequest = (runId) => {
  const brief = loadJson("tests/fixtures/brief_spec/no_reference_thumbnail.json");
  return {
    context: {
      context_id: "ctx-canonical-no-reference",
      brief_ref: { artifact_id: "brief-canonical-no-reference", schema_version: brief.schema_version },
      protected_semantics: [],
      identity_constraints: [],
      transfer_scope: []
    },
    brief_spec: brief,
    reference_assets: [],
    run_options: { run_id: runId, project_id: "project_canonical_no_reference", clock: fixedClock }
  };
};

test("all 15 canonical Reference Translator runtime scenarios pass categorical evaluation", async () => {
  const scenarios = buildCanonicalReferenceTranslatorScenarios({
    validPlan: crossPlan(),
    createReferenceRequest,
    createNoReferenceRequest
  });
  assert.deepEqual(scenarios.map((item) => item.scenario_id), REFERENCE_TRANSLATOR_CANONICAL_SCENARIO_IDS);
  const report = await new ReferenceTranslatorEvaluationHarness().run(scenarios);
  assert.equal(report.status, "PASS", JSON.stringify(report.results.filter((item) => item.status !== "PASS"), null, 2));
  assert.deepEqual(report.summary, { total: 15, passed: 15, blocking: 0 });
  assert.equal(report.scoring, "CATEGORICAL_ONLY");
  assert.equal(report.numeric_design_scores_created, 0);
  for (const result of report.results) {
    assert.equal(result.metrics.schema_pass, true, result.scenario_id);
    assert.equal(result.metrics.semantic_pass, true, result.scenario_id);
    assert.equal(result.metrics.quality_pass, true, result.scenario_id);
    assert.equal(result.metrics.authority_preserved, true, result.scenario_id);
  }
});

test("surface-copy, undertransfer, and overtransfer traps require correction retries", async () => {
  const report = await new ReferenceTranslatorEvaluationHarness().run(buildCanonicalReferenceTranslatorScenarios({
    validPlan: crossPlan(),
    createReferenceRequest,
    createNoReferenceRequest
  }));
  for (const id of ["J_SURFACE_COPY_TRAP", "K_UNDERTRANSFER_TRAP", "L_OVERTRANSFER_TRAP"]) {
    assert.equal(report.results.find((item) => item.scenario_id === id).metrics.attempts, 2, id);
  }
});
