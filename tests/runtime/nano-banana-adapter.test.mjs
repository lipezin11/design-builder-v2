import assert from "node:assert/strict";
import test from "node:test";
import { nanoBananaSemanticAdapter, nanoBananaSemanticProfile } from "../../src/generators/adapters/nano-banana-adapter.mjs";
import { GENERATION_ERROR_CODES as C } from "../../src/generators/generation-errors.mjs";
import { loadJson } from "./test-helpers.mjs";
import { adaptCanonical, canonical, clone, syntheticResolution } from "./generation-test-helpers.mjs";

test("adapter: no-reference request preserves final-state instruction and identity", () => {
  const result = adaptCanonical("no_reference_urgency");
  assert.equal(result.instruction.type, "FINAL_STATE_DESCRIPTION");
  assert.match(result.instruction.final_visual_description, /final_frame_spec\.composition/);
  assert.equal(result.assets.subject_identity.length, 1);
  assert.equal(result.references.length, 0);
  assert.equal(result.creative_authority, "NONE");
});

test("adapter: strong reference preserves base, identity, primary reference and VERY_HIGH controls", () => {
  const result = adaptCanonical("strong_reference");
  assert.equal(result.assets.subject_identity[0].asset_id, "asset-product-subject-001");
  assert.equal(result.assets.base_images[0].asset_id, "asset-product-001");
  assert.equal(result.assets.primary_references[0].asset_id, "asset-reference-001");
  assert.equal(result.references[0].transfer_intensity, "VERY_HIGH");
  assert.deepEqual(result.references[0].required_anchors, ["anchor-depth-001", "anchor-light-001", "anchor-mass-001"]);
  assert.equal(result.text.requirements[0].content, "CONTROL THE CURRENT");
  assert.ok(result.controls.hard_locks.length > 5);
});

test("adapter: multiple references remain role-aware and ordered", () => {
  const { request, assetResolution } = canonical("strong_reference");
  const changed = clone(request);
  changed.asset_bindings.push({ asset_id: "asset-secondary-reference", adapter_slot: "secondary_reference", authority: "SUPPORTING_REFERENCE_AUTHORITY", required: true, source_ref: "compiler_input.assets.asset-secondary-reference" });
  changed.reference_instructions.push({ reference_asset_id: "asset-secondary-reference", transfer_intensity: "HIGH", required_anchors: ["support-anchor"], do_not_copy: [], source_ref: "compiler_input.reference_bindings.asset-secondary-reference" });
  assetResolution["asset-secondary-reference"] = { uri: "mock://assets/secondary.png", mime_type: "image/png" };
  const result = nanoBananaSemanticAdapter.adapt({ compiledRequest: changed, assetResolution, profile: nanoBananaSemanticProfile, modelName: "nano-banana-mock-model" });
  assert.equal(result.assets.primary_references.length, 1);
  assert.equal(result.assets.supporting_references.length, 1);
  assert.deepEqual(result.references.map((item) => item.reference_order), [0, 1]);
});

test("adapter: edit request preserves explicit edit target", () => {
  const request = loadJson("tests/fixtures/compiled_generation_request/edit_request.json");
  const result = nanoBananaSemanticAdapter.adapt({ compiledRequest: request, assetResolution: syntheticResolution(request), profile: nanoBananaSemanticProfile, modelName: "nano-banana-mock-model" });
  assert.equal(result.mode, "EDIT");
  assert.equal(result.assets.edit_target.length, 1);
  assert.equal(result.controls.control_layer.preserve_edit_target, true);
});

test("adapter: website hero preserves external text and negative space", () => {
  const result = adaptCanonical("website_hero");
  assert.equal(result.text.mode, "EXTERNAL_OVERLAY");
  assert.equal(result.output.aspect_ratio, "16:9");
  assert.ok(result.controls.hard_locks.some((item) => item.loss_category === "NEGATIVE_SPACE_LOSS"));
  assert.equal(result.assets.subject_identity[0].asset_id, "asset-stylist-001");
});

test("adapter: exact text is copied without rewriting", () => {
  const result = adaptCanonical("no_reference_urgency");
  const text = result.text.requirements.find((item) => item.text_id === "headline");
  assert.equal(text.content, "ENCERRAMENTO DO CARRINHO");
  assert.equal(text.exact_text_lock, true);
});

test("adapter: protected fields and controlled variation survive structurally", () => {
  const { request } = canonical("strong_reference");
  const result = adaptCanonical("strong_reference");
  assert.deepEqual(result.controls.hard_locks, request.protected_fields);
  assert.deepEqual(result.controls.controlled_variation, request.variation_policy);
  assert.equal(result.controls.execution_only, true);
});

test("adapter: generation mode is preserved", () => assert.equal(adaptCanonical("no_reference_urgency").mode, "GENERATE"));

test("adapter mutation: removed primary reference blocks", () => {
  const { request, assetResolution } = canonical("strong_reference");
  const changed = clone(request);
  changed.asset_bindings = changed.asset_bindings.filter((item) => item.adapter_slot !== "primary_reference");
  assert.throws(() => nanoBananaSemanticAdapter.adapt({ compiledRequest: changed, assetResolution, profile: nanoBananaSemanticProfile, modelName: "nano-banana-mock-model" }), (error) => error.code === C.REFERENCE_BINDING_MISSING);
});

test("adapter mutation: removed identity binding blocks", () => {
  const { request, assetResolution } = canonical("strong_reference");
  const changed = clone(request);
  changed.asset_bindings = changed.asset_bindings.filter((item) => item.adapter_slot !== "subject_identity");
  assert.throws(() => nanoBananaSemanticAdapter.adapt({ compiledRequest: changed, assetResolution, profile: nanoBananaSemanticProfile, modelName: "nano-banana-mock-model" }), (error) => error.code === C.IDENTITY_BINDING_MISSING);
});

test("adapter mutation: unresolved required asset blocks", () => {
  const { request, assetResolution } = canonical("no_reference_urgency");
  delete assetResolution["asset-presenter-001"];
  assert.throws(() => nanoBananaSemanticAdapter.adapt({ compiledRequest: request, assetResolution, profile: nanoBananaSemanticProfile, modelName: "nano-banana-mock-model" }), (error) => error.code === C.ASSET_RESOLUTION_MISSING);
});

test("adapter mutation: removed reference instructions block", () => {
  const { request, assetResolution } = canonical("strong_reference");
  const changed = clone(request);
  changed.reference_instructions = [];
  assert.throws(() => nanoBananaSemanticAdapter.adapt({ compiledRequest: changed, assetResolution, profile: nanoBananaSemanticProfile, modelName: "nano-banana-mock-model" }), (error) => error.code === C.REFERENCE_BINDING_MISSING);
});

test("adapter mutation: removed identity instructions block", () => {
  const { request, assetResolution } = canonical("strong_reference");
  const changed = clone(request);
  changed.identity_instructions = [];
  assert.throws(() => nanoBananaSemanticAdapter.adapt({ compiledRequest: changed, assetResolution, profile: nanoBananaSemanticProfile, modelName: "nano-banana-mock-model" }), (error) => error.code === C.IDENTITY_BINDING_MISSING);
});

test("Nano Banana semantic profile makes no provider capability claims", () => {
  assert.equal(nanoBananaSemanticProfile.provider_binding, "PROVIDER_DEPENDENT");
  assert.ok(Object.values(nanoBananaSemanticProfile.capabilities).every((value) => ["UNKNOWN", "PROVIDER_DEPENDENT"].includes(value)));
});