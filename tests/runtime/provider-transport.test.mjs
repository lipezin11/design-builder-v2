import assert from "node:assert/strict";
import test from "node:test";
import { ProviderTransport } from "../../src/generators/transports/provider-transport.mjs";
import { MockProviderTransport } from "../../src/generators/transports/mock-provider-transport.mjs";
import { ThirdPartyNanoBananaTransport } from "../../src/generators/transports/third-party-nano-banana-transport.mjs";
import { GENERATION_ERROR_CODES as C } from "../../src/generators/generation-errors.mjs";
import { adaptCanonical, fixedDate } from "./generation-test-helpers.mjs";

test("transport base is abstract", () => assert.throws(() => new ProviderTransport({ transportId: "x", providerId: "x", providerType: "OTHER" }), TypeError));

test("mock transport returns deterministic success", async () => {
  const response = await new MockProviderTransport({ clock: fixedDate }).generate(adaptCanonical("no_reference_urgency"));
  assert.equal(response.transport_status, "SUCCESS");
  assert.equal(response.outputs.length, 1);
  assert.match(response.outputs[0].uri, /^mock:/);
});

test("mock transport supports multiple outputs", async () => {
  const response = await new MockProviderTransport({ outputCount: 3, clock: fixedDate }).generate(adaptCanonical("no_reference_urgency"));
  assert.equal(response.outputs.length, 3);
  assert.deepEqual(response.outputs.map((item) => item.index), [0, 1, 2]);
});

test("mock transport supports warning response", async () => {
  const response = await new MockProviderTransport({ behavior: "WARNING", clock: fixedDate }).generate(adaptCanonical("website_hero"));
  assert.equal(response.transport_status, "PARTIAL_SUCCESS");
  assert.equal(response.warnings[0].severity, "WARNING");
});

test("mock transport supports simulated provider failure", async () => {
  const response = await new MockProviderTransport({ behavior: "FAILURE", clock: fixedDate }).generate(adaptCanonical("no_reference_urgency"));
  assert.equal(response.transport_status, "FAILED");
  assert.equal(response.errors[0].code, C.PROVIDER_GENERATION_FAILED);
});

test("mock transport supports simulated timeout", async () => {
  await assert.rejects(() => new MockProviderTransport({ behavior: "TIMEOUT", clock: fixedDate }).generate(adaptCanonical("no_reference_urgency")), (error) => error.code === C.PROVIDER_TIMEOUT && error.retryable);
});

test("third-party transport blocks missing configuration before protocol", async () => {
  const transport = new ThirdPartyNanoBananaTransport({ env: {} });
  await assert.rejects(() => transport.generate(adaptCanonical("no_reference_urgency")), (error) => error.code === C.NANO_BANANA_API_KEY_NOT_CONFIGURED);
});

test("third-party transport reports protocol not configured with valid test config", async () => {
  const env = { NANO_BANANA_API_KEY: "test-key-not-real", NANO_BANANA_BASE_URL: "https://provider.test", NANO_BANANA_MODEL: "test-model" };
  const transport = new ThirdPartyNanoBananaTransport({ env });
  await assert.rejects(() => transport.generate(adaptCanonical("no_reference_urgency")), (error) => {
    assert.equal(error.code, C.PROVIDER_PROTOCOL_NOT_CONFIGURED);
    assert.equal(JSON.stringify(error).includes(env.NANO_BANANA_API_KEY), false);
    return true;
  });
});
