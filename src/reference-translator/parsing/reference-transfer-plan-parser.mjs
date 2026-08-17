import { REFERENCE_TRANSLATOR_ERROR_CODES as C, ReferenceTranslatorError } from "../reference-translator-errors.mjs";

function responsePayload(response) {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    if (typeof response.content === "string") return response.content;
    if (typeof response.output_text === "string") return response.output_text;
    if (response.plan && typeof response.plan === "object") return response.plan;
    return response;
  }
  return response;
}

export function parseReferenceTransferPlan(response) {
  const payload = responsePayload(response);
  if (payload && typeof payload === "object" && !Array.isArray(payload)) return structuredClone(payload);
  if (typeof payload !== "string") {
    throw new ReferenceTranslatorError(C.MODEL_OUTPUT_INVALID_JSON, "Model output must be a JSON object or a raw JSON string.", { received_type: Array.isArray(payload) ? "array" : typeof payload }, { retryable: true });
  }

  const raw = payload.replace(/^\uFEFF/, "").trim();
  if (!raw) throw new ReferenceTranslatorError(C.MODEL_OUTPUT_INVALID_JSON, "Model output was empty.", {}, { retryable: true });
  if (raw.startsWith("```")) {
    throw new ReferenceTranslatorError(C.MODEL_OUTPUT_INVALID_JSON, "Model output must not contain Markdown fences.", { output_prefix: raw.slice(0, 40) }, { retryable: true });
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new TypeError("top-level JSON must be an object");
    return parsed;
  } catch (error) {
    throw new ReferenceTranslatorError(C.MODEL_OUTPUT_INVALID_JSON, "Model output is not valid Reference Transfer Plan JSON.", { cause: error.message, output_prefix: raw.slice(0, 160) }, { retryable: true });
  }
}
