import assert from "node:assert/strict";
import test from "node:test";
import { parseReferenceTransferPlan } from "../../src/reference-translator/parsing/reference-transfer-plan-parser.mjs";
import { REFERENCE_TRANSLATOR_ERROR_CODES as C } from "../../src/reference-translator/reference-translator-errors.mjs";
import {
  validateReferenceTransferPlanQuality,
  validateReferenceTransferPlanSchema,
  validateReferenceTransferPlanSemantics
} from "../../src/reference-translator/validation/reference-transfer-plan-validator.mjs";
import { crossAsset, crossBrief, crossPlan } from "./reference-translator-test-helpers.mjs";

const context = () => ({
  briefSpec: crossBrief(),
  referenceAssets: [crossAsset()],
  targetProductCategory: "fragrance",
  projectId: "project_cross_category_perfume",
  protectedSemantics: ["perfume bottle identity", "perfume label"],
  identityConstraints: ["perfume bottle identity"]
});
const qualityCodes = (plan) => validateReferenceTransferPlanQuality(plan).diagnostics.map((item) => item.code);
const semanticCodes = (plan) => validateReferenceTransferPlanSemantics(plan, context()).diagnostics.map((item) => item.code);

test("surface-copy bait for exact palette and source font is blocked", () => {
  for (const target of ["Copy the same exact palette into the target.", "Clone the identical source font for the perfume."]) {
    const plan = crossPlan();
    plan.design_decision_map[0].target_in_new_composition = target;
    assert.ok(qualityCodes(plan).includes("SURFACE_COPY_RISK"), target);
  }
});

test("functionless particles, blurred leaves, glow, and microdetails are blocked", () => {
  for (const target of [
    "Add particles for depth.",
    "Use blurred leaves for depth.",
    "Add glow to look cinematic.",
    "Use microdetails for richness."
  ]) {
    const plan = crossPlan();
    plan.design_decision_map[0].target_in_new_composition = target;
    assert.ok(qualityCodes(plan).includes("SURFACE_COPY_RISK"), target);
  }
});

test("vague AI-look label requires concrete decomposition", () => {
  const plan = crossPlan();
  plan.design_decision_map[0].target_in_new_composition = "Avoid the AI look.";
  assert.ok(qualityCodes(plan).includes("GENERIC_TRANSFER_PLAN"));
});

test("direct narrative-object transfer is a surface-copy risk", () => {
  const plan = crossPlan();
  plan.design_decision_map[0].action = "TRANSFER";
  assert.ok(qualityCodes(plan).includes("SURFACE_COPY_RISK"));
});

test("controlled intentional complexity is not rejected by element count", () => {
  const plan = crossPlan();
  plan.design_decision_map[0].rationale = "Preserve many purposeful tactile details when they converge on the same warm-fragrance material story, hierarchy, shared light, and product focus.";
  assert.equal(validateReferenceTransferPlanQuality(plan).valid, true);
});

test("functional lighting translation passes without copying glow", () => {
  const plan = crossPlan();
  plan.reference_analyses[0].observations[0].category = "LIGHTING";
  plan.design_decision_map[0].action = "ADAPT";
  plan.design_decision_map[0].target_in_new_composition = "Create localized warm edge separation from a plausible reflected amber source within the fragrance environment.";
  plan.design_decision_map[0].rationale = "The source mechanism separates product silhouette through motivated localized contrast; the target adapts the source and temperature to its amber material world.";
  assert.equal(validateReferenceTransferPlanQuality(plan).valid, true);
});

test("translator cannot approve or impersonate Director confirmation", () => {
  const approved = crossPlan();
  approved.status = "APPROVED";
  assert.ok(semanticCodes(approved).includes("TRANSLATOR_CANNOT_APPROVE"));
  const confirmed = crossPlan();
  confirmed.design_decision_map[0].provenance = "DIRECTOR_CONFIRMED";
  assert.ok(semanticCodes(confirmed).includes("DIRECTOR_PROVENANCE_IMPERSONATION"));
});

test("mapping cannot cite an observation it never saw", () => {
  const plan = crossPlan();
  plan.design_decision_map[0].observation_ids = ["obs_unseen"];
  assert.ok(semanticCodes(plan).includes("MAPPING_OBSERVATION_NOT_FOUND"));
});

test("unknown transfer action enum is rejected by schema", () => {
  const plan = crossPlan();
  plan.design_decision_map[0].action = "COPY";
  assert.equal(validateReferenceTransferPlanSchema(plan).valid, false);
});

test("parser accepts raw JSON object and rejects Markdown-fenced output", () => {
  const plan = crossPlan();
  assert.deepEqual(parseReferenceTransferPlan(JSON.stringify(plan)), plan);
  assert.throws(
    () => parseReferenceTransferPlan("```json\n{}\n```"),
    (error) => error.code === C.MODEL_OUTPUT_INVALID_JSON
  );
});
