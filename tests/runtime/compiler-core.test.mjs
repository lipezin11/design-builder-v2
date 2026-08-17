import test from "node:test";
import assert from "node:assert/strict";
import { CompilerCore } from "../../src/compiler/compiler-core.mjs";
import { COMPILER_ERROR_CODES } from "../../src/compiler/compiler-errors.mjs";
import { loadJson, loadScenario } from "./test-helpers.mjs";

const compiler = new CompilerCore({ clock: () => new Date("2026-08-10T03:00:00.000Z") });
const expectPass = (scenario) => {
  const result = compiler.compile(scenario);
  assert.equal(result.status, "PASS");
  assert.equal(result.compiledRequest.status, "REQUEST_READY");
  assert.equal(result.lossValidation.status, "PASS");
  return result;
};

test("Compiler Core: compiles no-reference generation", () => {
  const result = expectPass(loadScenario("no_reference_thumbnail", "no_reference_urgency_thumbnail"));
  assert.equal(result.compiledRequest.reference_instructions.length, 0);
  assert.equal(result.compiledRequest.text_instructions[0].content, "ENCERRAMENTO DO CARRINHO");
});

test("Compiler Core: preserves strong reference and identity", () => {
  const result = expectPass(loadScenario("strong_reference", "strong_reference_transfer"));
  assert.equal(result.compiledRequest.reference_instructions[0].transfer_intensity, "HIGH");
  assert.equal(result.compiledRequest.identity_instructions[0].preservation_level, "STRICT");
});

test("Compiler Core: protects website hero external-copy space", () => {
  const result = expectPass(loadScenario("website_hero", "website_hero_stylist"));
  assert.equal(result.compiledRequest.text_instructions[0].render_mode, "EXTERNAL_OVERLAY");
  assert.ok(result.compiledRequest.protected_fields.some((field) => field.loss_category === "NEGATIVE_SPACE_LOSS"));
});

test("Compiler Core: compiles direct edit with structural authority", () => {
  const result = expectPass(loadScenario("edit_mode", "no_reference_urgency_thumbnail", { profileId: "profile-hypothetical-edit-v1", mode: "EDIT" }));
  assert.equal(result.compiledRequest.control_layer.preserve_edit_target, true);
  assert.ok(result.compiledRequest.asset_bindings.some((asset) => asset.authority === "EDIT_TARGET_AUTHORITY"));
});

test("Compiler Core: compiles regeneration with parent and frozen locks", () => {
  const result = expectPass(loadScenario("regenerate_locked", "strong_reference_transfer", { mode: "REGENERATE" }));
  assert.equal(result.compiledRequest.mode_context.parent_generation_id, "generation-parent-001");
  assert.equal(result.compiledRequest.variation_policy.find((item) => item.domain === "identity").level, "NONE");
});

test("Compiler Core: compiles variant with bounded variation", () => {
  const result = expectPass(loadScenario("website_hero", "website_hero_stylist", { mode: "VARIANT" }));
  assert.deepEqual(result.compiledRequest.mode_context.variation_domains, ["environment_details"]);
  assert.equal(result.compiledRequest.control_layer.preserve_composition, true);
});

test("Compiler Core: rejects cross-artifact Final Frame ID mismatch", () => {
  const compilerInput = loadJson("tests/fixtures/compiler_input/no_reference_thumbnail.json");
  const finalFrameSpec = loadJson("tests/fixtures/final_frame_spec/no_reference_urgency_thumbnail.json");
  assert.throws(() => compiler.compile({ compilerInput, finalFrameSpec }), (error) => error.code === COMPILER_ERROR_CODES.FINAL_FRAME_REF_MISMATCH);
});