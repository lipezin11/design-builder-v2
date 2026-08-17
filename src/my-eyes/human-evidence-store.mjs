import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { validateApprovedDirectionMemory } from "./approved-direction-memory-loader.mjs";
import { ApprovedDirectionMemoryError } from "./approved-direction-memory-indexer.mjs";

const clone = (value) => structuredClone(value);
const sequence = (id) => Number(/_([0-9]{6})$/.exec(id ?? "")?.[1] ?? 0);
const allocate = (prefix, ids) => `${prefix}_${String(Math.max(0, ...ids.map(sequence)) + 1).padStart(6, "0")}`;
const nonBlank = (value, code, field) => {
  if (typeof value !== "string" || value.trim().length === 0) throw new ApprovedDirectionMemoryError(code, `${field} is required.`, { field });
  return value;
};
const classification = (memory) => memory.data_classification === "SYNTHETIC_TEST_DATA" ? "SYNTHETIC_TEST_DATA" : "REAL_HUMAN_EVIDENCE";
const aiClassification = (memory) => memory.data_classification === "SYNTHETIC_TEST_DATA" ? "SYNTHETIC_TEST_DATA" : "REAL_AI_ANALYSIS";
const sameTarget = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const pairKey = (left, right) => [left, right].sort().join("::");

function refreshSummary(memory) {
  const active = memory.human_decisions.filter((item) => item.status === "ACTIVE");
  memory.summary = {
    image_count: memory.images.length,
    available_image_count: memory.images.filter((item) => item.availability === "AVAILABLE").length,
    approved_count: active.filter((item) => item.decision === "APPROVED").length,
    rejected_count: active.filter((item) => item.decision === "REJECTED").length,
    human_reason_count: memory.human_reasons.length,
    structured_reason_count: memory.structured_human_reasons.length,
    visual_analysis_count: memory.visual_analyses.length,
    pairwise_count: memory.pairwise_preferences.length,
    hard_pair_count: memory.pairwise_preferences.filter((item) => item.pair_type === "HARD_PAIR").length,
    inferred_preference_count: memory.inferred_preferences.length,
    human_confirmed_generalized_preference_count: memory.inferred_preferences.filter((item) => item.human_confirmed === true && item.status !== "SUPERSEDED").length,
    candidate_signal_review_count: (memory.candidate_signal_reviews ?? []).length,
    system_hypothesis_count: (memory.system_hypotheses ?? []).length
  };
}

function finalize(memory, baseline, timestamp) {
  if (JSON.stringify(memory.visual_analyses) !== JSON.stringify(baseline.visual_analyses)) throw new ApprovedDirectionMemoryError("MY_EYES_HUMAN_FLOW_CHANGED_VISUAL_ANALYSIS", "Human evidence capture cannot modify visual analysis.");
  if (JSON.stringify(memory.inferred_preferences) !== JSON.stringify(baseline.inferred_preferences)) throw new ApprovedDirectionMemoryError("MY_EYES_HUMAN_FLOW_CREATED_INFERENCE", "Human evidence capture cannot create or modify inferred preferences.");
  refreshSummary(memory);
  memory.memory_version = baseline.memory_version + 1;
  memory.updated_at = timestamp;
  const validation = validateApprovedDirectionMemory(memory);
  if (!validation.valid) throw new ApprovedDirectionMemoryError("MY_EYES_HUMAN_EVIDENCE_INVALID", "Human evidence update failed validation.", { errors: validation.errors });
  return memory;
}

function assertTargetExists(memory, target, pendingPairId) {
  if (target?.image_id) {
    if (!memory.images.some((item) => item.image_id === target.image_id)) throw new ApprovedDirectionMemoryError("MY_EYES_REASON_IMAGE_MISSING", "Human reason references an unknown image.", { image_id: target.image_id });
    return;
  }
  if (target?.pair_id) {
    if (target.pair_id !== pendingPairId && !memory.pairwise_preferences.some((item) => item.pair_id === target.pair_id)) throw new ApprovedDirectionMemoryError("MY_EYES_REASON_PAIR_MISSING", "Human reason references an unknown pair.", { pair_id: target.pair_id });
    return;
  }
  if (target?.context_scope && target?.context_ref) return;
  throw new ApprovedDirectionMemoryError("MY_EYES_REASON_TARGET_REQUIRED", "Human reason requires an image, pair, or explicit evidence context target.");
}

