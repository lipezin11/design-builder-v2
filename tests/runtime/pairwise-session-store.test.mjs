import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildApprovedDirectionMemory } from "../../src/my-eyes/approved-direction-memory-indexer.mjs";
import { validateArtifact } from "../../src/compiler/schema-validator.mjs";
import { PairwiseSessionError, appendHumanPairDecision, appendStructuredPairReason, buildPairwiseSession, correctHumanPairDecision, persistPairwiseSessionVersion, skipPair, validatePairwiseSession } from "../../src/my-eyes/pairwise-session-store.mjs";

const fixedNow = () => new Date("2026-08-15T12:00:00.000Z");
const nextNow = () => new Date("2026-08-15T13:00:00.000Z");
const laterNow = () => new Date("2026-08-15T14:00:00.000Z");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-builder-pair-session-"));
  for (const bucket of ["approved", "rejected", "pairs"]) fs.mkdirSync(path.join(root, "data", "my_eyes", bucket), { recursive: true });
  const png = (name) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from(name)]);
  for (let index = 1; index <= 3; index += 1) fs.writeFileSync(path.join(root, "data", "my_eyes", "approved", `a${index}.png`), png(`a${index}`));
  for (let index = 1; index <= 3; index += 1) fs.writeFileSync(path.join(root, "data", "my_eyes", "rejected", `b${index}.png`), png(`b${index}`));
  const memory = buildApprovedDirectionMemory({ rootDir: root, dataClassification: "SYNTHETIC_TEST_DATA", now: fixedNow });
  const ids = memory.images.map((image) => image.image_id);
  const definitions = [
    { pair_type: "STANDARD_PAIR", image_a_id: ids[0], image_b_id: ids[3], selection_reason: "Comparable portrait hierarchy.", comparable_dimensions: ["HIERARCHY"], refutation_capable: true },
    { pair_type: "DIAGNOSTIC_PAIR", image_a_id: ids[4], image_b_id: ids[1], selection_reason: "Comparable controlled complexity.", comparable_dimensions: ["COMPLEXITY"], hypothesis_refs: ["MYE_HYP_000002"], refutation_capable: true },
    { pair_type: "STANDARD_PAIR", image_a_id: ids[2], image_b_id: ids[5], selection_reason: "Comparable floating elements.", comparable_dimensions: ["FLOATING_ELEMENTS"], refutation_capable: true },
    { pair_type: "STANDARD_PAIR", image_a_id: ids[3], image_b_id: ids[1], selection_reason: "Comparable depth strategy.", comparable_dimensions: ["DEPTH"], refutation_capable: true },
    { pair_type: "HARD_PAIR", image_a_id: ids[2], image_b_id: ids[4], selection_reason: "Both retain different plausible virtues.", comparable_dimensions: ["TRADEOFF"], refutation_capable: true }
  ];
  const session = buildPairwiseSession({ memory, pair_definitions: definitions, now: fixedNow });
  return { root, memory, ids, definitions, session };
}

function cleanup(root) {
  const resolved = path.resolve(root);
  if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Refusing to clean a non-temporary directory.");
  fs.rmSync(resolved, { recursive: true, force: true });
}

test("builds five pending selections without creating human pairwise evidence", () => {
  const { root, memory, session } = fixture();
  try {
    assert.equal(session.pairs.length, 5);
    assert.equal(session.status, "WAITING_FOR_HUMAN");
    assert.equal(session.summary.completed_pair_count, 0);
    assert.equal(session.summary.human_pairwise_evidence_count, 0);
    assert.equal(memory.pairwise_preferences.length, 0);
  } finally { cleanup(root); }
});

test("selection authority is SYSTEM while decision authority is HUMAN", () => {
  const { root, session } = fixture();
  try {
    for (const pair of session.pairs) {
      assert.equal(pair.selection.selected_by, "SYSTEM");
      assert.equal(pair.decision_authority, "HUMAN");
      assert.equal(pair.selection.label_based_winner_inference, false);
    }
  } finally { cleanup(root); }
});

