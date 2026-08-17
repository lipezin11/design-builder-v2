import assert from "node:assert/strict";
import test from "node:test";
import { loadScenario } from "../../src/validation/scenario-loader.mjs";
import { validateCrossArtifactScenario } from "../../src/validation/cross-artifact-validator.mjs";
import { CROSS_ARTIFACT_ERROR_CODES as C } from "../../src/validation/cross-artifact-errors.mjs";

function mutable(name) {
  const source = loadScenario(name);
  const manifest = structuredClone(source.manifest);
  return {
    ...source,
    manifest,
    artifacts: structuredClone(source.artifacts),
    assetsById: new Map(manifest.assets.map((asset) => [asset.asset_id, asset]))
  };
}
function expectBlock(name, mutate, code) {
  const loaded = mutable(name);
  mutate(loaded);
  const result = validateCrossArtifactScenario(loaded);
  assert.equal(result.status, "BLOCK");
  assert.ok(result.errors.some((error) => error.code === code), `expected ${code}; got ${result.errors.map((x) => x.code).join(", ")}`);
}

test("mutation: wrong final frame ID blocks", () => {
  expectBlock("no_reference_urgency", (x) => { x.artifacts.compiler_input.final_frame_spec_ref.final_frame_spec_id = "ffs-wrong"; }, C.UPSTREAM_REF_MISMATCH);
});

test("mutation: missing subject identity binding blocks", () => {
  expectBlock("no_reference_urgency", (x) => { x.artifacts.compiler_input.identity_bindings = []; }, C.MISSING_REQUIRED_ASSET_BINDING);
});

test("mutation: compiled VERY_HIGH reference diluted to MEDIUM blocks", () => {
  expectBlock("strong_reference", (x) => { x.artifacts.compiled_generation_request.reference_instructions[0].transfer_intensity = "MEDIUM"; }, C.REFERENCE_INTENSITY_DILUTION);
});

test("mutation: exact copy change blocks", () => {
  expectBlock("no_reference_urgency", (x) => { x.artifacts.compiled_generation_request.text_instructions[0].content = "ENCERRAMENTO"; }, C.EXACT_TEXT_MISMATCH);
});

test("mutation: required reference plan missing blocks", () => {
  expectBlock("strong_reference", (x) => { delete x.artifacts.reference_transfer_plan; delete x.manifest.artifacts.reference_transfer_plan; }, C.REFERENCE_PLAN_MISSING);
});

test("mutation: unexpected reference plan blocks no-reference mode", () => {
  const planSource = loadScenario("strong_reference");
  expectBlock("no_reference_urgency", (x) => {
    x.artifacts.reference_transfer_plan = structuredClone(planSource.artifacts.reference_transfer_plan);
    x.manifest.artifacts.reference_transfer_plan = structuredClone(planSource.manifest.artifacts.reference_transfer_plan);
  }, C.UNEXPECTED_REFERENCE_PLAN);
});

test("mutation: cross-project creative artifact blocks", () => {
  expectBlock("website_hero", (x) => { x.artifacts.creative_direction_spec.project_id = "project-foreign"; }, C.PROJECT_ID_MISMATCH);
});

test("mutation: protected negative space lost blocks", () => {
  expectBlock("website_hero", (x) => {
    x.artifacts.compiled_generation_request.protected_fields = x.artifacts.compiled_generation_request.protected_fields.filter((field) => field.field_id !== "negative-space-left-copy-field");
  }, C.COMPILER_LOSS);
});

test("mutation: locked composition raised from NONE to MEDIUM blocks", () => {
  expectBlock("no_reference_urgency", (x) => {
    x.artifacts.compiled_generation_request.variation_policy.find((item) => item.domain === "composition").level = "MEDIUM";
  }, C.CONTROLLED_VARIATION_ESCALATION);
});

test("mutation: non-negotiable reference anchor lost blocks", () => {
  expectBlock("strong_reference", (x) => {
    x.artifacts.creative_direction_spec.reference_integration.accepted_anchors = x.artifacts.creative_direction_spec.reference_integration.accepted_anchors.filter((item) => item.anchor_id !== "anchor-depth-001");
  }, C.REFERENCE_ANCHOR_LOST);
});

test("mutation: asset role conflict blocks", () => {
  expectBlock("strong_reference", (x) => { x.assetsById.get("asset-reference-001").role = "SECONDARY_REFERENCE"; }, C.ASSET_ROLE_MISMATCH);
});

test("mutation: propagated hard lock removed blocks", () => {
  expectBlock("no_reference_urgency", (x) => {
    x.artifacts.compiled_generation_request.protected_fields = x.artifacts.compiled_generation_request.protected_fields.filter((field) => field.field_id !== "handoff-lock-0");
  }, C.HARD_LOCK_NOT_PROPAGATED);
});
