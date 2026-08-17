import assert from "node:assert/strict";
import test from "node:test";
import { runNanoBananaSmoke } from "../../scripts/smoke_nano_banana.mjs";

const valid = { NANO_BANANA_API_KEY: "test-key-not-real", NANO_BANANA_BASE_URL: "https://provider.test", NANO_BANANA_MODEL: "test-model" };

test("smoke guard returns CONFIGURATION_REQUIRED without creating transport", async () => {
  let calls = 0;
  const result = await runNanoBananaSmoke({ env: {}, transportFactory: () => { calls += 1; throw new Error("must not be called"); } });
  assert.equal(result.status, "SKIPPED");
  assert.equal(result.reason, "CONFIGURATION_REQUIRED");
  assert.equal(result.provider_configured, false);
  assert.equal(calls, 0);
});

test("smoke guard proceeds only after complete configuration", async () => {
  let calls = 0;
  const result = await runNanoBananaSmoke({ env: valid, transportFactory: () => ({ generate: async () => { calls += 1; return { fixture: true }; } }) });
  assert.equal(result.status, "COMPLETED");
  assert.equal(calls, 1);
});

test("real transport skeleton reports protocol not configured without network", async () => {
  const result = await runNanoBananaSmoke({ env: valid });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.reason, "PROVIDER_PROTOCOL_NOT_CONFIGURED");
  assert.equal(result.provider_configured, true);
});
