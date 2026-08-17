import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendHumanReason, persistApprovedDirectionMemory } from "../src/my-eyes/human-evidence-store.mjs";
import { appendPreferenceRevision } from "../src/my-eyes/preference-candidate-store.mjs";
import {
  PREFERENCE_REVIEW_V1_CONTEXT,
  buildPreferenceRevisionsV2,
  renderPreferenceReviewV2Report
} from "../src/my-eyes/preference-review-v1.mjs";

const EXPECTED_IDS = Array.from({ length: 7 }, (_, index) =>
  `MYE_PREF_${String(index + 8).padStart(6, "0")}`
);

export function applyPreferenceReviewV1({ rootDir, now = () => new Date(), persist = true }) {
  const manifestPath = path.join(rootDir, "data", "my_eyes", "approved_direction_memory.json");
  const reviewPath = path.join(rootDir, "data", "my_eyes", "reviews", "PREFERENCE_INFERENCE_V1_REVIEW_000001.md");
  const reportPath = path.join(rootDir, "data", "my_eyes", "reports", "PREFERENCE_CANDIDATES_V2.md");
  let memory = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  let review = memory.human_reasons.find((reason) =>
    reason.target?.context_scope === PREFERENCE_REVIEW_V1_CONTEXT.context_scope &&
    reason.target?.context_ref === PREFERENCE_REVIEW_V1_CONTEXT.context_ref &&
    reason.status === "ACTIVE"
  );

  if (!review) {
    const rawText = fs.readFileSync(reviewPath, "utf8");
    const result = appendHumanReason({
      memory,
      context_scope: PREFERENCE_REVIEW_V1_CONTEXT.context_scope,
      context_ref: PREFERENCE_REVIEW_V1_CONTEXT.context_ref,
      raw_text: rawText,
      source_ref: PREFERENCE_REVIEW_V1_CONTEXT.source_ref,
      now
    });
    memory = result.memory;
    review = result.reason;
  }

  const existing = memory.inferred_preferences.filter((candidate) => EXPECTED_IDS.includes(candidate.preference_id));
  if (existing.length === 0) {
    const revisions = buildPreferenceRevisionsV2({ memory, now });
    for (const revision of revisions) {
      memory = appendPreferenceRevision({
        memory,
        previousPreferenceId: revision.supersedes,
        revisedCandidate: revision,
        now
      });
    }
  } else if (existing.length !== EXPECTED_IDS.length) {
    throw new Error("Preference review v2 is partially present; refusing to overwrite or branch append-only history.");
  }

  const candidates = memory.inferred_preferences.filter((candidate) => EXPECTED_IDS.includes(candidate.preference_id));
  const report = renderPreferenceReviewV2Report({ memory, candidates });

  if (persist) {
    persistApprovedDirectionMemory({ manifestPath, memory });
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report, "utf8");
  }

  return { memory, review, candidates, report, manifestPath, reviewPath, reportPath };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = applyPreferenceReviewV1({ rootDir });
  const active = result.memory.inferred_preferences.filter((candidate) => candidate.status !== "SUPERSEDED");
  const activeCardCandidate = active.find((candidate) => candidate.related_concepts.includes("GENERIC_CARD_TREATMENT_SENSITIVITY"));
  console.log(JSON.stringify({
    active_preference_candidates: active.length,
    historical_preference_records: result.memory.summary.inferred_preference_count,
    human_confirmed_generalized_preferences: result.memory.summary.human_confirmed_generalized_preference_count,
    needs_more_evidence: active.filter((candidate) => candidate.status === "INSUFFICIENT_EVIDENCE").length,
    candidate_7_human_confirmed: activeCardCandidate.human_confirmed,
    scores: 0,
    weights: 0,
    critic_integration: 0,
    report_path: path.relative(rootDir, result.reportPath).replaceAll(path.sep, "/")
  }, null, 2));
}
