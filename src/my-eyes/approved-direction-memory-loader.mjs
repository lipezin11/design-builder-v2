import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { validateArtifact } from "../compiler/schema-validator.mjs";
import { ApprovedDirectionMemoryError } from "./approved-direction-memory-indexer.mjs";

const normalized = (value) => path.resolve(value).toLowerCase();
const duplicateValues = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
const sameReasonTarget = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function expectedSummary(memory) {
  const active = memory.human_decisions.filter((item) => item.status === "ACTIVE");
  return {
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
    ...(memory.candidate_signal_reviews ? { candidate_signal_review_count: memory.candidate_signal_reviews.length } : {}),
    ...(memory.system_hypotheses ? { system_hypothesis_count: memory.system_hypotheses.length } : {})
  };
}

function semanticErrors(memory, { rootDir, verifyFiles }) {
  const errors = [];
  const add = (code, message, details = {}) => errors.push({ code, message, details });
  const imageIds = memory.images.map((item) => item.image_id);
  const imageIdSet = new Set(imageIds);
  const hashes = memory.images.map((item) => item.sha256);
  const decisionIds = memory.human_decisions.map((item) => item.evidence_id);
  const reasonIds = memory.human_reasons.map((item) => item.reason_id);
  const structuredReasonIds = memory.structured_human_reasons.map((item) => item.structured_reason_id);
  const analysisIds = memory.visual_analyses.map((item) => item.analysis_id);
  const pairIds = memory.pairwise_preferences.map((item) => item.pair_id);
  const preferenceIds = memory.inferred_preferences.map((item) => item.preference_id);
  const reviewIds = (memory.candidate_signal_reviews ?? []).map((item) => item.review_id);
  const hypothesisIds = (memory.system_hypotheses ?? []).map((item) => item.hypothesis_id);
  const imagesById = new Map(memory.images.map((item) => [item.image_id, item]));
  const allEvidenceIds = new Set([...decisionIds, ...reasonIds, ...structuredReasonIds, ...analysisIds, ...pairIds, ...preferenceIds, ...reviewIds, ...hypothesisIds]);

  for (const [field, values] of Object.entries({ image_id: imageIds, sha256: hashes, evidence_id: [...decisionIds, ...reasonIds, ...structuredReasonIds, ...analysisIds, ...pairIds, ...preferenceIds, ...reviewIds, ...hypothesisIds] })) {
    const duplicates = duplicateValues(values);
    if (duplicates.length) add("MY_EYES_DUPLICATE_IDENTITY", `Duplicate ${field} values are forbidden.`, { field, duplicates });
  }

  const decisionsById = new Map(memory.human_decisions.map((item) => [item.evidence_id, item]));
  for (const image of memory.images) {
    const activeForImage = memory.human_decisions.filter((item) => item.image_id === image.image_id && item.status === "ACTIVE");
    if (activeForImage.length !== 1) add("MY_EYES_ACTIVE_DECISION_COUNT_INVALID", "Each image must have exactly one active human decision.", { image_id: image.image_id, count: activeForImage.length });
    const decision = decisionsById.get(image.current_decision_evidence_id);
    if (!decision || decision.status !== "ACTIVE" || decision.image_id !== image.image_id) {
      add("MY_EYES_CURRENT_DECISION_INVALID", "An image must point to one active human decision for itself.", { image_id: image.image_id });
    } else if (decision.decision !== image.source_bucket) {
      add("MY_EYES_DIRECTORY_DECISION_MISMATCH", "The active human decision must match the approved/rejected source bucket.", { image_id: image.image_id });
    }
  }

  for (const decision of memory.human_decisions) {
    if (!imageIdSet.has(decision.image_id)) add("MY_EYES_DECISION_IMAGE_MISSING", "Human decision references an unknown image.", { evidence_id: decision.evidence_id });
    if (decision.provenance.asserted_by !== "HUMAN") add("MY_EYES_HUMAN_AUTHORITY_LOST", "Level 0 decisions must be asserted by HUMAN.", { evidence_id: decision.evidence_id });
  }

  const pairIdSet = new Set(pairIds);
  const reasonsById = new Map(memory.human_reasons.map((item) => [item.reason_id, item]));
  for (const reason of memory.human_reasons) {
    const targetValid = reason.target.image_id ? imageIdSet.has(reason.target.image_id) : reason.target.pair_id ? pairIdSet.has(reason.target.pair_id) : Boolean(reason.target.context_scope && reason.target.context_ref);
    if (!targetValid) add("MY_EYES_REASON_TARGET_MISSING", "Human reason references an unknown image or pair.", { reason_id: reason.reason_id });
    if (reason.provenance.asserted_by !== "HUMAN") add("MY_EYES_REASON_NOT_HUMAN", "Literal human reasons must be asserted by HUMAN.", { reason_id: reason.reason_id });
    if (reason.raw_text_sha256 && crypto.createHash("sha256").update(reason.raw_text, "utf8").digest("hex") !== reason.raw_text_sha256) add("MY_EYES_REASON_RAW_TEXT_HASH_MISMATCH", "Literal human reason hash must match raw_text exactly.", { reason_id: reason.reason_id });
    for (const relatedImageId of reason.related_image_ids ?? []) if (!imageIdSet.has(relatedImageId)) add("MY_EYES_REASON_RELATED_IMAGE_MISSING", "Human reason references an unknown related image.", { reason_id: reason.reason_id, image_id: relatedImageId });
    if (reason.version > 1) {
      const previous = reasonsById.get(reason.supersedes_reason_id);
      if (!previous || previous.status !== "SUPERSEDED" || previous.version + 1 !== reason.version || !sameReasonTarget(previous.target, reason.target)) add("MY_EYES_REASON_HISTORY_INVALID", "A corrected reason must preserve its superseded predecessor and target.", { reason_id: reason.reason_id });
    }
  }
  for (const image of memory.images) {
    const decision = decisionsById.get(image.current_decision_evidence_id);
    const expectedReasonFlag = memory.human_reasons.some((reason) => reason.status === "ACTIVE" && reason.target.image_id === image.image_id);
    if (decision && decision.reason_provided !== expectedReasonFlag) add("MY_EYES_DECISION_REASON_FLAG_MISMATCH", "The active decision reason_provided flag must reflect active human reasons for its image.", { image_id: image.image_id, expected: expectedReasonFlag, actual: decision.reason_provided });
  }

  const reasonIdSet = new Set(reasonIds);
  const structuredById = new Map(memory.structured_human_reasons.map((item) => [item.structured_reason_id, item]));
  for (const structured of memory.structured_human_reasons) {
    const raw = reasonsById.get(structured.human_reason_id);
    if (!reasonIdSet.has(structured.human_reason_id)) add("MY_EYES_RAW_REASON_MISSING", "Structured human reason must retain a reference to its raw human reason.", { structured_reason_id: structured.structured_reason_id });
    if (structured.status === "ACTIVE" && raw?.status !== "ACTIVE") add("MY_EYES_STRUCTURED_REASON_RAW_NOT_ACTIVE", "An active structured reason requires an active raw human reason.", { structured_reason_id: structured.structured_reason_id });
    if (structured.structured_by === "AI" && structured.provenance.asserted_by !== "AI") add("MY_EYES_STRUCTURED_REASON_IMPERSONATES_HUMAN", "AI-structured reasons must remain asserted by AI.", { structured_reason_id: structured.structured_reason_id });
    if (structured.structured_by === "SYSTEM" && (structured.provenance.asserted_by !== "SYSTEM" || structured.confirmed_by_human !== false)) add("MY_EYES_SYSTEM_STRUCTURE_AUTHORITY_INVALID", "System structured reasons must remain unconfirmed SYSTEM interpretations.", { structured_reason_id: structured.structured_reason_id });
    if (structured.source_raw_text !== undefined && structured.source_raw_text !== raw?.raw_text) add("MY_EYES_STRUCTURED_SOURCE_TEXT_MISMATCH", "Structured interpretation must preserve the exact source raw_text separately.", { structured_reason_id: structured.structured_reason_id });
    if (structured.structured_by === "HUMAN" && (structured.provenance.asserted_by !== "HUMAN" || !structured.confirmed_by_human)) add("MY_EYES_STRUCTURED_REASON_HUMAN_INVALID", "Human-structured reasons require human authority and confirmation.", { structured_reason_id: structured.structured_reason_id });
    if (structured.version > 1) {
      const previous = structuredById.get(structured.supersedes_structured_reason_id);
      if (!previous || previous.status !== "SUPERSEDED" || previous.version + 1 !== structured.version || previous.human_reason_id !== structured.human_reason_id) add("MY_EYES_STRUCTURED_REASON_HISTORY_INVALID", "A structured correction must preserve its superseded predecessor and raw reason.", { structured_reason_id: structured.structured_reason_id });
    }
  }
  for (const reasonId of reasonIds) {
    const activeCount = memory.structured_human_reasons.filter((item) => item.human_reason_id === reasonId && item.status === "ACTIVE").length;
    if (activeCount > 1) add("MY_EYES_STRUCTURED_REASON_ACTIVE_DUPLICATE", "A raw reason can have at most one active structured representation.", { human_reason_id: reasonId, count: activeCount });
  }

  const analysisVersions = new Set();
  for (const analysis of memory.visual_analyses) {
    const image = imagesById.get(analysis.image_id);
    if (!image) add("MY_EYES_ANALYSIS_IMAGE_MISSING", "Visual analysis references an unknown image.", { analysis_id: analysis.analysis_id });
    else if (analysis.image_sha256 !== image.sha256) add("MY_EYES_ANALYSIS_SHA_MISMATCH", "Visual analysis SHA-256 must match its indexed image.", { analysis_id: analysis.analysis_id, image_id: analysis.image_id });
    const versionKey = `${analysis.image_id}@${analysis.analysis_version}`;
    if (analysisVersions.has(versionKey)) add("MY_EYES_ANALYSIS_VERSION_DUPLICATE", "An image cannot have two visual analyses with the same version.", { analysis_id: analysis.analysis_id, image_id: analysis.image_id, analysis_version: analysis.analysis_version });
    analysisVersions.add(versionKey);
    if (analysis.blind_analysis !== true || analysis.label_visible_during_analysis !== false) {
      add("MY_EYES_ANALYSIS_NOT_BLIND", "Visual analysis must be blind and must not expose the human label during observation.", { analysis_id: analysis.analysis_id });
    }
    if (analysis.human_preference_claim !== false || analysis.provenance.asserted_by !== "MULTIMODAL_ANALYZER") {
      add("MY_EYES_ANALYSIS_AUTHORITY_INVALID", "Visual analysis cannot claim human preference or human authority.", { analysis_id: analysis.analysis_id });
    }
  }

  const pairsById = new Map(memory.pairwise_preferences.map((item) => [item.pair_id, item]));
  const activePairKeys = new Set();
  for (const pair of memory.pairwise_preferences) {
    if (!imageIdSet.has(pair.left_image_id) || !imageIdSet.has(pair.right_image_id)) add("MY_EYES_PAIR_IMAGE_MISSING", "Pairwise evidence references an unknown image.", { pair_id: pair.pair_id });
    if (pair.left_image_id === pair.right_image_id) add("MY_EYES_PAIR_SELF_COMPARISON", "A pair must contain two distinct images.", { pair_id: pair.pair_id });
    const expectedPreferred = pair.result === "LEFT_PREFERRED" ? pair.left_image_id : pair.result === "RIGHT_PREFERRED" ? pair.right_image_id : null;
    if (pair.preferred_image_id !== expectedPreferred) add("MY_EYES_PAIR_RESULT_MISMATCH", "Pairwise result and preferred image do not agree.", { pair_id: pair.pair_id });
    if (!pair.explicitly_compared_by_human || pair.provenance.asserted_by !== "HUMAN") add("MY_EYES_PAIR_NOT_HUMAN", "Pairwise evidence requires an explicit human comparison.", { pair_id: pair.pair_id });
    const key = [pair.left_image_id, pair.right_image_id].sort().join("::");
    if (pair.status === "ACTIVE" && activePairKeys.has(key)) add("MY_EYES_PAIR_DUPLICATE", "Only one active comparison may exist for an unordered image pair.", { pair_id: pair.pair_id });
    if (pair.status === "ACTIVE") activePairKeys.add(key);
    if (pair.version > 1) {
      const previous = pairsById.get(pair.supersedes_pair_id);
      const sameImages = previous && [previous.left_image_id, previous.right_image_id].sort().join("::") === key;
      if (!previous || previous.status !== "SUPERSEDED" || previous.version + 1 !== pair.version || !sameImages) add("MY_EYES_PAIR_HISTORY_INVALID", "A corrected pair must preserve its superseded predecessor and image identities.", { pair_id: pair.pair_id });
    }
    for (const reasonId of pair.human_reason_ids) {
      const reason = reasonsById.get(reasonId);
      if (!reason) add("MY_EYES_PAIR_REASON_MISSING", "Pair references an unknown human reason.", { pair_id: pair.pair_id, reason_id: reasonId });
      else if (reason.target.pair_id !== pair.pair_id) add("MY_EYES_PAIR_REASON_TARGET_MISMATCH", "A pair reason must target the same pair.", { pair_id: pair.pair_id, reason_id: reasonId });
    }
  }

  const reviewsById = new Map((memory.candidate_signal_reviews ?? []).map((item) => [item.review_id, item]));
  const activeReviewSignals = new Set();
  for (const review of memory.candidate_signal_reviews ?? []) {
    for (const reasonId of review.related_human_reason_ids) if (!reasonIdSet.has(reasonId)) add("MY_EYES_CANDIDATE_REVIEW_REASON_MISSING", "Candidate signal review references an unknown human reason.", { review_id: review.review_id, reason_id: reasonId });
    if (review.preference_status !== "NOT_INFERRED" || review.universal_rule_created !== false) add("MY_EYES_CANDIDATE_REVIEW_CREATED_PREFERENCE", "Candidate review cannot create a universal preference or rule.", { review_id: review.review_id });
    if (review.provenance.asserted_by !== "SYSTEM") add("MY_EYES_CANDIDATE_REVIEW_AUTHORITY_INVALID", "Candidate review is a SYSTEM interpretation of human evidence.", { review_id: review.review_id });
    if (review.status === "ACTIVE" && activeReviewSignals.has(review.candidate_signal_id)) add("MY_EYES_CANDIDATE_REVIEW_ACTIVE_DUPLICATE", "A candidate signal can have only one active review.", { candidate_signal_id: review.candidate_signal_id });
    if (review.status === "ACTIVE") activeReviewSignals.add(review.candidate_signal_id);
    if (review.candidate_signal_version > 2) {
      const previous = reviewsById.get(review.supersedes_review_id);
      if (!previous || previous.status !== "SUPERSEDED" || previous.candidate_signal_id !== review.candidate_signal_id || previous.candidate_signal_version + 1 !== review.candidate_signal_version) add("MY_EYES_CANDIDATE_REVIEW_HISTORY_INVALID", "A candidate review revision must preserve its superseded predecessor and signal identity.", { review_id: review.review_id });
    }
  }

  const hypothesesById = new Map((memory.system_hypotheses ?? []).map((item) => [item.hypothesis_id, item]));
  for (const hypothesis of memory.system_hypotheses ?? []) {
    for (const reasonId of hypothesis.related_human_reason_ids) if (!reasonIdSet.has(reasonId)) add("MY_EYES_HYPOTHESIS_REASON_MISSING", "System hypothesis references an unknown human reason.", { hypothesis_id: hypothesis.hypothesis_id, reason_id: reasonId });
    if (hypothesis.human_confirmed !== false || hypothesis.preference_status !== "NOT_INFERRED" || hypothesis.provenance.asserted_by !== "SYSTEM") add("MY_EYES_HYPOTHESIS_AUTHORITY_INVALID", "System hypotheses must remain non-preference SYSTEM interpretations even when partially confirmed.", { hypothesis_id: hypothesis.hypothesis_id });
    if ((hypothesis.version ?? 1) > 1) {
      const previous = hypothesesById.get(hypothesis.supersedes_hypothesis_id);
      const correctionReason = reasonsById.get(hypothesis.correction_reason_id);
      if (!previous || previous.record_status !== "SUPERSEDED" || (previous.version ?? 1) + 1 !== hypothesis.version) add("MY_EYES_HYPOTHESIS_HISTORY_INVALID", "A corrected hypothesis must preserve its superseded predecessor.", { hypothesis_id: hypothesis.hypothesis_id });
      if (!correctionReason || correctionReason.target.context_scope !== "SYSTEM_HYPOTHESIS_REVIEW" || correctionReason.target.context_ref !== previous?.hypothesis_id) add("MY_EYES_HYPOTHESIS_CORRECTION_REASON_INVALID", "A corrected hypothesis requires literal human feedback targeting its predecessor.", { hypothesis_id: hypothesis.hypothesis_id });
    }
  }
  const versionedHypotheses = (memory.system_hypotheses ?? []).filter((item) => item.record_status);
  if (versionedHypotheses.length && versionedHypotheses.filter((item) => item.record_status === "ACTIVE").length !== 1) add("MY_EYES_HYPOTHESIS_ACTIVE_COUNT_INVALID", "Versioned hypotheses must retain exactly one active record.");
  const rawEvidenceIds = new Set([...decisionIds, ...reasonIds, ...structuredReasonIds, ...analysisIds, ...pairIds, ...reviewIds, ...hypothesisIds]);
  const humanEvidenceIdSet = new Set([...decisionIds, ...reasonIds]);
  const analysisIdSet = new Set(analysisIds);
  const hypothesisIdSet = new Set(hypothesisIds);
  const candidateSignalIds = new Set((memory.candidate_signal_reviews ?? []).map((item) => item.candidate_signal_id));
  const preferenceById = new Map(memory.inferred_preferences.map((item) => [item.preference_id, item]));
  const supersededTargets = new Set();
  const prohibitedClaimPatterns = [
    /designer\s+(dislikes?|hates?)\s+(high\s+)?complexity/i,
    /(high\s+)?complexity\s*(is|=)\s*bad/i,
    /(cards?|floating[ _-]?elements?|particles?|details?)\s*(are|is|=)\s*(forbidden|bad)/i,
    /realism\s*(is|=)\s*(irrelevant|unimportant)/i,
    /(more|high|maximum)\s+(saturation|contrast)\s*(is|=|means)\s*better/i,
    /max(imum)?[ _-]?(elements?|element[ _-]?count)/i
  ];
  for (const preference of memory.inferred_preferences) {
    const supporting = new Set(preference.supporting_evidence_refs);
    const contradicting = new Set(preference.contradicting_evidence_refs);
    for (const evidenceId of [...supporting, ...contradicting]) {
      if (!rawEvidenceIds.has(evidenceId)) add("MY_EYES_INFERENCE_EVIDENCE_MISSING", "Preference candidate references unknown or non-evidence input.", { preference_id: preference.preference_id, evidence_id: evidenceId });
    }
    for (const evidenceId of supporting) if (contradicting.has(evidenceId)) add("MY_EYES_INFERENCE_EVIDENCE_RELATION_CONFLICT", "The same evidence cannot both support and contradict one candidate version.", { preference_id: preference.preference_id, evidence_id: evidenceId });
    for (const evidenceId of preference.human_evidence_refs) if (!humanEvidenceIdSet.has(evidenceId)) add("MY_EYES_INFERENCE_HUMAN_REF_INVALID", "human_evidence_refs must point to literal human reasons or labels.", { preference_id: preference.preference_id, evidence_id: evidenceId });
    for (const evidenceId of preference.visual_evidence_refs) if (!analysisIdSet.has(evidenceId)) add("MY_EYES_INFERENCE_VISUAL_REF_INVALID", "visual_evidence_refs must point to visual analyses.", { preference_id: preference.preference_id, evidence_id: evidenceId });
    for (const evidenceId of preference.pairwise_refs) if (!pairIdSet.has(evidenceId)) add("MY_EYES_INFERENCE_PAIR_REF_INVALID", "pairwise_refs must point to explicit human pairwise evidence.", { preference_id: preference.preference_id, evidence_id: evidenceId });
    for (const evidenceId of preference.hypothesis_refs) if (!hypothesisIdSet.has(evidenceId)) add("MY_EYES_INFERENCE_HYPOTHESIS_REF_INVALID", "hypothesis_refs must point to system hypotheses.", { preference_id: preference.preference_id, evidence_id: evidenceId });
    for (const signalId of preference.candidate_signal_refs) if (!candidateSignalIds.has(signalId)) add("MY_EYES_INFERENCE_SIGNAL_REF_INVALID", "candidate_signal_refs must point to a reviewed external candidate signal.", { preference_id: preference.preference_id, signal_id: signalId });
    for (const evidenceId of [...preference.human_evidence_refs, ...preference.visual_evidence_refs, ...preference.pairwise_refs, ...preference.hypothesis_refs]) {
      if (!supporting.has(evidenceId) && !contradicting.has(evidenceId)) add("MY_EYES_INFERENCE_TYPED_REF_UNLINKED", "Typed evidence refs must be classified as supporting or contradicting.", { preference_id: preference.preference_id, evidence_id: evidenceId });
    }
    const groupIds = preference.independent_evidence_groups.map((item) => item.group_id);
    if (duplicateValues(groupIds).length) add("MY_EYES_INFERENCE_GROUP_DUPLICATE", "Independent evidence group IDs must be unique.", { preference_id: preference.preference_id });
    const groupedRefs = new Set();
    let directHumanGroups = 0;
    for (const group of preference.independent_evidence_groups) {
      let containsDirectHuman = false;
      for (const evidenceId of group.evidence_refs) {
        if (!supporting.has(evidenceId)) add("MY_EYES_INFERENCE_GROUP_REF_INVALID", "Independent groups may contain only supporting evidence.", { preference_id: preference.preference_id, group_id: group.group_id, evidence_id: evidenceId });
        if (groupedRefs.has(evidenceId)) add("MY_EYES_INFERENCE_GROUPS_NOT_INDEPENDENT", "One evidence record cannot establish two independent groups.", { preference_id: preference.preference_id, evidence_id: evidenceId });
        groupedRefs.add(evidenceId);
        if (humanEvidenceIdSet.has(evidenceId) || pairIdSet.has(evidenceId)) containsDirectHuman = true;
      }
      if (containsDirectHuman) directHumanGroups += 1;
    }
    if (directHumanGroups < 2) add("MY_EYES_INFERENCE_CONVERGENCE_INSUFFICIENT", "A preference candidate requires at least two independent direct-human evidence groups.", { preference_id: preference.preference_id, direct_human_groups: directHumanGroups });
    if (preference.confidence === "HIGH" && directHumanGroups < 3) add("MY_EYES_INFERENCE_HIGH_CONFIDENCE_UNSUPPORTED", "HIGH confidence requires at least three independent direct-human evidence groups.", { preference_id: preference.preference_id, direct_human_groups: directHumanGroups });
    for (const imageId of preference.sample_context.image_ids) if (!imageIdSet.has(imageId)) add("MY_EYES_INFERENCE_SAMPLE_IMAGE_MISSING", "sample_context references an unknown image.", { preference_id: preference.preference_id, image_id: imageId });
    for (const pairId of preference.sample_context.pair_ids) if (!pairIdSet.has(pairId)) add("MY_EYES_INFERENCE_SAMPLE_PAIR_MISSING", "sample_context references unknown pairwise evidence.", { preference_id: preference.preference_id, pair_id: pairId });
    if (preference.human_confirmed === true) {
      const confirmationRef = preference.human_confirmation_event?.raw_human_evidence_ref;
      if (!confirmationRef || !humanEvidenceIdSet.has(confirmationRef)) add("MY_EYES_INFERENCE_HUMAN_CONFIRMATION_INVALID", "A confirmed generalization requires an explicit HUMAN evidence event.", { preference_id: preference.preference_id });
    }
    if (preference.provenance.asserted_by !== "SYSTEM_INFERENCE" || preference.created_by !== "SYSTEM_INFERENCE") add("MY_EYES_INFERENCE_AUTHORITY_INVALID", "Preference candidates must remain SYSTEM_INFERENCE generalizations.", { preference_id: preference.preference_id });
    const claimText = [preference.statement, preference.scope, ...preference.conditions].join(" ");
    for (const pattern of prohibitedClaimPatterns) if (pattern.test(claimText)) add("MY_EYES_INFERENCE_FORBIDDEN_GENERALIZATION", "A nuanced candidate cannot be collapsed into a prohibited hard rule.", { preference_id: preference.preference_id, pattern: pattern.source });
    if (preference.version > 1) {
      const previous = preferenceById.get(preference.supersedes);
      if (!previous || previous.status !== "SUPERSEDED" || previous.version + 1 !== preference.version) add("MY_EYES_INFERENCE_HISTORY_INVALID", "A revised preference must append a version that points to its preserved superseded predecessor.", { preference_id: preference.preference_id });
      if (supersededTargets.has(preference.supersedes)) add("MY_EYES_INFERENCE_HISTORY_FORKED", "One preference version cannot be superseded by multiple active revisions.", { preference_id: preference.preference_id, supersedes: preference.supersedes });
      supersededTargets.add(preference.supersedes);
    }
  }

  for (const image of memory.images) {
    const expectedImageFlag = memory.visual_analyses.some((analysis) => analysis.image_id === image.image_id);
    if (image.visual_content_analyzed !== expectedImageFlag) add("MY_EYES_IMAGE_VISUAL_STATUS_MISMATCH", "Each image visual_content_analyzed flag must reflect its own analysis records.", { image_id: image.image_id, expected: expectedImageFlag, actual: image.visual_content_analyzed });
  }
  const expectedVisualFlag = memory.visual_analyses.length > 0;
  if (memory.visual_content_analyzed !== expectedVisualFlag) add("MY_EYES_VISUAL_STATUS_MISMATCH", "visual_content_analyzed must reflect whether visual analyses exist.");
  const summary = expectedSummary(memory);
  for (const [key, expected] of Object.entries(summary)) {
    if (memory.summary[key] !== expected) add("MY_EYES_SUMMARY_MISMATCH", "Manifest summary is inconsistent.", { field: key, expected, actual: memory.summary[key] });
  }

  if (verifyFiles) {
    if (!rootDir) add("MY_EYES_VERIFY_ROOT_REQUIRED", "rootDir is required when verifyFiles is true.");
    else {
      const root = normalized(rootDir);
      for (const image of memory.images.filter((item) => item.availability === "AVAILABLE")) {
        const fullPath = path.resolve(rootDir, ...image.source_path.split("/"));
        if (!normalized(fullPath).startsWith(`${root}${path.sep}`)) {
          add("MY_EYES_UNSAFE_SOURCE_PATH", "Image source path escapes the memory root.", { image_id: image.image_id, source_path: image.source_path });
          continue;
        }
        if (!fs.existsSync(fullPath)) {
          add("MY_EYES_IMAGE_BYTES_MISSING", "Available image bytes are missing.", { image_id: image.image_id, source_path: image.source_path });
          continue;
        }
        const bytes = fs.readFileSync(fullPath);
        const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
        if (sha256 !== image.sha256 || bytes.length !== image.byte_size) {
          add("MY_EYES_IMAGE_BYTES_CHANGED", "Image bytes no longer match the indexed identity.", { image_id: image.image_id, source_path: image.source_path });
        }
      }
      for (const analysis of memory.visual_analyses) {
        const fullPath = path.resolve(rootDir, ...analysis.record_path.split("/"));
        if (!normalized(fullPath).startsWith(`${root}${path.sep}`)) {
          add("MY_EYES_UNSAFE_ANALYSIS_PATH", "Visual analysis record path escapes the memory root.", { analysis_id: analysis.analysis_id, record_path: analysis.record_path });
          continue;
        }
        if (!fs.existsSync(fullPath)) {
          add("MY_EYES_ANALYSIS_RECORD_MISSING", "Visual analysis record is missing.", { analysis_id: analysis.analysis_id, record_path: analysis.record_path });
          continue;
        }
        let record;
        try {
          record = JSON.parse(fs.readFileSync(fullPath, "utf8"));
        } catch (error) {
          add("MY_EYES_ANALYSIS_RECORD_UNREADABLE", "Visual analysis record is not valid JSON.", { analysis_id: analysis.analysis_id, record_path: analysis.record_path, reason: error.message });
          continue;
        }
        const validation = validateArtifact("visual_analysis_record", record);
        if (!validation.valid) {
          add("MY_EYES_ANALYSIS_RECORD_SCHEMA_INVALID", "Visual analysis record failed schema validation.", { analysis_id: analysis.analysis_id, errors: validation.errors });
          continue;
        }
        const mismatches = ["analysis_id", "image_id", "image_sha256", "analysis_version", "analyzed_at", "blind_analysis", "label_visible_during_analysis"]
          .filter((field) => record[field] !== analysis[field]);
        if (JSON.stringify(record.analyzer) !== JSON.stringify(analysis.analyzer)) mismatches.push("analyzer");
        if (record.human_decision_context_used !== false || record.semantic_boundaries.human_reason_written !== false || record.semantic_boundaries.general_quality_judgment_performed !== false || record.semantic_boundaries.designer_preference_inferred !== false || record.semantic_boundaries.pairwise_inference_performed !== false || record.provenance.asserted_by !== "MULTIMODAL_ANALYZER") mismatches.push("semantic_boundaries_or_provenance");
        if (mismatches.length) add("MY_EYES_ANALYSIS_RECORD_MISMATCH", "Visual analysis record does not match its manifest reference or semantic boundary.", { analysis_id: analysis.analysis_id, mismatches });
      }
    }
  }
  return errors;
}

