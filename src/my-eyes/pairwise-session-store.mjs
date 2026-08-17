import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { validateArtifact } from "../compiler/schema-validator.mjs";

export class PairwiseSessionError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "PairwiseSessionError";
    this.code = code;
    this.details = details;
  }
}

const clone = (value) => structuredClone(value);
const pairKey = (a, b) => [a, b].sort().join("::");
const nonBlank = (value) => typeof value === "string" && value.trim().length > 0;
const nullableText = (value, field) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new PairwiseSessionError("MY_EYES_PAIR_TEXT_INVALID", `${field} must be text or null.`, { field });
  return value;
};
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

function activeDecision(memory, imageId) {
  return memory.human_decisions.find((item) => item.image_id === imageId && item.status === "ACTIVE");
}

function latestAnalysis(memory, imageId) {
  return memory.visual_analyses
    .filter((item) => item.image_id === imageId)
    .sort((a, b) => b.analysis_version - a.analysis_version)[0] ?? null;
}

function imageSnapshot(memory, imageId) {
  const image = memory.images.find((item) => item.image_id === imageId);
  if (!image) throw new PairwiseSessionError("MY_EYES_PAIR_IMAGE_MISSING", "Pair selections must reference indexed images.", { image_id: imageId });
  const decision = activeDecision(memory, imageId);
  if (!decision) throw new PairwiseSessionError("MY_EYES_PAIR_LABEL_SNAPSHOT_MISSING", "Pair selections require the active historical label snapshot.", { image_id: imageId });
  return {
    image_id: image.image_id,
    original_filename: image.original_filename,
    source_path: image.source_path,
    sha256: image.sha256,
    mime_type: image.mime_type,
    label_snapshot: {
      decision: decision.decision,
      evidence_id: decision.evidence_id,
      attached_as_context_only: true,
      does_not_imply_pairwise_winner: true
    }
  };
}

function analysisSnapshot(memory, imageId) {
  const analysis = latestAnalysis(memory, imageId);
  if (!analysis) return [];
  return [{ analysis_id: analysis.analysis_id, analysis_version: analysis.analysis_version, record_path: analysis.record_path }];
}

function pendingDecision() {
  return {
    status: "PENDING",
    decision_version: 0,
    winner: null,
    raw_reason: null,
    winner_reason: null,
    loser_reason: null,
    keep_from_loser: null,
    decision_difficulty: null,
    decisive_visual_dimension: null,
    explicit_human_response: false,
    provenance: null
  };
}

function expectedSummary(session) {
  const statuses = session.pairs.map((pair) => pair.human_decision.status);
  return {
    proposed_pair_count: session.pairs.length,
    pending_pair_count: statuses.filter((status) => status === "PENDING").length,
    completed_pair_count: statuses.filter((status) => status === "COMPLETED").length,
    skipped_pair_count: statuses.filter((status) => status === "SKIPPED").length,
    human_pairwise_evidence_count: statuses.filter((status) => status === "COMPLETED").length,
    scores_created: 0,
    weights_created: 0,
    inferred_preferences_created: 0
  };
}

function expectedStatus(summary) {
  if (summary.pending_pair_count === summary.proposed_pair_count) return "WAITING_FOR_HUMAN";
  if (summary.pending_pair_count > 0) return "IN_PROGRESS";
  return "COMPLETED";
}

function assertValid(session) {
  const validation = validateArtifact("pairwise_session", session);
  if (!validation.valid) throw new PairwiseSessionError("MY_EYES_PAIR_SESSION_INVALID", "Pairwise session failed contract validation.", { errors: validation.errors });
  return session;
}

