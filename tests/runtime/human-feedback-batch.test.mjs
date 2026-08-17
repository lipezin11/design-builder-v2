import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildApprovedDirectionMemory, ApprovedDirectionMemoryError } from "../../src/my-eyes/approved-direction-memory-indexer.mjs";
import { validateApprovedDirectionMemory } from "../../src/my-eyes/approved-direction-memory-loader.mjs";
import { applyInitialCandidateSignalHumanFeedback, initialDesignerFeedbackRawTexts } from "../../src/my-eyes/human-feedback-batch.mjs";

const fixedNow = () => new Date("2026-08-12T18:00:00.000Z");
const externalArtifact = {
  batch_id: "MYE_EXT_BATCH_000001",
  candidate_signals: [1, 2, 3, 4].map((index) => ({ signal_id: `MYE_EXT_SIG_${String(index).padStart(6, "0")}`, preference_status: "NOT_INFERRED" }))
};

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-builder-human-feedback-batch-"));
  for (const bucket of ["approved", "rejected", "pairs"]) fs.mkdirSync(path.join(root, "data", "my_eyes", bucket), { recursive: true });
  fs.writeFileSync(path.join(root, "data", "my_eyes", "rejected", "synthetic.png"), Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), Buffer.from("feedback-batch")]));
  return { root, memory: buildApprovedDirectionMemory({ rootDir: root, dataClassification: "SYNTHETIC_TEST_DATA", now: fixedNow }) };
}

function run() {
  const { root, memory } = fixture();
  const result = applyInitialCandidateSignalHumanFeedback({ memory, externalArtifact: structuredClone(externalArtifact), now: fixedNow });
  return { root, memory, result };
}

function cleanup(root) {
  const resolved = path.resolve(root);
  if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Refusing to clean non-temporary test data.");
  fs.rmSync(resolved, { recursive: true, force: true });
}

test("five Level 1 records preserve the literal human texts", () => {
  const { root, result } = run();
  try {
    assert.deepEqual(result.human_reasons.map((item) => item.raw_text), initialDesignerFeedbackRawTexts);
    assert.ok(result.human_reasons.every((item) => item.provenance.asserted_by === "HUMAN" && item.evidence_level === "LEVEL_1_HUMAN_REASON"));
    assert.ok(result.human_reasons.every((item) => item.related_image_ids.length === 0));
  } finally { cleanup(root); }
});

test("Level 2 interpretations remain unconfirmed SYSTEM assertions", () => {
  const { root, result } = run();
  try {
    assert.equal(result.structured_reasons.length, 5);
    assert.ok(result.structured_reasons.every((item) => item.structured_by === "SYSTEM" && item.provenance.asserted_by === "SYSTEM"));
    assert.ok(result.structured_reasons.every((item) => item.human_confirmation_status === "AWAITING_STRUCTURED_CONFIRMATION" && !item.confirmed_by_human));
    assert.deepEqual(result.structured_reasons.map((item) => item.human_evidence_status), ["HUMAN_REPORTED_CONCERN", "HUMAN_REPORTED_SIGNAL", "HUMAN_REPORTED_SIGNAL", "HUMAN_REPORTED_EXPERIENCE", "HUMAN_REPORTED_CONCERN"]);
  } finally { cleanup(root); }
});

test("HIGH_DENSITY remains correlation and does not become designer dislike", () => {
  const { root, result } = run();
  try {
    const review = result.candidate_signal_reviews.find((item) => item.candidate_signal_id === "MYE_EXT_SIG_000001");
    assert.equal(review.correlation_retained, true);
    assert.equal(review.human_causal_confirmation, "NOT_CONFIRMED");
    assert.ok(review.explicitly_not_claimed.includes("designer_dislikes_high_density"));
    assert.equal(result.memory.inferred_preferences.length, 0);
  } finally { cleanup(root); }
});

test("floating-element presence is not failure while poor execution is human-supported", () => {
  const { root, result } = run();
  try {
    const review = result.candidate_signal_reviews.find((item) => item.candidate_signal_id === "MYE_EXT_SIG_000004");
    assert.ok(review.explicitly_not_claimed.includes("floating_elements_present_is_a_failure"));
    assert.deepEqual(review.human_supported_conditions, ["poor_selection", "excessive_quantity", "poor_placement", "poor_positioning"]);
    assert.equal(review.human_causal_confirmation, "CONDITIONALLY_SUPPORTED");
  } finally { cleanup(root); }
});

test("typography overlap is not automatic failure while contextual rule violation is supported", () => {
  const { root, result } = run();
  try {
    const review = result.candidate_signal_reviews.find((item) => item.candidate_signal_id === "MYE_EXT_SIG_000003");
    assert.ok(review.explicitly_not_claimed.includes("typography_over_subject_is_a_failure"));
    assert.deepEqual(review.human_supported_conditions, ["typography_design_rule_violation"]);
  } finally { cleanup(root); }
});

