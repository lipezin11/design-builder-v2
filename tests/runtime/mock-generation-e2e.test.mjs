import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { compile } from "../../src/compiler/compiler-core.mjs";
import { validateArtifact } from "../../src/compiler/schema-validator.mjs";
import { GenerationService } from "../../src/generators/generation-service.mjs";
import { GenerationResultStore } from "../../src/generators/persistence/generation-result-store.mjs";
import { MockProviderTransport } from "../../src/generators/transports/mock-provider-transport.mjs";
import { nanoBananaSemanticAdapter, nanoBananaSemanticProfile } from "../../src/generators/adapters/nano-banana-adapter.mjs";
import { canonical, fixedDate } from "./generation-test-helpers.mjs";

test("mock end-to-end: canonical urgency compiles, generates, validates and persists", async () => {
  const data = canonical("no_reference_urgency");
  const compiled = compile({ compilerInput: data.loaded.artifacts.compiler_input, finalFrameSpec: data.loaded.artifacts.final_frame_spec, clock: fixedDate });
  assert.equal(compiled.status, "PASS");
  assert.equal(compiled.lossValidation.status, "PASS");
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "design-builder-e2e-"));
  try {
    const store = new GenerationResultStore({ baseDirectory: directory });
    const service = new GenerationService({ transport: new MockProviderTransport({ clock: fixedDate }), store, clock: fixedDate });
    const result = await service.generate({ compiledRequest: compiled.compiledRequest, assetResolution: data.assetResolution, modelName: "nano-banana-mock-model", persist: true });
    assert.equal(result.status, "SUCCEEDED");
    assert.equal(validateArtifact("generation_result", result).valid, true);
    assert.deepEqual(store.load(result.generation_id), result);
  } finally {
    const resolved = path.resolve(directory);
    if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Unsafe cleanup path.");
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

test("mock end-to-end: strong reference carries semantic controls into result lineage", async () => {
  const data = canonical("strong_reference");
  const semantic = nanoBananaSemanticAdapter.adapt({ compiledRequest: data.request, assetResolution: data.assetResolution, profile: nanoBananaSemanticProfile, modelName: "nano-banana-mock-model" });
  assert.equal(semantic.references[0].transfer_intensity, "VERY_HIGH");
  assert.equal(semantic.assets.subject_identity.length, 1);
  assert.equal(semantic.assets.base_images.length, 1);
  assert.equal(semantic.assets.primary_references.length, 1);
  const service = new GenerationService({ transport: new MockProviderTransport({ clock: fixedDate }), clock: fixedDate });
  const result = await service.generate({ compiledRequest: data.request, assetResolution: data.assetResolution, modelName: "nano-banana-mock-model" });
  assert.equal(result.status, "SUCCEEDED");
  assert.equal(result.project_id, data.request.project_id);
  assert.equal(result.run_id, data.request.run_id);
  assert.equal(result.request_ref.artifact_id, data.request.request_id);
  assert.equal(result.final_frame_spec_ref.artifact_id, data.request.final_frame_spec_ref.artifact_id);
});

test("mock end-to-end: website hero keeps external-copy controls", async () => {
  const data = canonical("website_hero");
  const semantic = nanoBananaSemanticAdapter.adapt({ compiledRequest: data.request, assetResolution: data.assetResolution, profile: nanoBananaSemanticProfile, modelName: "nano-banana-mock-model" });
  assert.equal(semantic.text.mode, "EXTERNAL_OVERLAY");
  assert.equal(semantic.output.aspect_ratio, "16:9");
  assert.ok(semantic.controls.hard_locks.some((item) => item.field_id === "negative-space-left-copy-field"));
  const result = await new GenerationService({ transport: new MockProviderTransport({ clock: fixedDate }), clock: fixedDate }).generate({ compiledRequest: data.request, assetResolution: data.assetResolution, modelName: "nano-banana-mock-model" });
  assert.equal(result.status, "SUCCEEDED");
});
