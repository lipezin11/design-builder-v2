import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { ApprovedDirectionMemoryError, buildApprovedDirectionMemory } from "../../src/my-eyes/approved-direction-memory-indexer.mjs";
import { validateApprovedDirectionMemory } from "../../src/my-eyes/approved-direction-memory-loader.mjs";
import { appendVisualAnalysisRecord } from "../../src/my-eyes/visual-analysis-store.mjs";

const fixedNow = () => new Date("2026-08-10T15:00:00.000Z");
const dimensions = ["format_usage", "composition", "visual_hierarchy", "depth", "subject_environment_integration", "lighting", "color", "typography", "environment", "foreground", "effects", "realism_coherence", "complexity_density", "distinctive_design_decisions"];
const analyzer = { provider: "synthetic-provider", model: "synthetic-model", analyzer_version: "test-only", analysis_prompt_version: "blind-test-v1" };

function createRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-builder-visual-analysis-"));
  fs.mkdirSync(path.join(root, "data", "my_eyes", "approved"), { recursive: true });
  fs.mkdirSync(path.join(root, "data", "my_eyes", "rejected"), { recursive: true });
  fs.mkdirSync(path.join(root, "data", "my_eyes", "pairs"), { recursive: true });
  fs.writeFileSync(path.join(root, "data", "my_eyes", "approved", "synthetic.png"), Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("visual-analysis") ]));
  return root;
}
function cleanup(root) {
  const resolved = path.resolve(root);
  if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Refusing to clean a non-temporary directory.");
  fs.rmSync(resolved, { recursive: true, force: true });
}
function fixture(root) {
  const memory = buildApprovedDirectionMemory({ rootDir: root, dataClassification: "SYNTHETIC_TEST_DATA", now: fixedNow });
  const image = memory.images[0];
  let fact = 0;
  return { memory, draft: {
    image_id: image.image_id,
    image_sha256: image.sha256,
    data_classification: "SYNTHETIC_TEST_DATA",
    analyzer,
    overall_observation_summary: "Synthetic blind visual observation with no quality or preference claim.",
    dimensions: Object.fromEntries(dimensions.map((name) => [name, { status: "OBSERVED", summary: `Synthetic ${name} observation.`, facts: [{ fact_id: `FACT_${String(++fact).padStart(3, "0")}`, attribute: name, observation: `Observable synthetic attribute for ${name}.`, confidence: "HIGH" }] }])),
    interpretations: [],
    uncertainty_notes: ["Synthetic record used only for contract tests."]
  }};
}

test("valid image and matching SHA append a Level 3 record", () => {
  const root = createRoot();
  try {
    const { memory, draft } = fixture(root);
    const result = appendVisualAnalysisRecord({ rootDir: root, memory, draft, now: fixedNow });
    assert.equal(result.record.analysis_version, 1);
    assert.equal(result.memory.visual_analyses.length, 1);
    assert.equal(result.memory.images[0].visual_content_analyzed, true);
    assert.equal(fs.existsSync(path.join(root, ...result.recordPath.split("/"))), true);
    assert.equal(validateApprovedDirectionMemory(result.memory, { rootDir: root, verifyFiles: true }).valid, true);
  } finally { cleanup(root); }
});

test("missing image is rejected", () => {
  const root = createRoot();
  try {
    const { memory, draft } = fixture(root);
    draft.image_id = "MYE_IMG_999999";
    assert.throws(() => appendVisualAnalysisRecord({ rootDir: root, memory, draft, now: fixedNow }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_ANALYSIS_IMAGE_MISSING");
  } finally { cleanup(root); }
});

test("SHA mismatch is rejected", () => {
  const root = createRoot();
  try {
    const { memory, draft } = fixture(root);
    draft.image_sha256 = "f".repeat(64);
    assert.throws(() => appendVisualAnalysisRecord({ rootDir: root, memory, draft, now: fixedNow }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_ANALYSIS_SHA_MISMATCH");
  } finally { cleanup(root); }
});

test("stored provenance is non-human and blind flags are immutable", () => {
  const root = createRoot();
  try {
    const { memory, draft } = fixture(root);
    draft.blind_analysis = false;
    draft.label_visible_during_analysis = true;
    const result = appendVisualAnalysisRecord({ rootDir: root, memory, draft, now: fixedNow });
    assert.equal(result.record.blind_analysis, true);
    assert.equal(result.record.label_visible_during_analysis, false);
    assert.equal(result.record.human_decision_context_used, false);
    assert.equal(result.record.provenance.asserted_by, "MULTIMODAL_ANALYZER");
    assert.equal(result.record.semantic_boundaries.designer_preference_inferred, false);
    const humanClaim = structuredClone(result.memory);
    humanClaim.visual_analyses[0].provenance.asserted_by = "HUMAN";
    assert.equal(validateApprovedDirectionMemory(humanClaim).valid, false);
  } finally { cleanup(root); }
});

test("visual drafts cannot write human reasons or inferred preferences", () => {
  const root = createRoot();
  try {
    const first = fixture(root);
    first.draft.human_reason = "forbidden";
    assert.throws(() => appendVisualAnalysisRecord({ rootDir: root, ...first, now: fixedNow }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_ANALYSIS_SEMANTIC_BOUNDARY_VIOLATION");
    const second = fixture(root);
    second.draft.inferred_preference = { statement: "forbidden" };
    assert.throws(() => appendVisualAnalysisRecord({ rootDir: root, ...second, now: fixedNow }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_ANALYSIS_SEMANTIC_BOUNDARY_VIOLATION");
  } finally { cleanup(root); }
});

test("duplicate analysis version is rejected semantically", () => {
  const root = createRoot();
  try {
    const { memory, draft } = fixture(root);
    const first = appendVisualAnalysisRecord({ rootDir: root, memory, draft, now: fixedNow });
    const duplicate = structuredClone(first.memory.visual_analyses[0]);
    duplicate.analysis_id = "MYE_ANA_000002";
    first.memory.visual_analyses.push(duplicate);
    first.memory.summary.visual_analysis_count = 2;
    const validation = validateApprovedDirectionMemory(first.memory);
    assert.equal(validation.valid, false);
    assert.equal(validation.errors.some((error) => error.code === "MY_EYES_ANALYSIS_VERSION_DUPLICATE"), true);
  } finally { cleanup(root); }
});

test("reanalysis appends version 2 without overwriting version 1", () => {
  const root = createRoot();
  try {
    const { memory, draft } = fixture(root);
    const first = appendVisualAnalysisRecord({ rootDir: root, memory, draft, now: fixedNow });
    const second = appendVisualAnalysisRecord({ rootDir: root, memory: first.memory, draft, now: () => new Date("2026-08-11T15:00:00.000Z") });
    assert.equal(second.record.analysis_version, 2);
    assert.equal(second.memory.visual_analyses.length, 2);
    assert.notEqual(second.recordPath, first.recordPath);
    assert.equal(fs.existsSync(path.join(root, ...first.recordPath.split("/"))), true);
    assert.equal(fs.existsSync(path.join(root, ...second.recordPath.split("/"))), true);
  } finally { cleanup(root); }
});

test("requesting an old version is rejected before any write", () => {
  const root = createRoot();
  try {
    const { memory, draft } = fixture(root);
    const first = appendVisualAnalysisRecord({ rootDir: root, memory, draft, now: fixedNow });
    draft.analysis_version = 1;
    assert.throws(() => appendVisualAnalysisRecord({ rootDir: root, memory: first.memory, draft, now: fixedNow }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_ANALYSIS_VERSION_INVALID");
  } finally { cleanup(root); }
});