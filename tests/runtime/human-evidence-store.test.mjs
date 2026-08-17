import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildApprovedDirectionMemory, ApprovedDirectionMemoryError } from "../../src/my-eyes/approved-direction-memory-indexer.mjs";
import { createPreferenceEvidencePreparation, validateApprovedDirectionMemory } from "../../src/my-eyes/approved-direction-memory-loader.mjs";
import { appendHumanReason, correctHumanReason, appendStructuredHumanReason, correctStructuredHumanReason, appendPairwisePreference, correctPairwisePreference } from "../../src/my-eyes/human-evidence-store.mjs";
import { loadJson } from "./test-helpers.mjs";

const fixedNow = () => new Date("2026-08-10T18:00:00.000Z");
const nextNow = () => new Date("2026-08-10T19:00:00.000Z");
function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-builder-human-evidence-"));
  for (const bucket of ["approved", "rejected", "pairs"]) fs.mkdirSync(path.join(root, "data", "my_eyes", bucket), { recursive: true });
  const png = (name) => Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), Buffer.from(name)]);
  fs.writeFileSync(path.join(root, "data", "my_eyes", "approved", "a.png"), png("a"));
  fs.writeFileSync(path.join(root, "data", "my_eyes", "rejected", "b.png"), png("b"));
  const memory = buildApprovedDirectionMemory({ rootDir: root, dataClassification: "SYNTHETIC_TEST_DATA", now: fixedNow });
  return { root, memory, left: memory.images[0].image_id, right: memory.images[1].image_id };
}
function cleanup(root) {
  const resolved = path.resolve(root);
  if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Refusing to clean a non-temporary directory.");
  fs.rmSync(resolved, { recursive: true, force: true });
}

test("reason requires a real image and preserves raw_text exactly", () => {
  const { root, memory, left } = createFixture();
  try {
    const raw = "  aprovei porque tem muito mais profundidade  ";
    const result = appendHumanReason({ memory, image_id: left, raw_text: raw, now: fixedNow });
    assert.equal(result.reason.raw_text, raw);
    assert.equal(result.reason.provenance.asserted_by, "HUMAN");
    assert.equal(result.memory.human_decisions.find((item) => item.image_id === left).reason_provided, true);
    assert.equal(result.memory.pairwise_preferences.length, 0);
    assert.equal(result.memory.inferred_preferences.length, 0);
  } finally { cleanup(root); }
});

