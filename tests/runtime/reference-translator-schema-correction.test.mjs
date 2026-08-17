import assert from "node:assert/strict";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { crossPlan } from "./reference-translator-test-helpers.mjs";
import { validateReferenceTransferPlanSchema } from "../../src/reference-translator/validation/reference-transfer-plan-validator.mjs";
import {
  buildSchemaCorrectionDiagnostics,
  getReferenceTransferPlanSchema,
  resolveSchemaPointer
} from "../../src/reference-translator/validation/schema-correction-diagnostic-builder.mjs";

const diagnosticAt = (result, path, code) => result.diagnostics.find((item) => item.path === path && item.code === code);

function validateIsolated(schema, candidate) {
  const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
  assert.equal(validate(candidate), false);
  return buildSchemaCorrectionDiagnostics(validate.errors, candidate, { schema });
}

test("real Gemini authority and provenance failures expose exact production enum values", () => {
  const plan = crossPlan();
  plan.reference_analyses[0].authority = "PRIMARY_REFERENCE";
  plan.non_negotiable_anchors[0].provenance = "USER_CONSTRAINT";
  const before = structuredClone(plan);
  const result = validateReferenceTransferPlanSchema(plan);
  const authority = diagnosticAt(result, "/reference_analyses/0/authority", "SCHEMA_ENUM_MISMATCH");
  const provenance = diagnosticAt(result, "/non_negotiable_anchors/0/provenance", "SCHEMA_ENUM_MISMATCH");
  assert.deepEqual(authority.allowed_values, ["USER_PRIMARY_REFERENCE", "USER_SECONDARY_REFERENCE", "SUPPORTING_REFERENCE"]);
  assert.equal(authority.received_value, "PRIMARY_REFERENCE");
  assert.deepEqual(provenance.allowed_values, ["OBSERVED", "INFERRED", "USER_EXPLICIT", "MODEL_INFERENCE"]);
  assert.equal(provenance.received_value, "USER_CONSTRAINT");
  assert.match(provenance.instruction, /Do not describe provenance using free language/);
  assert.deepEqual(plan, before, "schema diagnostics must not repair or mutate the candidate");
});

test("invalid action enum is derived from the production contract", () => {
  const plan = crossPlan();
  plan.design_decision_map[0].action = "TRANSFORM";
  const item = diagnosticAt(validateReferenceTransferPlanSchema(plan), "/design_decision_map/0/action", "SCHEMA_ENUM_MISMATCH");
  assert.deepEqual(item.allowed_values, ["PRESERVE", "TRANSFER", "ADAPT", "REINVENT", "DISCARD", "CONFLICT"]);
  assert.equal(item.received_value, "TRANSFORM");
});

test("missing required property identifies the parent path and property name", () => {
  const plan = crossPlan();
  delete plan.reference_analyses[0].authority;
  const item = diagnosticAt(validateReferenceTransferPlanSchema(plan), "/reference_analyses/0", "SCHEMA_MISSING_REQUIRED_PROPERTY");
  assert.equal(item.required_property, "authority");
  assert.match(item.instruction, /including this required field/);
});

test("additional property identifies the undeclared field without removing it", () => {
  const plan = crossPlan();
  plan.reference_analyses[0].invented_field = "keep me invalid";
  const before = structuredClone(plan);
  const item = diagnosticAt(validateReferenceTransferPlanSchema(plan), "/reference_analyses/0", "SCHEMA_ADDITIONAL_PROPERTY_NOT_ALLOWED");
  assert.equal(item.additional_property, "invented_field");
  assert.deepEqual(plan, before);
});

test("incorrect primitive type reports received and expected types", () => {
  const plan = crossPlan();
  plan.reference_analyses[0].confidence = 7;
  const item = diagnosticAt(validateReferenceTransferPlanSchema(plan), "/reference_analyses/0/confidence", "SCHEMA_TYPE_MISMATCH");
  assert.equal(item.received_type, "integer");
  assert.equal(item.expected_type, "string");
});