function createReason({ memory, target, rawText, version, supersedesReasonId, timestamp, sourceRef, pendingPairId, relatedCandidateSignalIds = [], relatedImageIds = [] }) {
  assertTargetExists(memory, target, pendingPairId);
  nonBlank(rawText, "MY_EYES_REASON_RAW_TEXT_REQUIRED", "raw_text");
  return {
    reason_id: allocate("MYE_RSN", memory.human_reasons.map((item) => item.reason_id)),
    evidence_level: "LEVEL_1_HUMAN_REASON",
    target: clone(target),
    raw_text: rawText,
    raw_text_sha256: crypto.createHash("sha256").update(rawText, "utf8").digest("hex"),
    related_candidate_signal_ids: [...new Set(relatedCandidateSignalIds)],
    related_image_ids: [...new Set(relatedImageIds)],
    status: "ACTIVE",
    version,
    ...(supersedesReasonId ? { supersedes_reason_id: supersedesReasonId } : {}),
    provenance: {
      asserted_by: "HUMAN",
      recorded_by: "APPROVED_DIRECTION_MEMORY_SERVICE",
      source_type: "HUMAN_FEEDBACK",
      source_ref: sourceRef,
      recorded_at: timestamp,
      data_classification: classification(memory)
    }
  };
}

export function appendHumanReason({ memory, image_id, pair_id, context_scope, context_ref, related_candidate_signal_ids = [], related_image_ids = [], raw_text, source_ref = "my-eyes-cli://add-reason", now = () => new Date() }) {
  const baseline = clone(memory);
  const updated = clone(memory);
  const target = image_id ? { image_id } : pair_id ? { pair_id } : context_scope && context_ref ? { context_scope, context_ref } : null;
  const unknownRelatedImages = related_image_ids.filter((id) => !updated.images.some((item) => item.image_id === id));
  if (unknownRelatedImages.length) throw new ApprovedDirectionMemoryError("MY_EYES_REASON_RELATED_IMAGE_MISSING", "Human reason references unknown related images.", { unknownRelatedImages });
  const timestamp = now().toISOString();
  const reason = createReason({ memory: updated, target, rawText: raw_text, version: 1, timestamp, sourceRef: source_ref, relatedCandidateSignalIds: related_candidate_signal_ids, relatedImageIds: related_image_ids });
  updated.human_reasons.push(reason);
  if (image_id) {
    const image = updated.images.find((item) => item.image_id === image_id);
    const decision = updated.human_decisions.find((item) => item.evidence_id === image.current_decision_evidence_id);
    decision.reason_provided = true;
  }
  return { memory: finalize(updated, baseline, timestamp), reason: clone(reason) };
}

export function correctHumanReason({ memory, reason_id, raw_text, source_ref = "my-eyes-cli://correct-reason", now = () => new Date() }) {
  const baseline = clone(memory);
  const updated = clone(memory);
  const previous = updated.human_reasons.find((item) => item.reason_id === reason_id);
  if (!previous) throw new ApprovedDirectionMemoryError("MY_EYES_REASON_MISSING", "Human reason to correct was not found.", { reason_id });
  if (previous.status !== "ACTIVE") throw new ApprovedDirectionMemoryError("MY_EYES_REASON_NOT_ACTIVE", "Only an active human reason can be corrected.", { reason_id });
  const timestamp = now().toISOString();
  previous.status = "SUPERSEDED";
  for (const structured of updated.structured_human_reasons.filter((item) => item.human_reason_id === reason_id && item.status === "ACTIVE")) structured.status = "SUPERSEDED";
  const reason = createReason({ memory: updated, target: previous.target, rawText: raw_text, version: previous.version + 1, supersedesReasonId: previous.reason_id, timestamp, sourceRef: source_ref, relatedCandidateSignalIds: previous.related_candidate_signal_ids, relatedImageIds: previous.related_image_ids });
  updated.human_reasons.push(reason);
  return { memory: finalize(updated, baseline, timestamp), reason: clone(reason), superseded_reason_id: previous.reason_id };
}

