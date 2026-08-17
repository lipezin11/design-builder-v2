import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadApprovedDirectionMemory } from "../src/my-eyes/approved-direction-memory-loader.mjs";
import { persistApprovedDirectionMemory } from "../src/my-eyes/human-evidence-store.mjs";
import { applyInitialCandidateSignalHumanFeedback } from "../src/my-eyes/human-feedback-batch.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(rootDir, "data/my_eyes/approved_direction_memory.json");
const externalPath = path.join(rootDir, "data/my_eyes/imports/MYE_EXT_BATCH_000001/normalized.json");
const dryRun = process.argv.includes("--dry-run");
const memory = loadApprovedDirectionMemory(manifestPath, { rootDir, verifyFiles: true });
const externalArtifact = JSON.parse(fs.readFileSync(externalPath, "utf8"));
const result = applyInitialCandidateSignalHumanFeedback({ memory, externalArtifact });
if (!dryRun) persistApprovedDirectionMemory({ manifestPath, memory: result.memory });
console.log(JSON.stringify({ dry_run: dryRun, ...result.report, memory_version: result.memory.memory_version, reason_ids: result.human_reasons.map((item) => item.reason_id), structured_reason_ids: result.structured_reasons.map((item) => item.structured_reason_id), review_ids: result.candidate_signal_reviews.map((item) => item.review_id), hypothesis_id: result.system_hypothesis.hypothesis_id }, null, 2));
