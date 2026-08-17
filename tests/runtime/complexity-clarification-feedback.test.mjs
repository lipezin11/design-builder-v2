import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildApprovedDirectionMemory, ApprovedDirectionMemoryError } from "../../src/my-eyes/approved-direction-memory-indexer.mjs";
import { validateApprovedDirectionMemory } from "../../src/my-eyes/approved-direction-memory-loader.mjs";
import { applyInitialCandidateSignalHumanFeedback } from "../../src/my-eyes/human-feedback-batch.mjs";
import { applyComplexityClarificationFeedback, complexityClarificationRawText } from "../../src/my-eyes/complexity-clarification-feedback.mjs";

const fixedNow = () => new Date("2026-08-15T15:00:00.000Z");
const externalArtifact = { batch_id: "MYE_EXT_BATCH_000001", candidate_signals: [1,2,3,4].map((index) => ({ signal_id: `MYE_EXT_SIG_${String(index).padStart(6, "0")}`, preference_status: "NOT_INFERRED" })) };

function run() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-builder-complexity-clarification-"));
  for (const bucket of ["approved", "rejected", "pairs"]) fs.mkdirSync(path.join(root, "data", "my_eyes", bucket), { recursive: true });
  fs.writeFileSync(path.join(root, "data", "my_eyes", "approved", "synthetic.png"), Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), Buffer.from("complexity-clarification")]));
  const memory = buildApprovedDirectionMemory({ rootDir: root, dataClassification: "SYNTHETIC_TEST_DATA", now: fixedNow });
  const initial = applyInitialCandidateSignalHumanFeedback({ memory, externalArtifact, now: fixedNow });
  const result = applyComplexityClarificationFeedback({ memory: initial.memory, now: fixedNow });
  return { root, initial, result };
}

function cleanup(root) {
  const resolved = path.resolve(root);
  if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Refusing to clean non-temporary test data.");
  fs.rmSync(resolved, { recursive: true, force: true });
}

test("the complete clarification is preserved as literal HUMAN Level 1 evidence", () => {
  const { root, result } = run();
  try {
    assert.equal(result.human_reason.raw_text, complexityClarificationRawText);
    assert.equal(result.human_reason.raw_text_sha256, crypto.createHash("sha256").update(complexityClarificationRawText).digest("hex"));
    assert.equal(result.human_reason.provenance.asserted_by, "HUMAN");
    assert.deepEqual(result.human_reason.related_image_ids, []);
  } finally { cleanup(root); }
});

test("MYE_HYP_000001 is preserved and superseded by a partially confirmed correction", () => {
  const { root, result } = run();
  try {
    const previous = result.memory.system_hypotheses.find((item) => item.hypothesis_id === "MYE_HYP_000001");
    assert.equal(previous.record_status, "SUPERSEDED");
    assert.equal(previous.version, 1);
    assert.equal(result.corrected_hypothesis.supersedes_hypothesis_id, previous.hypothesis_id);
    assert.equal(result.corrected_hypothesis.status, "PARTIALLY_CONFIRMED_WITH_CORRECTION");
    assert.equal(result.corrected_hypothesis.human_confirmation_status, "PARTIALLY_CONFIRMED_WITH_CORRECTION");
    assert.equal(result.corrected_hypothesis.record_status, "ACTIVE");
  } finally { cleanup(root); }
});

test("the canonical axis is controlled intentional versus artificial uncontrolled complexity", () => {
  const { root, result } = run();
  try {
    assert.equal(result.structured_reason.structured_concept, "CONTROLLED_VS_ARTIFICIAL_COMPLEXITY");
    assert.deepEqual(result.structured_reason.evaluation_axis, { positive_pole: "CONTROLLED_INTENTIONAL_COMPLEXITY", negative_pole: "ARTIFICIAL_UNCONTROLLED_COMPLEXITY", fixed_quantitative_limit: false, quantity_is_decisive: false });
    assert.equal(result.structured_reason.human_evidence_status, "HUMAN_CONFIRMED_CLARIFICATION");
  } finally { cleanup(root); }
});