function createStructured({ memory, humanReason, categories, polarity, normalizedStatement, structuredBy, confirmedByHuman, version, supersedesId, timestamp, sourceRef, structuredConcept, structuredSummary, conditions, explicitlyNotClaimed, relatedVisualDimensions, interpretationConfidence, humanConfirmationStatus, humanEvidenceStatus, evaluationAxis, functionalJustificationDimensions }) {
  if (!Array.isArray(categories) || categories.length === 0) throw new ApprovedDirectionMemoryError("MY_EYES_STRUCTURED_CATEGORIES_REQUIRED", "At least one structured category is required.");
  nonBlank(normalizedStatement, "MY_EYES_STRUCTURED_STATEMENT_REQUIRED", "normalized_statement");
  if (!['POSITIVE','NEGATIVE','MIXED','NEUTRAL'].includes(polarity)) throw new ApprovedDirectionMemoryError("MY_EYES_STRUCTURED_POLARITY_INVALID", "Structured reason polarity is invalid.", { polarity });
  if (!["HUMAN","AI","SYSTEM"].includes(structuredBy)) throw new ApprovedDirectionMemoryError("MY_EYES_STRUCTURED_BY_INVALID", "structured_by must be HUMAN, AI, or SYSTEM.", { structuredBy });
  if (structuredBy === "HUMAN" && confirmedByHuman !== true) throw new ApprovedDirectionMemoryError("MY_EYES_HUMAN_STRUCTURE_REQUIRES_CONFIRMATION", "Human-structured reasons are explicitly human-confirmed.");
  const translationMethod = structuredBy === "HUMAN" ? "HUMAN_STRUCTURED" : structuredBy === "SYSTEM" ? "SYSTEM_STRUCTURED" : confirmedByHuman ? "AI_STRUCTURED_HUMAN_CONFIRMED" : "AI_STRUCTURED";
  return {
    structured_reason_id: allocate("MYE_SRSN", memory.structured_human_reasons.map((item) => item.structured_reason_id)),
    evidence_level: "LEVEL_2_STRUCTURED_HUMAN_REASON",
    human_reason_id: humanReason.reason_id,
    categories: [...new Set(categories)],
    polarity,
    normalized_statement: normalizedStatement,
    structured_by: structuredBy,
    translation_method: translationMethod,
    confirmed_by_human: confirmedByHuman,
    ...(structuredConcept ? {
      source_raw_text: humanReason.raw_text,
      structured_concept: structuredConcept,
      structured_summary: structuredSummary,
      conditions: clone(conditions),
      explicitly_not_claimed: [...explicitlyNotClaimed],
      related_visual_dimensions: [...relatedVisualDimensions],
      interpretation_confidence: interpretationConfidence,
      human_confirmation_status: humanConfirmationStatus,
      human_evidence_status: humanEvidenceStatus,
      ...(evaluationAxis ? { evaluation_axis: clone(evaluationAxis) } : {}),
      claim_status: "SYSTEM_STRUCTURING_OF_HUMAN_EVIDENCE",
      ...(functionalJustificationDimensions?.length ? { functional_justification_dimensions: [...functionalJustificationDimensions] } : {})
    } : {}),
    status: "ACTIVE",
    version,
    ...(supersedesId ? { supersedes_structured_reason_id: supersedesId } : {}),
    provenance: {
      asserted_by: structuredBy,
      recorded_by: "APPROVED_DIRECTION_MEMORY_SERVICE",
      source_type: structuredBy === "SYSTEM" ? "SYSTEM_STRUCTURED_INTERPRETATION" : structuredBy === "AI" ? "DERIVED_INFERENCE" : "HUMAN_FEEDBACK",
      source_ref: sourceRef,
      recorded_at: timestamp,
      data_classification: structuredBy === "HUMAN" ? classification(memory) : aiClassification(memory)
    }
  };
}

