import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildExternalVisualAnalysisBatch, persistExternalVisualAnalysisBatch } from "../src/my-eyes/importers/external-visual-analysis-importer.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = process.argv[2] ? path.resolve(process.argv[2]) : null;
const dryRun = process.argv.includes("--dry-run");

if (!sourcePath) {
  console.error("Usage: node scripts/import_external_visual_analysis.mjs <source.md> [--dry-run]");
  process.exitCode = 1;
} else {
  const rawBytes = fs.readFileSync(sourcePath);
  const memory = JSON.parse(fs.readFileSync(path.join(rootDir, "data/my_eyes/approved_direction_memory.json"), "utf8"));
  const mappingDocument = JSON.parse(fs.readFileSync(path.join(rootDir, "data/my_eyes/imports/mappings/visual_analysis_batch_001.mapping.json"), "utf8"));
  const artifact = buildExternalVisualAnalysisBatch({
    rawBytes,
    originalFilename: path.basename(sourcePath),
    memory,
    mappings: mappingDocument.mappings,
    rawPath: "data/my_eyes/imports/MYE_EXT_BATCH_000001/raw/Markdown(2).md colado",
    importedAt: new Date().toISOString()
  });
  const result = dryRun ? null : persistExternalVisualAnalysisBatch({ rootDir, rawBytes, artifact });
  console.log(JSON.stringify({ dry_run: dryRun, import_report: artifact.import_report, normalization_report: artifact.normalization_report, recalculated_aggregates: artifact.recalculated_aggregates, paths: result }, null, 2));
}
