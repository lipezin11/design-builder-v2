import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateArtifact } from "../../src/compiler/schema-validator.mjs";
import { ApprovedDirectionMemoryError } from "../../src/my-eyes/approved-direction-memory-indexer.mjs";
import { buildExternalVisualAnalysisBatch, extractExternalVisualAnalysisMarkdown, externalVisualAnalysisRequiredTokens, persistExternalVisualAnalysisBatch } from "../../src/my-eyes/importers/external-visual-analysis-importer.mjs";

const importedAt = "2026-08-12T15:00:00.000Z";
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

function syntheticFixture() {
  const labels = externalVisualAnalysisRequiredTokens.map((image_token, index) => ({ image_token, human_decision: index < 4 ? "APPROVED" : "REJECTED" }));
  const records = externalVisualAnalysisRequiredTokens.map((image_token, index) => ({
    image_token,
    analysis_mode: "BLIND_VISUAL_ANALYSIS",
    visual_hierarchy: { hierarchy_strength: index < 4 ? "STRONG" : "WEAK", competing_focal_points: index >= 4, evidence: "Synthetic observable hierarchy." },
    depth: { depth_strength: "STRONG", subject_pasted_on_background: index === 4 ? "POSSIBLE" : "NOT_OBSERVED", evidence: "Synthetic observable depth." },
    foreground: { foreground_present: true },
    typography: index >= 6 ? { text_present: true, occlusion: "text overlaps subject at subject-plane depth", legibility: "LOW_MEDIUM" } : { text_present: false },
    complexity_density: { overall_density: index === 0 ? "MEDIUM_HIGH" : "HIGH" },
    distinctive_design_decisions: index >= 4 ? ["7-8 independently lit floating objects with no shared shadow"] : ["single integrated object"]
  }));
  const source = [
    ...records.map((record) => `\`\`\`json\n${JSON.stringify(record, null, 2)}\n\`\`\``),
    "**C. BLIND DATASET STATISTICS (n=8, no labels)**\nSynthetic raw aggregates.",
    `**D. LABEL ATTACHMENT**\n\`\`\`json\n${JSON.stringify(labels, null, 2)}\n\`\`\``,
    "**E. APPROVED VS REJECTED — DESCRIPTIVE CONTRAST**\nSynthetic descriptive contrast.",
    "**F. CANDIDATE SIGNALS FOR FUTURE INVESTIGATION**\n- Density candidate.\n- Hierarchy candidate.\n- Typography candidate.\n- Floating integration candidate.\n- These are correlational observations.",
    "**G. LIMITATIONS**\nSynthetic small-sample limitations."
  ].join("\n\n");
  const images = labels.map((label, index) => ({ image_id: `MYE_IMG_${String(index + 1).padStart(6, "0")}`, sha256: hash(`synthetic-image-${index + 1}`), original_filename: `synthetic-${index + 1}.png`, current_decision_evidence_id: `MYE_DEC_${String(index + 1).padStart(6, "0")}` }));
  const human_decisions = labels.map((label, index) => ({ evidence_id: `MYE_DEC_${String(index + 1).padStart(6, "0")}`, decision: label.human_decision, status: "ACTIVE" }));
  const memory = { images, human_decisions, visual_analyses: [], human_reasons: [], pairwise_preferences: [], inferred_preferences: [] };
  const mappings = Object.fromEntries(labels.map((label, index) => [label.image_token, { image_id: images[index].image_id, evidence_basis: `Synthetic deterministic mapping ${index + 1}.` }]));
  return { source, rawBytes: Buffer.from(source, "utf8"), memory, mappings };
}

function build(overrides = {}) {
  const fixture = syntheticFixture();
  return { fixture, artifact: buildExternalVisualAnalysisBatch({ ...fixture, originalFilename: "synthetic.md", importedAt, dataClassification: "SYNTHETIC_TEST_DATA", ...overrides }) };
}

test("extracts exactly the eight required external tokens", () => {
  const fixture = syntheticFixture();
  const extracted = extractExternalVisualAnalysisMarkdown(fixture.source);
  assert.deepEqual(extracted.records.map((item) => item.image_token), [...externalVisualAnalysisRequiredTokens]);
  assert.equal(extracted.labels.length, 8);
});

