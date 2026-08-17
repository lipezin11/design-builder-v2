import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SUPPORTED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const POSIX = (value) => value.split(path.sep).join("/");

export class ApprovedDirectionMemoryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "ApprovedDirectionMemoryError";
    this.code = code;
    this.details = details;
  }
}

function listFilesRecursive(directory) {
  if (!fs.existsSync(directory)) return [];
  const entries = fs.readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFilesRecursive(fullPath);
    return entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) ? [fullPath] : [];
  });
}

function detectMimeType(bytes) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

function sequenceFromId(id) {
  const match = /_([0-9]{6})$/.exec(id ?? "");
  return match ? Number(match[1]) : 0;
}

function createAllocator(prefix, existingIds) {
  let current = Math.max(0, ...existingIds.map(sequenceFromId));
  return () => `${prefix}_${String(++current).padStart(6, "0")}`;
}

function provenanceForDecision({ decision, sourcePath, recordedAt, dataClassification }) {
  return {
    asserted_by: "HUMAN",
    recorded_by: "SYSTEM_INDEXER",
    source_type: decision === "APPROVED" ? "APPROVED_IMAGE" : "REJECTED_IMAGE",
    source_ref: sourcePath,
    recorded_at: recordedAt,
    data_classification: dataClassification
  };
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

export function scanApprovedDirectionImages({ rootDir }) {
  const sources = [
    { bucket: "APPROVED", directory: path.join(rootDir, "data", "my_eyes", "approved") },
    { bucket: "REJECTED", directory: path.join(rootDir, "data", "my_eyes", "rejected") }
  ];
  const seenHashes = new Map();
  const records = [];

  for (const source of sources) {
    for (const fullPath of listFilesRecursive(source.directory)) {
      const bytes = fs.readFileSync(fullPath);
      if (bytes.length === 0) {
        throw new ApprovedDirectionMemoryError("MY_EYES_EMPTY_IMAGE", "An indexed image has no bytes.", { fullPath });
      }
      const mimeType = detectMimeType(bytes);
      if (!mimeType) {
        throw new ApprovedDirectionMemoryError("MY_EYES_INVALID_IMAGE_SIGNATURE", "An indexed file does not have a supported image signature.", { fullPath });
      }
      const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
      const sourcePath = POSIX(path.relative(rootDir, fullPath));
      if (seenHashes.has(sha256)) {
        throw new ApprovedDirectionMemoryError("MY_EYES_DUPLICATE_IMAGE_BYTES", "The same image bytes occur more than once; one stable identity cannot carry ambiguous locations or labels.", {
          sha256,
          firstPath: seenHashes.get(sha256),
          duplicatePath: sourcePath
        });
      }
      seenHashes.set(sha256, sourcePath);
      records.push({
        decision: source.bucket,
        originalFilename: path.basename(fullPath),
        sourcePath,
        sha256,
        byteSize: bytes.length,
        mimeType
      });
    }
  }

  return records.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath, "en", { numeric: true }));
}

function activeDecisionFor(image, decisions) {
  return decisions.find((item) => item.evidence_id === image?.current_decision_evidence_id && item.status === "ACTIVE");
}

function calculateSummary(memory) {
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
    candidate_signal_review_count: (memory.candidate_signal_reviews ?? []).length,
    system_hypothesis_count: (memory.system_hypotheses ?? []).length
  };
}

