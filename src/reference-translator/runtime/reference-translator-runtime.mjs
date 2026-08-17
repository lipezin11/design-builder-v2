import crypto from "node:crypto";
import { validateArtifact } from "../../compiler/schema-validator.mjs";
import { buildReferenceTranslatorContext } from "../context/reference-translator-context-builder.mjs";
import { REFERENCE_TRANSLATOR_ERROR_CODES as C, ReferenceTranslatorError } from "../reference-translator-errors.mjs";
import { buildReferenceTranslatorPromptRequest, REFERENCE_TRANSLATOR_PROMPT_VERSION } from "../prompt/reference-translator-prompt-builder.mjs";
import { parseReferenceTransferPlan } from "../parsing/reference-transfer-plan-parser.mjs";
import { assertReferenceTransferPlan } from "../validation/reference-transfer-plan-validator.mjs";
import { REFERENCE_TRANSFER_PLAN_SCHEMA_METADATA } from "../validation/schema-correction-diagnostic-builder.mjs";

export const REFERENCE_TRANSLATOR_RUNTIME_VERSION = "1.0.0";
export const REFERENCE_TRANSLATOR_SCHEMA_CORRECTION_PROTOCOL_VERSION = "1.0.0";
const allowedAssetKeys = new Set([
  "asset_id", "role", "visual_access", "visually_accessible", "mime_type", "uri", "bytes_base64",
  "product_category", "product_support_observation_ids", "literal_support_elements",
  "visible_reference_text", "brand_markers", "reference_subject_identities",
  "synthetic_observations", "notes"
]);

const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
};
const sha256 = (value) => crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const event = (state, clock, details = {}) => ({ state, at: clock().toISOString(), ...details });
const valuesFrom = (items = []) => items.flatMap((item) => {
  if (typeof item === "string") return [item];
  if (!item || typeof item !== "object") return [];
  return [item.semantic_id, item.element, item.target, item.value].filter((value) => typeof value === "string");
});

function diagnosticStage(errorCode, diagnostic) {
  if (diagnostic?.stage) return diagnostic.stage;
  if (errorCode === C.REFERENCE_PLAN_SCHEMA_INVALID) return "SCHEMA";
  if (errorCode === C.REFERENCE_PLAN_SEMANTIC_INVALID) return "SEMANTIC";
  if (errorCode === C.REFERENCE_PLAN_QUALITY_INVALID) return "QUALITY";
  if (errorCode === C.MODEL_OUTPUT_INVALID_JSON) return "JSON_PARSE";
  return "MODEL";
}

function traceDiagnosticSummary(diagnostic, errorCode) {
  const summary = {
    stage: diagnosticStage(errorCode, diagnostic),
    path: diagnostic?.path ?? "",
    keyword: diagnostic?.keyword ?? null,
    diagnostic_code: diagnostic?.code ?? errorCode
  };
  if (diagnostic?.schema_path) summary.schema_path = diagnostic.schema_path;
  if (Array.isArray(diagnostic?.allowed_values)) summary.allowed_values = structuredClone(diagnostic.allowed_values);
  if (Number.isInteger(diagnostic?.allowed_values_count)) summary.allowed_values_count = diagnostic.allowed_values_count;
  if (Object.prototype.hasOwnProperty.call(diagnostic ?? {}, "received_value")) summary.received_value = structuredClone(diagnostic.received_value);
  if (diagnostic?.received_type) summary.received_type = diagnostic.received_type;
  if (diagnostic?.expected_type !== undefined) summary.expected_type = structuredClone(diagnostic.expected_type);
  if (diagnostic?.required_property) summary.required_property = diagnostic.required_property;
  if (diagnostic?.additional_property) summary.additional_property = diagnostic.additional_property;
  if (diagnostic?.required_value !== undefined) summary.required_value = structuredClone(diagnostic.required_value);
  if (Number.isInteger(diagnostic?.limit)) summary.limit = diagnostic.limit;
  return summary;
}

function contextReady(context) {
  if (context?.context_type === "REFERENCE_TRANSLATOR_READINESS_CONTEXT") return structuredClone(context);
  return buildReferenceTranslatorContext(context);
}