test("nested array enum resolves through production $defs", () => {
  const plan = crossPlan();
  plan.reference_analyses[0].observations[0].category = "LAYOUT";
  const item = diagnosticAt(validateReferenceTransferPlanSchema(plan), "/reference_analyses/0/observations/0/category", "SCHEMA_ENUM_MISMATCH");
  assert.ok(item.schema_path.includes("$defs/observation"));
  assert.deepEqual(item.allowed_values, resolveSchemaPointer(getReferenceTransferPlanSchema(), "#/$defs/observation/properties/category/enum"));
});

test("const violation reports the exact required value", () => {
  const plan = crossPlan();
  plan.design_decision_map[0].cross_category_adaptation.literal_transfer_allowed = true;
  const item = diagnosticAt(validateReferenceTransferPlanSchema(plan), "/design_decision_map/0/cross_category_adaptation/literal_transfer_allowed", "SCHEMA_CONST_MISMATCH");
  assert.equal(item.received_value, true);
  assert.equal(item.required_value, false);
});

test("array cardinality diagnostics cover minItems, maxItems, and uniqueItems", () => {
  const schema = {
    type: "object",
    properties: {
      tooShort: { type: "array", minItems: 2 },
      tooLong: { type: "array", maxItems: 1 },
      duplicate: { type: "array", uniqueItems: true }
    }
  };
  const diagnostics = validateIsolated(schema, { tooShort: [], tooLong: [1, 2], duplicate: ["x", "x"] });
  assert.ok(diagnostics.some((item) => item.code === "SCHEMA_ARRAY_MIN_ITEMS" && item.limit === 2 && item.actual_items === 0));
  assert.ok(diagnostics.some((item) => item.code === "SCHEMA_ARRAY_MAX_ITEMS" && item.limit === 1 && item.actual_items === 2));
  assert.ok(diagnostics.some((item) => item.code === "SCHEMA_ARRAY_UNIQUE_ITEMS" && item.duplicate_indexes.length === 2));
});

test("multiple simultaneous schema errors remain separate and actionable", () => {
  const plan = crossPlan();
  delete plan.project_id;
  plan.status = 42;
  plan.invented_top_level = true;
  const result = validateReferenceTransferPlanSchema(plan);
  const codes = new Set(result.diagnostics.map((item) => item.code));
  assert.ok(codes.has("SCHEMA_MISSING_REQUIRED_PROPERTY"));
  assert.ok(codes.has("SCHEMA_TYPE_MISMATCH"));
  assert.ok(codes.has("SCHEMA_ADDITIONAL_PROPERTY_NOT_ALLOWED"));
});

test("schema evolution changes enum feedback without retry-code changes", () => {
  const candidate = { mode: "OLD" };
  const firstSchema = { type: "object", properties: { mode: { enum: ["A", "B"] } } };
  const secondSchema = { type: "object", properties: { mode: { enum: ["C", "D", "E"] } } };
  const first = validateIsolated(firstSchema, candidate).find((item) => item.code === "SCHEMA_ENUM_MISMATCH");
  const second = validateIsolated(secondSchema, candidate).find((item) => item.code === "SCHEMA_ENUM_MISMATCH");
  assert.deepEqual(first.allowed_values, ["A", "B"]);
  assert.deepEqual(second.allowed_values, ["C", "D", "E"]);
});

test("oneOf, anyOf, and nullable type branches resolve compactly", () => {
  const schema = {
    type: "object",
    properties: {
      one: { oneOf: [{ type: "string" }, { type: "number" }] },
      any: { anyOf: [{ enum: ["X"] }, { type: "null" }] },
      nullable: { type: ["string", "null"] }
    }
  };
  const diagnostics = validateIsolated(schema, { one: true, any: 3, nullable: false });
  assert.ok(diagnostics.some((item) => item.code === "SCHEMA_ONE_OF_MISMATCH" && item.schema_branch_count === 2));
  assert.ok(diagnostics.some((item) => item.code === "SCHEMA_ANY_OF_MISMATCH" && item.schema_branch_count === 2));
  assert.ok(diagnostics.some((item) => item.code === "SCHEMA_TYPE_MISMATCH" && Array.isArray(item.expected_type)));
  assert.equal(JSON.stringify(diagnostics).includes(JSON.stringify(schema)), false);
});