test("pending decisions contain only null human fields and no provenance", () => {
  const { root, session } = fixture();
  try {
    const decision = session.pairs[0].human_decision;
    assert.equal(decision.status, "PENDING");
    for (const field of ["winner", "raw_reason", "winner_reason", "loser_reason", "keep_from_loser", "decision_difficulty", "decisive_visual_dimension", "provenance"]) assert.equal(decision[field], null);
    assert.equal(decision.explicit_human_response, false);
  } finally { cleanup(root); }
});

test("historical APPROVED and REJECTED labels remain context-only", () => {
  const { root, session } = fixture();
  try {
    const pair = session.pairs[0];
    assert.equal(pair.image_a.label_snapshot.decision, "APPROVED");
    assert.equal(pair.image_b.label_snapshot.decision, "REJECTED");
    assert.equal(pair.image_a.label_snapshot.does_not_imply_pairwise_winner, true);
    assert.equal(pair.human_decision.winner, null);
  } finally { cleanup(root); }
});

test("missing images are rejected", () => {
  const { root, memory, definitions } = fixture();
  try {
    const mutated = structuredClone(definitions);
    mutated[0].image_a_id = "MYE_IMG_999999";
    assert.throws(() => buildPairwiseSession({ memory, pair_definitions: mutated, now: fixedNow }), (error) => error instanceof PairwiseSessionError && error.code === "MY_EYES_PAIR_IMAGE_MISSING");
  } finally { cleanup(root); }
});

test("self-comparisons are rejected", () => {
  const { root, memory, definitions } = fixture();
  try {
    const mutated = structuredClone(definitions);
    mutated[0].image_b_id = mutated[0].image_a_id;
    assert.throws(() => buildPairwiseSession({ memory, pair_definitions: mutated, now: fixedNow }), (error) => error instanceof PairwiseSessionError && error.code === "MY_EYES_PAIR_SELF_COMPARISON");
  } finally { cleanup(root); }
});

test("duplicate unordered selections are rejected", () => {
  const { root, memory, definitions } = fixture();
  try {
    const mutated = structuredClone(definitions);
    mutated[1].image_a_id = mutated[0].image_b_id;
    mutated[1].image_b_id = mutated[0].image_a_id;
    assert.throws(() => buildPairwiseSession({ memory, pair_definitions: mutated, now: fixedNow }), (error) => error instanceof PairwiseSessionError && error.code === "MY_EYES_PAIR_SELECTION_DUPLICATE");
  } finally { cleanup(root); }
});

test("session size is limited to four through six pairs", () => {
  const { root, memory, definitions } = fixture();
  try {
    assert.throws(() => buildPairwiseSession({ memory, pair_definitions: definitions.slice(0, 3), now: fixedNow }), (error) => error.code === "MY_EYES_PAIR_SESSION_SIZE_INVALID");
    assert.throws(() => buildPairwiseSession({ memory, pair_definitions: [...definitions, ...definitions.slice(0, 2)], now: fixedNow }), (error) => error.code === "MY_EYES_PAIR_SESSION_SIZE_INVALID");
  } finally { cleanup(root); }
});

test("at least one HARD_PAIR is mandatory", () => {
  const { root, memory, definitions } = fixture();
  try {
    const mutated = definitions.map((item) => ({ ...item, pair_type: item.pair_type === "HARD_PAIR" ? "STANDARD_PAIR" : item.pair_type }));
    assert.throws(() => buildPairwiseSession({ memory, pair_definitions: mutated, now: fixedNow }), (error) => error.code === "MY_EYES_HARD_PAIR_REQUIRED");
  } finally { cleanup(root); }
});

