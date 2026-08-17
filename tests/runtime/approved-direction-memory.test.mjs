import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  ApprovedDirectionMemoryError,
  buildApprovedDirectionMemory
} from "../../src/my-eyes/approved-direction-memory-indexer.mjs";
import {
  createMyEyesEvidenceView,
  loadApprovedDirectionMemory,
  validateApprovedDirectionMemory
} from "../../src/my-eyes/approved-direction-memory-loader.mjs";
import { loadJson } from "./test-helpers.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixedNow = () => new Date("2026-08-10T12:00:00.000Z");
const pngBytes = (tag) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from(tag)]);
const createRoot = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-builder-my-eyes-"));
  fs.mkdirSync(path.join(root, "data", "my_eyes", "approved"), { recursive: true });
  fs.mkdirSync(path.join(root, "data", "my_eyes", "rejected"), { recursive: true });
  fs.mkdirSync(path.join(root, "data", "my_eyes", "pairs"), { recursive: true });
  return root;
};
const cleanup = (root) => {
  const resolved = path.resolve(root);
  if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Refusing to clean a non-temporary directory.");
  fs.rmSync(resolved, { recursive: true, force: true });
};
const writeImage = (root, bucket, name, tag) => {
  const target = path.join(root, "data", "my_eyes", bucket, name);
  fs.writeFileSync(target, pngBytes(tag));
  return target;
};

test("indexer records only explicit approved/rejected decisions from synthetic directories", () => {
  const root = createRoot();
  try {
    writeImage(root, "approved", "synthetic-approved.png", "approved-bytes");
    writeImage(root, "rejected", "synthetic-rejected.png", "rejected-bytes");
    const memory = buildApprovedDirectionMemory({ rootDir: root, dataClassification: "SYNTHETIC_TEST_DATA", now: fixedNow });
    assert.equal(memory.summary.approved_count, 1);
    assert.equal(memory.summary.rejected_count, 1);
    assert.equal(memory.human_reasons.length, 0);
    assert.equal(memory.visual_analyses.length, 0);
    assert.equal(memory.pairwise_preferences.length, 0);
    assert.equal(memory.inferred_preferences.length, 0);
    assert.equal(memory.visual_content_analyzed, false);
    assert.equal(validateApprovedDirectionMemory(memory, { rootDir: root, verifyFiles: true }).valid, true);
  } finally { cleanup(root); }
});

test("unchanged reindexing preserves manifest version and update timestamp", () => {
  const root = createRoot();
  try {
    writeImage(root, "approved", "unchanged.png", "unchanged-bytes");
    const first = buildApprovedDirectionMemory({ rootDir: root, dataClassification: "SYNTHETIC_TEST_DATA", now: fixedNow });
    const second = buildApprovedDirectionMemory({
      rootDir: root,
      existingMemory: first,
      dataClassification: "SYNTHETIC_TEST_DATA",
      now: () => new Date("2026-08-11T12:00:00.000Z")
    });
    assert.deepEqual(second, first);
  } finally { cleanup(root); }
});
test("stable image ID survives a filename change because identity follows SHA-256", () => {
  const root = createRoot();
  try {
    const original = writeImage(root, "approved", "first-name.png", "stable-bytes");
    const first = buildApprovedDirectionMemory({ rootDir: root, dataClassification: "SYNTHETIC_TEST_DATA", now: fixedNow });
    fs.renameSync(original, path.join(root, "data", "my_eyes", "approved", "renamed.png"));
    const second = buildApprovedDirectionMemory({ rootDir: root, existingMemory: first, dataClassification: "SYNTHETIC_TEST_DATA", now: fixedNow });
    assert.equal(second.images[0].image_id, first.images[0].image_id);
    assert.equal(second.images[0].original_filename, "renamed.png");
    assert.equal(second.human_decisions.length, 1);
  } finally { cleanup(root); }
});

test("directory reclassification preserves the previous human decision as superseded", () => {
  const root = createRoot();
  try {
    const original = writeImage(root, "approved", "candidate.png", "reclassified-bytes");
    const first = buildApprovedDirectionMemory({ rootDir: root, dataClassification: "SYNTHETIC_TEST_DATA", now: fixedNow });
    fs.renameSync(original, path.join(root, "data", "my_eyes", "rejected", "candidate.png"));
    const second = buildApprovedDirectionMemory({ rootDir: root, existingMemory: first, dataClassification: "SYNTHETIC_TEST_DATA", now: fixedNow });
    assert.equal(second.images[0].image_id, first.images[0].image_id);
    assert.equal(second.human_decisions.length, 2);
    assert.equal(second.human_decisions[0].status, "SUPERSEDED");
    assert.equal(second.human_decisions[1].decision, "REJECTED");
    assert.equal(second.human_decisions[1].supersedes_evidence_id, second.human_decisions[0].evidence_id);
  } finally { cleanup(root); }
});

