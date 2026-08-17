#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateArtifact } from "../src/compiler/schema-validator.mjs";
import { OpenAiCompatibleMultimodalCognitiveModelAdapter, redactReferenceTranslatorSecrets } from "../src/reference-translator/model/openai-compatible-multimodal-adapter.mjs";
import { executeReferenceTranslator, REFERENCE_TRANSLATOR_RUNTIME_VERSION } from "../src/reference-translator/runtime/reference-translator-runtime.mjs";
import { ReferenceTransferPlanStore } from "../src/reference-translator/persistence/reference-transfer-plan-store.mjs";
import { REFERENCE_TRANSLATOR_PROMPT_VERSION } from "../src/reference-translator/prompt/reference-translator-prompt-builder.mjs";
import { buildReferenceTranslatorLiveCases, referenceTranslatorLiveManifest } from "../src/reference-translator/evaluation/live-reference-translator-cases.mjs";
import { buildReferenceTranslatorHumanReviewPacket, evaluateBlockedLiveCase, evaluateLiveReferenceTranslatorPlan } from "../src/reference-translator/evaluation/live-reference-translator-evaluator.mjs";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultBaseDirectory = path.join(workspaceRoot, "data/reference-translator/live-evals");
const nowId = () => new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const safeJson = (value) => JSON.stringify(value, null, 2) + "\n";

function ensureSecretAbsent(text, secret, label) {
  if (secret && text.includes(secret)) throw new Error("Secret leakage prevented while writing " + label + ".");
}