test("DIAGNOSTIC_PAIR is supported without becoming a decision", () => {
  const { root, session } = fixture();
  try {
    const diagnostic = session.pairs.find((pair) => pair.pair_type === "DIAGNOSTIC_PAIR");
    assert.ok(diagnostic);
    assert.equal(diagnostic.selection.hypothesis_refs[0], "MYE_HYP_000002");
    assert.equal(diagnostic.human_decision.status, "PENDING");
  } finally { cleanup(root); }
});

test("explicit human IMAGE_A response creates one completed evidence record", () => {
  const { root, session } = fixture();
  try {
    const updated = appendHumanPairDecision({ session, pair_id: session.pairs[0].pair_id, winner: "A", now: nextNow });
    assert.equal(updated.pairs[0].human_decision.winner, "IMAGE_A");
    assert.equal(updated.pairs[0].human_decision.provenance.asserted_by, "HUMAN");
    assert.equal(updated.summary.human_pairwise_evidence_count, 1);
    assert.equal(updated.status, "IN_PROGRESS");
  } finally { cleanup(root); }
});

test("explicit human IMAGE_B response is allowed even when B was historically rejected", () => {
  const { root, session } = fixture();
  try {
    const pair = session.pairs[0];
    assert.equal(pair.image_b.label_snapshot.decision, "REJECTED");
    const updated = appendHumanPairDecision({ session, pair_id: pair.pair_id, winner: "B", now: nextNow });
    assert.equal(updated.pairs[0].human_decision.winner, "IMAGE_B");
    assert.equal(updated.pairs[0].image_b.label_snapshot.decision, "REJECTED");
  } finally { cleanup(root); }
});

test("TIE is completed human evidence and never becomes SKIPPED", () => {
  const { root, session } = fixture();
  try {
    const updated = appendHumanPairDecision({ session, pair_id: session.pairs[0].pair_id, winner: "TIE", now: nextNow });
    assert.equal(updated.pairs[0].human_decision.status, "COMPLETED");
    assert.equal(updated.pairs[0].human_decision.winner, "TIE");
    assert.equal(updated.summary.completed_pair_count, 1);
    assert.equal(updated.summary.skipped_pair_count, 0);
  } finally { cleanup(root); }
});

test("SKIPPED records no winner and creates no human pairwise evidence", () => {
  const { root, session } = fixture();
  try {
    const updated = skipPair({ session, pair_id: session.pairs[0].pair_id, now: nextNow });
    assert.equal(updated.pairs[0].human_decision.status, "SKIPPED");
    assert.equal(updated.pairs[0].human_decision.winner, null);
    assert.equal(updated.summary.skipped_pair_count, 1);
    assert.equal(updated.summary.human_pairwise_evidence_count, 0);
  } finally { cleanup(root); }
});

test("decision difficulty remains null unless the human explicitly supplies it", () => {
  const { root, session } = fixture();
  try {
    const absent = appendHumanPairDecision({ session, pair_id: session.pairs[0].pair_id, winner: "A", now: nextNow });
    assert.equal(absent.pairs[0].human_decision.decision_difficulty, null);
    const supplied = appendHumanPairDecision({ session, pair_id: session.pairs[1].pair_id, winner: "B", decision_difficulty: "hard", now: laterNow });
    assert.equal(supplied.pairs[1].human_decision.decision_difficulty, "HARD");
  } finally { cleanup(root); }
});

test("raw human pair text is preserved literally", () => {
  const { root, session } = fixture();
  try {
    const raw = "  essa parece feita por uma pessoa, a outra tem aquela cara de ia  ";
    const updated = appendHumanPairDecision({ session, pair_id: session.pairs[0].pair_id, winner: "A", raw_reason: raw, now: nextNow });
    assert.equal(updated.pairs[0].human_decision.raw_reason, raw);
  } finally { cleanup(root); }
});

