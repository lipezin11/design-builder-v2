import { validateArtifact } from "../../compiler/schema-validator.mjs";
import { GENERATION_ERROR_CODES as C, GenerationError } from "../generation-errors.mjs";

const clone = (value) => structuredClone(value);
const safeId = (value) => String(value).replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
const SECRET_KEY = /(authorization|api[_-]?key|token|secret|credential|password)/i;
export function sanitizeProviderMetadata(value) {
  if (Array.isArray(value)) return value.map(sanitizeProviderMetadata);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !SECRET_KEY.test(key)).map(([key, item]) => [key, sanitizeProviderMetadata(item)]));
}
const diagnostic = (item, fallbackSource, fallbackSeverity) => ({
  code: item?.code ?? C.PROVIDER_BAD_RESPONSE,
  message: item?.message ?? "Provider returned an unspecified diagnostic.",
  severity: item?.severity ?? fallbackSeverity,
  source: item?.source ?? fallbackSource,
  retryable: item?.retryable ?? false,
  ...(item?.details ? { details: sanitizeProviderMetadata(item.details) } : {})
});
const ref = (item) => ({ artifact_id: item.artifact_id, artifact_version: item.artifact_version, ...(item.artifact_uri ? { artifact_uri: item.artifact_uri } : {}), ...(item.checksum ? { checksum: item.checksum } : {}) });

export function normalizeGenerationResult({ compiledRequest, semanticRequest, providerResponse, transportId, clock = () => new Date(), producerVersion = "1.0.0" }) {
  if (!providerResponse || !["SUCCESS", "PARTIAL_SUCCESS", "FAILED", "BLOCKED"].includes(providerResponse.transport_status)) {
    throw new GenerationError(C.PROVIDER_BAD_RESPONSE, "Provider response is missing a supported transport_status.");
  }
  const generationId = safeId(providerResponse.provider_generation_id ?? `gen-${semanticRequest.semantic_request_id}`);
  const warnings = (providerResponse.warnings ?? []).map((item) => diagnostic(item, "PROVIDER", "WARNING"));
  const errors = (providerResponse.errors ?? []).map((item) => diagnostic(item, "PROVIDER", "ERROR"));
  const outputs = (providerResponse.outputs ?? []).map((item, index) => ({
    output_id: safeId(item.output_id ?? `${generationId}-output-${index + 1}`),
    type: "IMAGE",
    uri: item.uri,
    mime_type: item.mime_type ?? "image/png",
    ...(item.width !== undefined ? { width: item.width } : {}),
    ...(item.height !== undefined ? { height: item.height } : {}),
    ...(item.aspect_ratio !== undefined ? { aspect_ratio: item.aspect_ratio } : {}),
    index: item.index ?? index,
    ...(item.checksum ? { checksum: item.checksum } : {}),
    ...(item.provider_asset_id ? { provider_asset_id: item.provider_asset_id } : {}),
    metadata: sanitizeProviderMetadata(item.metadata ?? {})
  }));
  let status = { SUCCESS: "SUCCEEDED", PARTIAL_SUCCESS: "PARTIALLY_SUCCEEDED", FAILED: "FAILED", BLOCKED: "BLOCKED" }[providerResponse.transport_status];
  if ((status === "SUCCEEDED" || status === "PARTIALLY_SUCCEEDED") && outputs.length === 0) {
    status = "FAILED";
    errors.push(diagnostic({ code: C.OUTPUT_NOT_FOUND, message: "Provider reported success without an image output." }, "NORMALIZER", "ERROR"));
  }
  const now = clock().toISOString();
  const result = {
    schema_version: "1.0.0",
    generation_id: generationId,
    project_id: compiledRequest.project_id,
    run_id: compiledRequest.run_id,
    request_ref: { artifact_id: compiledRequest.request_id, artifact_version: compiledRequest.schema_version, artifact_uri: `artifact://compiled-generation-request/${compiledRequest.request_id}/${compiledRequest.schema_version}` },
    final_frame_spec_ref: ref(compiledRequest.final_frame_spec_ref),
    provider: {
      provider_id: providerResponse.provider?.provider_id ?? "unknown-provider",
      provider_type: providerResponse.provider?.provider_type ?? "OTHER",
      configured: providerResponse.provider?.configured ?? false,
      protocol_status: providerResponse.provider?.protocol_status ?? "NOT_CONFIGURED"
    },
    model: { family: "NANO_BANANA", name: providerResponse.model?.name ?? semanticRequest.model.name },
    generation_mode: compiledRequest.generation_mode,
    status,
    outputs,
    provider_metadata: sanitizeProviderMetadata({
      ...(providerResponse.provider_request_id ? { provider_request_id: providerResponse.provider_request_id } : {}),
      ...(providerResponse.provider_generation_id ? { provider_generation_id: providerResponse.provider_generation_id } : {}),
      ...(providerResponse.raw_status ? { raw_status: providerResponse.raw_status } : {}),
      model_name: providerResponse.model?.name ?? semanticRequest.model.name,
      response_metadata: providerResponse.response_metadata ?? {}
    }),
    timing: {
      requested_at: providerResponse.timing?.requested_at ?? null,
      started_at: providerResponse.timing?.started_at ?? null,
      completed_at: providerResponse.timing?.completed_at ?? now,
      duration_ms: providerResponse.timing?.duration_ms ?? null
    },
    usage: sanitizeProviderMetadata(providerResponse.usage ?? {}),
    warnings,
    errors,
    provenance: { producer: "GENERATION_SERVICE", producer_version: producerVersion, created_at: now, sources: ["COMPILED_GENERATION_REQUEST", "NANO_BANANA_SEMANTIC_ADAPTER", "PROVIDER_TRANSPORT"] },
    trace: { adapter_id: semanticRequest.trace.adapter_id, transport_id: transportId, semantic_request_id: semanticRequest.semantic_request_id, creative_authority: "NONE", provider_configured: providerResponse.provider?.configured ?? false }
  };
  const validation = validateArtifact("generation_result", result);
  if (!validation.valid) throw new GenerationError(C.INVALID_GENERATION_RESULT, "Normalized Generation Result failed schema validation.", { schema_errors: validation.errors });
  return result;
}
