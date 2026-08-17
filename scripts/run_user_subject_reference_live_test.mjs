#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateArtifact } from "../src/compiler/schema-validator.mjs";
import { buildReferenceTranslatorLiveCases } from "../src/reference-translator/evaluation/live-reference-translator-cases.mjs";
import {
  OpenAiCompatibleMultimodalCognitiveModelAdapter,
  redactReferenceTranslatorSecrets
} from "../src/reference-translator/model/openai-compatible-multimodal-adapter.mjs";
import { ReferenceTransferPlanStore } from "../src/reference-translator/persistence/reference-transfer-plan-store.mjs";
import { executeReferenceTranslator } from "../src/reference-translator/runtime/reference-translator-runtime.mjs";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultSubjectPath = "C:/Users/filpz/Downloads/referencias e sujeitos/feitos design builder e sujeito/BB1C02B5-4BE2-4589-9890-A5BB077CC305.jpeg";
const defaultReferencePath = "C:/Users/filpz/Downloads/referencias e sujeitos/feitos design builder e sujeito/31DC2D42-E38A-42B1-8FD5-319C8BB1B54B.jpeg";

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

class SubjectAwareAdapter extends OpenAiCompatibleMultimodalCognitiveModelAdapter {
  constructor({ subjectBase64, ...options }) {
    super(options);
    this.subjectBase64 = subjectBase64;
  }

  serialize(request) {
    const body = super.serialize(request);
    const original = body.messages[1].content;
    body.messages[1].content = [
      { type: "text", text: "CRITICAL MULTIMODAL BINDING. IMAGE A below is the TARGET SUBJECT IDENTITY asset, not a style reference. Inspect it only to understand what identity must survive. Its face, dark rectangular glasses, hairstyle, and age cues outrank all reference attraction." },
      { type: "image_url", image_url: { url: "data:image/jpeg;base64," + this.subjectBase64, detail: "high" } },
      { type: "text", text: "The structured Reference Translator request follows. Its declared PRIMARY_REFERENCE is IMAGE B, which appears after the structured text. Analyze IMAGE B for transferable design intelligence. Never treat IMAGE A as a source reference." },
      original[0],
      { type: "text", text: "IMAGE B: PRIMARY VISUAL REFERENCE. Observe pixels directly, distinguish mechanisms from manifestations, and do not transfer its visible words or literal infinity object." },
      ...original.slice(1)
    ];
    return body;
  }
}

function literalCopyChecks(plan) {
  const decisions = plan.design_decision_map ?? [];
  const prohibitedPositiveInstructionDetected = decisions.some((decision) => {
    const target = String(decision.target_in_new_composition ?? "");
    if (/sem prompts/i.test(target)) return decision.action !== "DISCARD";
    if (/(?:infinity|∞)/i.test(target)) return ["PRESERVE", "TRANSFER"].includes(decision.action);
    return false;
  });
  const handoff = (plan.director_handoff.what_must_survive ?? []).join(" ").toLowerCase();
  const protectedIdentityFeatures = ["face", "facial geometry", "glasses", "hairstyle", "age cues"]
    .filter((feature) => handoff.includes(feature));
  const baseIdentityText = [
    ...(plan.base_analysis.protected_elements ?? []),
    plan.base_analysis.subject_identity_requirements ?? ""
  ].join(" ").toLowerCase();
  const baseIdentityFeatures = ["face", "facial geometry", "glasses", "hairstyle", "age cues", "recognizability"]
    .filter((feature) => baseIdentityText.includes(feature));
  return {
    prohibited_positive_instruction_detected: prohibitedPositiveInstructionDetected,
    identity_protected: baseIdentityFeatures.length >= 3 && protectedIdentityFeatures.length >= 3
  };
}

