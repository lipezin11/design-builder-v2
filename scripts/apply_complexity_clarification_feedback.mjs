import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadApprovedDirectionMemory } from "../src/my-eyes/approved-direction-memory-loader.mjs";
import { persistApprovedDirectionMemory } from "../src/my-eyes/human-evidence-store.mjs";
import { applyComplexityClarificationFeedback } from "../src/my-eyes/complexity-clarification-feedback.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(rootDir, "data/my_eyes/approved_direction_memory.json");
const dryRun = process.argv.includes("--dry-run");
const memory = loadApprovedDirectionMemory(manifestPath, { rootDir, verifyFiles: true });
const result = applyComplexityClarificationFeedback({ memory });
if (!dryRun) persistApprovedDirectionMemory({ manifestPath, memory: result.memory });
console.log(JSON.stringify({ dry_run: dryRun, ...result.report, memory_version: result.memory.memory_version, reason_id: result.human_reason.reason_id, structured_reason_id: result.structured_reason.structured_reason_id, corrected_hypothesis_id: result.corrected_hypothesis.hypothesis_id, density_review_id: result.density_review_v3.review_id }, null, 2));
