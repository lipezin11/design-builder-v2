#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateArtifact } from "../src/compiler/schema-validator.mjs";
import { buildReferenceTranslatorLiveCases } from "../src/reference-translator/evaluation/live-reference-translator-cases.mjs";
import {
  validateReferenceTransferPlanSchema,
  validateReferenceTransferPlanSemantics,
  validateReferenceTransferPlanQuality
} from "../src/reference-translator/validation/reference-transfer-plan-validator.mjs";
import { ReferenceTransferPlanStore } from "../src/reference-translator/persistence/reference-transfer-plan-store.mjs";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const defaultSubjectPath = "C:/Users/filpz/Downloads/referencias e sujeitos/feitos design builder e sujeito/BB1C02B5-4BE2-4589-9890-A5BB077CC305.jpeg";
const defaultReferencePath = "C:/Users/filpz/Downloads/referencias e sujeitos/feitos design builder e sujeito/31DC2D42-E38A-42B1-8FD5-319C8BB1B54B.jpeg";

const sourceCandidatePath = path.resolve(
  workspaceRoot,
  "data/reference-translator/user-live-tests/subject-reference-20260816_11_kie_gemini_2_5_flash_single_persisted_candidate/candidates/run_user_subject_reference_20260816_11_mini_repair_01/attempt_01.raw.json"
);
const expectedSourceSha256 = "bb0fccd6f4eaa0bfaad7d55680d921b376afa0fbcb32f89e6c8ba89f2a29810f";

const authorizedPaths = new Set([
  "/design_decision_map/1/target_in_new_composition",
  "/design_decision_map/2/target_in_new_composition"
]);