export function buildApprovedDirectionMemory({
  rootDir,
  existingMemory = null,
  dataClassification = "REAL_HUMAN_EVIDENCE",
  now = () => new Date()
}) {
  if (!rootDir) throw new ApprovedDirectionMemoryError("MY_EYES_ROOT_REQUIRED", "rootDir is required.");
  if (!["REAL_HUMAN_EVIDENCE", "SYNTHETIC_TEST_DATA"].includes(dataClassification)) {
    throw new ApprovedDirectionMemoryError("MY_EYES_CLASSIFICATION_INVALID", "Unsupported data classification.", { dataClassification });
  }
  if (existingMemory && existingMemory.data_classification !== dataClassification) {
    throw new ApprovedDirectionMemoryError("MY_EYES_CLASSIFICATION_CHANGE_FORBIDDEN", "A memory cannot be reindexed under a different data classification.");
  }

  const timestamp = now().toISOString();
  const scanned = scanApprovedDirectionImages({ rootDir });
  const previousImages = clone(existingMemory?.images ?? []);
  const decisions = clone(existingMemory?.human_decisions ?? []);
  const imageByHash = new Map(previousImages.map((item) => [item.sha256, item]));
  const allocateImageId = createAllocator("MYE_IMG", previousImages.map((item) => item.image_id));
  const allocateDecisionId = createAllocator("MYE_DEC", decisions.map((item) => item.evidence_id));
  const currentHashes = new Set();
  const images = [];

  for (const record of scanned) {
    currentHashes.add(record.sha256);
    const previousImage = imageByHash.get(record.sha256);
    const imageId = previousImage?.image_id ?? allocateImageId();
    let activeDecision = activeDecisionFor(previousImage, decisions);

    if (!activeDecision || activeDecision.decision !== record.decision) {
      if (activeDecision) activeDecision.status = "SUPERSEDED";
      const evidenceId = allocateDecisionId();
      const nextDecision = {
        evidence_id: evidenceId,
        evidence_level: "LEVEL_0_HUMAN_DECISION",
        image_id: imageId,
        decision: record.decision,
        status: "ACTIVE",
        assertion_scope: "HUMAN_DECISION_ONLY",
        reason_provided: false,
        ...(activeDecision ? { supersedes_evidence_id: activeDecision.evidence_id } : {}),
        provenance: provenanceForDecision({
          decision: record.decision,
          sourcePath: record.sourcePath,
          recordedAt: timestamp,
          dataClassification
        })
      };
      decisions.push(nextDecision);
      activeDecision = nextDecision;
    }

    const analyzed = (existingMemory?.visual_analyses ?? []).some((item) => item.image_id === imageId);
    images.push({
      image_id: imageId,
      original_filename: record.originalFilename,
      source_path: record.sourcePath,
      source_bucket: record.decision,
      sha256: record.sha256,
      byte_size: record.byteSize,
      mime_type: record.mimeType,
      availability: "AVAILABLE",
      byte_accessible: true,
      indexed_at: previousImage?.indexed_at ?? timestamp,
      current_decision_evidence_id: activeDecision.evidence_id,
      visual_content_analyzed: analyzed,
      data_classification: dataClassification
    });
  }

  for (const previousImage of previousImages) {
    if (!currentHashes.has(previousImage.sha256)) {
      images.push({ ...previousImage, availability: "MISSING", byte_accessible: false });
    }
  }

  images.sort((a, b) => a.image_id.localeCompare(b.image_id));
  decisions.sort((a, b) => a.evidence_id.localeCompare(b.evidence_id));

  const memory = {
    schema_version: "1.1.0",
    memory_id: existingMemory?.memory_id ?? "approved-direction-memory",
    memory_version: (existingMemory?.memory_version ?? 0) + 1,
    created_at: existingMemory?.created_at ?? timestamp,
    updated_at: timestamp,
    data_classification: dataClassification,
    visual_content_analyzed: (existingMemory?.visual_analyses ?? []).length > 0,
    semantic_boundaries: {
      approval_is_not_general_quality: true,
      rejection_is_not_failure_reason: true,
      visual_analysis_is_not_human_preference: true,
      inference_is_not_human_truth: true,
      pairwise_requires_explicit_comparison: true
    },
    images,
    human_decisions: decisions,
    human_reasons: clone(existingMemory?.human_reasons ?? []),
    structured_human_reasons: clone(existingMemory?.structured_human_reasons ?? []),
    candidate_signal_reviews: clone(existingMemory?.candidate_signal_reviews ?? []),
    system_hypotheses: clone(existingMemory?.system_hypotheses ?? []),
    visual_analyses: clone(existingMemory?.visual_analyses ?? []),
    pairwise_preferences: clone(existingMemory?.pairwise_preferences ?? []),
    inferred_preferences: clone(existingMemory?.inferred_preferences ?? []),
    summary: {},
    provenance: {
      producer: "APPROVED_DIRECTION_MEMORY_INDEXER",
      producer_version: "1.0.0",
      source_directories: ["data/my_eyes/approved", "data/my_eyes/rejected"],
      indexing_method: "DIRECTORY_CLASSIFICATION_AND_BYTE_METADATA_ONLY",
      visual_analysis_performed: false
    }
  };
  memory.summary = calculateSummary(memory);
  if (existingMemory) {
    const comparable = (value) => {
      const copy = structuredClone(value);
      delete copy.memory_version;
      delete copy.updated_at;
      return JSON.stringify(copy);
    };
    if (comparable(memory) === comparable(existingMemory)) return structuredClone(existingMemory);
  }
  return memory;
}

export function writeApprovedDirectionMemory({ manifestPath, memory }) {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(memory, null, 2)}\n`, "utf8");
  return manifestPath;
}
