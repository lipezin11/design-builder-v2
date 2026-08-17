import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { validateArtifact } from "../../compiler/schema-validator.mjs";
import { ApprovedDirectionMemoryError } from "../approved-direction-memory-indexer.mjs";

const clone = (value) => structuredClone(value);
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const posix = (value) => value.split(path.sep).join("/");
const requiredTokens = Object.freeze(["IMG_1_agroforte", "IMG_2_red_party_hat", "IMG_3_lantern_businessman", "IMG_4_jungle_biologist", "IMG_5_ideas_that_float", "IMG_6_green_neon_carousel", "IMG_7_creative_db", "IMG_8_web_designer"]);
const canonicalScale = Object.freeze({
  LOW: { canonical: "LOW", range: ["LOW"], confidence: "HIGH", strategy: "EXACT_SCALE_TRANSLATION" },
  WEAK: { canonical: "LOW", range: ["LOW"], confidence: "HIGH", strategy: "EXACT_SCALE_TRANSLATION" },
  MODERATE: { canonical: "MEDIUM", range: ["MEDIUM"], confidence: "HIGH", strategy: "EXACT_SCALE_TRANSLATION" },
  MEDIUM: { canonical: "MEDIUM", range: ["MEDIUM"], confidence: "HIGH", strategy: "EXACT_SCALE_TRANSLATION" },
  STRONG: { canonical: "HIGH", range: ["HIGH"], confidence: "HIGH", strategy: "EXACT_SCALE_TRANSLATION" },
  HIGH: { canonical: "HIGH", range: ["HIGH"], confidence: "HIGH", strategy: "EXACT_SCALE_TRANSLATION" },
  VERY_STRONG: { canonical: "VERY_HIGH", range: ["VERY_HIGH"], confidence: "HIGH", strategy: "EXACT_SCALE_TRANSLATION" },
  VERY_HIGH: { canonical: "VERY_HIGH", range: ["VERY_HIGH"], confidence: "HIGH", strategy: "EXACT_SCALE_TRANSLATION" },
  LOW_MEDIUM: { canonical: null, range: ["LOW", "MEDIUM"], confidence: "HIGH", strategy: "RANGE_PRESERVING_TRANSLATION" },
  LOW_MODERATE: { canonical: null, range: ["LOW", "MEDIUM"], confidence: "HIGH", strategy: "RANGE_PRESERVING_TRANSLATION" },
  WEAK_MODERATE: { canonical: null, range: ["LOW", "MEDIUM"], confidence: "MEDIUM", strategy: "RANGE_PRESERVING_TRANSLATION" },
  MODERATE_STRONG: { canonical: null, range: ["MEDIUM", "HIGH"], confidence: "MEDIUM", strategy: "RANGE_PRESERVING_TRANSLATION" },
  MODERATE_HIGH: { canonical: null, range: ["MEDIUM", "HIGH"], confidence: "HIGH", strategy: "RANGE_PRESERVING_TRANSLATION" },
  MEDIUM_HIGH: { canonical: null, range: ["MEDIUM", "HIGH"], confidence: "HIGH", strategy: "RANGE_PRESERVING_TRANSLATION" },
  HIGH_VERY_HIGH: { canonical: null, range: ["HIGH", "VERY_HIGH"], confidence: "HIGH", strategy: "RANGE_PRESERVING_TRANSLATION" }
});
const scaleFields = new Set(["hierarchy_strength", "depth_strength", "integration_strength", "overall_density", "legibility", "specificity", "color_cohesion", "small_size_legibility_estimate", "text_density"]);

function fail(code, message, details = {}) { throw new ApprovedDirectionMemoryError(code, message, details); }
function section(source, heading, nextHeading) {
  const start = source.indexOf(heading);
  if (start < 0) return "";
  const from = start + heading.length;
  const end = nextHeading ? source.indexOf(nextHeading, from) : source.length;
  return source.slice(from, end < 0 ? source.length : end).trim();
}