function validateAssets(referenceAssets, briefSpec, modelAdapter, targetProductCategory) {
  if (!Array.isArray(referenceAssets)) throw new ReferenceTranslatorError(C.REFERENCE_CONTEXT_INVALID, "reference_assets must be an array.");
  const ids = new Set();
  for (const [index, asset] of referenceAssets.entries()) {
    if (!asset || typeof asset !== "object" || Array.isArray(asset)) throw new ReferenceTranslatorError(C.REFERENCE_CONTEXT_INVALID, "Each reference asset must be an object.", { index });
    const unknown = Object.keys(asset).filter((key) => !allowedAssetKeys.has(key));
    if (unknown.length) throw new ReferenceTranslatorError(C.REFERENCE_CONTEXT_INVALID, "Reference asset contains unsupported fields.", { index, unknown });
    if (typeof asset.asset_id !== "string" || !asset.asset_id.trim() || ids.has(asset.asset_id)) throw new ReferenceTranslatorError(C.REFERENCE_CONTEXT_INVALID, "Reference assets require unique non-empty asset_id values.", { index, asset_id: asset.asset_id });
    ids.add(asset.asset_id);
    if (asset.visually_accessible === false) throw new ReferenceTranslatorError(C.REFERENCE_VISUAL_CONTENT_UNAVAILABLE, "Declared reference visual content is unavailable.", { asset_id: asset.asset_id });
    if (!["MULTIMODAL", "STRUCTURED_TEST"].includes(asset.visual_access)) throw new ReferenceTranslatorError(C.REFERENCE_VISUAL_CONTENT_UNAVAILABLE, "Reference asset requires explicit MULTIMODAL or STRUCTURED_TEST visual access.", { asset_id: asset.asset_id });
    if (asset.visual_access === "MULTIMODAL" && !asset.uri && !asset.bytes_base64) throw new ReferenceTranslatorError(C.REFERENCE_VISUAL_CONTENT_UNAVAILABLE, "Multimodal reference requires image URI or bytes.", { asset_id: asset.asset_id });
    if (asset.visual_access === "MULTIMODAL" && modelAdapter?.supportsImages === false) throw new ReferenceTranslatorError(C.REFERENCE_VISUAL_CONTENT_UNAVAILABLE, "Configured cognitive model adapter cannot access image inputs.", { asset_id: asset.asset_id });
    if (asset.visual_access === "STRUCTURED_TEST" && (!Array.isArray(asset.synthetic_observations) || !asset.synthetic_observations.length)) throw new ReferenceTranslatorError(C.REFERENCE_VISUAL_CONTENT_UNAVAILABLE, "Structured test reference requires explicit synthetic observations.", { asset_id: asset.asset_id });
    if ((asset.product_support_observation_ids?.length ?? 0) && asset.product_category && !targetProductCategory) throw new ReferenceTranslatorError(C.REFERENCE_CONTEXT_INVALID, "target_product_category is required for cross-category support-element analysis.", { asset_id: asset.asset_id });
  }
  const expected = Boolean(briefSpec.pipeline_hints?.has_reference || briefSpec.pipeline_hints?.requires_reference_translator);
  if (expected && referenceAssets.length === 0) throw new ReferenceTranslatorError(C.REFERENCE_VISUAL_CONTENT_UNAVAILABLE, "Brief requires a reference but no accessible reference asset was supplied.");
  if (!expected && referenceAssets.length > 0) throw new ReferenceTranslatorError(C.REFERENCE_CONTEXT_INVALID, "Brief is in no-reference mode but reference assets were supplied.");
}

