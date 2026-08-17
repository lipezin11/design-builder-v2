import fs from "node:fs";
import path from "node:path";
import { validateArtifact } from "../compiler/schema-validator.mjs";
import { ApprovedDirectionMemoryError } from "./approved-direction-memory-indexer.mjs";

const nextSequence = (ids) => Math.max(0, ...ids.map((id) => Number(/_([0-9]{6})$/.exec(id)?.[1] ?? 0))) + 1;
const analysisPath = (imageId, version) => `data/my_eyes/analysis/${imageId}.visual.v${version}.json`;
const clone = (value) => structuredClone(value);
const forbiddenDraftKeys = new Set(["human_reason", "human_reason_written", "inferred_preference", "designer_preference_inferred", "pairwise_preference", "pairwise_inference_performed", "general_quality_judgment_performed"]);

function assertObservationOnly(value, trail = "draft") {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenDraftKeys.has(key)) throw new ApprovedDirectionMemoryError("MY_EYES_ANALYSIS_SEMANTIC_BOUNDARY_VIOLATION", "Visual analysis drafts cannot write human reasons, quality judgments, pairwise evidence, or inferred preferences.", { field: `${trail}.${key}` });
    assertObservationOnly(nested, `${trail}.${key}`);
  }
}

function prepare({ rootDir, memory, draft, sequence, now }) {
  assertObservationOnly(draft);
  const image = memory.images.find((item) => item.image_id === draft.image_id);
  if (!image) throw new ApprovedDirectionMemoryError("MY_EYES_ANALYSIS_IMAGE_MISSING", "Visual analysis references an unknown image.", { image_id: draft.image_id });
  if (image.sha256 !== draft.image_sha256) throw new ApprovedDirectionMemoryError("MY_EYES_ANALYSIS_SHA_MISMATCH", "Visual analysis SHA-256 does not match the indexed image.", { image_id: draft.image_id });

  const versions = memory.visual_analyses.filter((item) => item.image_id === draft.image_id).map((item) => item.analysis_version);
  const expectedVersion = Math.max(0, ...versions) + 1;
  if (draft.analysis_version !== undefined && draft.analysis_version !== expectedVersion) {
    throw new ApprovedDirectionMemoryError("MY_EYES_ANALYSIS_VERSION_INVALID", "Reanalysis must append the next version.", { image_id: draft.image_id, expectedVersion, actualVersion: draft.analysis_version });
  }
  const version = expectedVersion;
  const recordPath = analysisPath(draft.image_id, version);
  const fullPath = path.resolve(rootDir, ...recordPath.split("/"));
  if (fs.existsSync(fullPath)) throw new ApprovedDirectionMemoryError("MY_EYES_ANALYSIS_OVERWRITE_FORBIDDEN", "An existing visual analysis record cannot be overwritten.", { recordPath });

  const timestamp = draft.analyzed_at ?? now().toISOString();
  const analysisId = `MYE_ANA_${String(sequence).padStart(6, "0")}`;
  const dataClassification = draft.data_classification ?? "REAL_AI_ANALYSIS";
  const record = {
    schema_version: "1.0.0",
    analysis_id: analysisId,
    image_id: draft.image_id,
    image_sha256: draft.image_sha256,
    analysis_version: version,
    analyzed_at: timestamp,
    blind_analysis: true,
    label_visible_during_analysis: false,
    human_decision_context_used: false,
    data_classification: dataClassification,
    analyzer: clone(draft.analyzer),
    overall_observation_summary: draft.overall_observation_summary,
    dimensions: clone(draft.dimensions),
    interpretations: clone(draft.interpretations ?? []),
    uncertainty_notes: clone(draft.uncertainty_notes ?? []),
    semantic_boundaries: {
      human_reason_written: false,
      general_quality_judgment_performed: false,
      designer_preference_inferred: false,
      pairwise_inference_performed: false
    },
    provenance: {
      asserted_by: "MULTIMODAL_ANALYZER",
      recorded_by: "APPROVED_DIRECTION_MEMORY_SERVICE",
      source_type: "IMAGE_BYTES",
      source_ref: `my-eyes-image://${draft.image_id}@sha256:${draft.image_sha256}`,
      recorded_at: timestamp,
      data_classification: dataClassification
    }
  };
  const validation = validateArtifact("visual_analysis_record", record);
  if (!validation.valid) throw new ApprovedDirectionMemoryError("MY_EYES_ANALYSIS_SCHEMA_INVALID", "Visual analysis record failed schema validation.", { errors: validation.errors });
  const reference = {
    analysis_id: analysisId,
    evidence_level: "LEVEL_3_VISUAL_ANALYSIS",
    image_id: draft.image_id,
    image_sha256: draft.image_sha256,
    analysis_version: version,
    record_path: recordPath,
    analyzed_at: timestamp,
    blind_analysis: true,
    label_visible_during_analysis: false,
    human_preference_claim: false,
    analyzer: clone(draft.analyzer),
    provenance: {
      asserted_by: "MULTIMODAL_ANALYZER",
      recorded_by: "APPROVED_DIRECTION_MEMORY_SERVICE",
      source_type: "IMAGE_BYTES",
      source_ref: recordPath,
      recorded_at: timestamp,
      data_classification: dataClassification
    }
  };
  return { record, reference, recordPath, fullPath };
}

export function appendVisualAnalysisBatch({ rootDir, memory, drafts, now = () => new Date() }) {
  if (!Array.isArray(drafts) || drafts.length === 0) throw new ApprovedDirectionMemoryError("MY_EYES_ANALYSIS_BATCH_EMPTY", "At least one visual analysis draft is required.");
  const duplicateImages = drafts.map((item) => item.image_id).filter((id, index, all) => all.indexOf(id) !== index);
  if (duplicateImages.length) throw new ApprovedDirectionMemoryError("MY_EYES_ANALYSIS_BATCH_DUPLICATE_IMAGE", "A single blind-analysis batch may contain only one record per image.", { duplicateImages: [...new Set(duplicateImages)] });

  const start = nextSequence(memory.visual_analyses.map((item) => item.analysis_id));
  const prepared = drafts.map((draft, index) => prepare({ rootDir, memory, draft, sequence: start + index, now }));
  const updated = clone(memory);

  const written = [];
  try {
    for (const item of prepared) {
      fs.mkdirSync(path.dirname(item.fullPath), { recursive: true });
      fs.writeFileSync(item.fullPath, `${JSON.stringify(item.record, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
      written.push(item.fullPath);
      updated.visual_analyses.push(item.reference);
      const image = updated.images.find((candidate) => candidate.image_id === item.reference.image_id);
      image.visual_content_analyzed = true;
    }
  } catch (error) {
    for (const fullPath of written) fs.rmSync(fullPath, { force: true });
    throw error;
  }

  updated.visual_analyses.sort((a, b) => a.image_id.localeCompare(b.image_id) || a.analysis_version - b.analysis_version);
  updated.visual_content_analyzed = updated.visual_analyses.length > 0;
  updated.summary.visual_analysis_count = updated.visual_analyses.length;
  updated.memory_version += 1;
  updated.updated_at = now().toISOString();
  return { memory: updated, records: prepared.map(({ record, recordPath }) => ({ record, recordPath })) };
}

export function appendVisualAnalysisRecord(options) {
  const result = appendVisualAnalysisBatch({ ...options, drafts: [options.draft] });
  return { memory: result.memory, ...result.records[0] };
}
