#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ScriptedCognitiveModelAdapter } from "../src/reference-translator/model/cognitive-model-adapter.mjs";
import { ReferenceTranslatorEvaluationHarness } from "../src/reference-translator/evaluation/reference-translator-evaluation-harness.mjs";
import { buildCanonicalReferenceTranslatorScenarios } from "../src/reference-translator/scenarios/canonical-reference-translator-scenarios.mjs";

const read = (relative) => JSON.parse(fs.readFileSync(path.resolve(relative), "utf8"));
const fixedClock = () => new Date("2026-08-15T12:00:00.000Z");
const validPlan = read("tests/fixtures/reference_transfer_plan/cross_category_product_adaptation.json");
const referenceBrief = read("tests/fixtures/brief_spec/cross_category_perfume.json");
const noReferenceBrief = read("tests/fixtures/brief_spec/no_reference_thumbnail.json");
const context = {
  context_id: "ctx-cross-category-perfume",
  brief_ref: { artifact_id: "brief-cross-category-perfume", schema_version: "1.0.0" },
  reference_context: { target_product_category: "fragrance" },
  protected_semantics: ["perfume bottle identity", "perfume label"],
  identity_constraints: ["perfume bottle identity"],
  transfer_scope: ["material", "narrative_object", "mood", "color_relationship"]
};
const referenceAsset = {
  asset_id: "asset_skincare_reference",
  role: "PRIMARY_REFERENCE",
  visual_access: "STRUCTURED_TEST",
  visually_accessible: true,
  mime_type: "image/png",
  product_category: "skincare",
  product_support_observation_ids: ["obs_handbag_support"],
  literal_support_elements: [{ observation_id: "obs_handbag_support", object: "handbag" }],
  visible_reference_text: ["DERMA SOURCE"],
  brand_markers: ["DERMA LABS"],
  reference_subject_identities: [],
  synthetic_observations: [
    { observation_id: "obs_handbag_support", category: "NARRATIVE_OBJECT", description: "A soft neutral handbag is placed beside the skincare product.", region: "midground", salience: "HIGH", confidence: "HIGH" },
    { observation_id: "obs_soft_material", category: "MATERIAL", description: "Supple matte texture creates warm tonal continuity.", region: "support area", salience: "HIGH", confidence: "HIGH" }
  ]
};

const createReferenceRequest = (responses, runId) => ({
  context,
  brief_spec: referenceBrief,
  reference_assets: [referenceAsset],
  model_adapter: new ScriptedCognitiveModelAdapter({ responses }),
  run_options: { run_id: runId, project_id: "project_cross_category_perfume", target_product_category: "fragrance", max_attempts: 3, clock: fixedClock }
});
const createNoReferenceRequest = (runId) => ({
  context: {
    context_id: "ctx-canonical-no-reference",
    brief_ref: { artifact_id: "brief-canonical-no-reference", schema_version: noReferenceBrief.schema_version },
    protected_semantics: [],
    identity_constraints: [],
    transfer_scope: []
  },
  brief_spec: noReferenceBrief,
  reference_assets: [],
  run_options: { run_id: runId, project_id: "project_canonical_no_reference", clock: fixedClock }
});

const scenarios = buildCanonicalReferenceTranslatorScenarios({ validPlan, createReferenceRequest, createNoReferenceRequest });
const report = await new ReferenceTranslatorEvaluationHarness().run(scenarios);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === "PASS" ? 0 : 1;