export function appendStructuredHumanReason({ memory, human_reason_id, categories, polarity, normalized_statement, structured_by = "AI", confirmed_by_human = false, structured_concept, structured_summary, conditions, explicitly_not_claimed = [], related_visual_dimensions = [], interpretation_confidence, human_confirmation_status, human_evidence_status, evaluation_axis, functional_justification_dimensions = [], source_ref, now = () => new Date() }) {
  const baseline = clone(memory);
  const updated = clone(memory);
  const humanReason = updated.human_reasons.find((item) => item.reason_id === human_reason_id);
  if (!humanReason) throw new ApprovedDirectionMemoryError("MY_EYES_RAW_REASON_MISSING", "Structured reason requires an existing raw human reason.", { human_reason_id });
  if (humanReason.status !== "ACTIVE") throw new ApprovedDirectionMemoryError("MY_EYES_RAW_REASON_NOT_ACTIVE", "Structured reason requires an active raw human reason.", { human_reason_id });
  if (updated.structured_human_reasons.some((item) => item.human_reason_id === human_reason_id && item.status === "ACTIVE")) throw new ApprovedDirectionMemoryError("MY_EYES_STRUCTURED_REASON_DUPLICATE", "An active structured reason already exists for this raw reason.", { human_reason_id });
  const timestamp = now().toISOString();
  const structured = createStructured({ memory: updated, humanReason, categories, polarity, normalizedStatement: normalized_statement, structuredBy: structured_by, confirmedByHuman: confirmed_by_human, structuredConcept: structured_concept, structuredSummary: structured_summary, conditions, explicitlyNotClaimed: explicitly_not_claimed, relatedVisualDimensions: related_visual_dimensions, interpretationConfidence: interpretation_confidence, humanConfirmationStatus: human_confirmation_status, humanEvidenceStatus: human_evidence_status, evaluationAxis: evaluation_axis, functionalJustificationDimensions: functional_justification_dimensions, version: 1, timestamp, sourceRef: source_ref ?? `derived-from://${human_reason_id}` });
  updated.structured_human_reasons.push(structured);
  return { memory: finalize(updated, baseline, timestamp), structured_reason: clone(structured) };
}

export function correctStructuredHumanReason({ memory, structured_reason_id, categories, polarity, normalized_statement, structured_by, confirmed_by_human, source_ref, now = () => new Date() }) {
  const baseline = clone(memory);
  const updated = clone(memory);
  const previous = updated.structured_human_reasons.find((item) => item.structured_reason_id === structured_reason_id);
  if (!previous) throw new ApprovedDirectionMemoryError("MY_EYES_STRUCTURED_REASON_MISSING", "Structured reason to correct was not found.", { structured_reason_id });
  if (previous.status !== "ACTIVE") throw new ApprovedDirectionMemoryError("MY_EYES_STRUCTURED_REASON_NOT_ACTIVE", "Only an active structured reason can be corrected.", { structured_reason_id });
  const humanReason = updated.human_reasons.find((item) => item.reason_id === previous.human_reason_id);
  if (!humanReason || humanReason.status !== "ACTIVE") throw new ApprovedDirectionMemoryError("MY_EYES_RAW_REASON_NOT_ACTIVE", "Structured correction requires its raw human reason to remain active.", { human_reason_id: previous.human_reason_id });
  const timestamp = now().toISOString();
  previous.status = "SUPERSEDED";
  const structured = createStructured({ memory: updated, humanReason, categories: categories ?? previous.categories, polarity: polarity ?? previous.polarity, normalizedStatement: normalized_statement ?? previous.normalized_statement, structuredBy: structured_by ?? previous.structured_by, confirmedByHuman: confirmed_by_human ?? previous.confirmed_by_human, version: previous.version + 1, supersedesId: previous.structured_reason_id, timestamp, sourceRef: source_ref ?? `correction-of://${previous.structured_reason_id}` });
  updated.structured_human_reasons.push(structured);
  return { memory: finalize(updated, baseline, timestamp), structured_reason: clone(structured), superseded_structured_reason_id: previous.structured_reason_id };
}

