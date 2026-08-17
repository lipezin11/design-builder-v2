import assert from "node:assert/strict";
import test from "node:test";
import { validateArtifact } from "../../src/compiler/schema-validator.mjs";
import { normalizeGenerationResult } from "../../src/generators/normalization/generation-result-normalizer.mjs";
import { MockProviderTransport } from "../../src/generators/transports/mock-provider-transport.mjs";
import { GENERATION_ERROR_CODES as C } from "../../src/generators/generation-errors.mjs";
import { adaptCanonical, canonical, fixedDate } from "./generation-test-helpers.mjs";

async function normalized(name = "no_reference_urgency", options = {}) {
  const semanticRequest = adaptCanonical(name);
  const response = await new MockProviderTransport({ clock: fixedDate, ...options }).generate(semanticRequest);
  return normalizeGenerationResult({ compiledRequest: canonical(name).request, semanticRequest, providerResponse: response, transportId: "mock-provider-transport-v1", clock: fixedDate });
}

test("normalizer creates a schema-valid successful Generation Result", async () => {
  const result = await normalized();
  assert.equal(result.status, "SUCCEEDED");
  assert.equal(validateArtifact("generation_result", result).valid, true);
  assert.equal(result.request_ref.artifact_id, canonical("no_reference_urgency").request.request_id);
});

test("normalizer preserves multiple outputs", async () => assert.equal((await normalized("no_reference_urgency", { outputCount: 3 })).outputs.length, 3));

test("normalizer maps partial provider success to PARTIALLY_SUCCEEDED", async () => {
  const result = await normalized("website_hero", { behavior: "WARNING" });
  assert.equal(result.status, "PARTIALLY_SUCCEEDED");
  assert.equal(result.warnings.length, 1);
});

test("normalizer maps provider failure to FAILED", async () => {
  const result = await normalized("no_reference_urgency", { behavior: "FAILURE" });
  assert.equal(result.status, "FAILED");
  assert.equal(result.errors[0].code, C.PROVIDER_GENERATION_FAILED);
});

test("normalizer converts success without output into a stable failure", async () => {
  const semanticRequest = adaptCanonical("no_reference_urgency");
  const response = await new MockProviderTransport({ clock: fixedDate }).generate(semanticRequest);
  response.outputs = [];
  const result = normalizeGenerationResult({ compiledRequest: canonical("no_reference_urgency").request, semanticRequest, providerResponse: response, transportId: "mock-provider-transport-v1", clock: fixedDate });
  assert.equal(result.status, "FAILED");
  assert.equal(result.errors[0].code, C.OUTPUT_NOT_FOUND);
});

test("normalizer removes credential-shaped provider metadata recursively", async () => {
  const semanticRequest = adaptCanonical("no_reference_urgency");
  const response = await new MockProviderTransport({ clock: fixedDate }).generate(semanticRequest);
  response.response_metadata = { api_key: "must-not-survive", nested: { authorization: "must-not-survive", safe: "kept" } };
  const result = normalizeGenerationResult({ compiledRequest: canonical("no_reference_urgency").request, semanticRequest, providerResponse: response, transportId: "mock-provider-transport-v1", clock: fixedDate });
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("must-not-survive"), false);
  assert.equal(result.provider_metadata.response_metadata.nested.safe, "kept");
});
