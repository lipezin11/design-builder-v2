import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { CognitiveModelAdapter, ScriptedCognitiveModelAdapter } from "../../src/reference-translator/model/cognitive-model-adapter.mjs";
import { executeReferenceTranslator } from "../../src/reference-translator/runtime/reference-translator-runtime.mjs";
import { ReferenceTransferPlanStore } from "../../src/reference-translator/persistence/reference-transfer-plan-store.mjs";
import { REFERENCE_TRANSLATOR_ERROR_CODES as C } from "../../src/reference-translator/reference-translator-errors.mjs";
import { loadJson } from "./test-helpers.mjs";
import { crossAsset, crossBrief, crossContext, crossPlan, fixedClock, runtimeRequest } from "./reference-translator-test-helpers.mjs";

const temporaryStore = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "design-builder-reference-translator-"));
  return { directory, store: new ReferenceTransferPlanStore({ baseDirectory: directory }) };
};
const cleanup = (directory) => {
  const resolved = path.resolve(directory);
  if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Refusing to clean a non-temporary directory.");
  fs.rmSync(resolved, { recursive: true, force: true });
};

test("cognitive model adapter base is abstract", () => {
  assert.throws(() => new CognitiveModelAdapter({ adapterId: "x" }), TypeError);
});

test("runtime produces a validated cross-category Reference Transfer Plan", async () => {
  const adapter = new ScriptedCognitiveModelAdapter({ responses: [crossPlan()] });
  const request = runtimeRequest({ adapter });
  const before = {
    context: structuredClone(request.context),
    brief: structuredClone(request.brief_spec),
    assets: structuredClone(request.reference_assets)
  };
  const result = await executeReferenceTranslator(request);
  assert.equal(result.plan.plan_id, "plan_cross_category_perfume");
  assert.equal(result.plan.design_decision_map[0].action, "REINVENT");
  assert.equal(result.plan.design_decision_map[0].cross_category_adaptation.literal_transfer_allowed, false);
  assert.equal(result.trace.status, "COMPLETE");
  assert.equal(result.trace.prompt_version, "REFERENCE_TRANSLATOR_AGENT_V1_1");
  assert.equal(result.trace.hidden_reasoning_persisted, false);
  assert.equal(result.trace.attempts[0].status, "PASS");
  assert.equal(adapter.requests[0].structured_context.authority_and_task.project_id, "project_cross_category_perfume");
  assert.equal(adapter.requests[0].structured_context.authority_and_task.run_id, "run-cross-category-perfume");
  assert.deepEqual(request.context, before.context);
  assert.deepEqual(request.brief_spec, before.brief);
  assert.deepEqual(request.reference_assets, before.assets);
});

test("runtime retries invalid JSON with concise diagnostic codes", async () => {
  const adapter = new ScriptedCognitiveModelAdapter({ responses: ["not-json", crossPlan()] });
  const result = await executeReferenceTranslator(runtimeRequest({ adapter, run_id: "run-retry-json" }));
  assert.equal(adapter.invokeCount, 2);
  assert.equal(result.trace.attempts[0].error_code, C.MODEL_OUTPUT_INVALID_JSON);
  assert.equal(result.trace.attempts[1].status, "PASS");
  const correction = adapter.requests[1].structured_context.authority_and_task.correction_diagnostics;
  assert.deepEqual(correction.map((item) => item.code), [C.MODEL_OUTPUT_INVALID_JSON]);
  assert.equal(JSON.stringify(correction).includes("internal monologue"), false);
});

