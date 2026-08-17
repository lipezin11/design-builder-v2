import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateApprovedDirectionMemory } from "../../src/my-eyes/approved-direction-memory-loader.mjs";
import { applyPreferenceReviewV1 } from "../../scripts/apply_my_eyes_preference_review_v1.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(projectRoot, "data", "my_eyes", "approved_direction_memory.json");
const reviewPath = path.join(projectRoot, "data", "my_eyes", "reviews", "PREFERENCE_INFERENCE_V1_REVIEW_000001.md");
const loadMemory = () => JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const active = (memory) => memory.inferred_preferences.filter((candidate) => candidate.status !== "SUPERSEDED");

test("literal candidate review is preserved as HUMAN evidence with a matching hash", () => {
  const memory = loadMemory();
  const raw = fs.readFileSync(reviewPath, "utf8");
  const reason = memory.human_reasons.find((item) =>
    item.target?.context_scope === "PREFERENCE_CANDIDATE_REVIEW" &&
    item.target?.context_ref === "PREFERENCE_INFERENCE_V1_REVIEW_000001"
  );
  assert.ok(reason);
  assert.equal(reason.reason_id, "MYE_RSN_000012");
  assert.equal(reason.raw_text, raw);
  assert.equal(reason.raw_text_sha256, crypto.createHash("sha256").update(raw, "utf8").digest("hex"));
  assert.equal(reason.provenance.asserted_by, "HUMAN");
  assert.equal(reason.provenance.source_ref, "my-eyes://preference-confirmation/review-000001");
});

test("v1 history is preserved while six v2 preferences become human-confirmed", () => {
  const memory = loadMemory();
  const current = active(memory);
  assert.equal(memory.inferred_preferences.length, 16);
  assert.equal(current.length, 7);
  assert.equal(memory.inferred_preferences.slice(0, 7).every((candidate) => candidate.status === "SUPERSEDED"), true);
  assert.equal(current.filter((candidate) => candidate.human_confirmed).length, 7);
  assert.equal(memory.summary.human_confirmed_generalized_preference_count, 7);
  for (const candidate of current.slice(0, 6)) {
    assert.equal(candidate.preference_strength_status, "HUMAN_CONFIRMED_GENERALIZED_PREFERENCE");
    assert.equal(candidate.human_confirmation_event.confirmed_by, "HUMAN");
    assert.equal(candidate.human_confirmation_event.raw_human_evidence_ref, "MYE_RSN_000012");
    assert.equal(candidate.supporting_evidence_refs.includes("MYE_RSN_000012"), true);
  }
  assert.equal(validateApprovedDirectionMemory(memory).valid, true);
});

test("Candidate 7 v3 remains preserved as the pre-confirmation historical boundary", () => {
  const candidate = loadMemory().inferred_preferences.find((item) => item.preference_id === "MYE_PREF_000015");
  assert.equal(candidate.status, "SUPERSEDED");
  assert.equal(candidate.human_confirmed, false);
  assert.equal(candidate.preference_strength_status, "NON_AUTHORITATIVE_CANDIDATE");
  assert.equal(candidate.confidence, "LOW");
  assert.equal("human_confirmation_event" in candidate, false);
  assert.equal(candidate.explicitly_not_claimed.includes("positive_card_excellence_criteria_are_confirmed"), true);
  assert.match(candidate.statement, /evidence remains insufficient/i);
  assert.match(candidate.statement, /interchangeable ready-made dashboard/i);
  assert.match(candidate.human_confirmation_question, /uma ou duas peças/i);
  assert.equal(candidate.conditions.some((condition) => /remain positive hypotheses/i.test(condition)), true);
  assert.equal(candidate.explicitly_not_claimed.includes("candidate_B_is_an_excellent_card_reference"), true);
});

test("generic visual signature is operationalized as specific decisions, not an AI-look detector", () => {
  const candidate = active(loadMemory()).find((item) => item.preference_id === "MYE_PREF_000010");
  assert.match(candidate.statement, /specific decisions/i);
  assert.match(candidate.statement, /instead of using 'looks AI-generated'/i);
  assert.equal(candidate.conditions.some((condition) => /interchangeable|another client/i.test(condition)), true);
  assert.equal(candidate.conditions.some((condition) => /lighting and depth logic/i.test(condition)), true);
  assert.equal(candidate.explicitly_not_claimed.includes("the_system_can_universally_detect_ai_look"), true);
});

test("schema rejects confirmation without matching authority state or explicit HUMAN event", () => {
  const mismatchedStrength = loadMemory();
  active(mismatchedStrength)[0].preference_strength_status = "NON_AUTHORITATIVE_CANDIDATE";
  assert.equal(validateApprovedDirectionMemory(mismatchedStrength).valid, false);

  const autoConfirmedCard = loadMemory();
  const card = active(autoConfirmedCard).find((item) => item.preference_id === "MYE_PREF_000016");
  delete card.human_confirmation_event;
  assert.equal(validateApprovedDirectionMemory(autoConfirmedCard).valid, false);
});

test("review application remains idempotent after Candidate 7 positive confirmation", () => {
  const first = applyPreferenceReviewV1({ rootDir: projectRoot, persist: false });
  const second = applyPreferenceReviewV1({ rootDir: projectRoot, persist: false });
  assert.equal(first.memory.memory_version, second.memory.memory_version);
  assert.equal(first.memory.inferred_preferences.length, 16);
  assert.match(first.report, /Human-confirmed generalized preferences: 7/);
  assert.match(first.report, /Needs more evidence: 0/);
  assert.match(first.report, /Critic integration: 0/);
  assert.match(first.report, /Creative Director integration: 0/);
});

test("preference review remains disconnected from compiler, generation, and critic runtime", () => {
  const roots = ["src/compiler", "src/generators", "src/validation"];
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(path.join(projectRoot, directory), { withFileTypes: true })) {
      const relative = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(relative);
      else if (entry.isFile()) files.push(relative);
    }
  };
  roots.forEach(walk);
  const coupled = files.filter((file) => {
    const text = fs.readFileSync(path.join(projectRoot, file), "utf8");
    return text.includes("preference-review-v1") || text.includes("PREFERENCE_CANDIDATES_V2");
  });
  assert.deepEqual(coupled, []);
});