export function validatePairwiseSession(session) {
  const schema = validateArtifact("pairwise_session", session);
  const errors = schema.valid ? [] : schema.errors.map((error) => ({ code: "PAIRWISE_SESSION_SCHEMA", message: error.message, details: error }));
  if (!schema.valid) return { valid: false, errors };
  const ids = new Set();
  const keys = new Set();
  for (const pair of session.pairs) {
    if (ids.has(pair.pair_id)) errors.push({ code: "MY_EYES_PAIR_SELECTION_ID_DUPLICATE", message: "Pair selection IDs must be unique.", details: { pair_id: pair.pair_id } });
    ids.add(pair.pair_id);
    const key = pairKey(pair.image_a.image_id, pair.image_b.image_id);
    if (keys.has(key)) errors.push({ code: "MY_EYES_PAIR_SELECTION_DUPLICATE", message: "An unordered image pair may appear only once per session.", details: { pair_id: pair.pair_id } });
    keys.add(key);
    if (pair.image_a.image_id === pair.image_b.image_id) errors.push({ code: "MY_EYES_PAIR_SELF_COMPARISON", message: "A pair cannot compare an image with itself.", details: { pair_id: pair.pair_id } });
    if (pair.human_decision.status === "PENDING" && pair.decision_history.length !== 0) errors.push({ code: "MY_EYES_PENDING_PAIR_HAS_HISTORY", message: "A pending pair cannot contain human decision history.", details: { pair_id: pair.pair_id } });
    if (pair.human_decision.status !== "PENDING") {
      const latest = pair.decision_history.at(-1);
      if (!latest || JSON.stringify(latest) !== JSON.stringify(pair.human_decision)) errors.push({ code: "MY_EYES_PAIR_CURRENT_DECISION_MISMATCH", message: "Current decision must equal the latest append-only decision version.", details: { pair_id: pair.pair_id } });
    }
    for (let index = 0; index < pair.decision_history.length; index += 1) {
      if (pair.decision_history[index].decision_version !== index + 1) errors.push({ code: "MY_EYES_PAIR_DECISION_HISTORY_INVALID", message: "Human decision versions must be contiguous and append-only.", details: { pair_id: pair.pair_id } });
    }
  }
  if (!session.pairs.some((pair) => pair.pair_type === "HARD_PAIR")) errors.push({ code: "MY_EYES_HARD_PAIR_REQUIRED", message: "Each session must include at least one HARD_PAIR.", details: {} });
  const summary = expectedSummary(session);
  if (JSON.stringify(summary) !== JSON.stringify(session.summary)) errors.push({ code: "MY_EYES_PAIR_SESSION_SUMMARY_MISMATCH", message: "Session summary does not match pair states.", details: { expected: summary, actual: session.summary } });
  if (session.status !== expectedStatus(summary)) errors.push({ code: "MY_EYES_PAIR_SESSION_STATUS_MISMATCH", message: "Session status does not match pair states.", details: { expected: expectedStatus(summary), actual: session.status } });
  return { valid: errors.length === 0, errors };
}