test("runtime sends schema-aware contract corrections and persists compact trace summaries", async () => {
  const invalid = crossPlan();
  invalid.reference_analyses[0].authority = "PRIMARY_REFERENCE";
  invalid.non_negotiable_anchors[0].provenance = "USER_CONSTRAINT";
  const before = structuredClone(invalid);
  const adapter = new ScriptedCognitiveModelAdapter({ responses: [invalid, crossPlan()] });
  const result = await executeReferenceTranslator(runtimeRequest({ adapter, run_id: "run-retry-schema-aware" }));
  assert.equal(adapter.invokeCount, 2);
  const authorityTask = adapter.requests[1].structured_context.authority_and_task;
  const authority = authorityTask.correction_diagnostics.find((item) => item.path === "/reference_analyses/0/authority");
  const provenance = authorityTask.correction_diagnostics.find((item) => item.path === "/non_negotiable_anchors/0/provenance");
  assert.deepEqual(authority.allowed_values, ["USER_PRIMARY_REFERENCE", "USER_SECONDARY_REFERENCE", "SUPPORTING_REFERENCE"]);
  assert.equal(authority.received_value, "PRIMARY_REFERENCE");
  assert.deepEqual(provenance.allowed_values, ["OBSERVED", "INFERRED", "USER_EXPLICIT", "MODEL_INFERENCE"]);
  assert.equal(authorityTask.correction_protocol.authority, "CONTRACT_CORRECTION_ONLY");
  assert.equal(authorityTask.correction_protocol.return_complete_reference_transfer_plan, true);
  assert.equal(authorityTask.correction_protocol.runtime_output_repair, false);
  assert.deepEqual(invalid, before);
  assert.deepEqual(result.trace.attempts[0].diagnostic_summaries.map((item) => ({
    stage: item.stage,
    path: item.path,
    diagnostic_code: item.diagnostic_code,
    allowed_values_count: item.allowed_values_count
  })), [
    { stage: "SCHEMA", path: "/reference_analyses/0/authority", diagnostic_code: "SCHEMA_ENUM_MISMATCH", allowed_values_count: 3 },
    { stage: "SCHEMA", path: "/non_negotiable_anchors/0/provenance", diagnostic_code: "SCHEMA_ENUM_MISMATCH", allowed_values_count: 4 }
  ]);
  assert.deepEqual(result.trace.attempts[0].diagnostic_summaries[0].allowed_values, ["USER_PRIMARY_REFERENCE", "USER_SECONDARY_REFERENCE", "SUPPORTING_REFERENCE"]);
  assert.match(result.trace.attempts[0].diagnostic_summaries[0].schema_path, /authority/);
  assert.equal(result.trace.schema_contract.schema_name, "reference_transfer_plan");
  assert.match(result.trace.schema_contract.sha256, /^[a-f0-9]{64}$/);
});

test("schema-valid first attempt has no correction protocol or additional model call", async () => {
  const adapter = new ScriptedCognitiveModelAdapter({ responses: [crossPlan()] });
  const result = await executeReferenceTranslator(runtimeRequest({ adapter, run_id: "run-valid-no-correction" }));
  assert.equal(adapter.invokeCount, 1);
  assert.deepEqual(adapter.requests[0].structured_context.authority_and_task.correction_diagnostics, []);
  assert.equal("correction_protocol" in adapter.requests[0].structured_context.authority_and_task, false);
  assert.equal(result.trace.attempts[0].status, "PASS");
});

test("runtime retries a cross-category literal-copy violation and accepts correction", async () => {
  const bad = crossPlan();
  bad.design_decision_map[0].action = "TRANSFER";
  const adapter = new ScriptedCognitiveModelAdapter({ responses: [bad, crossPlan()] });
  const result = await executeReferenceTranslator(runtimeRequest({ adapter, run_id: "run-retry-cross-category" }));
  assert.equal(result.trace.attempts[0].error_code, C.REFERENCE_PLAN_SEMANTIC_INVALID);
  assert.ok(result.trace.attempts[0].diagnostic_codes.includes("CROSS_CATEGORY_LITERAL_PROP_TRANSFER"));
  assert.equal(result.plan.design_decision_map[0].action, "REINVENT");
});

test("declared but inaccessible reference blocks before model invocation", async () => {
  const asset = crossAsset();
  asset.visually_accessible = false;
  const adapter = new ScriptedCognitiveModelAdapter({ responses: [crossPlan()] });
  const request = runtimeRequest({ adapter, run_id: "run-inaccessible" });
  request.reference_assets = [asset];
  await assert.rejects(() => executeReferenceTranslator(request), (error) => error.code === C.REFERENCE_VISUAL_CONTENT_UNAVAILABLE);
  assert.equal(adapter.invokeCount, 0);
});

test("filename or metadata alone cannot stand in for visual access", async () => {
  const asset = crossAsset();
  delete asset.visual_access;
  asset.notes = { filename: "luxury-handbag-reference.png" };
  const adapter = new ScriptedCognitiveModelAdapter({ responses: [crossPlan()] });
  const request = runtimeRequest({ adapter, run_id: "run-filename-only" });
  request.reference_assets = [asset];
  await assert.rejects(() => executeReferenceTranslator(request), (error) => error.code === C.REFERENCE_VISUAL_CONTENT_UNAVAILABLE);
  assert.equal(adapter.invokeCount, 0);
});