export function extractExternalVisualAnalysisMarkdown(source) {
  const blocks = [...source.matchAll(/```\s*([\s\S]*?)```/g)].map((match) => match[1].trim().replace(/^json\s*/i, ""));
  const parsed = [];
  for (const block of blocks) { try { parsed.push(JSON.parse(block)); } catch {} }
  const records = parsed.filter((value) => value && !Array.isArray(value) && typeof value.image_token === "string");
  const labels = parsed.find((value) => Array.isArray(value) && value.length > 0 && value.every((item) => item?.image_token && item?.human_decision));
  if (records.length !== 8 || !labels || labels.length !== 8) fail("MY_EYES_EXTERNAL_SOURCE_STRUCTURE_INVALID", "External Markdown must contain eight individual analyses and eight labels.", { record_count: records.length, label_count: labels?.length ?? 0 });
  const tokens = records.map((item) => item.image_token);
  if (new Set(tokens).size !== tokens.length || requiredTokens.some((token) => !tokens.includes(token))) fail("MY_EYES_EXTERNAL_TOKEN_SET_INVALID", "External Markdown token set is incomplete or duplicated.", { tokens });
  return {
    records,
    labels,
    sections: {
      blind_statistics: section(source, "**C. BLIND DATASET STATISTICS", "**D. LABEL ATTACHMENT"),
      descriptive_contrast: section(source, "**E. APPROVED VS REJECTED", "**F. CANDIDATE SIGNALS"),
      candidate_signals: section(source, "**F. CANDIDATE SIGNALS FOR FUTURE INVESTIGATION**", "**G. LIMITATIONS**"),
      limitations: section(source, "**G. LIMITATIONS**")
    }
  };
}

function collectNormalizations(value, trail = "") {
  const output = [];
  if (!value || typeof value !== "object") return output;
  for (const [key, nested] of Object.entries(value)) {
    const current = trail ? `${trail}.${key}` : key;
    if (typeof nested === "string" && scaleFields.has(key)) {
      const exact = canonicalScale[nested.trim().toUpperCase()];
      if (exact) output.push({ path: current, raw_value: nested, canonical_value: exact.canonical, range: exact.range, normalization_confidence: exact.confidence, strategy: exact.strategy });
    }
    output.push(...collectNormalizations(nested, current));
  }
  return output;
}

function splitDimensions(raw) {
  const dimensions = clone(raw);
  delete dimensions.image_token;
  delete dimensions.analysis_mode;
  const quality = { separate_from_visual_observation: true };
  if (dimensions.visual_hierarchy) quality.hierarchy_assessment = {
    hierarchy_strength: dimensions.visual_hierarchy.hierarchy_strength ?? null,
    competing_focal_points: dimensions.visual_hierarchy.competing_focal_points ?? null,
    evidence: dimensions.visual_hierarchy.evidence ?? null
  };
  if (dimensions.depth) quality.subject_background_coherence = {
    subject_pasted_on_background: dimensions.depth.subject_pasted_on_background ?? null,
    evidence: dimensions.depth.evidence ?? null
  };
  if (dimensions.subject_environment_integration) quality.integration_assessment = clone(dimensions.subject_environment_integration);
  if (dimensions.realism_coherence) quality.realism_coherence = clone(dimensions.realism_coherence);
  return { observationDimensions: dimensions, generalQualityAssessment: quality };
}