export function validateApprovedDirectionMemory(memory, options = {}) {
  const schema = validateArtifact("approved_direction_memory", memory);
  const errors = schema.valid ? semanticErrors(memory, options) : schema.errors.map((error) => ({
    code: "MY_EYES_SCHEMA_INVALID",
    message: error.message ?? "Schema validation failed.",
    details: error
  }));
  return { valid: errors.length === 0, errors };
}

export function loadApprovedDirectionMemory(manifestPath, options = {}) {
  const memory = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const result = validateApprovedDirectionMemory(memory, options);
  if (!result.valid) throw new ApprovedDirectionMemoryError("MY_EYES_MEMORY_INVALID", "Approved Direction Memory validation failed.", { errors: result.errors });
  return memory;
}

export function createPreferenceEvidencePreparation(memory) {
  const result = validateApprovedDirectionMemory(memory);
  if (!result.valid) throw new ApprovedDirectionMemoryError("MY_EYES_MEMORY_INVALID", "Cannot prepare evidence links from invalid memory.", { errors: result.errors });
  const latestByImage = new Map();
  for (const analysis of memory.visual_analyses) {
    const previous = latestByImage.get(analysis.image_id);
    if (!previous || analysis.analysis_version > previous.analysis_version) latestByImage.set(analysis.image_id, analysis);
  }
  const pairById = new Map(memory.pairwise_preferences.map((pair) => [pair.pair_id, pair]));
  const refsFor = (imageIds) => imageIds.map((imageId) => latestByImage.get(imageId)).filter(Boolean).map((analysis) => ({ analysis_id: analysis.analysis_id, image_id: analysis.image_id, image_sha256: analysis.image_sha256, analysis_version: analysis.analysis_version, record_path: analysis.record_path }));
  return {
    stage: "PREFERENCE_EVIDENCE_PREPARATION",
    causality_inferred: false,
    preference_inferred: false,
    human_reason_observation_links: memory.human_reasons.map((reason) => {
      const pair = reason.target.pair_id ? pairById.get(reason.target.pair_id) : null;
      const imageIds = reason.target.image_id ? [reason.target.image_id] : pair ? [pair.left_image_id, pair.right_image_id] : [];
      return { reason_id: reason.reason_id, reason_status: reason.status, image_ids: imageIds, visual_analysis_refs: refsFor(imageIds), relationship_status: "UNASSESSED", causality_inferred: false };
    }),
    pair_observation_links: memory.pairwise_preferences.map((pair) => ({ pair_id: pair.pair_id, pair_status: pair.status, image_ids: [pair.left_image_id, pair.right_image_id], visual_analysis_refs: refsFor([pair.left_image_id, pair.right_image_id]), relationship_status: "UNASSESSED", causality_inferred: false }))
  };
}

export function createMyEyesEvidenceView(memory) {
  const result = validateApprovedDirectionMemory(memory);
  if (!result.valid) throw new ApprovedDirectionMemoryError("MY_EYES_MEMORY_INVALID", "Cannot create a My Eyes view from invalid memory.", { errors: result.errors });
  return {
    scope: "DESIGNER_PREFERENCE",
    human_truth: {
      decisions: structuredClone(memory.human_decisions),
      reasons: structuredClone(memory.human_reasons),
      structured_reasons: structuredClone(memory.structured_human_reasons),
      pairwise_preferences: structuredClone(memory.pairwise_preferences)
    },
    ai_observation: {
      visual_analyses: structuredClone(memory.visual_analyses)
    },
    inferred_preference: {
      patterns: structuredClone(memory.inferred_preferences)
    },
    evidence_preparation: createPreferenceEvidencePreparation(memory),
    boundaries: structuredClone(memory.semantic_boundaries)
  };
}