test("weak hierarchy remains an observation but is not a confirmed primary cause", () => {
  const { root, result } = run();
  try {
    const review = result.candidate_signal_reviews.find((item) => item.candidate_signal_id === "MYE_EXT_SIG_000002");
    assert.equal(review.review_outcome, "OBSERVATION_RETAINED_PRIMARY_CAUSE_NOT_CONFIRMED");
    assert.equal(review.human_causal_confirmation, "NOT_CONFIRMED");
  } finally { cleanup(root); }
});

test("VISUAL_NON_CONVERGENCE is represented separately from WEAK_HIERARCHY", () => {
  const { root, result } = run();
  try {
    const concept = result.structured_reasons.find((item) => item.structured_concept === "VISUAL_NON_CONVERGENCE");
    assert.ok(concept);
    assert.ok(concept.explicitly_not_claimed.includes("visual_non_convergence_equals_weak_hierarchy"));
    assert.ok(concept.conditions.what_is_not_necessarily_bad.includes("basic hierarchy correctness"));
  } finally { cleanup(root); }
});

test("functionless microdetail accumulation does not prohibit detail richness", () => {
  const { root, result } = run();
  try {
    const concept = result.structured_reasons.find((item) => item.structured_concept === "FUNCTIONLESS_MICRODETAIL_ACCUMULATION");
    assert.deepEqual(concept.conditions.what_is_not_necessarily_bad, ["detail", "complexity", "richness", "micro effects"]);
    assert.ok(concept.explicitly_not_claimed.includes("detail_is_bad"));
    assert.equal(concept.functional_justification_dimensions.length, 8);
  } finally { cleanup(root); }
});

test("candidate v1 remains accessible and reviews append v2 references", () => {
  const { root, result } = run();
  try {
    assert.equal(externalArtifact.candidate_signals.length, 4);
    assert.ok(result.candidate_signal_reviews.every((item) => item.candidate_signal_version === 2 && item.supersedes_candidate_signal_version === 1));
    assert.ok(result.candidate_signal_reviews.every((item) => item.source_artifact_path.endsWith("normalized.json")));
  } finally { cleanup(root); }
});

test("batch creates zero pairs, scores, weights, or universal preferences", () => {
  const { root, result } = run();
  try {
    assert.equal(result.memory.pairwise_preferences.length, 0);
    assert.equal(result.memory.inferred_preferences.length, 0);
    assert.equal(result.report.universal_preference_rules_created, 0);
    assert.equal(JSON.stringify(result.memory).includes('"weight"'), false);
    assert.equal(JSON.stringify(result.memory).includes('"score"'), false);
  } finally { cleanup(root); }
});

test("system hypothesis remains unconfirmed and is not a preference", () => {
  const { root, result } = run();
  try {
    assert.equal(result.system_hypothesis.status, "HYPOTHESIS_REQUIRING_HUMAN_CONFIRMATION");
    assert.equal(result.system_hypothesis.human_confirmed, false);
    assert.equal(result.system_hypothesis.preference_status, "NOT_INFERRED");
    assert.equal(result.system_hypothesis.provenance.asserted_by, "SYSTEM");
  } finally { cleanup(root); }
});

test("duplicate application of the same human feedback batch is rejected", () => {
  const { root, result } = run();
  try {
    assert.throws(() => applyInitialCandidateSignalHumanFeedback({ memory: result.memory, externalArtifact, now: fixedNow }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_FEEDBACK_BATCH_DUPLICATE");
  } finally { cleanup(root); }
});

test("mutation: designer_dislikes_density cannot be introduced as a rule", () => {
  const { root, result } = run();
  try {
    const mutation = structuredClone(result.memory);
    mutation.candidate_signal_reviews[0].designer_dislikes_density = true;
    assert.equal(validateApprovedDirectionMemory(mutation).valid, false);
  } finally { cleanup(root); }
});

test("mutation: floating elements, typography overlap, and details cannot become forbidden policies", () => {
  const { root, result } = run();
  try {
    for (const [index, field, value] of [[3, "floating_elements", "FORBIDDEN"], [2, "typography_over_subject", "FORBIDDEN"], [0, "details", "MINIMAL_ONLY"]]) {
      const mutation = structuredClone(result.memory);
      mutation.candidate_signal_reviews[index][field] = value;
      assert.equal(validateApprovedDirectionMemory(mutation).valid, false);
    }
  } finally { cleanup(root); }
});

test("mutation: system concept names cannot replace literal human source text", () => {
  const { root, result } = run();
  try {
    for (const conceptName of ["VISUAL_NON_CONVERGENCE", "FUNCTIONLESS_MICRODETAIL_ACCUMULATION"]) {
      const mutation = structuredClone(result.memory);
      const structured = mutation.structured_human_reasons.find((item) => item.structured_concept === conceptName);
      structured.source_raw_text = conceptName;
      assert.equal(validateApprovedDirectionMemory(mutation).valid, false);
    }
  } finally { cleanup(root); }
});