async function main() {
  const apiKey = process.argv.includes("--read-api-key-stdin") ? await readApiKeyFromStdin() : process.env.REFERENCE_TRANSLATOR_API_KEY;
  if (!apiKey) throw new Error("REFERENCE_TRANSLATOR_API_KEY is required.");
  const runLabel = String(process.env.USER_TEST_RUN_LABEL || "20260816_01").trim();
  if (!/^[a-z0-9_-]+$/i.test(runLabel)) throw new Error("USER_TEST_RUN_LABEL contains unsupported characters.");
  const subjectPath = process.env.USER_TEST_SUBJECT_PATH || defaultSubjectPath;
  const referencePath = process.env.USER_TEST_REFERENCE_PATH || defaultReferencePath;
  const subjectBytes = fs.readFileSync(subjectPath);
  const referenceBytes = fs.readFileSync(referencePath);
  const subjectBase64 = subjectBytes.toString("base64");
  const referenceBase64 = referenceBytes.toString("base64");
  const env = {
    ...process.env,
    REFERENCE_TRANSLATOR_API_KEY: apiKey,
    REFERENCE_TRANSLATOR_BASE_URL: process.env.USER_TEST_BASE_URL || "https://integrate.api.nvidia.com/v1",
    REFERENCE_TRANSLATOR_MODEL: process.env.USER_TEST_MODEL || "stepfun-ai/step-3.7-flash",
    REFERENCE_TRANSLATOR_PROVIDER: process.env.USER_TEST_PROVIDER || "NVIDIA_NIM",
    REFERENCE_TRANSLATOR_TIMEOUT_MS: process.env.USER_TEST_TIMEOUT_MS || "300000",
    REFERENCE_TRANSLATOR_MAX_OUTPUT_TOKENS: process.env.USER_TEST_MAX_OUTPUT_TOKENS || "16384",
    REFERENCE_TRANSLATOR_CONTEXT_LIMIT_TOKENS: process.env.USER_TEST_CONTEXT_LIMIT_TOKENS || "262144",
    REFERENCE_TRANSLATOR_STRUCTURED_OUTPUT_MODE: process.env.USER_TEST_STRUCTURED_OUTPUT_MODE || "NONE",
    REFERENCE_TRANSLATOR_MODEL_INPUT_MODALITIES: "TEXT,IMAGE"
  };
  const adapter = new SubjectAwareAdapter({ env, subjectBase64 });
  const baseDirectory = path.resolve(workspaceRoot, "data/reference-translator/user-live-tests/subject-reference-" + runLabel);
  const store = new ReferenceTransferPlanStore({ baseDirectory });
  const runId = "run_user_subject_reference_" + runLabel;
  const projectId = "project_user_subject_reference_" + runLabel;
  const referenceAsset = {
    asset_id: "primary_tech_reference",
    role: "PRIMARY_REFERENCE",
    visual_access: "MULTIMODAL",
    visually_accessible: true,
    mime_type: "image/jpeg",
    bytes_base64: referenceBase64,
    visible_reference_text: ["SEM PROMPTS"],
    brand_markers: [],
    reference_subject_identities: [],
    notes: { binding: "IMAGE B", untrusted_label: "Primary visual reference. Analyze pixels directly. Image A is a separate target identity asset." }
  };
  const execution = await executeReferenceTranslator({
    context: {
      context_id: "ctx_user_subject_reference_" + runLabel,
      brief_ref: { artifact_id: "brief_user_subject_reference_" + runLabel, schema_version: "1.0.0" },
      reference_context: {
        target_type: "personal-brand technology thumbnail",
        test_purpose: "Verify target identity protection and functional reference adaptation from a real user subject/reference pair.",
        multimodal_binding: { image_a: "target subject identity only", image_b: "primary visual reference" }
      },
      protected_semantics: ["target subject identity", "target facial geometry", "target dark rectangular glasses", "target hairstyle and age cues"],
      identity_constraints: ["Image A is the sole identity authority", "the target person must remain recognizable", "reference styling cannot replace target facial characteristics"],
      transfer_scope: ["composition", "hierarchy", "depth", "lighting", "color relationships", "material language", "subject-environment integration", "technical metaphor", "energy", "typography function"]
    },
    brief_spec: buildBrief(),
    reference_assets: [referenceAsset],
    model_adapter: adapter,
    store,
    run_options: { run_id: runId, project_id: projectId, max_attempts: Number.parseInt(process.env.MAX_COGNITIVE_ATTEMPTS ?? "3", 10) }
  });
  const plan = execution.plan;
  const result = {
    status: "PASS",
    provider: env.REFERENCE_TRANSLATOR_PROVIDER,
    model: env.REFERENCE_TRANSLATOR_MODEL,
    run_id: runId,
    plan_id: plan.plan_id,
    plan_path: execution.persistence.plan_path ?? store.planPath(plan.plan_id),
    trace_path: execution.persistence.trace_path ?? store.tracePath(runId),
    attempts: execution.trace.attempts,
    validation_outcomes: execution.trace.validation_outcomes,
    warnings: execution.trace.warnings,
    subject_proof: { byte_length: subjectBytes.length, sha256: crypto.createHash("sha256").update(subjectBytes).digest("hex") },
    reference_proof: { byte_length: referenceBytes.length, sha256: crypto.createHash("sha256").update(referenceBytes).digest("hex") },
    literal_copy_checks: literalCopyChecks(plan),
    reference_observations: plan.reference_analyses.flatMap((analysis) => analysis.observations.map((observation) => ({ category: observation.category, description: observation.description, salience: observation.salience, confidence: observation.confidence }))),
    decisions: plan.design_decision_map.map((decision) => ({ action: decision.action, target: decision.target_in_new_composition, rationale: decision.rationale })),
    director_handoff: plan.director_handoff
  };
  const resultPath = path.join(baseDirectory, "user-test-result.json");
  fs.mkdirSync(baseDirectory, { recursive: true });
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({
    status: result.status,
    provider: result.provider,
    model: result.model,
    plan_id: result.plan_id,
    plan_path: result.plan_path,
    trace_path: result.trace_path,
    result_path: resultPath,
    attempt_count: result.attempts.length,
    validation_outcomes: result.validation_outcomes,
    warnings: result.warnings,
    literal_copy_checks: result.literal_copy_checks,
    observation_count: result.reference_observations.length,
    decision_count: result.decisions.length
  }, null, 2));
}

try {
  await main();
} catch (error) {
  console.error(JSON.stringify(redactReferenceTranslatorSecrets({
    status: "FAIL",
    code: error?.code ?? "UNEXPECTED_ERROR",
    message: error?.message ?? String(error),
    details: error?.details
  }, [process.env.REFERENCE_TRANSLATOR_API_KEY]), null, 2));
  process.exitCode = 2;
}
