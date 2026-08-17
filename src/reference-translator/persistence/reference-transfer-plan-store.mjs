import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateArtifact } from "../../compiler/schema-validator.mjs";
import { REFERENCE_TRANSLATOR_ERROR_CODES as C, ReferenceTranslatorError } from "../reference-translator-errors.mjs";

const defaultDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../data/reference-translator");
const safeId = (value, label) => {
  if (typeof value !== "string" || !/^[A-Za-z0-9._-]+$/.test(value)) {
    throw new ReferenceTranslatorError(C.REFERENCE_PLAN_PERSISTENCE_FAILED, `${label} is unsafe for local persistence.`, { value });
  }
  return value;
};

const safeAttempt = (value) => {
  if (!Number.isInteger(value) || value < 1 || value > 999) {
    throw new ReferenceTranslatorError(C.REFERENCE_PLAN_PERSISTENCE_FAILED, "attempt is unsafe for local persistence.", { value });
  }
  return String(value).padStart(2, "0");
};

const serializeRawCandidate = (candidate) => {
  if (typeof candidate === "string") return { content: candidate, representation: "RAW_TEXT" };
  const content = JSON.stringify(candidate, null, 2);
  if (content === undefined) throw new ReferenceTranslatorError(C.REFERENCE_PLAN_PERSISTENCE_FAILED, "Visible candidate cannot be serialized for raw persistence.");
  return { content: content + "\n", representation: "JSON_VALUE" };
};

export const REFERENCE_TRANSLATOR_CANDIDATE_STATUS = Object.freeze({
  REJECTED: "REJECTED_CANDIDATE",
  ACCEPTED: "ACCEPTED_CANDIDATE"
});

export class ReferenceTransferPlanStore {
  constructor({ baseDirectory = defaultDirectory, allowOverwrite = false } = {}) {
    this.baseDirectory = path.resolve(baseDirectory);
    this.allowOverwrite = allowOverwrite;
  }

  planPath(planId) {
    return path.join(this.baseDirectory, "plans", `${safeId(planId, "plan_id")}.json`);
  }

  tracePath(runId) {
    return path.join(this.baseDirectory, "runs", `${safeId(runId, "run_id")}.trace.json`);
  }

  candidatePath(runId, attempt) {
    return path.join(this.baseDirectory, "candidates", safeId(runId, "run_id"), `attempt_${safeAttempt(attempt)}.raw.json`);
  }

  candidateMetadataPath(runId, attempt) {
    return path.join(this.baseDirectory, "candidates", safeId(runId, "run_id"), `attempt_${safeAttempt(attempt)}.meta.json`);
  }

  saveRawCandidate({ runId, attempt, candidate, createdAt = null }) {
    const rawTarget = this.candidatePath(runId, attempt);
    const metadataTarget = this.candidateMetadataPath(runId, attempt);
    if (!this.allowOverwrite && (fs.existsSync(rawTarget) || fs.existsSync(metadataTarget))) {
      throw new ReferenceTranslatorError(C.REFERENCE_PLAN_PERSISTENCE_FAILED, "Reference Translator candidate attempt already exists.", { run_id: runId, attempt });
    }
    const serialized = serializeRawCandidate(candidate);
    const metadata = {
      artifact_type: "REFERENCE_TRANSLATOR_RAW_CANDIDATE",
      status: REFERENCE_TRANSLATOR_CANDIDATE_STATUS.REJECTED,
      run_id: runId,
      attempt,
      raw_candidate_path: rawTarget,
      sha256: crypto.createHash("sha256").update(serialized.content, "utf8").digest("hex"),
      byte_length: Buffer.byteLength(serialized.content, "utf8"),
      representation: serialized.representation,
      created_at: createdAt
    };
    try {
      fs.mkdirSync(path.dirname(rawTarget), { recursive: true });
      const rawTemporary = `${rawTarget}.tmp`;
      const metadataTemporary = `${metadataTarget}.tmp`;
      fs.writeFileSync(rawTemporary, serialized.content, "utf8");
      fs.writeFileSync(metadataTemporary, JSON.stringify(metadata, null, 2) + "\n", "utf8");
      fs.renameSync(rawTemporary, rawTarget);
      fs.renameSync(metadataTemporary, metadataTarget);
      return { ...structuredClone(metadata), metadata_path: metadataTarget };
    } catch (error) {
      if (error instanceof ReferenceTranslatorError) throw error;
      throw new ReferenceTranslatorError(C.REFERENCE_PLAN_PERSISTENCE_FAILED, "Could not persist raw Reference Translator candidate.", { run_id: runId, attempt, cause: error.message });
    }
  }