function normalizedRange(rawValue) {
  return canonicalScale[String(rawValue ?? "").trim().toUpperCase()]?.range ?? [];
}
const hasHigh = (rawValue) => normalizedRange(rawValue).some((item) => item === "HIGH" || item === "VERY_HIGH");
const textOf = (value) => JSON.stringify(value).toLowerCase();
const predicates = Object.freeze({
  foreground_clearly_present: (record) => record.foreground?.foreground_present === true,
  depth_strength_strong_or_higher: (record) => hasHigh(record.depth?.depth_strength) && !normalizedRange(record.depth?.depth_strength).includes("MEDIUM"),
  subject_pasted_possible: (record) => String(record.depth?.subject_pasted_on_background).toUpperCase() === "POSSIBLE",
  competing_focal_points_or_weak_hierarchy: (record) => record.visual_hierarchy?.competing_focal_points === true || /borderline/.test(String(record.visual_hierarchy?.competing_focal_points).toLowerCase()) || normalizedRange(record.visual_hierarchy?.hierarchy_strength).includes("LOW"),
  typography_overlaps_subject_plane: (record) => {
    const typographyEvidence = textOf(record.typography);
    const explicitlyTypographicDecisions = (record.distinctive_design_decisions ?? []).filter((item) => /text|type|headline|wordmark/i.test(String(item)));
    return /overlap[^\"]{0,80}subject|subject[^\"]{0,80}overlap|occlud[^\"]{0,80}subject|subject[^\"]{0,80}occlud/.test(textOf({ typographyEvidence, explicitlyTypographicDecisions }));
  },
  four_plus_floating_objects_weak_integration: (record) => {
    const text = textOf(record);
    const objects = /7-8|7\+|at least 6|4 independently|4 glass-cube|many small product|dense fan\/stack of many/.test(text);
    const weakLink = /weak|independently lit|independently-glowing|lack matching contact shadows|no shared shadow|no shared scene light|no clear red rim-light/.test(text);
    return objects && weakLink;
  },
  overall_density_high_or_very_high: (record) => hasHigh(record.complexity_density?.overall_density)
});

function recalculate(records, labelMap) {
  return Object.entries(predicates).map(([metric, predicate]) => {
    const matches = records.filter(predicate);
    return {
      metric,
      blind_count: matches.length,
      approved_count: matches.filter((record) => labelMap.get(record.image_token) === "APPROVED").length,
      rejected_count: matches.filter((record) => labelMap.get(record.image_token) === "REJECTED").length,
      sample_size: 8,
      source: "RECALCULATED_FROM_INDIVIDUAL_RECORDS",
      small_sample_warning: true
    };
  });
}

function parseCandidateStatements(rawSection) {
  return rawSection.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.startsWith("- ")).map((line) => line.slice(2).trim()).filter((line) => !/^These are correlational/i.test(line)).slice(0, 4);
}

function latestInternalRefs(memory, imageId) {
  const analyses = memory.visual_analyses.filter((item) => item.image_id === imageId);
  const highest = Math.max(0, ...analyses.map((item) => item.analysis_version));
  return analyses.filter((item) => item.analysis_version === highest).map((item) => ({ analysis_id: item.analysis_id, analysis_version: item.analysis_version, record_path: item.record_path, analyzer_source: "INTERNAL_MULTIMODAL_ANALYZER" }));
}

function validateMapping(memory, extracted, mappings) {
  if (!mappings || typeof mappings !== "object") fail("MY_EYES_EXTERNAL_MAPPING_REQUIRED", "An explicit external-token mapping is required.");
  const labels = new Map(extracted.labels.map((item) => [item.image_token, item]));
  const resolved = [];
  for (const token of requiredTokens) {
    const input = mappings[token];
    if (!input?.image_id || !input?.evidence_basis) fail("MY_EYES_EXTERNAL_TOKEN_UNMAPPED", "Every external token requires an explicit mapping and evidence basis.", { token });
    const image = memory.images.find((item) => item.image_id === input.image_id);
    if (!image) fail("MY_EYES_EXTERNAL_MAPPING_IMAGE_MISSING", "Mapped image does not exist.", { token, image_id: input.image_id });
    const decision = memory.human_decisions.find((item) => item.evidence_id === image.current_decision_evidence_id && item.status === "ACTIVE");
    if (!decision || decision.decision !== labels.get(token)?.human_decision) fail("MY_EYES_EXTERNAL_LABEL_MISMATCH", "External human label does not match the mapped active human decision.", { token, image_id: image.image_id, external_label: labels.get(token)?.human_decision, internal_label: decision?.decision });
    resolved.push({ external_token: token, image_id: image.image_id, image_sha256: image.sha256, possible_filename: image.original_filename, mapping_status: "CONFIRMED_DETERMINISTIC", evidence_basis: input.evidence_basis, human_decision_evidence_id: decision.evidence_id });
  }
  if (new Set(resolved.map((item) => item.image_id)).size !== resolved.length) fail("MY_EYES_EXTERNAL_MAPPING_DUPLICATE_IMAGE", "External tokens must map to eight distinct image identities.");
  return resolved;
}

