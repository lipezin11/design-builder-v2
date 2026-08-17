import { assertAdvisoryAuthority } from "./authority-firewall.mjs";

const QUERY_KEYS = new Set(["query_id", "project_context", "creative_context", "query_scope", "advisory_budget"]);
const CREATIVE_KEYS = new Set([
  "concept", "visual_thesis", "planned_mechanisms", "planned_objects", "planned_effects",
  "planned_typography_behavior", "planned_complexity", "planned_color_behavior", "planned_depth_behavior", "signals"
]);
const PROJECT_KEYS = new Set(["project_type", "format", "industry_or_domain", "intended_use", "brand_context"]);
const SIGNAL_KEYS = new Set(["cards", "floating_elements", "microeffects", "generic_assembly", "high_complexity", "strong_color_impact"]);

function assertPlainObject(value, label, { optional = false } = {}) {
  if (value === undefined && optional) return;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
}

function rejectUnknown(object, allowed, label) {
  const unknown = Object.keys(object ?? {}).filter((key) => !allowed.has(key));
  if (unknown.length) throw new TypeError(`${label} contains unsupported fields: ${unknown.join(", ")}.`);
}

export function validateMyEyesQuery(query) {
  assertPlainObject(query, "My Eyes query");
  rejectUnknown(query, QUERY_KEYS, "My Eyes query");
  if (typeof query.query_id !== "string" || !query.query_id.trim()) throw new TypeError("query_id is required.");
  assertPlainObject(query.project_context, "project_context", { optional: true });
  assertPlainObject(query.creative_context, "creative_context", { optional: true });
  rejectUnknown(query.project_context, PROJECT_KEYS, "project_context");
  rejectUnknown(query.creative_context, CREATIVE_KEYS, "creative_context");
  if (query.creative_context?.signals !== undefined) {
    assertPlainObject(query.creative_context.signals, "creative_context.signals");
    rejectUnknown(query.creative_context.signals, SIGNAL_KEYS, "creative_context.signals");
  }
  if (query.query_scope !== undefined && (!Array.isArray(query.query_scope) || query.query_scope.some((item) => typeof item !== "string"))) {
    throw new TypeError("query_scope must be an array of strings.");
  }
  if (query.advisory_budget !== undefined) {
    assertPlainObject(query.advisory_budget, "advisory_budget");
    rejectUnknown(query.advisory_budget, new Set(["max_items"]), "advisory_budget");
  }
  assertAdvisoryAuthority(query, { source: "MY_EYES_QUERY" });
  return query;
}

export function validateVkbQuery(query) {
  assertPlainObject(query, "VKB query");
  const allowed = new Set(["query_id", "project_context", "project_goals", "desired_emotions", "hierarchy_needs", "depth_needs", "composition_problem", "lighting_problem", "color_problem", "integration_problem", "typography_problem", "reference_transfer_goals", "planned_mechanisms", "query_scope", "advisory_budget"]);
  rejectUnknown(query, allowed, "VKB query");
  if (typeof query.query_id !== "string" || !query.query_id.trim()) throw new TypeError("query_id is required.");
  assertPlainObject(query.project_context, "project_context", { optional: true });
  rejectUnknown(query.project_context, PROJECT_KEYS, "project_context");
  for (const field of ["project_goals", "desired_emotions", "hierarchy_needs", "depth_needs", "reference_transfer_goals", "planned_mechanisms", "query_scope"]) {
    if (query[field] !== undefined && (!Array.isArray(query[field]) || query[field].some((item) => typeof item !== "string"))) throw new TypeError(`${field} must be an array of strings.`);
  }
  if (query.advisory_budget !== undefined) {
    assertPlainObject(query.advisory_budget, "advisory_budget");
    rejectUnknown(query.advisory_budget, new Set(["max_items"]), "advisory_budget");
  }
  assertAdvisoryAuthority(query, { source: "VKB_QUERY" });
  return query;
}

export function validateAdvisoryResult(result, source) {
  assertPlainObject(result, `${source} result`);
  if (result.authority !== "ADVISORY_ONLY") throw new TypeError(`${source} result must declare ADVISORY_ONLY authority.`);
  assertAdvisoryAuthority(result, { source });
  return result;
}

