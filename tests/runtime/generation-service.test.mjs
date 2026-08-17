import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { GenerationService } from "../../src/generators/generation-service.mjs";
import { GenerationResultStore } from "../../src/generators/persistence/generation-result-store.mjs";
import { MockProviderTransport } from "../../src/generators/transports/mock-provider-transport.mjs";
import { validateArtifact } from "../../src/compiler/schema-validator.mjs";
import { canonical, fixedDate } from "./generation-test-helpers.mjs";

const run = async (behavior = "SUCCESS", extra = {}) => {
  const data = canonical("no_reference_urgency");
  const service = new GenerationService({ transport: new MockProviderTransport({ behavior, clock: fixedDate }), clock: fixedDate, ...extra });
  return service.generate({ compiledRequest: data.request, assetResolution: data.assetResolution, modelName: "nano-banana-mock-model", persist: extra.store ? true : false });
};

test("generation service connects adapter, mock transport and normalizer", async () => {
  const result = await run();
  assert.equal(result.status, "SUCCEEDED");
  assert.equal(validateArtifact("generation_result", result).valid, true);
});

test("generation service normalizes simulated provider failure", async () => assert.equal((await run("FAILURE")).status, "FAILED"));

test("generation service normalizes simulated timeout without leaking transport shape", async () => {
  const result = await run("TIMEOUT");
  assert.equal(result.status, "FAILED");
  assert.equal(result.errors[0].code, "PROVIDER_TIMEOUT");
});

test("generation service persists when a store is configured", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "design-builder-service-"));
  try {
    const store = new GenerationResultStore({ baseDirectory: directory });
    const result = await run("SUCCESS", { store });
    assert.deepEqual(store.load(result.generation_id), result);
  } finally {
    const resolved = path.resolve(directory);
    if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Unsafe cleanup path.");
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