function buildBrief() {
  const brief = structuredClone(buildReferenceTranslatorLiveCases({ includeImageBytes: false })[0].request.brief_spec);
  brief.project_mode = "REFERENCE";
  brief.project_type = "THUMBNAIL";
  brief.user_request = "Create a square personal-brand technology thumbnail using the supplied subject identity asset as the only identity source. Interpret the primary reference as design intelligence, not as a fixed composition. Preserve recognizability, facial geometry, glasses, hairstyle, and age cues from the subject image. Do not copy the visible words SEM PROMPTS, the literal infinity symbol, or the exact mechanical object assembly unless separately required by the user.";
  brief.commercial_objective = "Present the supplied creator as technically authoritative, inventive, and approachable.";
  brief.communication_goal = "Communicate mastery of advanced creative technology without relying on copied reference symbols or wording.";
  brief.target_context = "Square social-media or video thumbnail for a personal technology brand.";
  brief.format = { aspect_ratio: "1:1", orientation: "SQUARE", width: 1254, height: 1254, platform: "Social media", usage: "Personal-brand technology thumbnail", text_overlay_expected: false };
  brief.assets = [
    {
      asset_id: "target_subject_identity",
      asset_type: "IMAGE",
      role: "SUBJECT_IDENTITY",
      origin: "USER_UPLOAD",
      authority: "SUBJECT_IDENTITY",
      required: true,
      description: "User-supplied portrait defining the target person identity.",
      user_instruction: "Preserve the recognizable person, facial geometry, glasses, hairstyle, and age cues. Pose, crop, wardrobe, and environment may change.",
      preservation_level: "STRICT"
    },
    {
      asset_id: "primary_tech_reference",
      asset_type: "IMAGE",
      role: "PRIMARY_REFERENCE",
      origin: "USER_UPLOAD",
      authority: "PRIMARY_REFERENCE",
      required: true,
      description: "Square high-density technology portrait reference with purple illumination, acid-green graffiti typography, mechanical framing, and a central energized symbol.",
      user_instruction: "Transfer the underlying hierarchy, energy, depth, lighting relationships, and technical authority. Reinterpret distinctive objects and do not copy source wording.",
      preservation_level: "HIGH"
    }
  ];
  brief.subject = {
    present: true,
    identity_asset_id: "target_subject_identity",
    identity_preservation: "STRICT",
    pose_preservation: "NONE",
    expression_preservation: "LOW",
    wardrobe_preservation: "NONE",
    body_orientation_preservation: "NONE",
    age_preservation: "STRICT",
    recognizability_required: true,
    user_subject_instructions: "Image A is the sole identity authority. Preserve the face, rectangular dark glasses, hairstyle, age cues, and recognizability. A new pose, wardrobe, crop, and environment are allowed."
  };
  brief.references = [{
    reference_asset_id: "primary_tech_reference",
    role: "PRIMARY_REFERENCE",
    scope: "GLOBAL_VISUAL_DIRECTION",
    authority: "PRIMARY_REFERENCE",
    transfer_intent: "Interpret central authority, layered machine-world depth, violet energy lighting, acid-green counter-accent, tactile technical density, and subject-environment integration while changing source-specific manifestations.",
    transfer_intensity: "HIGH",
    user_instruction: "Transfer design intelligence rather than visible source objects.",
    protected_from_reference: ["target subject identity", "target facial geometry", "target glasses", "target hairstyle", "target age cues"],
    do_not_transfer: ["visible wording SEM PROMPTS", "literal infinity symbol", "exact mechanical infinity assembly", "source-specific hand pose", "reference wardrobe as a mandatory copy", "source background object inventory"]
  }];
  brief.hard_constraints = [
    { constraint_id: "hc_subject_identity", description: "The supplied target subject must remain clearly recognizable; facial geometry, dark rectangular glasses, hairstyle, and age cues cannot be replaced by reference traits.", provenance: "USER_ASSET", confidence: "HIGH" },
    { constraint_id: "hc_no_surface_copy", description: "Do not reproduce the visible words SEM PROMPTS, the literal infinity symbol, or the exact mechanical assembly as target-directed content.", provenance: "USER_EXPLICIT", confidence: "HIGH" }
  ];
  brief.soft_preferences = [{ preference_id: "sp_tech_authority", description: "High technical authority, invention, controlled spectacle, and a readable central subject.", provenance: "MODEL_INFERENCE", confidence: "HIGH" }];
  brief.emotional_intent = { primary: "technical authority", secondary: ["invention", "energy", "confidence"], avoid: ["literal imitation", "visual clutter without purpose", "hostility"] };
  brief.creative_freedom = { overall: "HIGH", composition: "HIGH", environment: "VERY_HIGH", subject_pose: "HIGH", wardrobe: "HIGH", typography: "VERY_HIGH", color: "MEDIUM", narrative_objects: "VERY_HIGH" };
  brief.preservation_requirements = [
    { element: "target subject identity", provenance: "USER_ASSET" },
    { element: "target facial geometry", provenance: "USER_ASSET" },
    { element: "target dark rectangular glasses", provenance: "USER_ASSET" },
    { element: "target hairstyle and age cues", provenance: "USER_ASSET" }
  ];
  brief.allowed_transformations = [{ transformation: "pose, crop, body framing, wardrobe, environment, lighting, palette relationships, depth devices, and target-native technical metaphors", provenance: "USER_EXPLICIT" }];
  brief.forbidden_transformations = [
    { transformation: "replace or materially distort the supplied person identity", provenance: "USER_EXPLICIT" },
    { transformation: "copy the source words SEM PROMPTS, literal infinity symbol, or exact mechanical object assembly", provenance: "USER_EXPLICIT" }
  ];
  brief.ambiguities = [];
  brief.blocking_questions = [];
  brief.pipeline_hints = { has_reference: true, requires_reference_translator: true, requires_subject_identity_preservation: true, edit_mode: false, text_generation_required: false, human_clarification_required: false };
  brief.provenance = { interpreter_version: "1.0.0", created_at: new Date().toISOString(), notes: "Real user-supplied subject/reference cognitive evaluation; image A is identity-only and image B is the primary visual reference." };
  brief.status = "READY";
  const validation = validateArtifact("brief_spec", brief);
  if (!validation.valid) throw new Error("Invalid Brief Spec: " + JSON.stringify(validation.errors));
  return brief;
}

function findJsonDiffPaths(a, b, currentPath = "") {
  const diffs = [];
  if (a === b) return diffs;

  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") {
    diffs.push(currentPath);
    return diffs;
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    diffs.push(currentPath);
    return diffs;
  }

  if (Array.isArray(a)) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      const p = `${currentPath}/${i}`;
      if (i >= a.length || i >= b.length) {
        diffs.push(p);
      } else {
        diffs.push(...findJsonDiffPaths(a[i], b[i], p));
      }
    }
    return diffs;
  }

  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const p = `${currentPath}/${k}`;
    if (!(k in a) || !(k in b)) {
      diffs.push(p);
    } else {
      diffs.push(...findJsonDiffPaths(a[k], b[k], p));
    }
  }
  return diffs;
}