test("no-reference mode creates a schema-valid zero-transfer result without invoking a model", async () => {
  const brief = loadJson("tests/fixtures/brief_spec/no_reference_thumbnail.json");
  const result = await executeReferenceTranslator({
    context: {
      context_id: "ctx-no-reference-runtime",
      brief_ref: { artifact_id: "brief-no-reference-thumbnail", schema_version: brief.schema_version },
      protected_semantics: ["exact target headline"],
      identity_constraints: [],
      transfer_scope: []
    },
    brief_spec: brief,
    reference_assets: [],
    run_options: { run_id: "run-no-reference", project_id: "project_no_reference", clock: fixedClock }
  });
  assert.equal(result.plan.transfer_intensity.value, "NONE");
  assert.deepEqual(result.plan.reference_analyses, []);
  assert.deepEqual(result.plan.design_decision_map, []);
  assert.equal(result.trace.model_adapter_id, "DETERMINISTIC_NO_REFERENCE");
  assert.equal(result.trace.prompt_version, "REFERENCE_TRANSLATOR_AGENT_V1_1");
});

test("runtime exhausts the deterministic retry cap with a typed error", async () => {
  const adapter = new ScriptedCognitiveModelAdapter({ responses: ["bad", "still bad", "```json\n{}\n```"] });
  await assert.rejects(
    () => executeReferenceTranslator(runtimeRequest({ adapter, run_id: "run-exhausted" })),
    (error) => error.code === C.REFERENCE_PLAN_RETRY_EXHAUSTED && error.details.attempts.length === 3
  );
  assert.equal(adapter.invokeCount, 3);
});

test("raw candidate remains persisted and rejected when schema validation fails", async () => {
  const { directory, store } = temporaryStore();
  try {
    const invalid = crossPlan();
    invalid.reference_analyses[0].authority = "PRIMARY_REFERENCE";
    const rawCandidate = JSON.stringify(invalid);
    const adapter = new ScriptedCognitiveModelAdapter({ responses: [rawCandidate] });
    await assert.rejects(
      () => executeReferenceTranslator(runtimeRequest({ adapter, store, run_id: "run-persisted-rejected-candidate", max_attempts: 1 })),
      (error) => error.code === C.REFERENCE_PLAN_RETRY_EXHAUSTED
    );
    const rawPath = store.candidatePath("run-persisted-rejected-candidate", 1);
    const metadataPath = store.candidateMetadataPath("run-persisted-rejected-candidate", 1);
    assert.equal(fs.readFileSync(rawPath, "utf8"), rawCandidate);
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    assert.equal(metadata.status, "REJECTED_CANDIDATE");
    assert.equal(metadata.raw_candidate_path, rawPath);
    const trace = store.loadRun("run-persisted-rejected-candidate");
    assert.equal(trace.attempts[0].raw_candidate.status, "REJECTED_CANDIDATE");
    assert.equal(trace.attempts[0].error_code, C.REFERENCE_PLAN_SCHEMA_INVALID);
  } finally { cleanup(directory); }
});

test("store persists plan and trace, then returns an idempotent replay", async () => {
  const { directory, store } = temporaryStore();
  try {
    const adapter = new ScriptedCognitiveModelAdapter({ responses: [crossPlan()] });
    const first = await executeReferenceTranslator(runtimeRequest({ adapter, store, run_id: "run-persisted" }));
    assert.equal(first.persistence.persisted, true);
    assert.equal(fs.existsSync(store.planPath(first.plan.plan_id)), true);
    assert.equal(fs.existsSync(store.tracePath(first.trace.run_id)), true);
    assert.equal(first.trace.attempts[0].raw_candidate.status, "ACCEPTED_CANDIDATE");
    assert.equal(JSON.parse(fs.readFileSync(store.candidateMetadataPath("run-persisted", 1), "utf8")).status, "ACCEPTED_CANDIDATE");

    const unused = new ScriptedCognitiveModelAdapter({ responses: [] });
    const second = await executeReferenceTranslator(runtimeRequest({ adapter: unused, store, run_id: "run-persisted" }));
    assert.equal(second.idempotent_replay, true);
    assert.deepEqual(second.plan, first.plan);
    assert.equal(unused.invokeCount, 0);
  } finally { cleanup(directory); }
});

test("reusing a run ID with changed input is rejected", async () => {
  const { directory, store } = temporaryStore();
  try {
    const adapter = new ScriptedCognitiveModelAdapter({ responses: [crossPlan()] });
    await executeReferenceTranslator(runtimeRequest({ adapter, store, run_id: "run-idempotency-conflict" }));
    const changed = runtimeRequest({ adapter: new ScriptedCognitiveModelAdapter({ responses: [crossPlan()] }), store, run_id: "run-idempotency-conflict" });
    changed.context.transfer_scope.push("typography");
    await assert.rejects(() => executeReferenceTranslator(changed), (error) => error.code === C.REFERENCE_RUN_IDEMPOTENCY_CONFLICT);
  } finally { cleanup(directory); }
});
