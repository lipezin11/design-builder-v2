import { assertAdvisoryAuthority } from "../../advisory/authority-firewall.mjs";
import { normalizeAdvisoryBudget } from "../../advisory/compression.mjs";
import { validateAdvisoryResult, validateVkbQuery } from "../../advisory/contract-validation.mjs";
import { VKB_MECHANISM_CATALOG_V1 } from "./vkb-mechanism-catalog.mjs";

const RETRIEVAL_FIELDS = Object.freeze([
  "project_goals", "desired_emotions", "hierarchy_needs", "depth_needs", "composition_problem", "lighting_problem",
  "color_problem", "integration_problem", "typography_problem", "reference_transfer_goals", "planned_mechanisms"
]);

const textOf = (value) => Array.isArray(value) ? value.join(" ") : typeof value === "string" ? value : "";
const containsTerm = (value, terms) => {
  const normalized = textOf(value).toLowerCase();
  return Boolean(normalized) && terms.some((term) => normalized.includes(term));
};

function matchedDimensions(mechanism, query) {
  const exactPlan = (query.planned_mechanisms ?? []).some((item) => {
    const normalized = item.toLowerCase();
    return normalized === mechanism.mechanism_id.toLowerCase() || normalized === mechanism.name.toLowerCase();
  });
  const matches = RETRIEVAL_FIELDS.filter((field) => {
    if (field === "planned_mechanisms" && exactPlan) return true;
    if (!mechanism.input_dimensions.includes(field) && field !== "project_goals" && field !== "desired_emotions" && field !== "reference_transfer_goals") return false;
    return containsTerm(query[field], mechanism.terms);
  });
  return [...new Set(matches)];
}

function relevanceFor(matches, mechanism, query) {
  const planned = (query.planned_mechanisms ?? []).some((item) => [mechanism.mechanism_id, mechanism.name].some((candidate) => candidate.toLowerCase() === item.toLowerCase()));
  if (planned || matches.length >= 2) return "HIGH_RELEVANCE";
  if (matches.length === 1) return "MEDIUM_RELEVANCE";
  return null;
}