export function buildPairwiseSession({ memory, pair_definitions, session_id = "MYE_PAIR_SESSION_000001", source_ref = "my-eyes://pairwise/session-builder", now = () => new Date() }) {
  if (!Array.isArray(pair_definitions) || pair_definitions.length < 4 || pair_definitions.length > 6) throw new PairwiseSessionError("MY_EYES_PAIR_SESSION_SIZE_INVALID", "A pairwise session must contain 4 to 6 useful pairs.", { count: pair_definitions?.length });
  const timestamp = now().toISOString();
  const seen = new Set();
  const pairs = pair_definitions.map((definition, index) => {
    const { image_a_id: imageAId, image_b_id: imageBId } = definition;
    if (imageAId === imageBId) throw new PairwiseSessionError("MY_EYES_PAIR_SELF_COMPARISON", "A pair cannot compare an image with itself.", { image_id: imageAId });
    const key = pairKey(imageAId, imageBId);
    if (seen.has(key)) throw new PairwiseSessionError("MY_EYES_PAIR_SELECTION_DUPLICATE", "An unordered image pair may appear only once per session.", { image_a_id: imageAId, image_b_id: imageBId });
    seen.add(key);
    if (!nonBlank(definition.selection_reason)) throw new PairwiseSessionError("MY_EYES_PAIR_SELECTION_REASON_REQUIRED", "System pair selection requires a reason.", { index });
    if (!Array.isArray(definition.comparable_dimensions) || definition.comparable_dimensions.length === 0) throw new PairwiseSessionError("MY_EYES_PAIR_COMPARABLE_DIMENSION_REQUIRED", "Pair selection requires at least one comparable visual dimension.", { index });
    const imageA = imageSnapshot(memory, imageAId);
    const imageB = imageSnapshot(memory, imageBId);
    return {
      pair_id: `MYE_PAIRSEL_${String(index + 1).padStart(6, "0")}`,
      pair_type: definition.pair_type ?? "STANDARD_PAIR",
      image_a: imageA,
      image_b: imageB,
      selection: {
        selected_by: "SYSTEM",
        selection_reason: definition.selection_reason,
        hypothesis_refs: [...(definition.hypothesis_refs ?? [])],
        candidate_signal_refs: [...(definition.candidate_signal_refs ?? [])],
        comparable_dimensions: [...definition.comparable_dimensions],
        refutation_capable: definition.refutation_capable ?? true,
        label_based_winner_inference: false,
        bias_warning: "Historical APPROVED/REJECTED labels are context only. Either image may win, and TIE is valid."
      },
      evidence_snapshot: {
        memory_version: memory.memory_version,
        image_a_analysis_refs: analysisSnapshot(memory, imageAId),
        image_b_analysis_refs: analysisSnapshot(memory, imageBId),
        human_label_evidence_refs: [imageA.label_snapshot.evidence_id, imageB.label_snapshot.evidence_id],
        external_batch_refs: [...(definition.external_batch_refs ?? [])]
      },
      decision_authority: "HUMAN",
      human_decision: pendingDecision(),
      decision_history: [],
      structured_pair_reason: null,
      structured_reason_history: []
    };
  });
  if (!pairs.some((pair) => pair.pair_type === "HARD_PAIR")) throw new PairwiseSessionError("MY_EYES_HARD_PAIR_REQUIRED", "The session must include at least one HARD_PAIR.");
  const session = {
    schema_version: "1.0.0",
    session_id,
    session_version: 1,
    status: "WAITING_FOR_HUMAN",
    created_at: timestamp,
    updated_at: timestamp,
    memory_snapshot: {
      memory_id: memory.memory_id,
      memory_version: memory.memory_version,
      image_count: memory.images.length,
      pairwise_evidence_count: memory.pairwise_preferences.length,
      inferred_preference_count: memory.inferred_preferences.length,
      scores_count: 0,
      weights_count: 0
    },
    selection_policy: {
      selected_by: "SYSTEM",
      pair_selection_is_preference: false,
      labels_may_not_decide_winner: true,
      decision_authority: "HUMAN",
      target_pair_count: pairs.length,
      presentation_ordering_rule: "A/B positions are alternated where practical; no side encodes the historical label."
    },
    pairs,
    summary: {
      proposed_pair_count: pairs.length,
      pending_pair_count: pairs.length,
      completed_pair_count: 0,
      skipped_pair_count: 0,
      human_pairwise_evidence_count: 0,
      scores_created: 0,
      weights_created: 0,
      inferred_preferences_created: 0
    },
    provenance: {
      asserted_by: "SYSTEM",
      recorded_by: "PAIRWISE_SESSION_SERVICE",
      source_type: "PAIR_SELECTION_SESSION",
      source_ref,
      recorded_at: timestamp,
      data_classification: memory.data_classification
    }
  };
  const validation = validatePairwiseSession(session);
  if (!validation.valid) throw new PairwiseSessionError("MY_EYES_PAIR_SESSION_INVALID", "Generated pairwise session is invalid.", { errors: validation.errors });
  return session;
}

function humanProvenance(session, pairId, timestamp, sourceRef, sourceType) {
  return {
    asserted_by: "HUMAN",
    recorded_by: "PAIRWISE_SESSION_SERVICE",
    source_type: sourceType,
    source_ref: sourceRef,
    recorded_at: timestamp,
    data_classification: session.provenance.data_classification,
    pair_id: pairId
  };
}

function finalizeSession(updated, timestamp) {
  updated.session_version += 1;
  updated.updated_at = timestamp;
  updated.summary = expectedSummary(updated);
  updated.status = expectedStatus(updated.summary);
  const validation = validatePairwiseSession(updated);
  if (!validation.valid) throw new PairwiseSessionError("MY_EYES_PAIR_SESSION_INVALID", "Updated pairwise session is invalid.", { errors: validation.errors });
  return updated;
}

function normalizeWinner(winner) {
  const value = String(winner ?? "").trim().toUpperCase();
  if (["A", "IMAGE_A"].includes(value)) return "IMAGE_A";
  if (["B", "IMAGE_B"].includes(value)) return "IMAGE_B";
  if (value === "TIE") return "TIE";
  throw new PairwiseSessionError("MY_EYES_PAIR_WINNER_INVALID", "winner must be IMAGE_A, IMAGE_B, or TIE.", { winner });
}

