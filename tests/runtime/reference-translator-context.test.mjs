import assert from "node:assert/strict";
import test from "node:test";
import { buildReferenceTranslatorContext } from "../../src/reference-translator/context/reference-translator-context-builder.mjs";
import { queryMyEyesAdvisory } from "../../src/my-eyes/query/my-eyes-query-engine.mjs";
import { queryVkbAdvisory } from "../../src/vkb/query/vkb-query-engine.mjs";

const brief_ref = { artifact_id: "brief-strong-reference", schema_version: "1.0.0", artifact_uri: "artifact://brief/strong-reference/1.0.0", status_expected: "READY" };
const myEyes = () => queryMyEyesAdvisory({ query_id: "rt-my-eyes", creative_context: { planned_depth_behavior: "floating foreground", signals: { floating_elements: { present: true } } } });
const vkb = () => queryVkbAdvisory({ query_id: "rt-vkb", depth_needs: ["foreground depth and occlusion"] });

test("Reference Translator context builder accepts a Brief Spec reference", () => {
  const context = buildReferenceTranslatorContext({ context_id: "rt-brief", brief_ref });
  assert.deepEqual(context.brief_ref, brief_ref);
  assert.equal(context.validation.brief_reference_present, true);
});

test("Reference Translator context supports absent optional reference context", () => {
  const context = buildReferenceTranslatorContext({ context_id: "rt-no-reference", brief_ref });
  assert.equal("reference_context" in context, false);
  assert.equal(context.validation.reference_context_optional, true);
});

test("protected semantics are preserved by value and cloned", () => {
  const protected_semantics = [{ semantic_id: "headline", value: "EXACT TEXT", lock: "EXACT" }];
  const context = buildReferenceTranslatorContext({ context_id: "rt-protected", brief_ref, protected_semantics });
  assert.deepEqual(context.protected_semantics, protected_semantics);
  assert.notEqual(context.protected_semantics, protected_semantics);
});

test("identity constraints are preserved by value and cloned", () => {
  const identity_constraints = [{ asset_id: "subject-1", preservation: "STRICT", recognizability_required: true }];
  const context = buildReferenceTranslatorContext({ context_id: "rt-identity", brief_ref, identity_constraints });
  assert.deepEqual(context.identity_constraints, identity_constraints);
  assert.notEqual(context.identity_constraints, identity_constraints);
});

test("My Eyes advisory remains attached as a separate advisory payload", () => {
  const advisory = myEyes();
  const context = buildReferenceTranslatorContext({ context_id: "rt-my-eyes-separate", brief_ref, my_eyes_advisory: advisory });
  assert.equal(context.advisory.my_eyes.authority, "ADVISORY_ONLY");
  assert.equal(context.advisory.my_eyes.query_id, advisory.query_id);
  assert.equal(context.advisory.vkb, null);
});

test("VKB advisory remains attached as a separate advisory payload", () => {
  const advisory = vkb();
  const context = buildReferenceTranslatorContext({ context_id: "rt-vkb-separate", brief_ref, vkb_advisory: advisory });
  assert.equal(context.advisory.vkb.authority, "ADVISORY_ONLY");
  assert.equal(context.advisory.vkb.query_id, advisory.query_id);
  assert.equal(context.advisory.separation_preserved, true);
});

test("context builder does not create a Reference Transfer Plan", () => {
  const context = buildReferenceTranslatorContext({ context_id: "rt-no-plan", brief_ref, reference_context: { asset_ids: ["reference-1"] }, my_eyes_advisory: myEyes(), vkb_advisory: vkb(), transfer_scope: ["lighting", "depth"] });
  assert.equal(context.authority_boundaries.future_translator, "IMPLEMENTED_AS_SEPARATE_RUNTIME");
  assert.equal(context.authority_boundaries.creative_translation_performed, false);
  assert.equal(context.authority_boundaries.transfer_choices_created, false);
  assert.equal(context.authority_boundaries.output_plan_created, false);
  assert.equal(JSON.stringify(context).includes("\"reference_transfer_plan\""), false);
});

test("context builder rejects creative transfer mappings", () => {
  assert.throws(() => buildReferenceTranslatorContext({ context_id: "rt-mutation", brief_ref, design_decision_map: [{ action: "TRANSFER" }] }), /unsupported fields/);
});