export function queryVkbAdvisory(query, { catalog = VKB_MECHANISM_CATALOG_V1 } = {}) {
  validateVkbQuery(query);
  const scope = new Set(query.query_scope ?? []);
  const considered = [];
  const candidates = [];
  const discarded = [];

  for (const mechanism of catalog) {
    const matches = matchedDimensions(mechanism, query);
    const relevance = relevanceFor(matches, mechanism, query);
    const scopedOut = scope.size && !scope.has(mechanism.mechanism_id) && !mechanism.input_dimensions.some((dimension) => scope.has(dimension));
    considered.push({ mechanism_id: mechanism.mechanism_id, matched_dimensions: matches });
    if (scopedOut || !relevance) {
      discarded.push({ mechanism_id: mechanism.mechanism_id, rule: scopedOut ? "OUTSIDE_QUERY_SCOPE" : "NO_PROBLEM_MATCH", rationale: scopedOut ? "The mechanism is outside the requested dimensions." : "No deterministic problem or mechanism signal matched." });
      continue;
    }
    candidates.push({
      record_id: `${query.query_id}:${mechanism.mechanism_id}:FULL`,
      mechanism_id: mechanism.mechanism_id,
      mechanism_version: mechanism.mechanism_version,
      name: mechanism.name,
      relevance,
      matched_problem_dimensions: matches,
      problem_fit_rationale: `The query exposes ${matches.join(", ")} needs addressed by this mechanism's declared applicability.`,
      description: mechanism.description,
      visual_effect: mechanism.visual_effect,
      psychological_effect: mechanism.psychological_effect,
      usage_conditions: structuredClone(mechanism.usage_conditions),
      risks: structuredClone(mechanism.risks),
      anti_patterns: structuredClone(mechanism.anti_patterns),
      applicability_notes: ["Treat this as a reusable visual mechanism, not a composition, style, palette, camera, or copy instruction."],
      interactions: { works_well_with: structuredClone(mechanism.works_well_with), tensions_with: structuredClone(mechanism.tensions_with) },
      provenance: structuredClone(mechanism.provenance),
      authority: "ADVISORY_ONLY"
    });
  }

  const maxItems = normalizeAdvisoryBudget(query.advisory_budget?.max_items, { defaultItems: 5, maximumItems: 8 });
  const ordered = [...candidates].sort((left, right) => {
    const relevance = (right.relevance === "HIGH_RELEVANCE" ? 2 : 1) - (left.relevance === "HIGH_RELEVANCE" ? 2 : 1);
    return relevance || right.matched_problem_dimensions.length - left.matched_problem_dimensions.length || left.mechanism_id.localeCompare(right.mechanism_id);
  });
  const selected = ordered.slice(0, maxItems);
  const budgetDiscarded = ordered.slice(maxItems);
  budgetDiscarded.forEach((item) => discarded.push({ mechanism_id: item.mechanism_id, rule: "ADVISORY_BUDGET", rationale: `The max-items budget of ${maxItems} was reached.` }));
  const selectedIds = new Set(selected.map((item) => item.mechanism_id));
  const interactions = [];
  for (const item of selected) {
    for (const related of item.interactions.works_well_with) {
      if (selectedIds.has(related) && item.mechanism_id.localeCompare(related) < 0) interactions.push({ type: "SUPPORTING_INTERACTION", mechanism_refs: [item.mechanism_id, related], note: "The mechanisms address complementary declared problem dimensions; a future creative agent must decide whether and how to combine them." });
    }
    for (const related of item.interactions.tensions_with) {
      if (selectedIds.has(related) && item.mechanism_id.localeCompare(related) < 0) interactions.push({ type: "MECHANISM_TENSION", mechanism_refs: [item.mechanism_id, related], note: "The mechanisms can compete for spatial territory; preserve the tension for future creative resolution." });
    }
  }

  const result = {
    schema_version: "1.0.0",
    query_id: query.query_id,
    catalog_ref: { catalog_id: "VKB_MECHANISM_CATALOG_V1", catalog_version: 1, source_ref: "docs/vkb/DOCUMENTO_05_VKB_DESIGN_BUILDER.md" },
    recommended_mechanisms: selected,
    supporting_patterns: selected.map((item) => ({ full_record_ref: item.record_id, mechanism_id: item.mechanism_id, pattern: item.description, copyable_design: false })),
    mechanism_interactions: interactions,
    risks: selected.flatMap((item) => item.risks.map((risk) => ({ mechanism_id: item.mechanism_id, full_record_ref: item.record_id, risk }))),
    anti_patterns: selected.flatMap((item) => item.anti_patterns.map((anti_pattern) => ({ mechanism_id: item.mechanism_id, full_record_ref: item.record_id, anti_pattern }))),
    applicability_notes: selected.flatMap((item) => item.applicability_notes.map((note) => ({ mechanism_id: item.mechanism_id, full_record_ref: item.record_id, note }))),
    compact_agent_context: selected.map((item, index) => ({ compact_id: `VKB_COMPACT_${index + 1}`, mechanism_id: item.mechanism_id, actionable_mechanism: item.description, principal_risk: item.risks[0], full_record_ref: item.record_id })),
    advisory_budget: { max_items: maxItems, returned_items: selected.length },
    uncertainties: selected.length ? [] : ["No catalog mechanism matched the supplied structured problem dimensions."],
    trace: {
      query_id: query.query_id,
      input_context: Object.fromEntries(RETRIEVAL_FIELDS.filter((field) => query[field] !== undefined).map((field) => [field, structuredClone(query[field])])),
      mechanisms_considered: considered,
      selected_mechanisms: selected.map((item) => item.mechanism_id),
      discarded_mechanisms: discarded.map((item) => item.mechanism_id),
      filter_reasons: discarded,
      compression_actions: budgetDiscarded.length ? [{ type: "MAX_ITEMS", before: ordered.length, after: selected.length }] : [],
      rationale_policy: "STRUCTURED_RULE_AND_PROVENANCE_RATIONALE_ONLY",
      hidden_reasoning_persisted: false
    },
    authority: "ADVISORY_ONLY"
  };

  assertAdvisoryAuthority(result, { source: "VKB_ADVISORY" });
  return validateAdvisoryResult(result, "VKB_ADVISORY");
}