function noReferencePlan({ briefSpec, readiness, runId, projectId, targetProductCategory, clock }) {
  const base = briefSpec.assets.find((asset) => !["PRIMARY_REFERENCE", "SECONDARY_REFERENCE"].includes(asset.role));
  const protectedElements = [...new Set([
    ...valuesFrom(readiness.protected_semantics),
    ...valuesFrom(readiness.identity_constraints),
    ...(briefSpec.preservation_requirements ?? []).map((item) => item.element)
  ])];
  const requiredCopy = Object.values(briefSpec.copy ?? {}).flatMap((value) => typeof value === "string" ? [value] : Array.isArray(value) ? value.filter((item) => typeof item === "string") : []);
  return {
    schema_version: "1.0.0",
    plan_id: `rtp-${runId}`,
    project_id: projectId,
    brief_spec_version: briefSpec.schema_version,
    status: "READY_FOR_DIRECTOR",
    transfer_mode: "STANDARD_REFERENCE_TRANSFER",
    transfer_intensity: { value: "NONE", source: "DEFAULT", confidence: "HIGH" },
    base_analysis: {
      base_asset_id: base?.asset_id ?? null,
      semantic_identity: targetProductCategory ?? briefSpec.project_type,
      protected_elements: protectedElements,
      required_copy: requiredCopy,
      subject_identity_requirements: briefSpec.subject?.recognizability_required ? "Preserve supplied subject identity." : "No subject identity requirement.",
      existing_composition_constraints: [briefSpec.format?.aspect_ratio, briefSpec.format?.orientation].filter(Boolean),
      elements_allowed_to_change: (briefSpec.allowed_transformations ?? []).map((item) => item.transformation),
      elements_forbidden_to_change: (briefSpec.forbidden_transformations ?? []).map((item) => item.transformation)
    },
    reference_analyses: [],
    design_decision_map: [],
    conflicts: [],
    non_negotiable_anchors: [],
    flexible_areas: [{ area: "reference influence", freedom_level: "VERY_HIGH", rationale: "No reference was supplied; downstream creative authority remains unconstrained by reference DNA." }],
    risks: [],
    open_questions: [],
    provenance: { translator_version: REFERENCE_TRANSLATOR_RUNTIME_VERSION, created_at: clock().toISOString(), notes: "Deterministic no-reference result; no visual interpretation was claimed." },
    confidence: { overall: "HIGH", rationale: "Absence of reference input is explicit in the validated Brief Spec." },
    director_handoff: {
      what_must_survive: protectedElements,
      what_should_survive: [],
      what_can_change: ["All areas not protected by the Brief Spec remain for the future Creative Director."],
      key_conflicts: [],
      recommended_anchors: [],
      creative_opportunities: [],
      warnings: ["No reference-derived decision should be inferred downstream."]
    }
  };
}

function traceBase({ runId, inputHash, readiness, referenceAssets, modelAdapter, clock }) {
  return {
    trace_version: "1.0.0",
    run_id: runId,
    runtime_version: REFERENCE_TRANSLATOR_RUNTIME_VERSION,
    prompt_version: REFERENCE_TRANSLATOR_PROMPT_VERSION,
    schema_contract: structuredClone(REFERENCE_TRANSFER_PLAN_SCHEMA_METADATA),
    schema_correction_protocol_version: REFERENCE_TRANSLATOR_SCHEMA_CORRECTION_PROTOCOL_VERSION,
    input_mode: referenceAssets.some((asset) => asset.visual_access === "MULTIMODAL") ? "MULTIMODAL" : "STRUCTURED_TEST",
    status: "RUNNING",
    started_at: clock().toISOString(),
    completed_at: null,
    input_hash: inputHash,
    input_artifacts: {
      context_id: readiness.context_id,
      brief_ref: structuredClone(readiness.brief_ref),
      reference_asset_refs: referenceAssets.map((asset) => ({ asset_id: asset.asset_id, visual_access: asset.visual_access })),
      advisory_refs: [readiness.advisory.my_eyes?.query_id, readiness.advisory.vkb?.query_id].filter(Boolean)
    },
    model_adapter_id: modelAdapter?.adapterId ?? "DETERMINISTIC_NO_REFERENCE",
    provider: modelAdapter ? { provider_id: modelAdapter.providerId ?? "UNSPECIFIED", model: modelAdapter.model ?? "UNSPECIFIED" } : null,
    attempts: [],
    events: [],
    validation_outcomes: [],
    output_plan_id: null,
    structured_decision_summary: [],
    warnings: [],
    hidden_reasoning_persisted: false
  };
}

function persistFailure(store, trace, clock, error) {
  if (!store) return;
  trace.status = "FAILED";
  trace.completed_at = clock().toISOString();
  trace.events.push(event("FAILED", clock, { code: error.code }));
  try { store.saveTrace(trace); } catch { /* preserve the primary typed error */ }
}

