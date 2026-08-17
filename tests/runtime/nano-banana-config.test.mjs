import assert from "node:assert/strict";
import test from "node:test";
import { assertNanoBananaConfig, validateNanoBananaConfig } from "../../src/generators/config/nano-banana-config.mjs";
import { GENERATION_ERROR_CODES as C } from "../../src/generators/generation-errors.mjs";

const valid = { NANO_BANANA_API_KEY: "test-key-not-real", NANO_BANANA_BASE_URL: "https://provider.test", NANO_BANANA_MODEL: "test-model" };
const codeFor = (env) => validateNanoBananaConfig(env).errors[0].code;

test("config: missing API key", () => assert.equal(codeFor({ ...valid, NANO_BANANA_API_KEY: undefined }), C.NANO_BANANA_API_KEY_NOT_CONFIGURED));
test("config: placeholder API key", () => assert.equal(codeFor({ ...valid, NANO_BANANA_API_KEY: "SUBSTITUA_PELA_API" }), C.NANO_BANANA_API_KEY_NOT_CONFIGURED));
test("config: missing base URL", () => assert.equal(codeFor({ ...valid, NANO_BANANA_BASE_URL: "" }), C.NANO_BANANA_BASE_URL_NOT_CONFIGURED));
test("config: placeholder base URL", () => assert.equal(codeFor({ ...valid, NANO_BANANA_BASE_URL: "SUBSTITUA_PELA_URL_DA_API" }), C.NANO_BANANA_BASE_URL_NOT_CONFIGURED));
test("config: missing model", () => assert.equal(codeFor({ ...valid, NANO_BANANA_MODEL: undefined }), C.NANO_BANANA_MODEL_NOT_CONFIGURED));
test("config: placeholder model", () => assert.equal(codeFor({ ...valid, NANO_BANANA_MODEL: "SUBSTITUA_PELO_MODELO" }), C.NANO_BANANA_MODEL_NOT_CONFIGURED));

test("config: valid test configuration is returned without logging", () => {
  const result = validateNanoBananaConfig(valid);
  assert.equal(result.valid, true);
  assert.deepEqual(result.config, { api_key: "test-key-not-real", base_url: "https://provider.test", model: "test-model" });
});

test("config: typed error never exposes an otherwise valid API key", () => {
  assert.throws(() => assertNanoBananaConfig({ ...valid, NANO_BANANA_MODEL: "" }), (error) => {
    assert.equal(error.code, C.NANO_BANANA_MODEL_NOT_CONFIGURED);
    assert.equal(JSON.stringify(error).includes(valid.NANO_BANANA_API_KEY), false);
    assert.match(error.message, /Nano Banana provider ainda não configurado/);
    return true;
  });
});
