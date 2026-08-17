import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateArtifact } from "../../src/compiler/schema-validator.mjs";
import { validateApprovedDirectionMemory } from "../../src/my-eyes/approved-direction-memory-loader.mjs";
import { buildMyEyesPreferenceModelV1 } from "../../src/my-eyes/preference-model-v1.mjs";
import { applyCardPositiveReference000001 } from "../../scripts/apply_card_positive_reference_000001.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(root, "data", "my_eyes", "approved_direction_memory.json");
const responsePath = path.join(root, "data", "my_eyes", "reviews", "CARD_POSITIVE_REFERENCE_APPROVED_6_000001.md");
const modelPath = path.join(root, "data", "my_eyes", "models", "MY_EYES_PREFERENCE_MODEL_V1.json");
const loadMemory = () => JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const loadModel = () => JSON.parse(fs.readFileSync(modelPath, "utf8"));

test("approved/6 card-only A — BONS response is preserved as literal HUMAN evidence", () => {
  const memory = loadMemory();
  const raw = fs.readFileSync(responsePath, "utf8");
  const reason = memory.human_reasons.find((item) => item.reason_id === "MYE_RSN_000014");
  const decision = memory.human_decisions.find((item) => item.image_id === "MYE_IMG_000006" && item.status === "ACTIVE");
  assert.equal(decision.decision, "APPROVED");
  assert.equal(reason.target.image_id, "MYE_IMG_000006");
  assert.equal(reason.raw_text, raw);
  assert.equal(reason.raw_text_sha256, crypto.createHash("sha256").update(raw, "utf8").digest("hex"));
  assert.equal(reason.provenance.asserted_by, "HUMAN");
  assert.equal(reason.provenance.source_ref, "my-eyes://card-positive-reference/approved-6/000001");
  assert.match(reason.raw_text, /A — BONS/);
  assert.match(reason.raw_text, /referência positiva de execução/);
});

test("Candidate 7 v4 exits insufficient evidence cautiously and is human-confirmed contextual", () => {
  const memory = loadMemory();
  const previous = memory.inferred_preferences.find((item) => item.preference_id === "MYE_PREF_000015");
  const candidate = memory.inferred_preferences.find((item) => item.preference_id === "MYE_PREF_000016");
  assert.equal(previous.status, "SUPERSEDED");
  assert.equal(candidate.version, 4);
  assert.equal(candidate.supersedes, previous.preference_id);
  assert.equal(candidate.status, "CONTEXTUAL");
  assert.equal(candidate.confidence, "MEDIUM");
  assert.equal(candidate.human_confirmed, true);
  assert.equal(candidate.preference_strength_status, "HUMAN_CONFIRMED_GENERALIZED_PREFERENCE");
  assert.equal(candidate.human_confirmation_event.raw_human_evidence_ref, "MYE_RSN_000014");
  assert.equal(candidate.supporting_evidence_refs.includes("MYE_RSN_000014"), true);
  assert.match(candidate.statement, /specific real-seeming content/i);
  assert.equal(candidate.explicitly_not_claimed.includes("all_good_cards_must_look_like_approved_6"), true);
  assert.equal(memory.summary.human_confirmed_generalized_preference_count, 7);
  assert.equal(validateApprovedDirectionMemory(memory, { rootDir: root, verifyFiles: true }).valid, true);
});

test("Preference Model v1 projects exactly the seven active human-confirmed preferences", () => {
  const memory = loadMemory();
  const model = loadModel();
  const activeIds = memory.inferred_preferences.filter((item) => item.status !== "SUPERSEDED").map((item) => item.preference_id);
  assert.equal(validateArtifact("my_eyes_preference_model", model).valid, true);
  assert.equal(model.model_id, "MYE_MODEL_000001");
  assert.equal(model.status, "HUMAN_CONFIRMED_CONTEXTUAL_MODEL");
  assert.equal(model.source_memory_version, memory.memory_version);
  assert.deepEqual(model.provenance.source_preference_ids, activeIds);
  assert.deepEqual(model.principles.map((item) => item.preference_id), activeIds);
  assert.equal(model.principles.length, 7);
  assert.equal(model.principles.every((item) => item.human_confirmed === true), true);
});

test("card profile binds approved/6 as a strong positive reference without making it universal", () => {
  const card = loadModel().card_execution_profile;
  assert.equal(card.status, "HUMAN_CONFIRMED_CONTEXTUAL");
  assert.equal(card.positive_reference_image_id, "MYE_IMG_000006");
  assert.equal(card.positive_reference_human_reason_id, "MYE_RSN_000014");
  assert.match(card.positive_definition, /specific content transformed/i);
  assert.equal(card.supported_positive_properties.some((item) => /coherent cluster/i.test(item)), true);
  assert.equal(card.supported_positive_properties.some((item) => /generic SaaS graphs/i.test(item)), true);
  assert.equal(card.unresolved_boundaries.some((item) => /not a universal template/i.test(item)), true);
});

test("Preference Model v1 contains no scores, weights, rankings, or runtime authority", () => {
  const model = loadModel();
  const prohibited = [];
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (/score|weight|ranking|coefficient/i.test(key)) prohibited.push(key);
        visit(child);
      }
    }
  };
  visit(model);
  assert.deepEqual(prohibited, []);
  assert.deepEqual(model.runtime_integration, {
    mode: "EVIDENCE_ARTIFACT_ONLY",
    creative_director: false,
    critic: false,
    compiler: false,
    generation: false
  });

  const mutation = structuredClone(model);
  mutation.score = 0.9;
  assert.equal(validateArtifact("my_eyes_preference_model", mutation).valid, false);
});

test("model builder refuses unresolved or unconfirmed active preference input", () => {
  const memory = loadMemory();
  const card = memory.inferred_preferences.find((item) => item.preference_id === "MYE_PREF_000016");
  card.human_confirmed = false;
  card.preference_strength_status = "NON_AUTHORITATIVE_CANDIDATE";
  delete card.human_confirmation_event;
  assert.throws(() => buildMyEyesPreferenceModelV1({ memory }), /must be human-confirmed/);
});

test("positive reference application and model projection are idempotent", () => {
  const first = applyCardPositiveReference000001({ rootDir: root, persist: false });
  const second = applyCardPositiveReference000001({ rootDir: root, persist: false });
  assert.equal(first.memory.memory_version, second.memory.memory_version);
  assert.equal(first.memory.memory_version, 36);
  assert.equal(first.memory.human_reasons.length, 14);
  assert.equal(first.memory.inferred_preferences.length, 16);
  assert.deepEqual(first.model, second.model);
  assert.match(first.report, /A — BONS/);
  assert.match(first.report, /Active human-confirmed principles: 7/);
  assert.match(first.report, /Runtime mode: EVIDENCE_ARTIFACT_ONLY/);
});