export function appendHumanPairDecision({ session, pair_id, winner, raw_reason, winner_reason, loser_reason, keep_from_loser, decision_difficulty, decisive_visual_dimension, source_ref = "my-eyes://human-pair-response", now = () => new Date() }) {
  const updated = clone(session);
  const pair = updated.pairs.find((item) => item.pair_id === pair_id);
  if (!pair) throw new PairwiseSessionError("MY_EYES_PAIR_SELECTION_MISSING", "Pair selection was not found.", { pair_id });
  if (pair.human_decision.status !== "PENDING") throw new PairwiseSessionError("MY_EYES_PAIR_ALREADY_ANSWERED", "Only a pending pair can receive its first human decision.", { pair_id });
  const difficulty = decision_difficulty === undefined || decision_difficulty === null || decision_difficulty === "" ? null : String(decision_difficulty).trim().toUpperCase();
  if (difficulty !== null && !["EASY", "MEDIUM", "HARD"].includes(difficulty)) throw new PairwiseSessionError("MY_EYES_PAIR_DIFFICULTY_INVALID", "decision_difficulty must be EASY, MEDIUM, HARD, or null.", { decision_difficulty });
  const timestamp = now().toISOString();
  const decision = {
    status: "COMPLETED",
    decision_version: 1,
    winner: normalizeWinner(winner),
    raw_reason: nullableText(raw_reason, "raw_reason"),
    winner_reason: nullableText(winner_reason, "winner_reason"),
    loser_reason: nullableText(loser_reason, "loser_reason"),
    keep_from_loser: nullableText(keep_from_loser, "keep_from_loser"),
    decision_difficulty: difficulty,
    decisive_visual_dimension: nullableText(decisive_visual_dimension, "decisive_visual_dimension"),
    explicit_human_response: true,
    provenance: humanProvenance(updated, pair_id, timestamp, source_ref, "HUMAN_PAIRWISE_DECISION")
  };
  pair.decision_history.push(clone(decision));
  pair.human_decision = decision;
  return finalizeSession(updated, timestamp);
}

export function correctHumanPairDecision({ session, pair_id, winner, raw_reason, winner_reason, loser_reason, keep_from_loser, decision_difficulty, decisive_visual_dimension, source_ref = "my-eyes://human-pair-correction", now = () => new Date() }) {
  const updated = clone(session);
  const pair = updated.pairs.find((item) => item.pair_id === pair_id);
  if (!pair) throw new PairwiseSessionError("MY_EYES_PAIR_SELECTION_MISSING", "Pair selection was not found.", { pair_id });
  if (pair.human_decision.status !== "COMPLETED") throw new PairwiseSessionError("MY_EYES_PAIR_NOT_COMPLETED", "Only a completed human decision can be corrected.", { pair_id });
  const previous = pair.human_decision;
  const difficultyInput = decision_difficulty === undefined ? previous.decision_difficulty : decision_difficulty;
  const difficulty = difficultyInput === null || difficultyInput === "" ? null : String(difficultyInput).trim().toUpperCase();
  if (difficulty !== null && !["EASY", "MEDIUM", "HARD"].includes(difficulty)) throw new PairwiseSessionError("MY_EYES_PAIR_DIFFICULTY_INVALID", "decision_difficulty must be EASY, MEDIUM, HARD, or null.");
  const timestamp = now().toISOString();
  const decision = {
    status: "COMPLETED",
    decision_version: previous.decision_version + 1,
    winner: winner === undefined ? previous.winner : normalizeWinner(winner),
    raw_reason: raw_reason === undefined ? previous.raw_reason : nullableText(raw_reason, "raw_reason"),
    winner_reason: winner_reason === undefined ? previous.winner_reason : nullableText(winner_reason, "winner_reason"),
    loser_reason: loser_reason === undefined ? previous.loser_reason : nullableText(loser_reason, "loser_reason"),
    keep_from_loser: keep_from_loser === undefined ? previous.keep_from_loser : nullableText(keep_from_loser, "keep_from_loser"),
    decision_difficulty: difficulty,
    decisive_visual_dimension: decisive_visual_dimension === undefined ? previous.decisive_visual_dimension : nullableText(decisive_visual_dimension, "decisive_visual_dimension"),
    explicit_human_response: true,
    provenance: humanProvenance(updated, pair_id, timestamp, source_ref, "HUMAN_PAIRWISE_CORRECTION")
  };
  pair.decision_history.push(clone(decision));
  pair.human_decision = decision;
  return finalizeSession(updated, timestamp);
}