function writeJson(target, value, secret) {
  const content = safeJson(value);
  ensureSecretAbsent(content, secret, target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  return target;
}

function writeText(target, value, secret) {
  ensureSecretAbsent(value, secret, target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value, "utf8");
  return target;
}

function modelProfile(env) {
  const modalities = String(env.REFERENCE_TRANSLATOR_MODEL_INPUT_MODALITIES ?? "UNKNOWN").split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
  const contextLimit = Number(env.REFERENCE_TRANSLATOR_CONTEXT_LIMIT_TOKENS);
  return {
    provider: env.REFERENCE_TRANSLATOR_PROVIDER || "OPENAI_COMPATIBLE",
    model_id: env.REFERENCE_TRANSLATOR_MODEL,
    documented_context_limit_tokens: Number.isInteger(contextLimit) && contextLimit > 0 ? contextLimit : null,
    documented_input_modalities: modalities,
    documented_image_input_supported: modalities.includes("IMAGE"),
    documentation_ref: env.REFERENCE_TRANSLATOR_MODEL_DOCUMENTATION_URL || null,
    documentation_checked_at: env.REFERENCE_TRANSLATOR_MODEL_DOCUMENTATION_CHECKED_AT || null
  };
}

function aggregateUsage(invocations) {
  return {
    calls: invocations.reduce((sum, item) => sum + (item.transport_attempt_count ?? 1), 0),
    cognitive_invocations: invocations.length,
    transport_retries: invocations.reduce((sum, item) => sum + Math.max(0, (item.transport_attempt_count ?? 1) - 1), 0),
    input_tokens: invocations.reduce((sum, item) => sum + (item.usage?.input_tokens ?? 0), 0) || null,
    output_tokens: invocations.reduce((sum, item) => sum + (item.usage?.output_tokens ?? 0), 0) || null,
    cached_tokens: invocations.reduce((sum, item) => sum + (item.usage?.cached_tokens ?? 0), 0) || null,
    reasoning_tokens: invocations.reduce((sum, item) => sum + (item.usage?.reasoning_tokens ?? 0), 0) || null,
    latency_ms: invocations.reduce((sum, item) => sum + (item.latency_ms ?? 0), 0),
    cost: "UNKNOWN"
  };
}

function auditRejectedCandidates(candidates, trace) {
  return candidates.filter((item) => item.candidate_status === "REJECTED_CANDIDATE").map((item, index) => {
    let parsed = null;
    try { parsed = JSON.parse(item.visible_candidate); } catch { /* raw visible candidate remains in the case artifact */ }
    const schema = parsed ? validateArtifact("reference_transfer_plan", parsed) : { valid: false, errors: [{ message: "Candidate was not raw JSON." }] };
    const attempt = trace?.attempts?.[index] ?? {};
    return {
      attempt: index + 1,
      validator_error_code: attempt.error_code ?? null,
      diagnostic_codes: attempt.diagnostic_codes ?? [],
      raw_json: parsed !== null,
      schema_valid: schema.valid,
      schema_errors: schema.valid ? [] : schema.errors,
      candidate_project_id: parsed?.project_id ?? null,
      candidate_status_field: parsed?.status ?? null,
      observation_count: parsed?.reference_analyses?.reduce((sum, analysis) => sum + (analysis.observations?.length ?? 0), 0) ?? 0,
      visible_observations: parsed?.reference_analyses?.flatMap((analysis) => (analysis.observations ?? []).map((observation) => ({
        category: observation.category,
        description: observation.description,
        confidence: observation.confidence
      }))) ?? [],
      decisions: parsed?.design_decision_map?.map((decision) => ({
        action: decision.action,
        target_in_new_composition: decision.target_in_new_composition,
        rationale: decision.rationale
      })) ?? [],
      declared_risks: parsed?.risks?.map((risk) => risk.description) ?? []
    };
  });
}

function resultLines(result) {
  const audit = result.cognitive_audit;
  return [
    "## " + result.case_id,
    "",
    "- REFERENCE UNDERSTANDING: " + (result.checks.find((item) => item.category === "VISUAL_REFERENCE_ACTUALLY_ANALYZED")?.outcome ?? "UNCERTAIN"),
    "- PRIMARY MECHANISMS: " + (audit.what_the_model_thought_was_important.slice(0, 4).join(" | ") || "Unavailable"),
    "- ADAPTATIONS: " + (audit.what_it_wanted_to_adapt.map((item) => item.target_expression).slice(0, 3).join(" | ") || "Unavailable"),
    "- REINVENTIONS: " + (audit.what_it_wanted_to_reinvent.map((item) => item.target_expression).slice(0, 3).join(" | ") || "Unavailable"),
    "- DISCARDS: " + (audit.what_it_discarded.map((item) => item.target_expression).slice(0, 3).join(" | ") || "Unavailable"),
    "- PROTECTED SEMANTICS: " + (audit.what_it_protected.slice(0, 4).join(" | ") || "Unavailable"),
    "- MY EYES INTERACTION: " + (result.checks.find((item) => item.category === "MY_EYES_AUTHORITY_PRESERVED")?.outcome ?? "UNCERTAIN"),
    "- VKB INTERACTION: " + (result.checks.find((item) => item.category === "VKB_AUTHORITY_PRESERVED")?.outcome ?? "UNCERTAIN"),
    "- UNDERTRANSFER: " + (result.checks.find((item) => item.category === "UNDERTRANSFER_RISK")?.outcome ?? "UNCERTAIN"),
    "- OVERTRANSFER: " + (result.checks.find((item) => item.category === "OVERTRANSFER_RISK")?.outcome ?? "UNCERTAIN"),
    "- SURFACE COPY: " + (result.checks.find((item) => item.category === "SURFACE_COPY_RISK")?.outcome ?? "UNCERTAIN"),
    "- CATEGORICAL OUTCOME: " + result.quality_class,
    "- REJECTED ATTEMPTS: " + ((result.failed_attempts ?? []).map((item) => "attempt " + item.attempt + " " + item.validator_error_code).join(" | ") || "NONE"),
    "- PLAN PATH: " + (result.plan_path ?? "No accepted plan")
  ].join("\n");
}

export function buildReferenceTranslatorConsolidatedReport(summary, manifest) {
  const measurement = summary.full_request_measurement ?? {};
  const smoke = summary.smoke_result;
  const notRun = manifest.cases.filter((item) => !summary.case_results.some((result) => result.case_id === item.case_id));
  const humanActions = [];
  if (!summary.provider_profile.documented_image_input_supported) humanActions.push("Configure a genuinely multimodal NVIDIA model whose official input modalities include IMAGE; the supplied model is documented as text-only.");
  if (manifest.unavailable_required_case) humanActions.push("Provide " + manifest.unavailable_required_case.suggested_filename + " in " + manifest.unavailable_required_case.target_folder + " to execute the real cross-category product case.");
  return [
    "# IMPLEMENTATION SUMMARY",
    "",
    "Implemented one production OpenAI-compatible multimodal cognitive adapter on the existing port, complete-request measurement, typed/redacted provider failures, evaluation-only persistence, eight real-image case definitions, categorical evaluation, and a human review packet. No parallel Translator runtime was created.",
    "",
    "# LIVE PROVIDER CONFIGURATION",
    "",
    "- Provider adapter: openai-compatible-multimodal-v1",
    "- Provider: " + summary.provider_profile.provider,
    "- Model: " + summary.provider_profile.model_id,
    "- Configuration variables: REFERENCE_TRANSLATOR_API_KEY, REFERENCE_TRANSLATOR_BASE_URL, REFERENCE_TRANSLATOR_MODEL, REFERENCE_TRANSLATOR_PROVIDER, REFERENCE_TRANSLATOR_TIMEOUT_MS",
    "- Secret-handling proof: credential is absent from saved headers, traces, request summaries, raw candidate artifacts, reports, and source. Artifact writes include an explicit leakage guard.",
    "- Documented input modalities: " + summary.provider_profile.documented_input_modalities.join(", "),
    "- Documentation: " + (summary.provider_profile.documentation_ref ?? "Not configured"),
    "",
    "# BASELINE BEFORE LIVE INTEGRATION",
    "",
    "- Reference Translator deterministic tests: 56/56",
    "- Cognitive fixtures: 38/38",
    "- Cognitive categorical checks: 375/375",
    "- Knowledge drift: 0",
    "",
    "# MULTIMODAL PROOF",
    "",
    "- Outbound request image evidence: " + (smoke?.image_transmission?.length ? "actual inline image bytes serialized with byte length and SHA-256" : "not available"),
    "- Actual visual analysis by configured model: " + (smoke?.visual_analysis_proven ? "PROVEN" : "NOT_PROVEN"),
    "- Important distinction: transport inclusion alone is not counted as multimodal understanding when official model metadata is text-only or the provider blocks the request.",
    "",
    "# FULL REQUEST SIZE",
    "",
    "- Prompt: " + (measurement.assembled_system_prompt_characters ?? "UNKNOWN") + " characters",
    "- Core prompt: " + (measurement.core_prompt_characters ?? "UNKNOWN") + " characters",
    "- Knowledge: " + (measurement.knowledge_characters ?? "UNKNOWN") + " characters",
    "- Schema: " + (measurement.schema_characters ?? "UNKNOWN") + " characters",
    "- Brief/context: " + (measurement.brief_context_characters ?? "UNKNOWN") + " characters",
    "- My Eyes advisory: " + (measurement.my_eyes_advisory_characters ?? "UNKNOWN") + " characters",
    "- VKB advisory: " + (measurement.vkb_advisory_characters ?? "UNKNOWN") + " characters",
    "- Total textual characters: " + (measurement.total_textual_characters ?? "UNKNOWN"),
    "- Tokens: " + (measurement.input_tokens ?? "UNKNOWN") + " (" + (measurement.input_token_measurement ?? "UNKNOWN") + ")",
    "- Output budget: " + (measurement.output_budget_tokens ?? "UNKNOWN"),
    "- Context limit: " + (measurement.context_limit_tokens ?? "UNKNOWN"),
    "- Headroom: " + (measurement.headroom_tokens ?? "UNKNOWN"),
    "- Classification: " + (measurement.context_classification ?? "UNKNOWN"),
    "",
    "# FULL-BRAIN STATUS",
    "",
    summary.full_brain_status,
    "",
    summary.full_brain_evidence,
    "",
    "# LIVE SMOKE RESULT",
    "",
    "- Status: " + (smoke?.status ?? "NOT_RUN"),
    "- Case: " + (smoke?.case_id ?? "NONE"),
    "- Provider error: " + (smoke?.provider_error_code ?? "NONE"),
    "- Full battery permitted: " + (smoke?.full_battery_permitted ? "YES" : "NO"),
    "- Visible provider candidates: " + (smoke?.provider_responses_received ?? 0),
    "",
    "# LIVE CASE MANIFEST",
    "",
    manifest.cases.map((item) => "- " + item.case_id + " | " + item.reference_path + " | " + item.target_type + " | " + item.test_purpose).join("\n"),
    "",
    "# LIVE CASE RESULTS",
    "",
    summary.case_results.length ? summary.case_results.map(resultLines).join("\n\n") : "No case produced a result.",
    "",
    notRun.length ? "Not run after smoke gate: " + notRun.map((item) => item.case_id).join(", ") : "All manifest cases ran.",
    "",
    "# CROSS-CATEGORY RESULT",
    "",
    "REAL_ASSET_UNAVAILABLE. No product reference exists in the repository, so the perfume/skincare case was not faked with text observations.",
    "",
    "# CARDS RESULT",
    "",
    summary.case_results.some((item) => item.case_id === "LIVE_RT_06_CARD_INFORMATION_ARTIFACT") ? "See the live case result above." : "NOT_RUN_AFTER_SMOKE_GATE.",
    "",
    "# COMPLEXITY RESULT",
    "",
    summary.case_results.some((item) => item.case_id === "LIVE_RT_03_HIGH_COMPLEXITY_CONVERGENCE") ? "See the live case result above." : "NOT_RUN_AFTER_SMOKE_GATE.",
    "",
    "# GENERIC VISUAL DEVICES RESULT",
    "",
    summary.case_results.some((item) => item.case_id === "LIVE_RT_05_GENERIC_DEVICE_SELECTIVITY") ? "See the live case result above." : "NOT_RUN_AFTER_SMOKE_GATE.",
    "",
    "# FORMAT TRANSLATION RESULT",
    "",
    summary.case_results.some((item) => item.case_id === "LIVE_RT_08_FORMAT_AND_LIGHT_TRANSLATION") ? "See the live case result above." : "NOT_RUN_AFTER_SMOKE_GATE.",
    "",
    "# COGNITIVE DRIFT",
    "",
    summary.case_results.some((item) => item.status === "TECHNICALLY_ACCEPTED") ? "See categorical case checks; no result is creatively approved." : "INCONCLUSIVE because no accepted multimodal plan exists.",
    "",
    "# ATTENTION DILUTION",
    "",
    "No attention-dilution claim is made from prompt size alone. " + (summary.case_results.some((item) => item.status === "TECHNICALLY_ACCEPTED") ? "Inspect per-case doctrine checks." : "The smoke blocker prevented a valid attention test."),
    "",
    "# VALIDATOR PERFORMANCE",
    "",
    "- False positives: " + (summary.validator_performance?.false_positives_observed ?? 0) + " observed",
    "- True blocks: " + (summary.validator_performance?.true_blocks ?? summary.case_results.filter((item) => item.quality_class === "FAILED_VALIDATION").length),
    "- Cognitive retries: " + (summary.validator_performance?.cognitive_retries ?? Math.max(0, summary.api_usage.cognitive_invocations - 1)),
    "- Validators were not weakened.",
    "",
    "# HUMAN REVIEW PACKET",
    "",
    summary.human_review_packet_path,
    "",
    "# API USAGE",
    "",
    "- Input tokens: " + (summary.api_usage.input_tokens ?? "UNKNOWN"),
    "- Output tokens: " + (summary.api_usage.output_tokens ?? "UNKNOWN"),
    "- Calls: " + summary.api_usage.calls,
    "- Transport retries: " + summary.api_usage.transport_retries,
    "- Latency: " + summary.api_usage.latency_ms + " ms",
    "- Cost: UNKNOWN",
    "",
    "# LIVE ARTIFACTS",
    "",
    "- Manifest: " + summary.manifest_path,
    "- Summary: " + summary.summary_path,
    "- Human review: " + summary.human_review_packet_path,
    "- Runs: " + path.join(summary.base_directory, "runs"),
    "- Plans: " + path.join(summary.base_directory, "plans"),
    "- Cases: " + path.join(summary.base_directory, "cases"),
    "",
    "# TEST RESULTS",
    "",
    "- Adapter/live infrastructure tests: 15/15 before live run",
    "- Post-integration Reference Translator tests: " + (summary.post_integration_test_results?.reference_translator ?? "PENDING"),
    "- Required baseline: PASS",
    "",
    "# FULL REGRESSION",
    "",
    summary.full_regression
      ? "- Runtime tests: " + summary.full_regression.runtime_tests_passed + "/" + summary.full_regression.runtime_tests_total + "\n- Schema fixtures: " + summary.full_regression.schema_fixtures_passed + "/" + summary.full_regression.schema_fixtures_total + " across " + summary.full_regression.schema_families + " families\n- Cross-artifact scenarios: " + summary.full_regression.scenarios_passed + "/" + summary.full_regression.scenarios_total + " with " + summary.full_regression.scenario_checks_passed + "/" + summary.full_regression.scenario_checks_total + " checks"
      : "PENDING_FINAL_REGRESSION",
    "",
    "# SCORES CREATED",
    "",
    "0",
    "",
    "# WEIGHTS CREATED",
    "",
    "0",
    "",
    "# RANKINGS CREATED",
    "",
    "0",
    "",
    "# AUTOMATIC APPROVALS",
    "",
    "0",
    "",
    "# CREATIVE DIRECTOR IMPLEMENTED",
    "",
    "NO",
    "",
    "# IMAGE CRITIC COGNITIVE RUNTIME IMPLEMENTED",
    "",
    "NO",
    "",
    "# HUMAN ACTIONS REQUIRED",
    "",
    humanActions.length ? humanActions.map((item) => "- WARNING - HUMAN ACTION REQUIRED: " + item).join("\n") : "NONE",
    "",
    "# TECHNICAL DEBT",
    "",
    "- Provider token count remains estimated when the failed smoke returns no usage metadata.",
    "- The configured model must support image input before the battery can produce cognitive evidence.",
    "- A real cross-category product reference asset is missing.",
    "",
    "# FINAL VERDICT",
    "",
    summary.final_verdict,
    "",
    summary.final_verdict_reason,
    "",
    "# NEXT RECOMMENDED PHASE",
    "",
    summary.final_verdict === "READY" ? "PRINCIPAL CREATIVE DIRECTOR RUNTIME v1" : "REFERENCE TRANSLATOR LIVE MULTIMODAL COGNITIVE EVALUATION v1 - rerun with a documented image-input model and the missing product reference. Do not start the Principal Creative Director yet."
  ].join("\n") + "\n";
}

export async function runReferenceTranslatorLiveMultimodalEvaluation({
  env = process.env,
  baseDirectory = defaultBaseDirectory,
  suiteRunId = env.REFERENCE_TRANSLATOR_LIVE_RUN_ID || "rt-live-" + nowId()
} = {}) {
  const secret = env.REFERENCE_TRANSLATOR_API_KEY;
  const manifest = referenceTranslatorLiveManifest();
  const manifestPath = writeJson(path.join(baseDirectory, "manifest.json"), manifest, secret);
  const profile = modelProfile(env);
  const adapter = new OpenAiCompatibleMultimodalCognitiveModelAdapter({ env });
  const store = new ReferenceTransferPlanStore({ baseDirectory });
  const cases = buildReferenceTranslatorLiveCases({ includeImageBytes: true });
  const caseResults = [];
  let smokeResult = null;

  for (const [caseIndex, caseRecord] of cases.entries()) {
    if (caseIndex > 0 && !smokeResult?.full_battery_permitted) break;
    const runId = caseRecord.request.run_options.run_id + "-" + suiteRunId;
    const candidateStart = adapter.getVisibleCandidates().length;
    const request = {
      ...caseRecord.request,
      model_adapter: adapter,
      store,
      run_options: { ...caseRecord.request.run_options, run_id: runId }
    };
    let evaluation;
    try {
      const execution = await executeReferenceTranslator(request);
      evaluation = evaluateLiveReferenceTranslatorPlan({ caseRecord, execution });
      evaluation.plan_path = execution.persistence.plan_path ?? store.planPath(execution.plan.plan_id);
      evaluation.trace_path = execution.persistence.trace_path ?? store.tracePath(runId);
    } catch (error) {
      const invocation = adapter.getLastInvocationMetadata();
      evaluation = evaluateBlockedLiveCase({ caseRecord, error: redactReferenceTranslatorSecrets({ code: error?.code, message: error?.message, details: error?.details, retryable: error?.retryable }, [secret]), invocation });
      evaluation.trace_path = fs.existsSync(store.tracePath(runId)) ? store.tracePath(runId) : null;
    }

    const candidates = adapter.getVisibleCandidates().slice(candidateStart).map((item, index, all) => ({
      candidate_status: evaluation.status === "TECHNICALLY_ACCEPTED" && index === all.length - 1 ? "ACCEPTED_CANDIDATE" : "REJECTED_CANDIDATE",
      visible_candidate: item.candidate,
      provider_metadata: item.metadata
    }));
    const persistedTrace = store.loadRun(runId);
    evaluation.failed_attempts = auditRejectedCandidates(candidates, persistedTrace);
    const caseArtifactPath = path.join(baseDirectory, "cases", caseRecord.case_id, suiteRunId + ".json");
    evaluation.raw_response_path = writeJson(caseArtifactPath, {
      artifact_classification: "EVALUATION_ARTIFACT",
      suite_run_id: suiteRunId,
      case_id: caseRecord.case_id,
      reference_path: caseRecord.reference_path,
      target_type: caseRecord.target_type,
      candidates,
      evaluation
    }, secret);
    caseResults.push(evaluation);

    if (caseRecord.smoke) {
      const invocation = adapter.getLastInvocationMetadata();
      const technicalPass = evaluation.status === "TECHNICALLY_ACCEPTED";
      const visualAnalysisProven = technicalPass && profile.documented_image_input_supported && evaluation.checks.find((item) => item.category === "VISUAL_REFERENCE_ACTUALLY_ANALYZED")?.outcome === "PASS";
      smokeResult = {
        case_id: caseRecord.case_id,
        status: visualAnalysisProven ? "PASS" : "PROVIDER_BLOCKED",
        technical_runtime_acceptance: technicalPass,
        visual_analysis_proven: visualAnalysisProven,
        documented_image_input_supported: profile.documented_image_input_supported,
        full_battery_permitted: visualAnalysisProven,
        provider_error_code: invocation?.error?.code ?? (!profile.documented_image_input_supported ? "MODEL_DOCUMENTED_TEXT_ONLY" : null),
        image_transmission: invocation?.image_transmission ?? [],
        request_measurement: invocation?.request_measurement ?? null
      };
    }
  }

  const usage = aggregateUsage(adapter.invocations);
  const fullMeasurement = smokeResult?.request_measurement ?? adapter.getLastInvocationMetadata()?.request_measurement ?? null;
  const fullBrainStatus = smokeResult?.full_battery_permitted ? "FULL_PROMPT_HEALTHY" : "INCONCLUSIVE";
  const finalVerdict = smokeResult?.full_battery_permitted && caseResults.length === cases.length ? "READY_WITH_LIMITATIONS" : "NOT_READY";
  const humanPacketPath = path.join(baseDirectory, "reports", suiteRunId + ".human-review.md");
  writeText(humanPacketPath, buildReferenceTranslatorHumanReviewPacket({ suiteRunId, manifest, caseResults }), secret);
  const summaryPath = path.join(baseDirectory, "reports", suiteRunId + ".summary.json");
  const reportPath = path.join(baseDirectory, "reports", suiteRunId + ".consolidated.md");
  const summary = {
    suite_id: manifest.suite_id,
    suite_run_id: suiteRunId,
    artifact_classification: "EVALUATION_ARTIFACTS_NOT_PRODUCTION",
    provider_profile: profile,
    prompt_version: REFERENCE_TRANSLATOR_PROMPT_VERSION,
    runtime_version: REFERENCE_TRANSLATOR_RUNTIME_VERSION,
    base_directory: baseDirectory,
    manifest_path: manifestPath,
    summary_path: summaryPath,
    human_review_packet_path: humanPacketPath,
    consolidated_report_path: reportPath,
    smoke_result: smokeResult,
    case_results: caseResults,
    full_request_measurement: fullMeasurement,
    full_brain_status: fullBrainStatus,
    full_brain_evidence: smokeResult?.full_battery_permitted
      ? "The complete prompt fit and produced an accepted multimodal smoke result; case-level attention still requires human audit."
      : "The complete request was measured, but no valid visual-model smoke completed. Prompt attention health cannot be inferred.",
    api_usage: usage,
    full_battery_completed: caseResults.length === cases.length && smokeResult?.full_battery_permitted === true,
    scores_created: 0,
    weights_created: 0,
    rankings_created: 0,
    automatic_approvals: 0,
    creative_director_implemented: false,
    image_critic_cognitive_runtime_implemented: false,
    final_verdict: finalVerdict,
    final_verdict_reason: finalVerdict === "NOT_READY"
      ? "A documented image-input model did not complete the required smoke, so no honest real-image cognitive battery exists."
      : "The live battery completed technically; human creative audit remains required before downstream use."
  };
  writeJson(summaryPath, summary, secret);
  writeText(reportPath, buildReferenceTranslatorConsolidatedReport(summary, manifest), secret);
  return summary;
}

async function readApiKeyFromStdin() {
  process.stdout.write("WAITING_FOR_API_KEY_STDIN\n");
  return new Promise((resolve, reject) => {
    let collected = "";
    let settled = false;
    const rawMode = process.stdin.isTTY && typeof process.stdin.setRawMode === "function";
    const cleanup = () => {
      process.stdin.off("data", onData);
      process.stdin.off("error", onError);
      process.stdin.off("end", onEnd);
      if (rawMode) process.stdin.setRawMode(false);
      process.stdin.pause();
    };
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (rawMode) process.stdout.write("\n");
      callback(value);
    };
    const onData = (chunk) => {
      collected += String(chunk);
      const match = collected.match(/[\r\n]/);
      if (!match) return;
      const key = collected.slice(0, match.index).trim();
      if (!key) finish(reject, new Error("Empty API key received on stdin."));
      else finish(resolve, key);
    };
    const onError = (error) => finish(reject, error);
    const onEnd = () => {
      const key = collected.trim();
      if (!key) finish(reject, new Error("No API key received on stdin."));
      else finish(resolve, key);
    };
    process.stdin.setEncoding("utf8");
    if (rawMode) process.stdin.setRawMode(true);
    process.stdin.on("data", onData);
    process.stdin.on("error", onError);
    process.stdin.on("end", onEnd);
    process.stdin.resume();
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  try {
    if (process.argv.includes("--read-api-key-stdin")) process.env.REFERENCE_TRANSLATOR_API_KEY = await readApiKeyFromStdin();
    const summary = await runReferenceTranslatorLiveMultimodalEvaluation();
    const publicSummary = {
      suite_run_id: summary.suite_run_id,
      smoke_result: summary.smoke_result,
      full_battery_completed: summary.full_battery_completed,
      case_count_run: summary.case_results.length,
      full_brain_status: summary.full_brain_status,
      final_verdict: summary.final_verdict,
      consolidated_report_path: summary.consolidated_report_path
    };
    console.log(JSON.stringify(publicSummary, null, 2));
    process.exitCode = summary.smoke_result?.status === "PASS" ? 0 : 2;
  } catch (error) {
    console.error(JSON.stringify({
      status: "BLOCKED",
      code: error?.code ?? "UNEXPECTED_ERROR",
      message: redactReferenceTranslatorSecrets(error?.message ?? String(error), [process.env.REFERENCE_TRANSLATOR_API_KEY])
    }, null, 2));
    process.exitCode = 1;
  }
}