test("human corrections append a new decision version without overwriting raw history", () => {
  const { root, session } = fixture();
  try {
    const first = appendHumanPairDecision({ session, pair_id: session.pairs[0].pair_id, winner: "A", raw_reason: "primeira resposta", now: nextNow });
    const corrected = correctHumanPairDecision({ session: first, pair_id: first.pairs[0].pair_id, winner: "B", raw_reason: "resposta corrigida", now: laterNow });
    assert.equal(corrected.pairs[0].decision_history.length, 2);
    assert.equal(corrected.pairs[0].decision_history[0].raw_reason, "primeira resposta");
    assert.equal(corrected.pairs[0].decision_history[1].raw_reason, "resposta corrigida");
    assert.equal(corrected.pairs[0].human_decision.decision_version, 2);
  } finally { cleanup(root); }
});

test("SYSTEM structured reason remains separate, unconfirmed and linked to literal text", () => {
  const { root, session } = fixture();
  try {
    const answered = appendHumanPairDecision({ session, pair_id: session.pairs[0].pair_id, winner: "A", raw_reason: "a outra tem coisa pequena jogada", now: nextNow });
    const structured = appendStructuredPairReason({ session: answered, pair_id: answered.pairs[0].pair_id, concepts: ["FUNCTIONLESS_MICRODETAIL_ACCUMULATION"], normalized_statement: "The losing option was described as accumulating small unintegrated elements.", now: laterNow });
    const reason = structured.pairs[0].structured_pair_reason;
    assert.equal(reason.source_raw_text, "a outra tem coisa pequena jogada");
    assert.equal(reason.structured_by, "SYSTEM");
    assert.equal(reason.confirmed_by_human, false);
    assert.equal(reason.provenance.asserted_by, "SYSTEM");
  } finally { cleanup(root); }
});

test("schema mutations reject a SYSTEM-authored winner and non-null pending winner", () => {
  const { root, session } = fixture();
  try {
    const answered = appendHumanPairDecision({ session, pair_id: session.pairs[0].pair_id, winner: "A", now: nextNow });
    const impersonation = structuredClone(answered);
    impersonation.pairs[0].human_decision.provenance.asserted_by = "SYSTEM";
    impersonation.pairs[0].decision_history[0].provenance.asserted_by = "SYSTEM";
    assert.equal(validateArtifact("pairwise_session", impersonation).valid, false);
    const premature = structuredClone(session);
    premature.pairs[0].human_decision.winner = "IMAGE_A";
    assert.equal(validateArtifact("pairwise_session", premature).valid, false);
  } finally { cleanup(root); }
});

test("no scoring, weights or inferred preferences are produced after decisions", () => {
  const { root, session } = fixture();
  try {
    const updated = appendHumanPairDecision({ session, pair_id: session.pairs[0].pair_id, winner: "A", now: nextNow });
    assert.equal(updated.summary.scores_created, 0);
    assert.equal(updated.summary.weights_created, 0);
    assert.equal(updated.summary.inferred_preferences_created, 0);
    assert.equal("score" in updated.pairs[0], false);
  } finally { cleanup(root); }
});

test("semantic validation catches summary mutations", () => {
  const { root, session } = fixture();
  try {
    const mutated = structuredClone(session);
    mutated.summary.completed_pair_count = 1;
    const validation = validatePairwiseSession(mutated);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some((error) => error.code === "MY_EYES_PAIR_SESSION_SUMMARY_MISMATCH"));
  } finally { cleanup(root); }
});

test("persistence is append-only across session versions", () => {
  const { root, session } = fixture();
  try {
    const v1 = persistPairwiseSessionVersion({ root_dir: root, session });
    assert.match(v1.path, /MYE_PAIR_SESSION_000001\.json$/);
    assert.throws(() => persistPairwiseSessionVersion({ root_dir: root, session }), /EEXIST/);
    const updated = appendHumanPairDecision({ session, pair_id: session.pairs[0].pair_id, winner: "A", now: nextNow });
    const v2 = persistPairwiseSessionVersion({ root_dir: root, session: updated });
    assert.match(v2.path, /MYE_PAIR_SESSION_000001\.v000002\.json$/);
    assert.equal(fs.existsSync(v1.path), true);
  } finally { cleanup(root); }
});