export function skipPair({ session, pair_id, source_ref = "my-eyes://human-pair-skip", now = () => new Date() }) {
  const updated = clone(session);
  const pair = updated.pairs.find((item) => item.pair_id === pair_id);
  if (!pair) throw new PairwiseSessionError("MY_EYES_PAIR_SELECTION_MISSING", "Pair selection was not found.", { pair_id });
  if (pair.human_decision.status !== "PENDING") throw new PairwiseSessionError("MY_EYES_PAIR_ALREADY_ANSWERED", "Only a pending pair can be skipped.", { pair_id });
  const timestamp = now().toISOString();
  const decision = {
    status: "SKIPPED",
    decision_version: 1,
    winner: null,
    raw_reason: null,
    winner_reason: null,
    loser_reason: null,
    keep_from_loser: null,
    decision_difficulty: null,
    decisive_visual_dimension: null,
    explicit_human_response: false,
    provenance: humanProvenance(updated, pair_id, timestamp, source_ref, "HUMAN_PAIRWISE_SKIP")
  };
  pair.decision_history.push(clone(decision));
  pair.human_decision = decision;
  return finalizeSession(updated, timestamp);
}

export function appendStructuredPairReason({ session, pair_id, concepts, normalized_statement, source_ref = "my-eyes://structured-pair-reason", now = () => new Date() }) {
  const updated = clone(session);
  const pair = updated.pairs.find((item) => item.pair_id === pair_id);
  if (!pair) throw new PairwiseSessionError("MY_EYES_PAIR_SELECTION_MISSING", "Pair selection was not found.", { pair_id });
  if (pair.human_decision.status !== "COMPLETED" || pair.human_decision.raw_reason === null) throw new PairwiseSessionError("MY_EYES_PAIR_RAW_REASON_REQUIRED", "A SYSTEM interpretation requires a completed pair with literal raw human text.", { pair_id });
  if (!Array.isArray(concepts) || concepts.length === 0 || concepts.some((item) => !nonBlank(item))) throw new PairwiseSessionError("MY_EYES_PAIR_CONCEPTS_REQUIRED", "Structured pair reason requires non-empty concepts.", { pair_id });
  if (!nonBlank(normalized_statement)) throw new PairwiseSessionError("MY_EYES_PAIR_NORMALIZED_STATEMENT_REQUIRED", "Structured pair reason requires a normalized statement.", { pair_id });
  const timestamp = now().toISOString();
  const structured = {
    structured_reason_id: `MYE_PAIR_SRSN_${String(pair.structured_reason_history.length + 1).padStart(6, "0")}`,
    structured_reason_version: pair.structured_reason_history.length + 1,
    source_decision_version: pair.human_decision.decision_version,
    source_raw_text: pair.human_decision.raw_reason,
    concepts: [...concepts],
    normalized_statement,
    structured_by: "SYSTEM",
    confirmed_by_human: false,
    provenance: {
      asserted_by: "SYSTEM",
      recorded_by: "PAIRWISE_SESSION_SERVICE",
      source_type: "STRUCTURED_PAIR_REASON",
      source_ref,
      recorded_at: timestamp,
      data_classification: session.provenance.data_classification
    }
  };
  pair.structured_reason_history.push(clone(structured));
  pair.structured_pair_reason = structured;
  return finalizeSession(updated, timestamp);
}

export function persistPairwiseSessionVersion({ root_dir, session }) {
  assertValid(session);
  const directory = path.resolve(root_dir, "data", "my_eyes", "pairwise", "sessions");
  fs.mkdirSync(directory, { recursive: true });
  const suffix = session.session_version === 1 ? "" : `.v${String(session.session_version).padStart(6, "0")}`;
  const target = path.join(directory, `${session.session_id}${suffix}.json`);
  const body = `${JSON.stringify(session, null, 2)}\n`;
  fs.writeFileSync(target, body, { encoding: "utf8", flag: "wx" });
  return { path: target, sha256: sha256(Buffer.from(body, "utf8")) };
}

export function loadPairwiseSession(sessionPath) {
  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  const validation = validatePairwiseSession(session);
  if (!validation.valid) throw new PairwiseSessionError("MY_EYES_PAIR_SESSION_INVALID", "Pairwise session failed validation.", { errors: validation.errors });
  return session;
}