test("indexer refuses duplicate bytes instead of inventing two identities or a pair", () => {
  const root = createRoot();
  try {
    writeImage(root, "approved", "a.png", "same-bytes");
    writeImage(root, "rejected", "b.png", "same-bytes");
    assert.throws(
      () => buildApprovedDirectionMemory({ rootDir: root, dataClassification: "SYNTHETIC_TEST_DATA", now: fixedNow }),
      (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_DUPLICATE_IMAGE_BYTES"
    );
  } finally { cleanup(root); }
});

test("synthetic full-stack fixture keeps human truth, AI observation, and inference separate", () => {
  const memory = structuredClone(loadJson("tests/fixtures/approved_direction_memory/synthetic_full_evidence_stack.json"));
  const validation = validateApprovedDirectionMemory(memory);
  assert.equal(validation.valid, true);
  const view = createMyEyesEvidenceView(memory);
  assert.equal(view.scope, "DESIGNER_PREFERENCE");
  assert.equal(view.human_truth.decisions.length, 2);
  assert.equal(view.ai_observation.visual_analyses.length, 1);
  assert.equal(view.inferred_preference.patterns.length, 1);
  assert.equal(view.boundaries.inference_is_not_human_truth, true);
});

test("pairwise result mismatch is rejected semantically", () => {
  const memory = structuredClone(loadJson("tests/fixtures/approved_direction_memory/synthetic_full_evidence_stack.json"));
  memory.pairwise_preferences[0].preferred_image_id = "MYE_IMG_000002";
  const result = validateApprovedDirectionMemory(memory);
  assert.equal(result.valid, false);
  assert.equal(result.errors.some((error) => error.code === "MY_EYES_PAIR_RESULT_MISMATCH"), true);
});

test("visual analysis cannot claim human preference", () => {
  const memory = structuredClone(loadJson("tests/fixtures/approved_direction_memory/synthetic_full_evidence_stack.json"));
  memory.visual_analyses[0].human_preference_claim = true;
  assert.equal(validateApprovedDirectionMemory(memory).valid, false);
});

test("inferred preference must retain every supporting and contradicting evidence reference", () => {
  const memory = structuredClone(loadJson("tests/fixtures/approved_direction_memory/synthetic_full_evidence_stack.json"));
  memory.inferred_preferences[0].supporting_evidence_refs.push("MYE_DEC_999999");
  const result = validateApprovedDirectionMemory(memory);
  assert.equal(result.valid, false);
  assert.equal(result.errors.some((error) => error.code === "MY_EYES_INFERENCE_EVIDENCE_MISSING"), true);
});

test("real Approved Direction Memory verifies all image bytes and blind visual records", () => {
  const manifestPath = path.join(projectRoot, "data", "my_eyes", "approved_direction_memory.json");
  const memory = loadApprovedDirectionMemory(manifestPath, { rootDir: projectRoot, verifyFiles: true });
  const approvedFiles = fs.readdirSync(path.join(projectRoot, "data", "my_eyes", "approved"), { withFileTypes: true }).filter((entry) => entry.isFile()).length;
  const rejectedFiles = fs.readdirSync(path.join(projectRoot, "data", "my_eyes", "rejected"), { withFileTypes: true }).filter((entry) => entry.isFile()).length;
  assert.equal(memory.summary.approved_count, approvedFiles);
  assert.equal(memory.summary.rejected_count, rejectedFiles);
  assert.equal(memory.summary.available_image_count, approvedFiles + rejectedFiles);
  assert.equal(memory.visual_content_analyzed, true);
  assert.equal(new Set(memory.visual_analyses.map((analysis) => analysis.image_id)).size, approvedFiles + rejectedFiles);
  assert.equal(memory.visual_analyses.every((analysis) => analysis.blind_analysis === true && analysis.label_visible_during_analysis === false && analysis.human_preference_claim === false), true);
  assert.equal(memory.human_reasons.length, 14);
  assert.equal(memory.structured_human_reasons.length, 6);
  assert.equal(memory.candidate_signal_reviews.length, 5);
  assert.equal(memory.system_hypotheses.length, 2);
  assert.equal(memory.human_reasons.every((reason) => reason.provenance.asserted_by === "HUMAN"), true);
  assert.equal(memory.structured_human_reasons.every((reason) => reason.provenance.asserted_by === "SYSTEM" && reason.confirmed_by_human === false), true);
  assert.equal(memory.pairwise_preferences.length, 6);
  assert.equal(memory.pairwise_preferences.every((pair) => pair.provenance.asserted_by === "HUMAN" && pair.explicitly_compared_by_human === true), true);
  assert.equal(memory.inferred_preferences.length, 16);
  assert.equal(memory.summary.human_confirmed_generalized_preference_count, 7);
  const activePreferences = memory.inferred_preferences.filter((item) => item.status !== "SUPERSEDED");
  assert.equal(activePreferences.length, 7);
  assert.equal(activePreferences.filter((item) => item.human_confirmed === true).length, 7);
  assert.equal(activePreferences.find((item) => item.preference_id === "MYE_PREF_000016").human_confirmed, true);
});