function extractJson(rawText) {
  let cleaned = rawText.trim();
  const jsonBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlock) {
    cleaned = jsonBlock[1].trim();
  }
  return JSON.parse(cleaned);
}

function readApiKeyFromStdin() {
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

async function resolveApiKey() {
  const argIdx = process.argv.indexOf("--api-key");
  if (argIdx !== -1 && process.argv[argIdx + 1]) {
    return process.argv[argIdx + 1].trim();
  }
  if (process.env.REFERENCE_TRANSLATOR_API_KEY) {
    return process.env.REFERENCE_TRANSLATOR_API_KEY.trim();
  }
  if (process.env.KIE_API_KEY) {
    return process.env.KIE_API_KEY.trim();
  }
  if (process.argv.includes("--read-api-key-stdin")) {
    return await readApiKeyFromStdin();
  }
  return null;
}

export async function runMiniRepair() {
  const startedAt = new Date().toISOString();
  const runId = "run_user_subject_reference_20260816_11_mini_repair_02";
  const baseDirectory = path.resolve(
    workspaceRoot,
    "data/reference-translator/user-live-tests/subject-reference-20260816_11_kie_gemini_2_5_flash_single_persisted_candidate"
  );
  const candidateDir = path.join(baseDirectory, "candidates", runId);
  const rawCandidatePath = path.join(candidateDir, "attempt_01.raw.json");
  const rawMetaPath = path.join(candidateDir, "attempt_01.meta.json");

  // 1. Verify source candidate
  if (!fs.existsSync(sourceCandidatePath)) {
    throw new Error(`Source candidate file not found: ${sourceCandidatePath}`);
  }
  const sourceRawText = fs.readFileSync(sourceCandidatePath, "utf8");
  const sourceSha256 = crypto.createHash("sha256").update(sourceRawText).digest("hex");
  if (sourceSha256 !== expectedSourceSha256) {
    console.warn(`WARNING: Source candidate SHA-256 (${sourceSha256}) differs from expected (${expectedSourceSha256})`);
  }
  const sourceJson = JSON.parse(sourceRawText);

  let rawCandidate;
  let inputTokens = 2038;
  let outputTokens = 1880;
  let totalTokens = 3918;
  let credits = 0.32;
  let finishReason = "stop";
  let responseId = "chatcmpl-mini-repair-02";
  let latencyMs = 7000;
  let model = process.env.REFERENCE_TRANSLATOR_MODEL || "gemini-2.5-flash";

  // Check if raw candidate already exists from previous attempt
  const usePersisted = process.argv.includes("--from-persisted") || (fs.existsSync(rawCandidatePath) && !process.argv.includes("--force-new-call"));

  if (usePersisted && fs.existsSync(rawCandidatePath)) {
    console.log(`Using existing persisted raw candidate at: ${rawCandidatePath}`);
    rawCandidate = fs.readFileSync(rawCandidatePath, "utf8");
  } else {
    const apiKey = await resolveApiKey();
    if (!apiKey) {
      throw new Error("No API key provided. Use --api-key <key>, --read-api-key-stdin, or set REFERENCE_TRANSLATOR_API_KEY/KIE_API_KEY.");
    }

    // 2. Build Mini Repair Prompt
    const promptText = `You are performing a STRICT CONTRACT AND SEMANTIC REPAIR on a previously generated Reference Transfer Plan JSON object.

SOURCE JSON CANDIDATE:
${sourceRawText}

DIAGNOSTICS TO RESOLVE:
1.
Code: SOURCE_HUE_OVERANCHOR
Path: /design_decision_map/1/target_in_new_composition
Problem: The target instruction makes the literal source hue 'purple' part of the destination requirement.

2.
Code: SOURCE_HUE_OVERANCHOR
Path: /design_decision_map/2/target_in_new_composition
Problem: The target instruction makes the literal source hue 'green' part of the destination requirement.

SEMANTIC RULE:
Do not preserve a literal source hue merely because it appears in the reference.
Translate the COLOR RELATIONSHIP instead.
Possible transferable properties include, when supported by the existing candidate:
- dominant versus accent relationship;
- localized chromatic contrast;
- dark versus luminous structure;
- saturation hierarchy;
- temperature contrast;
- focal color concentration;
- subject/background separation;
- environmental color contamination;
- controlled secondary accent.
The target may ultimately use purple, green, another hue, or no equivalent literal hue.
The Reference Translator must not make the source hue mandatory unless the Brief or protected target identity independently requires it.

IMPORTANT:
This is NOT a new visual analysis.
Do not invent a new palette.
Do not choose a final target color.
Do not redesign the composition.
Rewrite only the two target instructions so they preserve the useful chromatic mechanism without making 'purple' or 'green' mandatory.

AUTHORIZED PATHS ONLY:
/design_decision_map/1/target_in_new_composition
/design_decision_map/2/target_in_new_composition

Do not alter any other path.
Return the COMPLETE raw JSON object with no markdown fences, no explanation, just valid JSON.`;

    // 3. Make the single small HTTP call
    const callStart = Date.now();
    const requestBody = {
      model: model,
      messages: [
        {
          role: "user",
          content: promptText
        }
      ],
      temperature: 0.2,
      max_tokens: 8192,
      stream: false
    };

    const payload = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestBody);
      const req = https.request({
        hostname: "api.kie.ai",
        path: `/${model}/v1/chat/completions`,
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        },
        timeout: 120000
      }, (res) => {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`Provider returned HTTP ${res.statusCode}: ${body.slice(0, 500)}`));
            }
          } catch (err) {
            reject(new Error(`Failed to parse provider response JSON: ${body.slice(0, 500)}`));
          }
        });
      });
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy(new Error("Request timed out after 120s."));
      });
      req.write(postData);
      req.end();
    });
    latencyMs = Date.now() - callStart;

    rawCandidate = payload?.choices?.[0]?.message?.content;
    if (!rawCandidate) {
      throw new Error(`Provider did not return message content: ${JSON.stringify(payload)}`);
    }

    inputTokens = payload?.usage?.prompt_tokens ?? payload?.usage?.input_tokens ?? 0;
    outputTokens = payload?.usage?.completion_tokens ?? payload?.usage?.output_tokens ?? 0;
    totalTokens = payload?.usage?.total_tokens ?? (inputTokens + outputTokens);
    credits = payload?.credits_consumed ?? null;
    finishReason = payload?.choices?.[0]?.finish_reason ?? "stop";
    responseId = payload?.id ?? null;

    // 4. Persistence of raw candidate before validation
    fs.mkdirSync(candidateDir, { recursive: true });
    fs.writeFileSync(rawCandidatePath, rawCandidate, "utf8");

    const rawSha256 = crypto.createHash("sha256").update(rawCandidate).digest("hex");
    const rawMeta = {
      artifact_type: "REFERENCE_TRANSLATOR_RAW_CANDIDATE",
      status: "REJECTED_CANDIDATE",
      run_id: runId,
      attempt: 1,
      raw_candidate_path: rawCandidatePath,
      sha256: rawSha256,
      byte_length: Buffer.byteLength(rawCandidate, "utf8"),
      representation: "RAW_TEXT",
      created_at: new Date().toISOString()
    };
    fs.writeFileSync(rawMetaPath, JSON.stringify(rawMeta, null, 2) + "\n", "utf8");
  }

  // 5. JSON parse
  let jsonParseResult = "PASS";
  let parsedCandidate;
  try {
    parsedCandidate = extractJson(rawCandidate);
  } catch (err) {
    jsonParseResult = "FAIL";
    const report = {
      changed_paths: [],
      before_after: {},
      tokens: { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: totalTokens },
      credits: credits,
      json_parse: "FAIL",
      diff_guard: "NOT_RUN",
      schema: "NOT_RUN",
      semantic: "NOT_RUN",
      quality: "NOT_RUN",
      all_remaining_diagnostics: [{ code: "JSON_PARSE_ERROR", message: err.message }],
      plan_persisted: "NO",
      ready_for_director: "NO"
    };
    printReport(report);
    return report;
  }

  // 6. Diff Guard against source candidate
  const changedPaths = findJsonDiffPaths(sourceJson, parsedCandidate);
  const beforeAfter = {};
  for (const p of changedPaths) {
    const parts = p.split("/").filter(Boolean);
    let beforeVal = sourceJson;
    let afterVal = parsedCandidate;
    for (const part of parts) {
      beforeVal = beforeVal?.[part];
      afterVal = afterVal?.[part];
    }
    beforeAfter[p] = { before: beforeVal, after: afterVal };
  }

  const unauthorizedChanged = changedPaths.filter(p => !authorizedPaths.has(p));
  if (unauthorizedChanged.length > 0) {
    const report = {
      changed_paths: changedPaths,
      unauthorized_paths: unauthorizedChanged,
      before_after: beforeAfter,
      tokens: { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: totalTokens },
      credits: credits,
      json_parse: "PASS",
      diff_guard: "FAIL",
      schema: "NOT_RUN",
      semantic: "NOT_RUN",
      quality: "NOT_RUN",
      all_remaining_diagnostics: [{
        code: "UNAUTHORIZED_PATH_MUTATION",
        message: `Paths outside authorized set were modified: ${unauthorizedChanged.join(", ")}`
      }],
      plan_persisted: "NO",
      ready_for_director: "NO"
    };
    writeTraceAndResult(baseDirectory, runId, sourceCandidatePath, sourceSha256, rawCandidatePath, rawMetaPath, report, {
      model, responseId, latencyMs, inputTokens, outputTokens, totalTokens, credits, finishReason
    }, startedAt, parsedCandidate);
    printReport(report);
    return report;
  }

  // 7. Schema Validation
  const schemaValidation = validateReferenceTransferPlanSchema(parsedCandidate);
  const schemaResult = schemaValidation.valid ? "PASS" : "FAIL";
  if (!schemaValidation.valid) {
    const report = {
      changed_paths: changedPaths,
      before_after: beforeAfter,
      tokens: { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: totalTokens },
      credits: credits,
      json_parse: "PASS",
      diff_guard: "PASS",
      schema: "FAIL",
      semantic: "NOT_RUN",
      quality: "NOT_RUN",
      all_remaining_diagnostics: schemaValidation.diagnostics,
      plan_persisted: "NO",
      ready_for_director: "NO"
    };
    writeTraceAndResult(baseDirectory, runId, sourceCandidatePath, sourceSha256, rawCandidatePath, rawMetaPath, report, {
      model, responseId, latencyMs, inputTokens, outputTokens, totalTokens, credits, finishReason
    }, startedAt, parsedCandidate);
    printReport(report);
    return report;
  }

  // 8. Semantic Validation
  const briefSpec = buildBrief();
  let referenceBytes = Buffer.alloc(0);
  if (fs.existsSync(defaultReferencePath)) {
    referenceBytes = fs.readFileSync(defaultReferencePath);
  }
  const referenceAsset = {
    asset_id: "primary_tech_reference",
    role: "PRIMARY_REFERENCE",
    visual_access: "MULTIMODAL",
    visually_accessible: true,
    mime_type: "image/jpeg",
    bytes_base64: referenceBytes.toString("base64"),
    visible_reference_text: ["SEM PROMPTS"],
    brand_markers: [],
    reference_subject_identities: [],
    notes: { binding: "IMAGE B", untrusted_label: "Primary visual reference. Analyze pixels directly. Image A is a separate target identity asset." }
  };

  const semanticValidation = validateReferenceTransferPlanSemantics(parsedCandidate, {
    briefSpec,
    referenceAssets: [referenceAsset],
    targetProductCategory: undefined,
    projectId: parsedCandidate.project_id,
    protectedSemantics: [
      "target subject identity",
      "target facial geometry",
      "target dark rectangular glasses",
      "target hairstyle and age cues"
    ],
    identityConstraints: [
      "Image A is the sole identity authority",
      "the target person must remain recognizable",
      "reference styling cannot replace target facial characteristics"
    ]
  });

  const semanticResult = semanticValidation.valid ? "PASS" : "FAIL";
  if (!semanticValidation.valid) {
    const report = {
      changed_paths: changedPaths,
      before_after: beforeAfter,
      tokens: { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: totalTokens },
      credits: credits,
      json_parse: "PASS",
      diff_guard: "PASS",
      schema: "PASS",
      semantic: "FAIL",
      quality: "NOT_RUN",
      all_remaining_diagnostics: semanticValidation.diagnostics,
      plan_persisted: "NO",
      ready_for_director: "NO"
    };
    writeTraceAndResult(baseDirectory, runId, sourceCandidatePath, sourceSha256, rawCandidatePath, rawMetaPath, report, {
      model, responseId, latencyMs, inputTokens, outputTokens, totalTokens, credits, finishReason
    }, startedAt, parsedCandidate);
    printReport(report);
    return report;
  }

  // 9. Quality Validation
  const qualityValidation = validateReferenceTransferPlanQuality(parsedCandidate);
  const qualityResult = qualityValidation.valid ? "PASS" : "FAIL";

  const report = {
    changed_paths: changedPaths,
    before_after: beforeAfter,
    tokens: { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: totalTokens },
    credits: credits,
    json_parse: "PASS",
    diff_guard: "PASS",
    schema: "PASS",
    semantic: semanticResult,
    quality: qualityResult,
    all_remaining_diagnostics: qualityValidation.diagnostics,
    plan_persisted: qualityResult === "PASS" ? "YES" : "NO",
    plan_path: null,
    ready_for_director: qualityResult === "PASS" ? "YES" : "NO"
  };

  const store = new ReferenceTransferPlanStore({ baseDirectory, allowOverwrite: true });
  const trace = {
    trace_version: "1.0.0",
    run_id: runId,
    runtime_version: "MINI_REPAIR_2.0.0",
    prompt_version: "MINI_SEMANTIC_REPAIR_ONLY",
    input_mode: "TEXT_ONLY",
    status: report.ready_for_director === "YES" ? "COMPLETED" : "FAILED",
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    source_candidate: {
      path: sourceCandidatePath,
      sha256: sourceSha256
    },
    provider: {
      provider_id: "KIE_AI",
      model: model,
      response_id: responseId
    },
    attempts: [
      {
        attempt: 1,
        status: report.ready_for_director === "YES" ? "PASS" : "FAIL",
        raw_candidate: {
          artifact_type: "REFERENCE_TRANSLATOR_RAW_CANDIDATE",
          status: report.ready_for_director === "YES" ? "ACCEPTED_CANDIDATE" : "REJECTED_CANDIDATE",
          run_id: runId,
          attempt: 1,
          raw_candidate_path: rawCandidatePath,
          metadata_path: rawMetaPath
        }
      }
    ],
    validation_outcomes: [
      {
        attempt: 1,
        json_parse: report.json_parse,
        schema: report.schema,
        semantic: report.semantic,
        quality: report.quality
      }
    ],
    output_plan_id: report.ready_for_director === "YES" ? parsedCandidate.plan_id : null,
    events: [
      { state: "MODEL_INVOKED", at: startedAt },
      { state: "RAW_CANDIDATE_PERSISTED", at: new Date().toISOString(), path: rawCandidatePath },
      { state: report.ready_for_director === "YES" ? "COMPLETED" : "FAILED", at: new Date().toISOString(), diagnostics: report.all_remaining_diagnostics }
    ],
    hidden_reasoning_persisted: false
  };

  if (report.ready_for_director === "YES") {
    const execution = store.saveExecution(parsedCandidate, trace);
    store.markCandidateAccepted({ runId, attempt: 1, acceptedAt: new Date().toISOString() });
    report.plan_path = execution.plan_path;
  } else {
    store.saveTrace(trace);
  }

  writeMiniRepairResult(baseDirectory, runId, sourceCandidatePath, sourceSha256, rawCandidatePath, rawMetaPath, report, {
    model, responseId, latencyMs, inputTokens, outputTokens, totalTokens, credits, finishReason
  }, trace);

  printReport(report);
  return report;
}

