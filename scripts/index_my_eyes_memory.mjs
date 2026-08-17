import fs from "node:fs";
import path from "node:path";
import { buildApprovedDirectionMemory, writeApprovedDirectionMemory } from "../src/my-eyes/approved-direction-memory-indexer.mjs";
import { validateApprovedDirectionMemory } from "../src/my-eyes/approved-direction-memory-loader.mjs";

const rootDir = process.cwd();
const manifestPath = path.join(rootDir, "data", "my_eyes", "approved_direction_memory.json");
const existingMemory = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : null;
const memory = buildApprovedDirectionMemory({ rootDir, existingMemory, dataClassification: "REAL_HUMAN_EVIDENCE" });
const validation = validateApprovedDirectionMemory(memory, { rootDir, verifyFiles: true });

if (!validation.valid) {
  console.error(JSON.stringify({ status: "FAIL", errors: validation.errors }, null, 2));
  process.exit(1);
}

writeApprovedDirectionMemory({ manifestPath, memory });
console.log(JSON.stringify({
  status: "PASS",
  manifest_path: path.relative(rootDir, manifestPath).split(path.sep).join("/"),
  memory_version: memory.memory_version,
  approved: memory.summary.approved_count,
  rejected: memory.summary.rejected_count,
  bytes_accessible: memory.summary.available_image_count,
  pairwise_preferences: memory.summary.pairwise_count,
  human_reasons: memory.summary.human_reason_count,
  visual_analyses: memory.summary.visual_analysis_count,
  inferred_preferences: memory.summary.inferred_preference_count,
  visual_content_analyzed: memory.visual_content_analyzed
}, null, 2));
