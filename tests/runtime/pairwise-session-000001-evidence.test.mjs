import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateApprovedDirectionMemory } from "../../src/my-eyes/approved-direction-memory-loader.mjs";
import { loadPairwiseSession, validatePairwiseSession } from "../../src/my-eyes/pairwise-session-store.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const sessionsDir = path.join(root, "data", "my_eyes", "pairwise", "sessions");
const memory = JSON.parse(fs.readFileSync(path.join(root, "data", "my_eyes", "approved_direction_memory.json"), "utf8"));
const session = loadPairwiseSession(path.join(sessionsDir, "MYE_PAIR_SESSION_000001.v000011.json"));

test("real pairwise session 000001 is completed with five human decisions", () => {
  assert.equal(session.status, "COMPLETED");
  assert.equal(session.session_version, 11);
  assert.equal(session.summary.completed_pair_count, 5);
  assert.equal(session.summary.human_pairwise_evidence_count, 5);
  assert.equal(session.summary.pending_pair_count, 0);
});

test("winner and difficulty sequence matches the five explicit human responses", () => {
  assert.deepEqual(session.pairs.map((pair) => pair.human_decision.winner), ["IMAGE_A", "IMAGE_B", "IMAGE_A", "IMAGE_B", "IMAGE_A"]);
  assert.deepEqual(session.pairs.map((pair) => pair.human_decision.decision_difficulty), ["EASY", "EASY", "EASY", "EASY", "HARD"]);
  assert.ok(session.pairs.every((pair) => pair.human_decision.provenance.asserted_by === "HUMAN"));
});

test("Pair 02 preserves unspecified loser cause and keep-from-loser as null", () => {
  const pair = session.pairs[1];
  assert.equal(pair.human_decision.winner_reason, "o fundo esta muito melhor, qualidade visual");
  assert.equal(pair.human_decision.loser_reason, null);
  assert.equal(pair.human_decision.keep_from_loser, null);
});

test("each session decision is linked to one canonical human pairwise memory record", () => {
  for (const selection of session.pairs) {
    const match = selection.human_decision.provenance.source_ref.match(/#(MYE_PAIR_\d{6})$/);
    assert.ok(match, `${selection.pair_id} has no canonical pair link`);
    const pair = memory.pairwise_preferences.find((item) => item.pair_id === match[1]);
    assert.ok(pair);
    assert.equal(pair.provenance.asserted_by, "HUMAN");
    const reason = memory.human_reasons.find((item) => pair.human_reason_ids.includes(item.reason_id));
    assert.equal(reason.raw_text, selection.human_decision.raw_reason);
  }
});

test("Pair 05 raw human response matches the attached literal text", () => {
  const attachment = fs.readFileSync("C:/Users/filpz/.codex/attachments/a4277f18-d219-4a49-9b7e-1a6feeab9a11/pasted-text.txt", "utf8").replaceAll("\r\n", "\n");
  const marker = "RAW HUMAN RESPONSE:\n\n\"";
  const start = attachment.indexOf(marker) + marker.length;
  const end = attachment.indexOf("\"\n\n━━━━━━━━", start);
  assert.ok(start >= marker.length && end > start);
  assert.equal(session.pairs[4].human_decision.raw_reason, attachment.slice(start, end));
});

test("Pair 05 preserves technical realism strengths despite IMAGE_A winning", () => {
  const pair = session.pairs[4];
  assert.match(pair.human_decision.raw_reason, /o realismo do personagem ta melhor/);
  assert.match(pair.human_decision.keep_from_loser, /qualidade do realismo/);
  assert.match(pair.human_decision.keep_from_loser, /mistura de vermelho com azul/);
  assert.equal(pair.human_decision.winner, "IMAGE_A");
});

test("structured pair reasons remain SYSTEM interpretations and unconfirmed", () => {
  for (const pair of session.pairs) {
    assert.equal(pair.structured_pair_reason.structured_by, "SYSTEM");
    assert.equal(pair.structured_pair_reason.confirmed_by_human, false);
    assert.equal(pair.structured_pair_reason.provenance.asserted_by, "SYSTEM");
    assert.equal(pair.structured_pair_reason.source_raw_text, pair.human_decision.raw_reason);
  }
});

test("controlled complexity, narrative function, AI-looking accumulation and color vitality are represented contextually", () => {
  const concepts = new Set(session.pairs[4].structured_pair_reason.concepts);
  for (const concept of ["CONTROLLED_INTENTIONAL_COMPLEXITY", "NARRATIVE_FUNCTIONAL_COHERENCE", "FUNCTIONLESS_MICRODETAIL_ACCUMULATION", "AI_LOOKING_DESIGN", "COLOR_VITALITY_WITH_CONTROLLED_CONTRAST", "TECHNICAL_REALISM_NOT_SUFFICIENT"]) assert.equal(concepts.has(concept), true);
  assert.match(session.pairs[4].structured_pair_reason.normalized_statement, /contextual|universal/i);
});

test("pairwise capture itself created no score, weight, ranking, or inferred preference", () => {
  assert.equal(session.summary.scores_created, 0);
  assert.equal(session.summary.weights_created, 0);
  assert.equal(session.summary.inferred_preferences_created, 0);
  assert.equal(memory.inferred_preferences.length, 16);
  assert.equal(memory.summary.human_confirmed_generalized_preference_count, 7);
  assert.equal("ranking" in session, false);
});

test("original pending session and every append-only version are preserved", () => {
  const original = loadPairwiseSession(path.join(sessionsDir, "MYE_PAIR_SESSION_000001.json"));
  assert.equal(original.status, "WAITING_FOR_HUMAN");
  assert.ok(original.pairs.every((pair) => pair.human_decision.status === "PENDING"));
  const files = fs.readdirSync(sessionsDir).filter((name) => /^MYE_PAIR_SESSION_000001(?:\.v\d{6})?\.json$/.test(name));
  assert.equal(files.length, 11);
});

test("real memory and completed session pass semantic validation", () => {
  assert.equal(validateApprovedDirectionMemory(memory, { rootDir: root, verifyFiles: true }).valid, true);
  assert.equal(validatePairwiseSession(session).valid, true);
  assert.equal(memory.summary.pairwise_count, 6);
  assert.deepEqual(memory.pairwise_preferences.map((pair) => pair.pair_type), ["STANDARD_PAIR", "DIAGNOSTIC_PAIR", "DIAGNOSTIC_PAIR", "STANDARD_PAIR", "HARD_PAIR", "DIAGNOSTIC_PAIR"]);
});