function normalizeChoice(choice, leftImageId, rightImageId) {
  const normalized = String(choice ?? "").trim().toUpperCase();
  if (["LEFT", "LEFT_PREFERRED", leftImageId].includes(normalized)) return { result: "LEFT_PREFERRED", preferred: leftImageId };
  if (["RIGHT", "RIGHT_PREFERRED", rightImageId].includes(normalized)) return { result: "RIGHT_PREFERRED", preferred: rightImageId };
  if (normalized === "TIE") return { result: "TIE", preferred: null };
  throw new ApprovedDirectionMemoryError("MY_EYES_PAIR_CHOICE_INVALID", "human_choice must be LEFT, RIGHT, TIE, or one of the pair image IDs.", { choice });
}

function assertPairImages(memory, leftImageId, rightImageId) {
  if (leftImageId === rightImageId) throw new ApprovedDirectionMemoryError("MY_EYES_PAIR_SELF_COMPARISON", "A pair cannot compare an image with itself.", { image_id: leftImageId });
  const imageIds = new Set(memory.images.map((item) => item.image_id));
  const missing = [leftImageId, rightImageId].filter((id) => !imageIds.has(id));
  if (missing.length) throw new ApprovedDirectionMemoryError("MY_EYES_PAIR_IMAGE_MISSING", "Pair images must exist in Approved Direction Memory.", { missing });
}

function createPair({ memory, leftImageId, rightImageId, humanChoice, pairType, comparisonContext, version, supersedesId, timestamp, sourceRef, humanReasonRaw }) {
  assertPairImages(memory, leftImageId, rightImageId);
  if (!['STANDARD_PAIR','HARD_PAIR','DIAGNOSTIC_PAIR'].includes(pairType)) throw new ApprovedDirectionMemoryError("MY_EYES_PAIR_TYPE_INVALID", "pair_type must be STANDARD_PAIR, HARD_PAIR, or DIAGNOSTIC_PAIR.", { pairType });
  nonBlank(comparisonContext, "MY_EYES_PAIR_CONTEXT_REQUIRED", "comparison_context");
  const choice = normalizeChoice(humanChoice, leftImageId, rightImageId);
  const pairId = allocate("MYE_PAIR", memory.pairwise_preferences.map((item) => item.pair_id));
  let reason = null;
  if (humanReasonRaw !== undefined && humanReasonRaw !== null && humanReasonRaw !== "") {
    reason = createReason({ memory, target: { pair_id: pairId }, rawText: humanReasonRaw, version: 1, timestamp, sourceRef: `${sourceRef}#reason`, pendingPairId: pairId });
  }
  const pair = {
    pair_id: pairId,
    evidence_level: "LEVEL_0_HUMAN_DECISION",
    left_image_id: leftImageId,
    right_image_id: rightImageId,
    result: choice.result,
    preferred_image_id: choice.preferred,
    pair_type: pairType,
    explicitly_compared_by_human: true,
    comparison_context: comparisonContext,
    human_reason_ids: reason ? [reason.reason_id] : [],
    status: "ACTIVE",
    version,
    ...(supersedesId ? { supersedes_pair_id: supersedesId } : {}),
    provenance: {
      asserted_by: "HUMAN",
      recorded_by: "APPROVED_DIRECTION_MEMORY_SERVICE",
      source_type: "PAIRWISE_COMPARISON",
      source_ref: sourceRef,
      recorded_at: timestamp,
      data_classification: classification(memory)
    }
  };
  return { pair, reason };
}

