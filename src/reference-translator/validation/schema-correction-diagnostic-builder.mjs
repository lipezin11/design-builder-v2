import crypto from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const schemaPath = fileURLToPath(new URL("../../../schemas/reference_transfer_plan.schema.json", import.meta.url));
const schemaSource = fs.readFileSync(schemaPath, "utf8");
const referenceTransferPlanSchema = JSON.parse(schemaSource);

export const REFERENCE_TRANSFER_PLAN_SCHEMA_METADATA = Object.freeze({
  schema_name: "reference_transfer_plan",
  schema_id: referenceTransferPlanSchema.$id ?? null,
  sha256: crypto.createHash("sha256").update(schemaSource).digest("hex")
});

const clone = (value) => value === undefined ? undefined : structuredClone(value);
const pointerTokens = (pointer) => {
  if (typeof pointer !== "string") return [];
  const value = pointer.startsWith("#") ? pointer.slice(1) : pointer;
  if (!value) return [];
  if (!value.startsWith("/")) return [];
  return value.slice(1).split("/").map((token) => {
    const unescaped = token.replace(/~1/g, "/").replace(/~0/g, "~");
    try { return decodeURIComponent(unescaped); } catch { return unescaped; }
  });
};

function dereference(node, root, seen = new Set()) {
  let current = node;
  while (current && typeof current === "object" && !Array.isArray(current) && typeof current.$ref === "string" && current.$ref.startsWith("#")) {
    if (seen.has(current.$ref)) return current;
    seen.add(current.$ref);
    const target = resolveSchemaPointer(root, current.$ref, seen);
    if (target === undefined) return current;
    current = target;
  }
  return current;
}

export function resolveSchemaPointer(schema, pointer, seen = new Set()) {
  let current = schema;
  for (const token of pointerTokens(pointer)) {
    current = dereference(current, schema, seen);
    if (current === null || typeof current !== "object" || !(token in current)) return undefined;
    current = current[token];
  }
  return dereference(current, schema, seen);
}

function instanceValue(candidate, pointer) {
  let current = candidate;
  for (const token of pointerTokens(pointer)) {
    if (current === null || typeof current !== "object" || !(token in current)) return undefined;
    current = current[token];
  }
  return current;
}

function valueType(value) {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

function safePrimitive(value) {
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.length <= 200 ? value : value.slice(0, 197) + "...";
  return undefined;
}

const codeForKeyword = (keyword) => ({
  enum: "SCHEMA_ENUM_MISMATCH",
  required: "SCHEMA_MISSING_REQUIRED_PROPERTY",
  additionalProperties: "SCHEMA_ADDITIONAL_PROPERTY_NOT_ALLOWED",
  type: "SCHEMA_TYPE_MISMATCH",
  const: "SCHEMA_CONST_MISMATCH",
  minItems: "SCHEMA_ARRAY_MIN_ITEMS",
  maxItems: "SCHEMA_ARRAY_MAX_ITEMS",
  uniqueItems: "SCHEMA_ARRAY_UNIQUE_ITEMS",
  oneOf: "SCHEMA_ONE_OF_MISMATCH",
  anyOf: "SCHEMA_ANY_OF_MISMATCH"
}[keyword] ?? "SCHEMA_CONTRACT_VIOLATION");

function instructionFor(error, path, fragment) {
  switch (error.keyword) {
    case "enum":
      return "Regenerate the complete JSON candidate using exactly one allowed enum value at this path. Do not invent a synonym or new enum." + (path.endsWith("/provenance") ? " Do not describe provenance using free language; use one exact contract value." : "");
    case "required":
      return "Regenerate the complete candidate including this required field according to the schema. Do not invent its value deterministically outside the model response.";
    case "additionalProperties":
      return "Remove this undeclared field unless its information belongs in an existing schema-defined field. Return the complete candidate again.";
    case "type":
      return "Regenerate the complete candidate with the exact expected JSON type at this path. Do not rely on automatic conversion.";
    case "const":
      return "Regenerate the complete candidate using the exact contract value required at this path.";
    case "minItems":
    case "maxItems":
    case "uniqueItems":
      return "Regenerate the complete candidate so this array satisfies the stated cardinality constraint. Do not return a patch.";
    case "oneOf":
    case "anyOf":
      return "Regenerate the complete candidate so this value satisfies one permitted schema branch exactly.";
    default:
      return "Regenerate the complete JSON candidate and correct only this contract violation while preserving valid semantic decisions.";
  }
}

function messageFor(error, path) {
  switch (error.keyword) {
    case "enum": return `Value at ${path} is outside the contract enum.`;
    case "required": return `Required property ${error.params?.missingProperty ?? "<unknown>"} is missing from ${path}.`;
    case "additionalProperties": return `Property ${error.params?.additionalProperty ?? "<unknown>"} is not allowed at ${path}.`;
    case "type": return `Value at ${path} has the wrong JSON type.`;
    case "const": return `Value at ${path} does not match the required constant.`;
    case "minItems": return `Array at ${path} has fewer items than permitted.`;
    case "maxItems": return `Array at ${path} has more items than permitted.`;
    case "uniqueItems": return `Array at ${path} contains duplicate items.`;
    case "oneOf": return `Value at ${path} does not satisfy exactly one permitted schema branch.`;
    case "anyOf": return `Value at ${path} does not satisfy any permitted schema branch.`;
    default: return `Contract violation at ${path}: ${error.message ?? error.keyword}.`;
  }
}

export function getReferenceTransferPlanSchema() {
  return clone(referenceTransferPlanSchema);
}

export function buildSchemaCorrectionDiagnostics(schemaErrors, candidate, { schema = referenceTransferPlanSchema } = {}) {
  return (schemaErrors ?? []).map((error) => {
    const path = error.instancePath || "/";
    const fragment = resolveSchemaPointer(schema, error.schemaPath);
    const received = instanceValue(candidate, error.instancePath);
    const safeReceived = safePrimitive(received);
    const diagnostic = {
      stage: "SCHEMA",
      code: codeForKeyword(error.keyword),
      path,
      schema_path: error.schemaPath ?? null,
      keyword: error.keyword,
      message: messageFor(error, path),
      instruction: instructionFor(error, path, fragment)
    };

    if (safeReceived !== undefined) diagnostic.received_value = safeReceived;
    if (["enum", "type", "const"].includes(error.keyword)) diagnostic.received_type = valueType(received);
    if (error.keyword === "enum") {
      const allowed = Array.isArray(fragment) ? fragment : [];
      diagnostic.allowed_values = clone(allowed);
      diagnostic.allowed_values_count = allowed.length;
    } else if (error.keyword === "required") {
      diagnostic.required_property = error.params?.missingProperty ?? null;
    } else if (error.keyword === "additionalProperties") {
      diagnostic.additional_property = error.params?.additionalProperty ?? null;
    } else if (error.keyword === "type") {
      diagnostic.expected_type = clone(fragment ?? error.params?.type ?? null);
    } else if (error.keyword === "const") {
      diagnostic.required_value = clone(fragment);
    } else if (["minItems", "maxItems"].includes(error.keyword)) {
      diagnostic.limit = typeof fragment === "number" ? fragment : error.params?.limit ?? null;
      diagnostic.actual_items = Array.isArray(received) ? received.length : null;
    } else if (error.keyword === "uniqueItems") {
      diagnostic.duplicate_indexes = [error.params?.i, error.params?.j].filter(Number.isInteger);
    } else if (["oneOf", "anyOf"].includes(error.keyword)) {
      diagnostic.schema_branch_count = Array.isArray(fragment) ? fragment.length : null;
    }
    return diagnostic;
  });
}
