import assert from "node:assert/strict";
import test from "node:test";
import {
  OpenAiCompatibleMultimodalCognitiveModelAdapter,
  redactReferenceTranslatorSecrets,
  resolveReferenceTranslatorProviderConfig
} from "../../src/reference-translator/model/openai-compatible-multimodal-adapter.mjs";
import { REFERENCE_TRANSLATOR_ERROR_CODES as C } from "../../src/reference-translator/reference-translator-errors.mjs";

const secret = "unit-test-secret-never-persist";
const env = (extra = {}) => ({
  REFERENCE_TRANSLATOR_API_KEY: secret,
  REFERENCE_TRANSLATOR_BASE_URL: "https://provider.test/v1/",
  REFERENCE_TRANSLATOR_MODEL: "vision-test-model",
  REFERENCE_TRANSLATOR_PROVIDER: "TEST_PROVIDER",
  REFERENCE_TRANSLATOR_TIMEOUT_MS: "1000",
  REFERENCE_TRANSLATOR_MAX_OUTPUT_TOKENS: "2048",
  REFERENCE_TRANSLATOR_CONTEXT_LIMIT_TOKENS: "1000000",
  ...extra
});
const request = () => ({
  prompt_version: "REFERENCE_TRANSLATOR_AGENT_V1_1",
  system_prompt: "SYSTEM PROMPT",
  structured_context: {
    authority_and_task: { correction_diagnostics: [] },
    target_brief_and_protected_semantics: { brief_spec: { user_request: "test" } },
    reference_assets_and_scope: { assets: [{ asset_id: "ref-1" }] },
    advisories: { my_eyes: null, vkb: null, authority: "ADVISORY_ONLY" }
  },
  multimodal_inputs: [{ asset_id: "ref-1", mime_type: "image/png", bytes_base64: Buffer.from("real-image-bytes").toString("base64") }],
  output_contract: { type: "object" },
  generation_intent: { structured_output_strictness: "STRICT" }
});
const response = (status, payload) => ({
  ok: status >= 200 && status < 300,
  status,
  async text() { return typeof payload === "string" ? payload : JSON.stringify(payload); }
});
const successPayload = {
  id: "provider-response-1",
  model: "vision-test-model",
  choices: [{ finish_reason: "stop", message: { content: "{\"schema_version\":\"1.0.0\"}" } }],
  usage: { prompt_tokens: 123, completion_tokens: 17, total_tokens: 140 }
};

test("provider config requires secret, HTTPS base URL, and model", () => {
  assert.throws(() => resolveReferenceTranslatorProviderConfig({}), (error) => error.code === C.MODEL_CONFIGURATION_INVALID);
  const config = resolveReferenceTranslatorProviderConfig(env());
  assert.equal(config.baseUrl, "https://provider.test/v1");
  assert.equal(config.model, "vision-test-model");
  assert.equal(config.apiKey, secret);
});

test("adapter serializes system, structured context, and actual image data", () => {
  const adapter = new OpenAiCompatibleMultimodalCognitiveModelAdapter({ env: env(), fetchImpl: async () => response(200, successPayload) });
  const body = adapter.serialize(request());
  assert.equal(body.messages[0].role, "system");
  assert.equal(body.messages[1].content[0].type, "text");
  assert.equal(body.messages[1].content[1].type, "image_url");
  assert.match(body.messages[1].content[1].image_url.url, /^data:image\/png;base64,/);
  assert.equal(body.stream, false);
  assert.equal(body.response_format, undefined);
});

test("adapter optionally sends the exact Design Builder output contract as native JSON Schema", () => {
  const adapter = new OpenAiCompatibleMultimodalCognitiveModelAdapter({
    env: env({ REFERENCE_TRANSLATOR_STRUCTURED_OUTPUT_MODE: "JSON_SCHEMA" }),
    fetchImpl: async () => response(200, successPayload)
  });
  const source = request();
  const body = adapter.serialize(source);
  assert.deepEqual(body.response_format, {
    type: "json_schema",
    json_schema: {
      name: "reference_transfer_plan",
      strict: true,
      schema: source.output_contract
    }
  });
});

test("adapter sends authorization only in transport headers and returns visible candidate", async () => {
  let captured;
  const adapter = new OpenAiCompatibleMultimodalCognitiveModelAdapter({
    env: env(),
    fetchImpl: async (url, options) => { captured = { url, options }; return response(200, successPayload); }
  });
  const candidate = await adapter.invoke(request());
  assert.equal(candidate, "{\"schema_version\":\"1.0.0\"}");
  assert.equal(captured.options.headers.authorization, "Bearer " + secret);
  assert.equal(captured.url, "https://provider.test/v1/chat/completions");
  const metadata = adapter.getLastInvocationMetadata();
  assert.equal(metadata.input_mode, "MULTIMODAL");
  assert.equal(metadata.image_transmission[0].byte_length, Buffer.byteLength("real-image-bytes"));
  assert.equal(metadata.usage.input_tokens, 123);
  assert.equal(metadata.request_measurement.input_token_measurement, "PROVIDER_REPORTED_ACTUAL");
  assert.equal(JSON.stringify(metadata).includes(secret), false);
});