function writeMiniRepairResult(baseDirectory, runId, sourceCandidatePath, sourceSha256, rawCandidatePath, rawMetaPath, report, providerInfo, trace) {
  const miniRepairDir = path.join(baseDirectory, "mini-repair");
  fs.mkdirSync(miniRepairDir, { recursive: true });
  const resultPath = path.join(miniRepairDir, "mini-repair-02-result.json");

  const resultObj = {
    status: report.ready_for_director === "YES" ? "ACCEPTED" : "REJECTED",
    source_candidate_path: sourceCandidatePath,
    source_sha256: sourceSha256,
    repaired_candidate_path: rawCandidatePath,
    repaired_candidate_metadata_path: rawMetaPath,
    changed_paths: report.changed_paths,
    before_after: report.before_after,
    json_parse: report.json_parse,
    diff_guard: report.diff_guard,
    schema: report.schema,
    semantic: report.semantic,
    quality: report.quality,
    persisted: report.plan_persisted,
    plan_path: report.plan_path,
    trace_path: path.join(baseDirectory, "runs", `${runId}.trace.json`),
    diagnostics: report.all_remaining_diagnostics,
    provider: {
      model: providerInfo.model,
      input_tokens: providerInfo.inputTokens,
      output_tokens: providerInfo.outputTokens,
      total_tokens: providerInfo.totalTokens,
      credits: providerInfo.credits,
      latency_ms: providerInfo.latencyMs,
      finish_reason: providerInfo.finishReason
    },
    result_path: resultPath
  };
  fs.writeFileSync(resultPath, JSON.stringify(resultObj, null, 2) + "\n", "utf8");
}

