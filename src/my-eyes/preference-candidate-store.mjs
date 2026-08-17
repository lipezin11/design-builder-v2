import { validateApprovedDirectionMemory } from "./approved-direction-memory-loader.mjs";

export class PreferenceInferenceError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "PreferenceInferenceError";
    this.code = code;
    this.details = details;
  }
}

const clone = (value) => structuredClone(value);

export function calculatePreferenceMemorySummary(memory) {
  const activeDecisions = memory.human_decisions.filter((item) => item.status === "ACTIVE");
  return {
    image_count: memory.images.length,
    available_image_count: memory.images.filter((item) => item.availability === "AVAILABLE").length,
    approved_count: activeDecisions.filter((item) => item.decision === "APPROVED").length,
    rejected_count: activeDecisions.filter((item) => item.decision === "REJECTED").length,
    human_reason_count: memory.human_reasons.length,
    structured_reason_count: memory.structured_human_reasons.length,
    visual_analysis_count: memory.visual_analyses.length,
    pairwise_count: memory.pairwise_preferences.length,
    hard_pair_count: memory.pairwise_preferences.filter((item) => item.pair_type === "HARD_PAIR").length,
    inferred_preference_count: memory.inferred_preferences.length,
    human_confirmed_generalized_preference_count: memory.inferred_preferences.filter((item) => item.human_confirmed === true && item.status !== "SUPERSEDED").length,
    ...(memory.candidate_signal_reviews ? { candidate_signal_review_count: memory.candidate_signal_reviews.length } : {}),
    ...(memory.system_hypotheses ? { system_hypothesis_count: memory.system_hypotheses.length } : {})
  };
}

export function upgradeMemoryForPreferenceCandidates(memory) {
  const next = clone(memory);
  next.schema_version = "1.1.0";
  next.summary = calculatePreferenceMemorySummary(next);
  return next;
}

function assertValid(memory, code) {
  const validation = validateApprovedDirectionMemory(memory);
  if (!validation.valid) throw new PreferenceInferenceError(code, "Approved Direction Memory failed Preference Candidate validation.", { errors: validation.errors });
}

function assertSystemCandidate(candidate, { allowHumanConfirmation = false } = {}) {
  if (candidate.human_confirmed !== false && !allowHumanConfirmation) {
    throw new PreferenceInferenceError("MY_EYES_PREFERENCE_AUTO_CONFIRMATION_FORBIDDEN", "New system-inferred candidates must start with human_confirmed=false.", { preference_id: candidate.preference_id });
  }
  if (candidate.human_confirmed === true && candidate.human_confirmation_event?.confirmed_by !== "HUMAN") {
    throw new PreferenceInferenceError("MY_EYES_PREFERENCE_HUMAN_CONFIRMATION_REQUIRED", "A human-confirmed revision requires an explicit HUMAN confirmation event.", { preference_id: candidate.preference_id });
  }
  if (candidate.created_by !== "SYSTEM_INFERENCE" || candidate.provenance?.asserted_by !== "SYSTEM_INFERENCE") {
    throw new PreferenceInferenceError("MY_EYES_PREFERENCE_AUTHORITY_INVALID", "Preference candidates must be attributed to SYSTEM_INFERENCE.", { preference_id: candidate.preference_id });
  }
}

export function appendPreferenceCandidates({ memory, candidates, now = () => new Date() }) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new PreferenceInferenceError("MY_EYES_PREFERENCE_CANDIDATES_REQUIRED", "At least one preference candidate is required.");
  }
  const next = upgradeMemoryForPreferenceCandidates(memory);
  assertValid(next, "MY_EYES_PREFERENCE_BASE_MEMORY_INVALID");
  const knownIds = new Set(next.inferred_preferences.map((item) => item.preference_id));
  for (const candidate of candidates) {
    assertSystemCandidate(candidate);
    if (knownIds.has(candidate.preference_id)) {
      throw new PreferenceInferenceError("MY_EYES_PREFERENCE_ID_DUPLICATE", "Preference candidate IDs are append-only and must be unique.", { preference_id: candidate.preference_id });
    }
    knownIds.add(candidate.preference_id);
    next.inferred_preferences.push(clone(candidate));
  }
  next.memory_version += 1;
  next.updated_at = now().toISOString();
  next.summary = calculatePreferenceMemorySummary(next);
  assertValid(next, "MY_EYES_PREFERENCE_APPEND_INVALID");
  return next;
}

export function appendPreferenceRevision({ memory, previousPreferenceId, revisedCandidate, now = () => new Date() }) {
  const next = upgradeMemoryForPreferenceCandidates(memory);
  assertValid(next, "MY_EYES_PREFERENCE_BASE_MEMORY_INVALID");
  const previous = next.inferred_preferences.find((item) => item.preference_id === previousPreferenceId);
  if (!previous) throw new PreferenceInferenceError("MY_EYES_PREFERENCE_PREDECESSOR_MISSING", "Cannot revise an unknown preference candidate.", { previousPreferenceId });
  if (previous.status === "SUPERSEDED") throw new PreferenceInferenceError("MY_EYES_PREFERENCE_PREDECESSOR_INACTIVE", "Cannot branch from an already superseded candidate.", { previousPreferenceId });
  assertSystemCandidate(revisedCandidate, { allowHumanConfirmation: true });
  if (next.inferred_preferences.some((item) => item.preference_id === revisedCandidate.preference_id)) {
    throw new PreferenceInferenceError("MY_EYES_PREFERENCE_ID_DUPLICATE", "A revision requires a new append-only preference_id.", { preference_id: revisedCandidate.preference_id });
  }
  if (revisedCandidate.version !== previous.version + 1 || revisedCandidate.supersedes !== previous.preference_id || !revisedCandidate.revision_reason) {
    throw new PreferenceInferenceError("MY_EYES_PREFERENCE_REVISION_LINK_INVALID", "A revision must increment version, reference its predecessor, and preserve why it changed.", { previousPreferenceId, preference_id: revisedCandidate.preference_id });
  }
  previous.status = "SUPERSEDED";
  next.inferred_preferences.push(clone(revisedCandidate));
  next.memory_version += 1;
  next.updated_at = now().toISOString();
  next.summary = calculatePreferenceMemorySummary(next);
  assertValid(next, "MY_EYES_PREFERENCE_REVISION_INVALID");
  return next;
}
