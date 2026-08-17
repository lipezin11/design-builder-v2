import assert from "node:assert/strict";
import test from "node:test";
import { compile } from "../../src/compiler/compiler-core.mjs";
import { loadScenario } from "../../src/validation/scenario-loader.mjs";
import { validateCrossArtifactScenario } from "../../src/validation/cross-artifact-validator.mjs";

for (const scenario of ["no_reference_urgency", "strong_reference", "website_hero"]) {
  test(`canonical scenario ${scenario} passes end-to-end integrity validation`, () => {
    const result = validateCrossArtifactScenario(loadScenario(scenario));
    assert.equal(result.status, "PASS");
    assert.equal(result.summary.blocking, 0);
    assert.ok(result.summary.passed > 40);
  });
}

test("strong_reference can be recompiled and matches the canonical request structurally", () => {
  const loaded = loadScenario("strong_reference");
  const actual = compile({
    compilerInput: loaded.artifacts.compiler_input,
    finalFrameSpec: loaded.artifacts.final_frame_spec,
    clock: () => new Date("2026-08-10T15:00:00.000Z")
  });
  const expected = loaded.artifacts.compiled_generation_request;
  assert.equal(actual.status, "PASS");
  assert.deepEqual({
    refs: [actual.compiledRequest.compiler_input_ref, actual.compiledRequest.final_frame_spec_ref],
    target: actual.compiledRequest.target_generator,
    mode: actual.compiledRequest.generation_mode,
    assets: actual.compiledRequest.asset_bindings,
    references: actual.compiledRequest.reference_instructions,
    identities: actual.compiledRequest.identity_instructions,
    text: actual.compiledRequest.text_instructions,
    protected: actual.compiledRequest.protected_fields,
    variation: actual.compiledRequest.variation_policy,
    output: actual.compiledRequest.output_parameters,
    compatibility: actual.compiledRequest.compatibility_status,
    status: actual.compiledRequest.status
  }, {
    refs: [expected.compiler_input_ref, expected.final_frame_spec_ref],
    target: expected.target_generator,
    mode: expected.generation_mode,
    assets: expected.asset_bindings,
    references: expected.reference_instructions,
    identities: expected.identity_instructions,
    text: expected.text_instructions,
    protected: expected.protected_fields,
    variation: expected.variation_policy,
    output: expected.output_parameters,
    compatibility: expected.compatibility_status,
    status: expected.status
  });
});