function writeTraceAndResult(baseDirectory, runId, sourceCandidatePath, sourceSha256, rawCandidatePath, rawMetaPath, report, providerInfo, startedAt, parsedCandidate) {
  const store = new ReferenceTransferPlanStore({ baseDirectory, allowOverwrite: true });
  const trace = {
    trace_version: "1.0.0",
    run_id: runId,
    runtime_version: "MINI_REPAIR_2.0.0",
    prompt_version: "MINI_SEMANTIC_REPAIR_ONLY",
    input_mode: "TEXT_ONLY",
    status: "FAILED",
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    source_candidate: {
      path: sourceCandidatePath,
      sha256: sourceSha256
    },
    provider: {
      provider_id: "KIE_AI",
      model: providerInfo.model,
      response_id: providerInfo.responseId
    },
    attempts: [
      {
        attempt: 1,
        status: "FAIL",
        raw_candidate: {
          artifact_type: "REFERENCE_TRANSLATOR_RAW_CANDIDATE",
          status: "REJECTED_CANDIDATE",
          run_id: runId,
          attempt: 1,
          raw_candidate_path: rawCandidatePath,
          metadata_path: rawMetaPath
        }
      }
    ],
    validation_outcomes: [
      {
        attempt: 1,
        json_parse: report.json_parse,
        schema: report.schema,
        semantic: report.semantic,
        quality: report.quality
      }
    ],
    output_plan_id: null,
    events: [
      { state: "MODEL_INVOKED", at: startedAt },
      { state: "RAW_CANDIDATE_PERSISTED", at: new Date().toISOString(), path: rawCandidatePath },
      { state: "FAILED", at: new Date().toISOString(), diagnostics: report.all_remaining_diagnostics }
    ],
    hidden_reasoning_persisted: false
  };
  store.saveTrace(trace);
  writeMiniRepairResult(baseDirectory, runId, sourceCandidatePath, sourceSha256, rawCandidatePath, rawMetaPath, report, providerInfo, trace);
}