test("adapter records factual provider-reported credit consumption", async () => {
  const adapter = new OpenAiCompatibleMultimodalCognitiveModelAdapter({
    env: env(),
    fetchImpl: async () => response(200, { ...successPayload, credits_consumed: 1.25 })
  });
  await adapter.invoke(request());
  assert.equal(adapter.getLastInvocationMetadata().provider_reported_credits, 1.25);
});

test("adapter classifies authentication, invalid model, unsupported image, and malformed response", async () => {
  const cases = [
    [401, { error: { message: "bad token " + secret } }, C.MODEL_AUTHENTICATION_FAILED],
    [404, { error: { message: "model not found" } }, C.MODEL_INVALID_MODEL],
    [422, { error: { message: "image_url modality is unsupported by this text-only model" } }, C.MODEL_UNSUPPORTED_IMAGE],
    [200, { choices: [] }, C.MODEL_MALFORMED_RESPONSE]
  ];
  for (const [status, payload, code] of cases) {
    const adapter = new OpenAiCompatibleMultimodalCognitiveModelAdapter({ env: env(), maxTransportAttempts: 1, fetchImpl: async () => response(status, payload) });
    await assert.rejects(() => adapter.invoke(request()), (error) => {
      assert.equal(error.code, code);
      assert.equal(JSON.stringify(error).includes(secret), false);
      return true;
    });
  }
});

test("HTTP 200 envelopes carrying provider errors are classified and retried", async () => {
  let calls = 0;
  const adapter = new OpenAiCompatibleMultimodalCognitiveModelAdapter({
    env: env(),
    sleep: async () => {},
    maxTransportAttempts: 2,
    fetchImpl: async () => ++calls === 1
      ? response(200, { code: 500, msg: "Server exception", data: null })
      : response(200, successPayload)
  });
  await adapter.invoke(request());
  assert.equal(calls, 2);
  assert.equal(adapter.getLastInvocationMetadata().transport_attempt_count, 2);
});

test("rate limits use one bounded transport retry", async () => {
  let calls = 0;
  const adapter = new OpenAiCompatibleMultimodalCognitiveModelAdapter({
    env: env(),
    sleep: async () => {},
    maxTransportAttempts: 2,
    fetchImpl: async () => ++calls === 1 ? response(429, { error: { message: "rate limit" } }) : response(200, successPayload)
  });
  await adapter.invoke(request());
  assert.equal(calls, 2);
  assert.equal(adapter.getLastInvocationMetadata().transport_attempt_count, 2);
});

test("timeout is typed and bounded", async () => {
  const adapter = new OpenAiCompatibleMultimodalCognitiveModelAdapter({
    env: env({ REFERENCE_TRANSLATOR_TIMEOUT_MS: "10" }),
    maxTransportAttempts: 1,
    fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
    })
  });
  await assert.rejects(() => adapter.invoke(request()), (error) => error.code === C.MODEL_TIMEOUT);
});

test("empty provider candidates expose safe envelope diagnostics", async () => {
  const adapter = new OpenAiCompatibleMultimodalCognitiveModelAdapter({
    env: env(),
    maxTransportAttempts: 1,
    fetchImpl: async () => response(200, { code: 422, msg: "schema rejected", choices: [] })
  });
  await assert.rejects(() => adapter.invoke(request()), (error) => {
    assert.equal(error.code, C.MODEL_MALFORMED_RESPONSE);
    assert.equal(error.details.provider_code, 422);
    assert.equal(error.details.provider_message, "schema rejected");
    assert.deepEqual(error.details.top_level_keys, ["code", "msg", "choices"]);
    return true;
  });
});

test("malformed HTTP JSON is typed", async () => {
  const adapter = new OpenAiCompatibleMultimodalCognitiveModelAdapter({ env: env(), maxTransportAttempts: 1, fetchImpl: async () => response(200, "not-json") });
  await assert.rejects(() => adapter.invoke(request()), (error) => error.code === C.MODEL_MALFORMED_RESPONSE);
});

test("secret redaction removes explicit and bearer forms recursively", () => {
  const redacted = redactReferenceTranslatorSecrets({ message: "failed " + secret, header: "Bearer " + secret }, [secret]);
  assert.equal(JSON.stringify(redacted).includes(secret), false);
  assert.match(redacted.header, /REDACTED/);
});

test("saved structural measurement excludes API key and classifies configured context", () => {
  const adapter = new OpenAiCompatibleMultimodalCognitiveModelAdapter({ env: env(), fetchImpl: async () => response(200, successPayload) });
  const measurement = adapter.measureRequest(request());
  assert.equal(measurement.context_classification, "SAFE");
  assert.equal(measurement.multimodal_image_count, 1);
  assert.equal(measurement.input_token_measurement, "ESTIMATED_NOT_PROVIDER_EXACT");
  assert.equal(JSON.stringify(measurement).includes(secret), false);
});