export function buildExternalVisualAnalysisBatch({ rawBytes, originalFilename, memory, mappings, batchId = "MYE_EXT_BATCH_000001", batchVersion = 1, sourceId = "MYE_EXT_SRC_000001", rawPath = `data/my_eyes/imports/${batchId}/raw/source.md`, importedAt = new Date().toISOString(), dataClassification = "REAL_AI_ANALYSIS", existingArtifacts = [] }) {
  const sourceText = Buffer.isBuffer(rawBytes) ? rawBytes.toString("utf8") : String(rawBytes);
  const bytes = Buffer.isBuffer(rawBytes) ? rawBytes : Buffer.from(sourceText, "utf8");
  const extracted = extractExternalVisualAnalysisMarkdown(sourceText);
  const resolvedMappings = validateMapping(memory, extracted, mappings);
  const mappingByToken = new Map(resolvedMappings.map((item) => [item.external_token, item]));
  const labelMap = new Map(extracted.labels.map((item) => [item.image_token, item.human_decision]));
  const before = { reasons: memory.human_reasons.length, pairs: memory.pairwise_preferences.length, preferences: memory.inferred_preferences.length };
  const records = extracted.records.map((raw, index) => {
    const mapping = mappingByToken.get(raw.image_token);
    const duplicate = existingArtifacts.flatMap((artifact) => artifact.records ?? []).some((item) => item.image_id === mapping.image_id && item.provenance.source_ref === `${sourceId}#${raw.image_token}` && item.analysis_version === batchVersion);
    if (duplicate) fail("MY_EYES_EXTERNAL_ANALYSIS_DUPLICATE", "The same external analyzer source and version cannot be imported twice for one image.", { token: raw.image_token, image_id: mapping.image_id, analysis_version: batchVersion });
    const split = splitDimensions(raw);
    return {
      external_analysis_id: `MYE_EXT_ANA_${String(index + 1).padStart(6, "0")}`,
      external_token: raw.image_token,
      image_id: mapping.image_id,
      image_sha256: mapping.image_sha256,
      analysis_version: batchVersion,
      blind_analysis: true,
      label_visible_during_analysis: false,
      human_decision_context_used: false,
      observation_dimensions: split.observationDimensions,
      general_quality_assessment: split.generalQualityAssessment,
      normalized_values: collectNormalizations(raw),
      internal_analysis_refs: latestInternalRefs(memory, mapping.image_id),
      agreement_status: "NOT_COMPUTED",
      provenance: { asserted_by: "MULTIMODAL_ANALYZER", recorded_by: "EXTERNAL_VISUAL_ANALYSIS_IMPORTER", source_type: "EXTERNAL_BLIND_VISUAL_ANALYSIS", source_ref: `${sourceId}#${raw.image_token}`, recorded_at: importedAt, data_classification: dataClassification }
    };
  });
  const humanLabels = extracted.labels.map((raw) => {
    const mapping = mappingByToken.get(raw.image_token);
    return {
      external_token: raw.image_token,
      image_id: mapping.image_id,
      human_decision: raw.human_decision,
      source: "HUMAN_EXPLICIT_DATASET_LABEL",
      linked_decision_evidence_id: mapping.human_decision_evidence_id,
      attached_after_blind_analysis: true,
      provenance: { asserted_by: "HUMAN", recorded_by: "EXTERNAL_VISUAL_ANALYSIS_IMPORTER", source_type: "HUMAN_EXPLICIT_DATASET_LABEL", source_ref: `${sourceId}#label:${raw.image_token}`, recorded_at: importedAt, data_classification: dataClassification === "SYNTHETIC_TEST_DATA" ? "SYNTHETIC_TEST_DATA" : "REAL_HUMAN_EVIDENCE" }
    };
  });
  const aggregates = recalculate(extracted.records, labelMap);
  const aggregateByMetric = new Map(aggregates.map((item) => [item.metric, item]));
  const signalMetrics = ["overall_density_high_or_very_high", "competing_focal_points_or_weak_hierarchy", "typography_overlaps_subject_plane", "four_plus_floating_objects_weak_integration"];
  const statements = parseCandidateStatements(extracted.sections.candidate_signals);
  const candidateSignals = signalMetrics.map((metric, index) => {
    const aggregate = aggregateByMetric.get(metric);
    const predicate = predicates[metric];
    return {
      signal_id: `MYE_EXT_SIG_${String(index + 1).padStart(6, "0")}`,
      status: "CANDIDATE_SIGNAL",
      statement: statements[index] ?? metric,
      source_batch_id: batchId,
      supporting_image_refs: extracted.records.filter(predicate).map((item) => mappingByToken.get(item.image_token).image_id),
      approved_count: aggregate.approved_count,
      rejected_count: aggregate.rejected_count,
      sample_size: 8,
      small_sample_warning: true,
      human_confirmed: false,
      preference_status: "NOT_INFERRED",
      correlation_status: "OBSERVED",
      causality_status: "UNKNOWN",
      designer_preference_status: "UNKNOWN",
      provenance: { asserted_by: "MULTIMODAL_ANALYZER", recorded_by: "EXTERNAL_VISUAL_ANALYSIS_IMPORTER", source_type: "EXTERNAL_CANDIDATE_SIGNAL", source_ref: `${sourceId}#candidate-signal-${index + 1}`, recorded_at: importedAt, data_classification: dataClassification }
    };
  });
  const warnings = ["SMALL_SAMPLE_WARNING: the batch contains four approved and four rejected images.", "Correlation is observed descriptively; causality and designer preference remain unknown."];
  const declaredAggregates = {
    foreground_clearly_present: { blind_count: 5, approved_count: 3, rejected_count: 2 },
    depth_strength_strong_or_higher: { blind_count: 5, approved_count: 3, rejected_count: 2 },
    subject_pasted_possible: { blind_count: 2, approved_count: 0, rejected_count: 1 },
    competing_focal_points_or_weak_hierarchy: { blind_count: 3, approved_count: 0, rejected_count: 3 },
    typography_overlaps_subject_plane: { blind_count: 2, approved_count: 0, rejected_count: 2 },
    four_plus_floating_objects_weak_integration: { blind_count: 4, approved_count: 1, rejected_count: 3 },
    overall_density_high_or_very_high: { blind_count: 5, approved_count: 1, rejected_count: 4 }
  };
  for (const [metric, declared] of Object.entries(declaredAggregates)) {
    const actual = aggregateByMetric.get(metric);
    const differingFields = Object.keys(declared).filter((key) => declared[key] !== actual[key]);
    if (differingFields.length) warnings.push(`RAW_AGGREGATE_MISMATCH: ${metric} declared ${JSON.stringify(declared)}; recalculated from individual records ${JSON.stringify({ blind_count: actual.blind_count, approved_count: actual.approved_count, rejected_count: actual.rejected_count })}.`);
  }
  const normalizedCount = records.reduce((sum, item) => sum + item.normalized_values.length, 0);
  const rangeCount = records.reduce((sum, item) => sum + item.normalized_values.filter((value) => value.strategy === "RANGE_PRESERVING_TRANSLATION").length, 0);
  const artifact = {
    schema_version: "1.0.0",
    batch_id: batchId,
    batch_version: batchVersion,
    source: { source_id: sourceId, original_filename: originalFilename, raw_path: rawPath, sha256: sha256(bytes), imported_at: importedAt, analyzer_type: "EXTERNAL_MULTIMODAL_ANALYZER", analysis_protocol: "BLIND_ANALYSIS_THEN_HUMAN_LABEL_ATTACHMENT", data_classification: dataClassification },
    semantic_boundaries: { external_evidence_is_not_internal_analysis: true, candidate_signal_is_not_human_reason: true, candidate_signal_is_not_preference: true, correlation_is_not_causation: true, pairwise_created: false, preference_inference_performed: false, consensus_computed: false },
    mappings: resolvedMappings,
    records,
    human_label_attachments: humanLabels,
    raw_aggregate_output: { blind_statistics_section: extracted.sections.blind_statistics, descriptive_contrast_section: extracted.sections.descriptive_contrast, limitations_section: extracted.sections.limitations, source_of_truth: false, provenance: { asserted_by: "MULTIMODAL_ANALYZER", recorded_by: "EXTERNAL_VISUAL_ANALYSIS_IMPORTER", source_type: "EXTERNAL_DESCRIPTIVE_CONTRAST", source_ref: `${sourceId}#descriptive-contrast`, recorded_at: importedAt, data_classification: dataClassification } },
    recalculated_aggregates: aggregates,
    candidate_signals: candidateSignals,
    normalization_report: { strategy: "EXPLICIT_RANGE_PRESERVING", raw_values_preserved: true, normalized_value_count: normalizedCount, range_preserved_count: rangeCount, reversible: true },
    warnings,
    import_report: { status: warnings.length ? "WARNING" : "PASS", source_id: sourceId, images_found: extracted.records.length, images_mapped: resolvedMappings.length, observations_imported: records.length, human_labels_imported: humanLabels.length, candidate_signals_imported: candidateSignals.length, human_reasons_created: 0, pairs_created: 0, preferences_created: 0, warnings: clone(warnings) }
  };
  const validation = validateArtifact("external_visual_analysis_batch", artifact);
  if (!validation.valid) fail("MY_EYES_EXTERNAL_BATCH_SCHEMA_INVALID", "External visual analysis batch failed schema validation.", { errors: validation.errors });
  if (memory.human_reasons.length !== before.reasons || memory.pairwise_preferences.length !== before.pairs || memory.inferred_preferences.length !== before.preferences) fail("MY_EYES_EXTERNAL_IMPORT_MUTATED_MEMORY", "External evidence import cannot mutate human reasons, pairs, or inferred preferences.");
  return artifact;
}

