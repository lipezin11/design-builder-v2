import crypto from "node:crypto";
import { CognitiveModelAdapter } from "./cognitive-model-adapter.mjs";
import { buildReferenceTranslatorProviderUserText, measureReferenceTranslatorRequest } from "./reference-translator-request-measurement.mjs";
import { REFERENCE_TRANSLATOR_ERROR_CODES as C, ReferenceTranslatorError } from "../reference-translator-errors.mjs";

const DEFAULT_TIMEOUT_MS = 180000;
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;
const trim = (value) => typeof value === "string" ? value.trim() : "";
const clone = (value) => value === undefined ? undefined : structuredClone(value);

function structuredOutputMode(value) {
  const mode = trim(value).toUpperCase() || "NONE";
  if (!["NONE", "JSON_SCHEMA"].includes(mode)) throw new ReferenceTranslatorError(C.MODEL_CONFIGURATION_INVALID, "REFERENCE_TRANSLATOR_STRUCTURED_OUTPUT_MODE must be NONE or JSON_SCHEMA.");
  return mode;
}

export function redactReferenceTranslatorSecrets(value, secrets = []) {
  const active = secrets.filter((secret) => typeof secret === "string" && secret.length >= 4);
  const scrub = (text) => {
    let result = String(text ?? "").replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer [REDACTED]");
    for (const secret of active) result = result.split(secret).join("[REDACTED]");
    return result;
  };
  if (typeof value === "string") return scrub(value);
  if (Array.isArray(value)) return value.map((item) => redactReferenceTranslatorSecrets(item, active));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, redactReferenceTranslatorSecrets(child, active)]));
  return value;
}

function positiveInteger(value, fallback, label, { maximum = 1000000 } = {}) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) throw new ReferenceTranslatorError(C.MODEL_CONFIGURATION_INVALID, label + " must be a positive integer no greater than " + maximum + ".");
  return parsed;
}