test("reason rejects missing image and blank raw_text", () => {
  const { root, memory, left } = createFixture();
  try {
    assert.throws(() => appendHumanReason({ memory, image_id: "MYE_IMG_999999", raw_text: "real", now: fixedNow }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_REASON_IMAGE_MISSING");
    assert.throws(() => appendHumanReason({ memory, image_id: left, raw_text: "   ", now: fixedNow }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_REASON_RAW_TEXT_REQUIRED");
  } finally { cleanup(root); }
});

test("AI structured reason cannot impersonate HUMAN and remains unconfirmed", () => {
  const { root, memory, left } = createFixture();
  try {
    const raw = appendHumanReason({ memory, image_id: left, raw_text: "parece colado", now: fixedNow });
    const result = appendStructuredHumanReason({ memory: raw.memory, human_reason_id: raw.reason.reason_id, categories: ["SUBJECT_INTEGRATION"], polarity: "NEGATIVE", normalized_statement: "Subject appears visually separated from the environment.", structured_by: "AI", confirmed_by_human: false, now: fixedNow });
    assert.equal(result.structured_reason.structured_by, "AI");
    assert.equal(result.structured_reason.confirmed_by_human, false);
    assert.equal(result.structured_reason.provenance.asserted_by, "AI");
    const impersonation = structuredClone(result.memory);
    impersonation.structured_human_reasons[0].provenance.asserted_by = "HUMAN";
    assert.equal(validateApprovedDirectionMemory(impersonation).valid, false);
  } finally { cleanup(root); }
});

test("human confirmation appends a structured version and preserves AI history", () => {
  const { root, memory, left } = createFixture();
  try {
    const raw = appendHumanReason({ memory, image_id: left, raw_text: "parece colado", now: fixedNow });
    const ai = appendStructuredHumanReason({ memory: raw.memory, human_reason_id: raw.reason.reason_id, categories: ["SUBJECT_INTEGRATION"], polarity: "NEGATIVE", normalized_statement: "Subject appears separated.", now: fixedNow });
    const confirmed = correctStructuredHumanReason({ memory: ai.memory, structured_reason_id: ai.structured_reason.structured_reason_id, confirmed_by_human: true, now: nextNow });
    assert.equal(confirmed.memory.structured_human_reasons.length, 2);
    assert.equal(confirmed.memory.structured_human_reasons[0].status, "SUPERSEDED");
    assert.equal(confirmed.structured_reason.version, 2);
    assert.equal(confirmed.structured_reason.confirmed_by_human, true);
    assert.equal(confirmed.structured_reason.provenance.asserted_by, "AI");
  } finally { cleanup(root); }
});

test("pair cannot compare an image with itself and both images must exist", () => {
  const { root, memory, left, right } = createFixture();
  try {
    assert.throws(() => appendPairwisePreference({ memory, left_image_id: left, right_image_id: left, human_choice: "LEFT", comparison_context: "synthetic", now: fixedNow }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_PAIR_SELF_COMPARISON");
    assert.throws(() => appendPairwisePreference({ memory, left_image_id: left, right_image_id: "MYE_IMG_999999", human_choice: "LEFT", comparison_context: "synthetic", now: fixedNow }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_PAIR_IMAGE_MISSING");
    assert.equal(memory.pairwise_preferences.length, 0);
    assert.equal(memory.inferred_preferences.length, 0);
    assert.notEqual(left, right);
  } finally { cleanup(root); }
});

test("human_choice must match one side or TIE", () => {
  const { root, memory, left, right } = createFixture();
  try {
    assert.throws(() => appendPairwisePreference({ memory, left_image_id: left, right_image_id: right, human_choice: "MIDDLE", comparison_context: "synthetic", now: fixedNow }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_PAIR_CHOICE_INVALID");
    const tie = appendPairwisePreference({ memory, left_image_id: left, right_image_id: right, human_choice: "TIE", comparison_context: "synthetic", now: fixedNow });
    assert.equal(tie.pair.result, "TIE");
    assert.equal(tie.pair.preferred_image_id, null);
  } finally { cleanup(root); }
});

test("hard pair is valid, human-authored, and can retain an optional literal reason", () => {
  const { root, memory, left, right } = createFixture();
  try {
    const result = appendPairwisePreference({ memory, left_image_id: left, right_image_id: right, human_choice: "RIGHT", pair_type: "HARD_PAIR", comparison_context: "Both are plausible; compare spatial integration.", human_reason_raw: "a diferença é sutil, mas a direita integra melhor", now: fixedNow });
    assert.equal(result.pair.pair_type, "HARD_PAIR");
    assert.equal(result.pair.preferred_image_id, right);
    assert.equal(result.pair.provenance.asserted_by, "HUMAN");
    assert.equal(result.human_reason.raw_text, "a diferença é sutil, mas a direita integra melhor");
    assert.equal(result.human_reason.target.pair_id, result.pair.pair_id);
    assert.equal(result.memory.inferred_preferences.length, 0);
  } finally { cleanup(root); }
});

test("duplicate unordered active pair is rejected", () => {
  const { root, memory, left, right } = createFixture();
  try {
    const first = appendPairwisePreference({ memory, left_image_id: left, right_image_id: right, human_choice: "LEFT", comparison_context: "synthetic", now: fixedNow });
    assert.throws(() => appendPairwisePreference({ memory: first.memory, left_image_id: right, right_image_id: left, human_choice: "RIGHT", comparison_context: "duplicate reversed", now: nextNow }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_PAIR_DUPLICATE");
  } finally { cleanup(root); }
});

test("pair correction preserves superseded history instead of overwriting", () => {
  const { root, memory, left, right } = createFixture();
  try {
    const first = appendPairwisePreference({ memory, left_image_id: left, right_image_id: right, human_choice: "LEFT", comparison_context: "first choice", now: fixedNow });
    const corrected = correctPairwisePreference({ memory: first.memory, pair_id: first.pair.pair_id, human_choice: "RIGHT", comparison_context: "human corrected the choice", now: nextNow });
    assert.equal(corrected.memory.pairwise_preferences.length, 2);
    assert.equal(corrected.memory.pairwise_preferences[0].status, "SUPERSEDED");
    assert.equal(corrected.pair.status, "ACTIVE");
    assert.equal(corrected.pair.version, 2);
    assert.equal(corrected.pair.supersedes_pair_id, first.pair.pair_id);
    assert.equal(corrected.memory.inferred_preferences.length, 0);
  } finally { cleanup(root); }
});

test("reason correction preserves exact previous text as SUPERSEDED", () => {
  const { root, memory, left } = createFixture();
  try {
    const first = appendHumanReason({ memory, image_id: left, raw_text: "texto original", now: fixedNow });
    const corrected = correctHumanReason({ memory: first.memory, reason_id: first.reason.reason_id, raw_text: "texto corrigido", now: nextNow });
    assert.equal(corrected.memory.human_reasons.length, 2);
    assert.equal(corrected.memory.human_reasons[0].raw_text, "texto original");
    assert.equal(corrected.memory.human_reasons[0].status, "SUPERSEDED");
    assert.equal(corrected.reason.raw_text, "texto corrigido");
    assert.equal(corrected.reason.version, 2);
  } finally { cleanup(root); }
});

test("evidence preparation links human evidence to latest visual records without causality", () => {
  const memory = structuredClone(loadJson("tests/fixtures/approved_direction_memory/synthetic_full_evidence_stack.json"));
  const view = createPreferenceEvidencePreparation(memory);
  assert.equal(view.causality_inferred, false);
  assert.equal(view.preference_inferred, false);
  assert.equal(view.human_reason_observation_links[0].visual_analysis_refs.length, 1);
  assert.equal(view.human_reason_observation_links[0].relationship_status, "UNASSESSED");
  assert.equal(view.pair_observation_links[0].causality_inferred, false);
});