export async function executeReferenceTranslator({
  context,
  brief_spec,
  reference_assets = [],
  model_adapter,
  run_options = {},
  store
}) {
  const clock = run_options.clock ?? (() => new Date());
  const runId = run_options.run_id;
  const projectId = run_options.project_id;
  const maxAttempts = run_options.max_attempts ?? 3;
  if (typeof runId !== "string" || !runId.trim() || typeof projectId !== "string" || !projectId.trim()) throw new ReferenceTranslatorError(C.REFERENCE_CONTEXT_INVALID, "run_options.run_id and run_options.project_id are required.");
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 3) throw new ReferenceTranslatorError(C.REFERENCE_CONTEXT_INVALID, "run_options.max_attempts must be an integer from 1 to 3.");

  const briefSpec = structuredClone(brief_spec);
  const referenceAssets = structuredClone(reference_assets);
  const readiness = contextReady(structuredClone(context));
  const briefValidation = validateArtifact("brief_spec", briefSpec);
  if (!briefValidation.valid) throw new ReferenceTranslatorError(C.REFERENCE_CONTEXT_INVALID, "Brief Spec failed schema validation.", { schema_errors: briefValidation.errors });
  if (readiness.brief_ref.schema_version !== briefSpec.schema_version) throw new ReferenceTranslatorError(C.REFERENCE_CONTEXT_INVALID, "Readiness context and Brief Spec versions do not match.");

  const targetProductCategory = run_options.target_product_category ?? readiness.reference_context?.target_product_category;
  validateAssets(referenceAssets, briefSpec, model_adapter, targetProductCategory);
  if (referenceAssets.length && (!model_adapter || typeof model_adapter.invoke !== "function")) throw new ReferenceTranslatorError(C.REFERENCE_CONTEXT_INVALID, "model_adapter is required when references are supplied.");

  const inputHash = sha256({ readiness, briefSpec, referenceAssets, projectId, targetProductCategory });
  const previous = store?.loadRun(runId);
  if (previous) {
    if (previous.input_hash !== inputHash || !previous.output_plan_id) throw new ReferenceTranslatorError(C.REFERENCE_RUN_IDEMPOTENCY_CONFLICT, "Run ID already exists with different input or without a completed plan.", { run_id: runId });
    return { plan: store.loadPlan(previous.output_plan_id), trace: previous, persistence: { idempotent_replay: true }, idempotent_replay: true };
  }

  const trace = traceBase({ runId, inputHash, readiness, referenceAssets, modelAdapter: model_adapter, clock });
  trace.events.push(event("CONTEXT_VALIDATED", clock));

  const validationContext = {
    briefSpec,
    referenceAssets,
    targetProductCategory,
    projectId,
    protectedSemantics: readiness.protected_semantics,
    identityConstraints: readiness.identity_constraints
  };

  if (!referenceAssets.length) {
    const plan = noReferencePlan({ briefSpec, readiness, runId, projectId, targetProductCategory, clock });
    const outcomes = assertReferenceTransferPlan(plan, validationContext);
    trace.events.push(event("SCHEMA_VALIDATED", clock), event("SEMANTIC_VALIDATED", clock), event("QUALITY_VALIDATED", clock));
    trace.validation_outcomes.push({ attempt: 0, schema: outcomes.schema.valid, semantic: outcomes.semantic.valid, quality: outcomes.quality.valid });
    trace.output_plan_id = plan.plan_id;
    trace.status = "COMPLETE";
    trace.completed_at = clock().toISOString();
    trace.events.push(event("COMPLETE", clock));
    const persistence = store ? store.saveExecution(plan, trace) : { persisted: false };
    return { plan: structuredClone(plan), trace: structuredClone(trace), persistence, idempotent_replay: false };
  }

  let lastError;
  let correctionDiagnostics = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const attemptTrace = { attempt, status: "RUNNING", error_code: null, diagnostic_codes: [], diagnostic_summaries: [], request_measurement: null, model_invocation: null, raw_candidate: null };
    trace.attempts.push(attemptTrace);
    try {
      const request = buildReferenceTranslatorPromptRequest({ readinessContext: readiness, briefSpec, referenceAssets, targetProductCategory, projectId, runId, attempt, correctionDiagnostics });
      if (typeof model_adapter.measureRequest === "function") attemptTrace.request_measurement = structuredClone(model_adapter.measureRequest(request));
      trace.events.push(event("PROMPT_ASSEMBLED", clock, { attempt }), event("MODEL_INVOKED", clock, { attempt }));
      let response;
      try { response = await model_adapter.invoke(request); }
      catch (error) {
        if (error instanceof ReferenceTranslatorError) throw error;
        throw new ReferenceTranslatorError(C.MODEL_INVOCATION_FAILED, "Cognitive model invocation failed.", { cause: error.message }, { retryable: true });
      }
      if (typeof model_adapter.getLastInvocationMetadata === "function") attemptTrace.model_invocation = model_adapter.getLastInvocationMetadata();
      if (store && typeof store.saveRawCandidate === "function") {
        attemptTrace.raw_candidate = store.saveRawCandidate({ runId, attempt, candidate: response, createdAt: clock().toISOString() });
        trace.events.push(event("RAW_CANDIDATE_PERSISTED", clock, { attempt, path: attemptTrace.raw_candidate.raw_candidate_path, status: attemptTrace.raw_candidate.status }));
      }
      const plan = parseReferenceTransferPlan(response);
      trace.events.push(event("OUTPUT_PARSED", clock, { attempt }));
      const outcomes = assertReferenceTransferPlan(plan, validationContext);
      if (attemptTrace.raw_candidate && typeof store?.markCandidateAccepted === "function") {
        attemptTrace.raw_candidate = store.markCandidateAccepted({ runId, attempt, acceptedAt: clock().toISOString() });
        trace.events.push(event("CANDIDATE_ACCEPTED", clock, { attempt, path: attemptTrace.raw_candidate.raw_candidate_path, status: attemptTrace.raw_candidate.status }));
      }
      trace.events.push(event("SCHEMA_VALIDATED", clock, { attempt }), event("SEMANTIC_VALIDATED", clock, { attempt }), event("QUALITY_VALIDATED", clock, { attempt }));
      trace.validation_outcomes.push({ attempt, schema: outcomes.schema.valid, semantic: outcomes.semantic.valid, quality: outcomes.quality.valid });
      attemptTrace.status = "PASS";
      trace.output_plan_id = plan.plan_id;
      trace.structured_decision_summary = plan.design_decision_map.map((item) => ({ mapping_id: item.mapping_id, action: item.action, source_reference_asset_id: item.source_reference_asset_id, observation_ids: item.observation_ids }));
      trace.warnings = outcomes.quality.diagnostics.filter((item) => item.severity === "WARNING").map((item) => ({ code: item.code, message: item.message }));
      trace.status = "COMPLETE";
      trace.completed_at = clock().toISOString();
      trace.events.push(event("PLAN_PERSISTED", clock, { pending_store: Boolean(store) }), event("COMPLETE", clock));
      const persistence = store ? store.saveExecution(plan, trace) : { persisted: false };
      return { plan: structuredClone(plan), trace: structuredClone(trace), persistence, idempotent_replay: false };
    } catch (error) {
      if (typeof model_adapter.getLastInvocationMetadata === "function") attemptTrace.model_invocation = model_adapter.getLastInvocationMetadata();
      lastError = error instanceof ReferenceTranslatorError ? error : new ReferenceTranslatorError(C.MODEL_INVOCATION_FAILED, "Unexpected Reference Translator failure.", { cause: error.message }, { retryable: false });
      correctionDiagnostics = lastError.details?.diagnostics ?? [{ code: lastError.code, message: lastError.message }];
      attemptTrace.status = "FAIL";
      attemptTrace.error_code = lastError.code;
      attemptTrace.diagnostic_codes = correctionDiagnostics.map((item) => item.code).filter(Boolean);
      attemptTrace.diagnostic_summaries = correctionDiagnostics.map((item) => traceDiagnosticSummary(item, lastError.code));
      trace.events.push(event("ATTEMPT_FAILED", clock, { attempt, code: lastError.code }));
      if (lastError.retryable === false || attempt === maxAttempts) break;
    }
  }

  const exhausted = new ReferenceTranslatorError(C.REFERENCE_PLAN_RETRY_EXHAUSTED, "Reference Translator exhausted its correction attempts.", {
    attempts: trace.attempts,
    last_error_code: lastError?.code,
    last_diagnostics: correctionDiagnostics
  }, { retryable: false });
  persistFailure(store, trace, clock, exhausted);
  throw exhausted;
}