export function resolveReferenceTranslatorProviderConfig(env = process.env) {
  const apiKey = trim(env.REFERENCE_TRANSLATOR_API_KEY);
  const baseUrl = trim(env.REFERENCE_TRANSLATOR_BASE_URL).replace(/\/+$/, "");
  const model = trim(env.REFERENCE_TRANSLATOR_MODEL);
  if (!apiKey) throw new ReferenceTranslatorError(C.MODEL_CONFIGURATION_INVALID, "REFERENCE_TRANSLATOR_API_KEY is not configured.");
  if (!baseUrl) throw new ReferenceTranslatorError(C.MODEL_CONFIGURATION_INVALID, "REFERENCE_TRANSLATOR_BASE_URL is not configured.");
  if (!/^https:\/\//i.test(baseUrl)) throw new ReferenceTranslatorError(C.MODEL_CONFIGURATION_INVALID, "REFERENCE_TRANSLATOR_BASE_URL must use HTTPS.");
  if (!model) throw new ReferenceTranslatorError(C.MODEL_CONFIGURATION_INVALID, "REFERENCE_TRANSLATOR_MODEL is not configured.");
  return {
    apiKey,
    baseUrl,
    model,
    provider: trim(env.REFERENCE_TRANSLATOR_PROVIDER) || "OPENAI_COMPATIBLE",
    apiVersion: trim(env.REFERENCE_TRANSLATOR_API_VERSION) || null,
    timeoutMs: positiveInteger(env.REFERENCE_TRANSLATOR_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, "REFERENCE_TRANSLATOR_TIMEOUT_MS", { maximum: 600000 }),
    maxOutputTokens: positiveInteger(env.REFERENCE_TRANSLATOR_MAX_OUTPUT_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS, "REFERENCE_TRANSLATOR_MAX_OUTPUT_TOKENS", { maximum: 32768 }),
    contextLimitTokens: positiveInteger(env.REFERENCE_TRANSLATOR_CONTEXT_LIMIT_TOKENS, null, "REFERENCE_TRANSLATOR_CONTEXT_LIMIT_TOKENS", { maximum: 10000000 }),
    structuredOutputMode: structuredOutputMode(env.REFERENCE_TRANSLATOR_STRUCTURED_OUTPUT_MODE)
  };
}

function imagePart(input) {
  const mimeType = trim(input.mime_type);
  if (!mimeType.startsWith("image/")) throw new ReferenceTranslatorError(C.MODEL_UNSUPPORTED_IMAGE, "Multimodal input requires an image MIME type.", { asset_id: input.asset_id, mime_type: mimeType });
  const url = input.bytes_base64 ? "data:" + mimeType + ";base64," + input.bytes_base64 : trim(input.uri);
  if (!url) throw new ReferenceTranslatorError(C.MODEL_UNSUPPORTED_IMAGE, "Multimodal input has no image bytes or URL.", { asset_id: input.asset_id });
  if (!/^(data:image\/|https:\/\/)/i.test(url)) throw new ReferenceTranslatorError(C.MODEL_UNSUPPORTED_IMAGE, "Provider image input must be HTTPS or an image data URL.", { asset_id: input.asset_id });
  return { type: "image_url", image_url: { url, detail: "high" } };
}

function imageProof(input) {
  if (input.bytes_base64) {
    const bytes = Buffer.from(input.bytes_base64, "base64");
    return {
      asset_id: input.asset_id,
      mime_type: input.mime_type,
      source_type: "INLINE_IMAGE_BYTES",
      byte_length: bytes.length,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex")
    };
  }
  return {
    asset_id: input.asset_id,
    mime_type: input.mime_type,
    source_type: "HTTPS_IMAGE_URL",
    uri_sha256: crypto.createHash("sha256").update(input.uri).digest("hex")
  };
}

function providerCandidate(payload) {
  const choice = payload?.choices?.[0];
  const message = choice?.message;
  const content = message?.content;
  if (typeof content === "string" && content.trim()) return content;
  if (Array.isArray(content)) {
    const text = content.filter((item) => item?.type === "text" && typeof item.text === "string").map((item) => item.text).join("\n");
    if (text.trim()) return text;
  }
  throw new ReferenceTranslatorError(C.MODEL_MALFORMED_RESPONSE, "Provider response did not contain visible candidate text.", {
    provider_response_id: payload?.id ?? null,
    provider_code: payload?.code ?? payload?.error?.code ?? null,
    provider_message: trim(payload?.msg) || trim(payload?.error?.message) || trim(payload?.message) || null,
    top_level_keys: payload && typeof payload === "object" ? Object.keys(payload).slice(0, 20) : [],
    choice_count: Array.isArray(payload?.choices) ? payload.choices.length : null,
    first_choice_keys: choice && typeof choice === "object" ? Object.keys(choice).slice(0, 20) : [],
    finish_reason: choice?.finish_reason ?? null,
    message_keys: message && typeof message === "object" ? Object.keys(message).slice(0, 20) : [],
    content_type: Array.isArray(content) ? "array" : typeof content,
    content_length: typeof content === "string" ? content.length : Array.isArray(content) ? content.length : null
  });
}

function providerMessage(payload, fallback) {
  return trim(payload?.error?.message) || trim(payload?.detail) || trim(payload?.message) || trim(payload?.msg) || fallback;
}

function embeddedProviderErrorStatus(payload) {
  const code = Number(payload?.code);
  return Number.isInteger(code) && code >= 400 && !Array.isArray(payload?.choices) ? code : null;
}

function classifyHttpError(status, payload, secrets) {
  const rawMessage = providerMessage(payload, "Provider returned HTTP " + status + ".");
  const message = redactReferenceTranslatorSecrets(rawMessage, secrets).slice(0, 2000);
  const normalized = message.toLowerCase();
  const details = {
    http_status: status,
    provider_code: redactReferenceTranslatorSecrets(payload?.error?.code ?? null, secrets),
    provider_message: message
  };
  if (status === 401 || status === 403) return new ReferenceTranslatorError(C.MODEL_AUTHENTICATION_FAILED, "Provider authentication failed.", details);
  if (status === 429) return new ReferenceTranslatorError(C.MODEL_RATE_LIMITED, "Provider rate limit reached.", details, { retryable: true });
  if (/context|token.{0,20}(limit|maximum)|maximum context/.test(normalized)) return new ReferenceTranslatorError(C.MODEL_CONTEXT_WINDOW_EXCEEDED, "Provider rejected the complete request for context-window capacity.", details);
  if (/image|vision|multimodal|image_url/.test(normalized) && /unsupported|not support|invalid|text.only|modality/.test(normalized)) return new ReferenceTranslatorError(C.MODEL_UNSUPPORTED_IMAGE, "Configured provider model rejected multimodal image input.", details);
  if (/model/.test(normalized) && /not found|invalid|unknown|does not exist|unsupported/.test(normalized)) return new ReferenceTranslatorError(C.MODEL_INVALID_MODEL, "Configured provider model is invalid or unavailable.", details);
  if (status >= 500) return new ReferenceTranslatorError(C.MODEL_SERVER_ERROR, "Provider server failed while invoking the cognitive model.", details, { retryable: true });
  return new ReferenceTranslatorError(C.MODEL_INVOCATION_FAILED, "Provider rejected the cognitive model request.", details);
}

export class OpenAiCompatibleMultimodalCognitiveModelAdapter extends CognitiveModelAdapter {
  constructor({
    env = process.env,
    fetchImpl = globalThis.fetch,
    sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    clock = () => Date.now(),
    maxTransportAttempts = 2,
    temperature = 0.2,
    seed = 42,
    adapterId = "openai-compatible-multimodal-v1"
  } = {}) {
    super({ adapterId, supportsImages: true });
    if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl is required.");
    if (!Number.isInteger(maxTransportAttempts) || maxTransportAttempts < 1 || maxTransportAttempts > 3) throw new TypeError("maxTransportAttempts must be an integer from 1 to 3.");
    this.config = resolveReferenceTranslatorProviderConfig(env);
    this.providerId = this.config.provider;
    this.model = this.config.model;
    this.fetchImpl = fetchImpl;
    this.sleep = sleep;
    this.clock = clock;
    this.maxTransportAttempts = maxTransportAttempts;
    this.temperature = temperature;
    this.seed = seed;
    this.invocations = [];
    this.lastInvocationMetadata = null;
    this.lastVisibleCandidate = null;
    this.visibleCandidates = [];
  }

  serialize(request) {
    const content = [
      { type: "text", text: buildReferenceTranslatorProviderUserText(request) },
      ...(request.multimodal_inputs ?? []).map(imagePart)
    ];
    const body = {
      model: this.config.model,
      messages: [
        { role: "system", content: request.system_prompt },
        { role: "user", content }
      ],
      temperature: this.temperature,
      max_tokens: this.config.maxOutputTokens,
      seed: this.seed,
      stream: false
    };
    if (this.config.structuredOutputMode === "JSON_SCHEMA") {
      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: "reference_transfer_plan",
          strict: true,
          schema: request.output_contract
        }
      };
    }
    return body;
  }

  measureRequest(request) {
    const body = this.serialize(request);
    return measureReferenceTranslatorRequest(request, {
      providerBody: body,
      contextLimitTokens: this.config.contextLimitTokens,
      outputBudgetTokens: this.config.maxOutputTokens
    });
  }

  getLastInvocationMetadata() {
    return clone(this.lastInvocationMetadata);
  }

  getLastVisibleCandidate() {
    return this.lastVisibleCandidate;
  }

  getVisibleCandidates() {
    return clone(this.visibleCandidates);
  }

  async invoke(request) {
    const body = this.serialize(request);
    const imageTransmission = (request.multimodal_inputs ?? []).map(imageProof);
    const measurement = measureReferenceTranslatorRequest(request, {
      providerBody: body,
      contextLimitTokens: this.config.contextLimitTokens,
      outputBudgetTokens: this.config.maxOutputTokens
    });
    const invocationStarted = this.clock();
    let lastError;
    for (let transportAttempt = 1; transportAttempt <= this.maxTransportAttempts; transportAttempt++) {
      const attemptStarted = this.clock();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
      try {
        const response = await this.fetchImpl(this.config.baseUrl + "/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
            authorization: "Bearer " + this.config.apiKey
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        const responseText = await response.text();
        let payload;
        try {
          payload = responseText ? JSON.parse(responseText) : {};
        } catch {
          throw new ReferenceTranslatorError(C.MODEL_MALFORMED_RESPONSE, "Provider returned malformed JSON.", { http_status: response.status });
        }
        if (!response.ok) throw classifyHttpError(response.status, payload, [this.config.apiKey]);
        const embeddedStatus = embeddedProviderErrorStatus(payload);
        if (embeddedStatus !== null) throw classifyHttpError(embeddedStatus, payload, [this.config.apiKey]);
        const candidate = providerCandidate(payload);
        this.lastVisibleCandidate = candidate;
        const usage = payload.usage ? {
          input_tokens: payload.usage.prompt_tokens ?? payload.usage.input_tokens ?? null,
          output_tokens: payload.usage.completion_tokens ?? payload.usage.output_tokens ?? null,
          total_tokens: payload.usage.total_tokens ?? null,
          cached_tokens: payload.usage.prompt_tokens_details?.cached_tokens ?? payload.usage.cached_tokens ?? null,
          reasoning_tokens: payload.usage.completion_tokens_details?.reasoning_tokens ?? payload.usage.reasoning_tokens ?? null
        } : null;
        const completed = this.clock();
        this.lastInvocationMetadata = {
          input_mode: "MULTIMODAL",
          provider_adapter: this.adapterId,
          provider: this.providerId,
          model: this.model,
          provider_response_id: payload.id ?? null,
          finish_reason: payload.choices?.[0]?.finish_reason ?? null,
          transport_attempt_count: transportAttempt,
          latency_ms: completed - invocationStarted,
          final_attempt_latency_ms: completed - attemptStarted,
          image_transmission: imageTransmission,
          request_measurement: usage?.input_tokens ? measureReferenceTranslatorRequest(request, {
            providerBody: body,
            contextLimitTokens: this.config.contextLimitTokens,
            outputBudgetTokens: this.config.maxOutputTokens,
            actualInputTokens: usage.input_tokens
          }) : measurement,
          usage,
          provider_reported_credits: Number.isFinite(payload.credits_consumed) ? payload.credits_consumed : null,
          structured_output_mode: this.config.structuredOutputMode,
          hidden_reasoning_persisted: false
        };
        this.invocations.push(clone(this.lastInvocationMetadata));
        this.visibleCandidates.push({ candidate, metadata: clone(this.lastInvocationMetadata) });
        return candidate;
      } catch (error) {
        this.lastVisibleCandidate = null;
        const aborted = controller.signal.aborted || error?.name === "AbortError";
        const typed = aborted
          ? new ReferenceTranslatorError(C.MODEL_TIMEOUT, "Provider request timed out.", { timeout_ms: this.config.timeoutMs }, { retryable: true })
          : error instanceof ReferenceTranslatorError
            ? error
            : new ReferenceTranslatorError(C.MODEL_INVOCATION_FAILED, "Provider transport failed.", {
              cause: redactReferenceTranslatorSecrets(error?.message ?? String(error), [this.config.apiKey]).slice(0, 2000)
            }, { retryable: true });
        lastError = typed;
        const completed = this.clock();
        this.lastInvocationMetadata = {
          input_mode: "MULTIMODAL",
          provider_adapter: this.adapterId,
          provider: this.providerId,
          model: this.model,
          transport_attempt_count: transportAttempt,
          latency_ms: completed - invocationStarted,
          final_attempt_latency_ms: completed - attemptStarted,
          image_transmission: imageTransmission,
          request_measurement: measurement,
          usage: null,
          provider_reported_credits: null,
          structured_output_mode: this.config.structuredOutputMode,
          error: {
            code: typed.code,
            retryable: typed.retryable,
            details: redactReferenceTranslatorSecrets(typed.details, [this.config.apiKey])
          },
          hidden_reasoning_persisted: false
        };
        if (!typed.retryable || transportAttempt === this.maxTransportAttempts) {
          this.invocations.push(clone(this.lastInvocationMetadata));
          throw typed;
        }
        await this.sleep(Math.min(1000 * transportAttempt, 3000));
      } finally {
        clearTimeout(timeout);
      }
    }
    throw lastError;
  }
}