export function persistExternalVisualAnalysisBatch({ rootDir, rawBytes, artifact, artifactPath = `data/my_eyes/imports/${artifact.batch_id}/normalized.json`, reportPath = `data/my_eyes/imports/${artifact.batch_id}/import-report.json` }) {
  const rawFull = path.resolve(rootDir, ...artifact.source.raw_path.split("/"));
  const artifactFull = path.resolve(rootDir, ...artifactPath.split("/"));
  const reportFull = path.resolve(rootDir, ...reportPath.split("/"));
  const root = path.resolve(rootDir).toLowerCase();
  for (const full of [rawFull, artifactFull, reportFull]) if (!full.toLowerCase().startsWith(`${root}${path.sep}`)) fail("MY_EYES_EXTERNAL_IMPORT_PATH_UNSAFE", "External import path escapes project root.", { path: full });
  if ([rawFull, artifactFull, reportFull].some((full) => fs.existsSync(full))) fail("MY_EYES_EXTERNAL_IMPORT_OVERWRITE_FORBIDDEN", "External evidence is append-only; existing import files cannot be overwritten.", { artifactPath });
  const bytes = Buffer.isBuffer(rawBytes) ? rawBytes : Buffer.from(String(rawBytes), "utf8");
  if (sha256(bytes) !== artifact.source.sha256) fail("MY_EYES_EXTERNAL_RAW_SHA_MISMATCH", "Raw source bytes do not match artifact SHA-256.");
  const written = [];
  try {
    for (const full of [rawFull, artifactFull, reportFull]) fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(rawFull, bytes, { flag: "wx" }); written.push(rawFull);
    fs.writeFileSync(artifactFull, `${JSON.stringify(artifact, null, 2)}\n`, { encoding: "utf8", flag: "wx" }); written.push(artifactFull);
    fs.writeFileSync(reportFull, `${JSON.stringify(artifact.import_report, null, 2)}\n`, { encoding: "utf8", flag: "wx" }); written.push(reportFull);
  } catch (error) { for (const full of written) fs.rmSync(full, { force: true }); throw error; }
  return { raw_path: posix(path.relative(rootDir, rawFull)), artifact_path: posix(path.relative(rootDir, artifactFull)), report_path: posix(path.relative(rootDir, reportFull)) };
}

export const externalVisualAnalysisRequiredTokens = requiredTokens;