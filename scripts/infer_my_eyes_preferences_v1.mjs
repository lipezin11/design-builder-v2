import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendPreferenceCandidates } from "../src/my-eyes/preference-candidate-store.mjs";
import { buildPreferenceCandidatesV1, renderPreferenceInferenceReport } from "../src/my-eyes/preference-inference-v1.mjs";

export function runPreferenceInferenceV1({ rootDir, now = () => new Date(), persist = true }) {
  const manifestPath = path.join(rootDir, "data", "my_eyes", "approved_direction_memory.json");
  const reportPath = path.join(rootDir, "data", "my_eyes", "reports", "PREFERENCE_CANDIDATES_V1.md");
  const memory = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const candidates = buildPreferenceCandidatesV1({ memory, now });
  const expectedIds = new Set(candidates.map((item) => item.preference_id));
  const existing = memory.inferred_preferences.filter((item) => expectedIds.has(item.preference_id));
  let next;
  if (existing.length === 0) {
    next = appendPreferenceCandidates({ memory, candidates, now });
  } else if (existing.length === candidates.length) {
    next = memory;
  } else {
    throw new Error("Preference Inference v1 is partially present; refusing to invent or overwrite append-only history.");
  }
  const report = renderPreferenceInferenceReport({ memory: next, candidates: next.inferred_preferences.filter((item) => expectedIds.has(item.preference_id)) });
  if (persist) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    fs.writeFileSync(reportPath, report, "utf8");
  }
  return { memory: next, candidates, report, manifestPath, reportPath };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = runPreferenceInferenceV1({ rootDir });
  console.log(JSON.stringify({
    preference_candidates: result.memory.summary.inferred_preference_count,
    human_confirmed_generalized_preferences: result.memory.summary.human_confirmed_generalized_preference_count,
    scores: 0,
    weights: 0,
    critic_integration: 0,
    report_path: path.relative(rootDir, result.reportPath).replaceAll(path.sep, "/")
  }, null, 2));
}