test("high complexity and many elements are explicitly not failures", () => {
  const { root, result } = run();
  try {
    assert.ok(result.structured_reason.conditions.what_is_not_necessarily_bad.includes("high complexity"));
    assert.ok(result.structured_reason.conditions.what_is_not_necessarily_bad.includes("many elements"));
    assert.ok(result.structured_reason.explicitly_not_claimed.includes("high_complexity_is_bad"));
    assert.ok(result.structured_reason.explicitly_not_claimed.includes("a_fixed_maximum_element_count_exists"));
  } finally { cleanup(root); }
});

test("functional controlled complexity records the human-supported positive conditions", () => {
  const { root, result } = run();
  try {
    const review = result.density_review_v3;
    assert.deepEqual(review.human_supported_conditions, ["functional_purpose", "controlled_positioning", "mutual_coherence", "shared_visual_logic", "perceptual_convergence"]);
    assert.equal(review.human_causal_confirmation, "HUMAN_CLARIFIED");
  } finally { cleanup(root); }
});

test("perceptual excess is separated from element count", () => {
  const { root, result } = run();
  try {
    assert.ok(result.structured_reason.conditions.what_is_bad.includes("perceptual excess that prevents the whole from converging"));
    assert.ok(result.structured_reason.related_visual_dimensions.includes("perceptual_convergence"));
    assert.equal(result.structured_reason.evaluation_axis.quantity_is_decisive, false);
  } finally { cleanup(root); }
});

test("density review v2 remains historical and v3 becomes the sole active review", () => {
  const { root, result } = run();
  try {
    const density = result.memory.candidate_signal_reviews.filter((item) => item.candidate_signal_id === "MYE_EXT_SIG_000001");
    assert.equal(density.length, 2);
    assert.equal(density[0].status, "SUPERSEDED");
    assert.equal(density[1].status, "ACTIVE");
    assert.equal(density[1].candidate_signal_version, 3);
    assert.equal(density[1].supersedes_review_id, density[0].review_id);
  } finally { cleanup(root); }
});

test("the axis permits excellent maximalism and does not privilege simple design", () => {
  const { root, result } = run();
  try {
    assert.ok(result.structured_reason.explicitly_not_claimed.includes("maximalist_design_is_bad"));
    assert.ok(result.structured_reason.explicitly_not_claimed.includes("simple_design_is_always_better"));
  } finally { cleanup(root); }
});

test("clarification creates no pair, preference, score, weight, or quantitative limit", () => {
  const { root, result } = run();
  try {
    assert.equal(result.memory.pairwise_preferences.length, 0);
    assert.equal(result.memory.inferred_preferences.length, 0);
    assert.equal(result.report.fixed_quantitative_limits_created, 0);
    assert.equal(result.report.scores_created, 0);
    assert.equal(result.report.weights_created, 0);
    assert.equal(JSON.stringify(result.memory).includes('"maximum_element_count"'), false);
  } finally { cleanup(root); }
});

test("duplicate application is rejected", () => {
  const { root, result } = run();
  try {
    assert.throws(() => applyComplexityClarificationFeedback({ memory: result.memory, now: fixedNow }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_COMPLEXITY_CLARIFICATION_DUPLICATE");
  } finally { cleanup(root); }
});

test("mutation: HIGH_COMPLEXITY_BAD and maximum element count cannot enter the contract", () => {
  const { root, result } = run();
  try {
    for (const [field, value] of [["high_complexity_bad", true], ["maximum_element_count", 12]]) {
      const mutation = structuredClone(result.memory);
      const axis = mutation.structured_human_reasons.find((item) => item.structured_concept === "CONTROLLED_VS_ARTIFICIAL_COMPLEXITY");
      axis.evaluation_axis[field] = value;
      assert.equal(validateApprovedDirectionMemory(mutation).valid, false);
    }
  } finally { cleanup(root); }
});

test("mutation: hypothesis and candidate history cannot be overwritten", () => {
  const { root, result } = run();
  try {
    const mutation = structuredClone(result.memory);
    mutation.system_hypotheses[0].record_status = "ACTIVE";
    mutation.candidate_signal_reviews.find((item) => item.review_id === result.superseded_review_id).status = "ACTIVE";
    assert.equal(validateApprovedDirectionMemory(mutation).valid, false);
  } finally { cleanup(root); }
});