test("an unknown or missing token mapping blocks the import", () => {
  const fixture = syntheticFixture();
  delete fixture.mappings.IMG_8_web_designer;
  fixture.mappings.UNKNOWN = { image_id: "MYE_IMG_000008", evidence_basis: "Not accepted." };
  assert.throws(() => buildExternalVisualAnalysisBatch({ ...fixture, originalFilename: "synthetic.md", importedAt, dataClassification: "SYNTHETIC_TEST_DATA" }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_EXTERNAL_TOKEN_UNMAPPED");
});

test("human label mismatch blocks deterministic attachment", () => {
  const fixture = syntheticFixture();
  fixture.memory.human_decisions[0].decision = "REJECTED";
  assert.throws(() => buildExternalVisualAnalysisBatch({ ...fixture, originalFilename: "synthetic.md", importedAt, dataClassification: "SYNTHETIC_TEST_DATA" }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_EXTERNAL_LABEL_MISMATCH");
});

test("observations remain analyzer assertions and labels remain human assertions", () => {
  const { artifact } = build();
  assert.equal(artifact.records.length, 8);
  assert.equal(artifact.human_label_attachments.length, 8);
  assert.ok(artifact.records.every((item) => item.blind_analysis && !item.label_visible_during_analysis && item.provenance.asserted_by === "MULTIMODAL_ANALYZER"));
  assert.ok(artifact.human_label_attachments.every((item) => item.provenance.asserted_by === "HUMAN" && item.attached_after_blind_analysis));
  assert.equal(artifact.raw_aggregate_output.provenance.asserted_by, "MULTIMODAL_ANALYZER");
});

test("schema rejects an AI observation relabeled as HUMAN", () => {
  const { artifact } = build();
  artifact.records[0].provenance.asserted_by = "HUMAN";
  assert.equal(validateArtifact("external_visual_analysis_batch", artifact).valid, false);
});

test("candidate signals cannot be promoted to preferences", () => {
  const { artifact } = build();
  const signal = artifact.candidate_signals[0];
  assert.equal(signal.preference_status, "NOT_INFERRED");
  assert.equal(signal.human_confirmed, false);
  assert.equal(signal.causality_status, "UNKNOWN");
  signal.preference_status = "INFERRED";
  assert.equal(validateArtifact("external_visual_analysis_batch", artifact).valid, false);
});

test("hybrid enum normalization preserves the raw value and its reversible range", () => {
  const { artifact } = build();
  const normalized = artifact.records[0].normalized_values.find((item) => item.raw_value === "MEDIUM_HIGH");
  assert.deepEqual(normalized, { path: "complexity_density.overall_density", raw_value: "MEDIUM_HIGH", canonical_value: null, range: ["MEDIUM", "HIGH"], normalization_confidence: "HIGH", strategy: "RANGE_PRESERVING_TRANSLATION" });
  assert.equal(artifact.normalization_report.raw_values_preserved, true);
  assert.equal(artifact.normalization_report.reversible, true);
});

test("an internal analysis and a distinct external analyzer record may coexist", () => {
  const fixture = syntheticFixture();
  fixture.memory.visual_analyses.push({ image_id: "MYE_IMG_000001", analysis_id: "MYE_ANA_000001", analysis_version: 1, record_path: "data/my_eyes/analysis/internal.json" });
  const artifact = buildExternalVisualAnalysisBatch({ ...fixture, originalFilename: "synthetic.md", importedAt, dataClassification: "SYNTHETIC_TEST_DATA" });
  assert.deepEqual(artifact.records[0].internal_analysis_refs, [{ analysis_id: "MYE_ANA_000001", analysis_version: 1, record_path: "data/my_eyes/analysis/internal.json", analyzer_source: "INTERNAL_MULTIMODAL_ANALYZER" }]);
});

test("duplicate import from the same source and analysis version is rejected", () => {
  const first = build();
  assert.throws(() => buildExternalVisualAnalysisBatch({ ...first.fixture, originalFilename: "synthetic.md", importedAt, dataClassification: "SYNTHETIC_TEST_DATA", existingArtifacts: [first.artifact] }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_EXTERNAL_ANALYSIS_DUPLICATE");
});

test("aggregates are recomputed from eight individual records", () => {
  const { artifact } = build();
  const density = artifact.recalculated_aggregates.find((item) => item.metric === "overall_density_high_or_very_high");
  assert.deepEqual({ blind: density.blind_count, approved: density.approved_count, rejected: density.rejected_count }, { blind: 8, approved: 4, rejected: 4 });
  assert.equal(density.source, "RECALCULATED_FROM_INDIVIDUAL_RECORDS");
});

test("critical co-occurrence still does not infer a preference", () => {
  const { artifact } = build();
  const density = artifact.candidate_signals.find((item) => item.statement === "Density candidate.");
  assert.equal(density.approved_count, 4);
  assert.equal(density.rejected_count, 4);
  assert.equal(density.preference_status, "NOT_INFERRED");
  assert.equal(density.designer_preference_status, "UNKNOWN");
  assert.equal(artifact.semantic_boundaries.preference_inference_performed, false);
});

test("import creates zero human reasons, pairs, or inferred preferences and does not mutate memory", () => {
  const fixture = syntheticFixture();
  const before = structuredClone(fixture.memory);
  const artifact = buildExternalVisualAnalysisBatch({ ...fixture, originalFilename: "synthetic.md", importedAt, dataClassification: "SYNTHETIC_TEST_DATA" });
  assert.deepEqual(fixture.memory, before);
  assert.deepEqual({ reasons: artifact.import_report.human_reasons_created, pairs: artifact.import_report.pairs_created, preferences: artifact.import_report.preferences_created }, { reasons: 0, pairs: 0, preferences: 0 });
});

test("persistence keeps the raw source byte-for-byte and is append-only", () => {
  const { fixture, artifact } = build({ rawPath: "data/my_eyes/imports/MYE_EXT_BATCH_000001/raw/source.md" });
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "design-builder-external-import-"));
  try {
    const result = persistExternalVisualAnalysisBatch({ rootDir, rawBytes: fixture.rawBytes, artifact });
    const persisted = fs.readFileSync(path.join(rootDir, ...result.raw_path.split("/")));
    assert.equal(Buffer.compare(persisted, fixture.rawBytes), 0);
    assert.equal(hash(persisted), artifact.source.sha256);
    assert.throws(() => persistExternalVisualAnalysisBatch({ rootDir, rawBytes: fixture.rawBytes, artifact }), (error) => error instanceof ApprovedDirectionMemoryError && error.code === "MY_EYES_EXTERNAL_IMPORT_OVERWRITE_FORBIDDEN");
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});