  markCandidateAccepted({ runId, attempt, acceptedAt = null }) {
    const metadataTarget = this.candidateMetadataPath(runId, attempt);
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataTarget, "utf8"));
      metadata.status = REFERENCE_TRANSLATOR_CANDIDATE_STATUS.ACCEPTED;
      metadata.accepted_at = acceptedAt;
      const temporary = `${metadataTarget}.tmp`;
      fs.writeFileSync(temporary, JSON.stringify(metadata, null, 2) + "\n", "utf8");
      fs.renameSync(temporary, metadataTarget);
      return { ...structuredClone(metadata), metadata_path: metadataTarget };
    } catch (error) {
      if (error instanceof ReferenceTranslatorError) throw error;
      throw new ReferenceTranslatorError(C.REFERENCE_PLAN_PERSISTENCE_FAILED, "Could not mark Reference Translator candidate as accepted.", { run_id: runId, attempt, cause: error.message });
    }
  }

  loadRun(runId) {
    const target = this.tracePath(runId);
    if (!fs.existsSync(target)) return null;
    try { return JSON.parse(fs.readFileSync(target, "utf8")); }
    catch (error) { throw new ReferenceTranslatorError(C.REFERENCE_PLAN_PERSISTENCE_FAILED, "Could not load Reference Translator trace.", { run_id: runId, cause: error.message }); }
  }

  loadPlan(planId) {
    const target = this.planPath(planId);
    try {
      const plan = JSON.parse(fs.readFileSync(target, "utf8"));
      const validation = validateArtifact("reference_transfer_plan", plan);
      if (!validation.valid) throw new ReferenceTranslatorError(C.REFERENCE_PLAN_SCHEMA_INVALID, "Persisted Reference Transfer Plan is schema-invalid.", { schema_errors: validation.errors });
      return plan;
    } catch (error) {
      if (error instanceof ReferenceTranslatorError) throw error;
      throw new ReferenceTranslatorError(C.REFERENCE_PLAN_PERSISTENCE_FAILED, "Could not load Reference Transfer Plan.", { plan_id: planId, cause: error.message });
    }
  }

  saveTrace(trace) {
    const target = this.tracePath(trace.run_id);
    if (!this.allowOverwrite && fs.existsSync(target)) throw new ReferenceTranslatorError(C.REFERENCE_PLAN_PERSISTENCE_FAILED, "Reference Translator trace already exists.", { run_id: trace.run_id });
    this.#writeAtomic(target, trace);
    return { persisted: true, path: target };
  }

  saveExecution(plan, trace) {
    const validation = validateArtifact("reference_transfer_plan", plan);
    if (!validation.valid) throw new ReferenceTranslatorError(C.REFERENCE_PLAN_SCHEMA_INVALID, "Only schema-valid Reference Transfer Plans can be persisted.", { schema_errors: validation.errors });
    if (trace.output_plan_id !== plan.plan_id || trace.run_id === undefined) throw new ReferenceTranslatorError(C.REFERENCE_PLAN_PERSISTENCE_FAILED, "Trace must reference the plan and run being persisted.");
    const planTarget = this.planPath(plan.plan_id);
    const traceTarget = this.tracePath(trace.run_id);
    if (!this.allowOverwrite && (fs.existsSync(planTarget) || fs.existsSync(traceTarget))) {
      throw new ReferenceTranslatorError(C.REFERENCE_PLAN_PERSISTENCE_FAILED, "Reference Translator execution already exists.", { plan_id: plan.plan_id, run_id: trace.run_id });
    }
    try {
      fs.mkdirSync(path.dirname(planTarget), { recursive: true });
      fs.mkdirSync(path.dirname(traceTarget), { recursive: true });
      const planTemporary = `${planTarget}.tmp`;
      const traceTemporary = `${traceTarget}.tmp`;
      fs.writeFileSync(planTemporary, JSON.stringify(plan, null, 2) + "\n", "utf8");
      fs.writeFileSync(traceTemporary, JSON.stringify(trace, null, 2) + "\n", "utf8");
      fs.renameSync(planTemporary, planTarget);
      fs.renameSync(traceTemporary, traceTarget);
      return { persisted: true, plan_path: planTarget, trace_path: traceTarget };
    } catch (error) {
      if (error instanceof ReferenceTranslatorError) throw error;
      throw new ReferenceTranslatorError(C.REFERENCE_PLAN_PERSISTENCE_FAILED, "Could not persist Reference Translator execution.", { plan_id: plan.plan_id, run_id: trace.run_id, cause: error.message });
    }
  }

  #writeAtomic(target, value) {
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const temporary = `${target}.tmp`;
      fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n", "utf8");
      fs.renameSync(temporary, target);
    } catch (error) {
      throw new ReferenceTranslatorError(C.REFERENCE_PLAN_PERSISTENCE_FAILED, "Could not persist Reference Translator trace.", { target, cause: error.message });
    }
  }
}