export function appendPairwisePreference({ memory, left_image_id, right_image_id, human_choice, pair_type = "STANDARD_PAIR", comparison_context, human_reason_raw, source_ref = "my-eyes-cli://add-pair", now = () => new Date() }) {
  const baseline = clone(memory);
  const updated = clone(memory);
  assertPairImages(updated, left_image_id, right_image_id);
  const key = pairKey(left_image_id, right_image_id);
  if (updated.pairwise_preferences.some((item) => item.status === "ACTIVE" && pairKey(item.left_image_id, item.right_image_id) === key)) throw new ApprovedDirectionMemoryError("MY_EYES_PAIR_DUPLICATE", "An active comparison for this unordered image pair already exists.", { left_image_id, right_image_id });
  const timestamp = now().toISOString();
  const { pair, reason } = createPair({ memory: updated, leftImageId: left_image_id, rightImageId: right_image_id, humanChoice: human_choice, pairType: pair_type, comparisonContext: comparison_context, version: 1, timestamp, sourceRef: source_ref, humanReasonRaw: human_reason_raw });
  updated.pairwise_preferences.push(pair);
  if (reason) updated.human_reasons.push(reason);
  return { memory: finalize(updated, baseline, timestamp), pair: clone(pair), human_reason: clone(reason) };
}

export function correctPairwisePreference({ memory, pair_id, human_choice, pair_type, comparison_context, human_reason_raw, source_ref = "my-eyes-cli://correct-pair", now = () => new Date() }) {
  const baseline = clone(memory);
  const updated = clone(memory);
  const previous = updated.pairwise_preferences.find((item) => item.pair_id === pair_id);
  if (!previous) throw new ApprovedDirectionMemoryError("MY_EYES_PAIR_MISSING", "Pair to correct was not found.", { pair_id });
  if (previous.status !== "ACTIVE") throw new ApprovedDirectionMemoryError("MY_EYES_PAIR_NOT_ACTIVE", "Only an active pair can be corrected.", { pair_id });
  const key = pairKey(previous.left_image_id, previous.right_image_id);
  if (updated.pairwise_preferences.some((item) => item.pair_id !== pair_id && item.status === "ACTIVE" && pairKey(item.left_image_id, item.right_image_id) === key)) throw new ApprovedDirectionMemoryError("MY_EYES_PAIR_DUPLICATE", "Another active comparison already exists for this pair.", { pair_id });
  const timestamp = now().toISOString();
  previous.status = "SUPERSEDED";
  const fallbackChoice = previous.result === "LEFT_PREFERRED" ? "LEFT" : previous.result === "RIGHT_PREFERRED" ? "RIGHT" : "TIE";
  const { pair, reason } = createPair({ memory: updated, leftImageId: previous.left_image_id, rightImageId: previous.right_image_id, humanChoice: human_choice ?? fallbackChoice, pairType: pair_type ?? previous.pair_type, comparisonContext: comparison_context ?? previous.comparison_context, version: previous.version + 1, supersedesId: previous.pair_id, timestamp, sourceRef: source_ref, humanReasonRaw: human_reason_raw });
  updated.pairwise_preferences.push(pair);
  if (reason) updated.human_reasons.push(reason);
  return { memory: finalize(updated, baseline, timestamp), pair: clone(pair), human_reason: clone(reason), superseded_pair_id: previous.pair_id };
}

export function persistApprovedDirectionMemory({ manifestPath, memory }) {
  const validation = validateApprovedDirectionMemory(memory, { rootDir: path.resolve(path.dirname(manifestPath), "../.."), verifyFiles: true });
  if (!validation.valid) throw new ApprovedDirectionMemoryError("MY_EYES_MEMORY_INVALID", "Refusing to persist invalid Approved Direction Memory.", { errors: validation.errors });
  const temporary = `${manifestPath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(memory, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    fs.copyFileSync(temporary, manifestPath);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
  return manifestPath;
}