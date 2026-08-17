import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateApprovedDirectionMemory } from "../../src/my-eyes/approved-direction-memory-loader.mjs";
import { applyCardDiagnosticPair000001 } from "../../scripts/apply_card_diagnostic_pair_000001.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(root, "data", "my_eyes", "approved_direction_memory.json");
const responsePath = path.join(root, "data", "my_eyes", "reviews", "CARD_DIAGNOSTIC_PAIR_000001_RESPONSE.md");
const load = () => JSON.parse(fs.readFileSync(manifestPath, "utf8"));

test("Card Diagnostic Pair 000001 preserves the literal HUMAN response and B/EASY nuance", () => {
  const memory = load();
  const raw = fs.readFileSync(responsePath, "utf8");
  const pair = memory.pairwise_preferences.find((item) => item.pair_id === "MYE_PAIR_000006");
  const reason = memory.human_reasons.find((item) => item.reason_id === "MYE_RSN_000013");
  assert.ok(pair);
  assert.ok(reason);
  assert.equal(pair.left_image_id, "MYE_IMG_000017");
  assert.equal(pair.right_image_id, "MYE_IMG_000020");
  assert.equal(pair.result, "RIGHT_PREFERRED");
  assert.equal(pair.preferred_image_id, "MYE_IMG_000020");
  assert.equal(pair.pair_type, "DIAGNOSTIC_PAIR");
  assert.deepEqual(pair.human_reason_ids, ["MYE_RSN_000013"]);
  assert.equal(reason.raw_text, raw);
  assert.equal(reason.raw_text_sha256, crypto.createHash("sha256").update(raw, "utf8").digest("hex"));
  assert.match(reason.raw_text, /menos ruim/);
  assert.match(reason.raw_text, /Dificuldade: EASY/);
  assert.equal(reason.provenance.asserted_by, "HUMAN");
});

test("Candidate 7 v3 preserves the historical negative-only boundary", () => {
  const memory = load();
  const previous = memory.inferred_preferences.find((item) => item.preference_id === "MYE_PREF_000014");
  const candidate = memory.inferred_preferences.find((item) => item.preference_id === "MYE_PREF_000015");
  assert.equal(previous.status, "SUPERSEDED");
  assert.equal(candidate.version, 3);
  assert.equal(candidate.supersedes, previous.preference_id);
  assert.equal(candidate.status, "SUPERSEDED");
  assert.equal(candidate.human_confirmed, false);
  assert.equal(candidate.preference_strength_status, "NON_AUTHORITATIVE_CANDIDATE");
  assert.equal("human_confirmation_event" in candidate, false);
  assert.equal(candidate.pairwise_refs.includes("MYE_PAIR_000006"), true);
  assert.equal(candidate.human_evidence_refs.includes("MYE_RSN_000013"), true);
  assert.match(candidate.statement, /interchangeable ready-made dashboard/i);
  assert.match(candidate.statement, /evidence remains insufficient/i);
  assert.equal(candidate.explicitly_not_claimed.includes("candidate_B_is_an_excellent_card_reference"), true);
  assert.equal(candidate.explicitly_not_claimed.includes("positive_card_excellence_criteria_are_confirmed"), true);
  assert.equal(validateApprovedDirectionMemory(memory, { rootDir: root, verifyFiles: true }).valid, true);
});

test("less-bad winner cannot silently become a positive card reference, score, or weight", () => {
  const candidate = load().inferred_preferences.find((item) => item.preference_id === "MYE_PREF_000015");
  assert.equal(candidate.exceptions.some((value) => /less generic card execution, not.*positive excellence/i.test(value)), true);
  assert.equal(candidate.known_uncertainties.some((value) => /No current image is human-confirmed/i.test(value)), true);
  const keys = [];
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        keys.push(key);
        visit(child);
      }
    }
  };
  visit(candidate);
  assert.equal(keys.includes("score"), false);
  assert.equal(keys.includes("weight"), false);
  assert.equal(keys.includes("ranking_coefficient"), false);
});

test("Card Diagnostic Pair application remains idempotent after the later positive confirmation", () => {
  const first = applyCardDiagnosticPair000001({ rootDir: root, persist: false });
  const second = applyCardDiagnosticPair000001({ rootDir: root, persist: false });
  assert.equal(first.memory.memory_version, second.memory.memory_version);
  assert.equal(first.memory.pairwise_preferences.length, 6);
  assert.equal(first.memory.human_reasons.length, 14);
  assert.equal(first.memory.inferred_preferences.length, 16);
  assert.match(first.report, /B is less bad, not a positive example/);
  assert.match(first.report, /Historical stage outcome/);
  assert.match(first.report, /My Eyes Preference Model v1 ready: yes/);
  assert.equal(first.preferenceModelV1Ready, true);
  assert.match(first.report, /Scores: 0/);
  assert.match(first.report, /Critic integration: 0/);
});