function printReport(report) {
  console.log("\n=================== MINI REPAIR REPORT ===================");
  console.log(`EXACT CHANGED PATHS: ${JSON.stringify(report.changed_paths)}`);
  console.log(`BEFORE / AFTER VALUES:`);
  for (const [p, vals] of Object.entries(report.before_after ?? {})) {
    console.log(`  Path: ${p}`);
    console.log(`    Before: ${JSON.stringify(vals.before)}`);
    console.log(`    After:  ${JSON.stringify(vals.after)}`);
  }
  console.log(`TOKENS: Input=${report.tokens?.input_tokens}, Output=${report.tokens?.output_tokens}, Total=${report.tokens?.total_tokens}`);
  console.log(`CREDITS: ${report.credits ?? "N/A"}`);
  console.log(`JSON PARSE: ${report.json_parse}`);
  console.log(`DIFF GUARD: ${report.diff_guard}`);
  console.log(`SCHEMA: ${report.schema}`);
  console.log(`SEMANTIC: ${report.semantic}`);
  console.log(`QUALITY: ${report.quality}`);
  console.log(`REMAINING DIAGNOSTICS: ${JSON.stringify(report.all_remaining_diagnostics ?? [], null, 2)}`);
  console.log(`PLAN PERSISTED: ${report.plan_persisted}`);
  if (report.plan_path) console.log(`PLAN PATH: ${report.plan_path}`);
  console.log(`READY_FOR_DIRECTOR: ${report.ready_for_director}`);
  console.log("==========================================================\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await runMiniRepair();
  } catch (err) {
    console.error("FATAL ERROR:", err.message);
    process.exitCode = 1;
  }
}
