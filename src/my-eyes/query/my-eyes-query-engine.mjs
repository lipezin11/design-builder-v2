import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { applyAdvisoryBudget, deduplicateMyEyesCompact, normalizeAdvisoryBudget } from "../../advisory/compression.mjs";
import { assertAdvisoryAuthority } from "../../advisory/authority-firewall.mjs";
import { validateAdvisoryResult, validateMyEyesQuery } from "../../advisory/contract-validation.mjs";

const DEFAULT_MODEL_PATH = fileURLToPath(new URL("../../../data/my_eyes/models/MY_EYES_PREFERENCE_MODEL_V1.json", import.meta.url));

const RULES = Object.freeze({
  MYE_PREF_000008: {
    scope: "COMPLEXITY",
    insight: "High information density is conditionally compatible with the evidence when elements are controlled, mutually coherent, well integrated, and converge on one idea.",
    warning: "Audit convergence, hierarchy, placement, and functional contribution; do not use element count as the failure condition.",
    failure: "Dense composition whose elements do not converge on a shared visual logic."
  },
  MYE_PREF_000009: {
    scope: "ELEMENT_FUNCTION",
    insight: "Require prominent objects and effects to strengthen narrative, hierarchy, framing, depth, atmosphere, integration, meaning, or readability.",
    warning: "Secondary elements should remain subordinate to the central idea, while decoration may remain when it contributes materially.",
    failure: "Prominent elements used mainly to fill space or manufacture impact without a visual function."
  },
  MYE_PREF_000010: {
    scope: "GENERIC_ASSEMBLY",
    insight: "Diagnose concrete assembly signals such as interchangeable modules, disconnected scene lighting, generic filler placement, arbitrary microeffects, or treatments that could move to an unrelated project unchanged.",
    warning: "Name the observed operational signals individually; a vague artificiality label is not an actionable diagnosis.",
    failure: "Multiple individually familiar impact devices combined without one project-specific concept or shared scene logic."
  },
  MYE_PREF_000011: {
    scope: "MICRODETAIL",
    insight: "Treat each microdetail as removable unless it strengthens narrative, depth, framing, attention, atmosphere, integration, composition, or meaning.",
    warning: "Rich detail is conditionally acceptable; the risk is accumulated functionless detail and mental noise, not detail itself.",
    failure: "Particles, mini-lines, icons, small glows, or fragments accumulate without a shared visual role."
  },
  MYE_PREF_000012: {
    scope: "FLOATING_ELEMENTS",
    insight: "Floating elements are conditionally accepted when selection, quantity, scale, position, perspective, lighting, occlusion, and integration follow one narrative and spatial logic.",
    warning: "Presence and quantity alone are not failures; assess purpose, placement, scene lighting, depth, and subject relationship.",
    failure: "Floating objects are generically distributed, independently lit, weakly positioned, or poorly integrated."
  },
  MYE_PREF_000013: {
    scope: "COLOR",
    insight: "Use color presence and contrast locally and intentionally to support focus, separation, atmosphere, depth, and hierarchy while keeping scene lighting coherent.",
    warning: "Strong chromatic impact does not imply maximum saturation or uniform contrast; restrained palettes remain valid when conceptually appropriate.",
    failure: "Saturation, glow, gradient, or contrast is applied as a global impact preset disconnected from concept and environment."
  },
  MYE_PREF_000016: {
    scope: "CARDS",
    insight: "Card systems are conditionally accepted when content is project-specific, grouping is coherent, hierarchy is clear, spatial integration is credible, and the cards carry narrative meaning while remaining subordinate to the subject.",
    warning: "Do not treat cards as forbidden and do not copy the positive reference layout; assess specificity, grouping, hierarchy, integration, breathing room, and non-interchangeability.",
    failure: "Interchangeable dashboard modules repeat the same border, glow, metric, and mini-graph formula or merely orbit the subject."
  }
});

const CONCRETE_GENERIC_SIGNALS = Object.freeze([
  "generic floating dashboard cards",
  "independently lit decorative objects",
  "excessive functionless microdetails",
  "arbitrary particles",
  "unmotivated glow",
  "repeated modular UI treatment",
  "visually interchangeable elements",
  "color or contrast treatment disconnected from the concept",
  "decorative cinematic filler",
  "objects without narrative or compositional purpose",
  "poorly integrated floating elements"
]);

const asArray = (value) => value === undefined ? [] : Array.isArray(value) ? value : [value];
const textOf = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textOf).join(" ");
  return Object.values(value).map(textOf).join(" ");
};
const hasAny = (text, terms) => terms.some((term) => text.includes(term));
const signalPresent = (signal) => signal === true || Boolean(signal?.present);

function analyzeContext(query) {
  const creative = query.creative_context ?? {};
  const signals = creative.signals ?? {};
  const normalized = textOf({ project: query.project_context, creative }).toLowerCase();
  const complexityLevel = String(creative.planned_complexity ?? "").toUpperCase();
  const colorBehavior = String(creative.planned_color_behavior ?? "").toLowerCase();
  const cards = signalPresent(signals.cards) || hasAny(normalized, ["card", "dashboard", "painel", "ui module", "interface panel"]);
  const goodCards = Boolean(signals.cards?.content_specific && signals.cards?.coherent_grouping && signals.cards?.narrative_role);
  const genericCards = Boolean(signals.cards?.generic_dashboard_treatment) || hasAny(normalized, ["generic dashboard", "generic card", "interchangeable card", "repeated modular ui"]);
  const floating = signalPresent(signals.floating_elements) || hasAny(normalized, ["floating", "suspended", "orbiting", "foreground object", "elementos suspensos", "flutuante"]);
  const microeffects = signalPresent(signals.microeffects) || hasAny(normalized, ["particle", "small glow", "mini line", "microeffect", "microdetail", "decorative icon", "partícula", "mini linha", "pequeno brilho"]);
  const microeffectsFunctional = signals.microeffects?.functional_purpose === true;
  const highComplexity = signalPresent(signals.high_complexity) || ["HIGH", "VERY_HIGH"].includes(complexityLevel) || hasAny(normalized, ["high complexity", "very high complexity", "dense", "layered", "many elements", "alta complexidade", "muitos elementos", "maximalist"]);
  const strongColor = signalPresent(signals.strong_color_impact) || hasAny(colorBehavior, ["strong", "impact", "vibrant", "satur", "contrast", "forte", "cromát", "contraste"]) || hasAny(normalized, ["strong color", "chromatic impact", "saturation", "contrast", "vibrant", "impacto cromático", "cor forte", "alto contraste"]);
  const explicitGeneric = asArray(signals.generic_assembly?.concrete_signals).filter((item) => typeof item === "string");
  const genericAssembly = signalPresent(signals.generic_assembly) || genericCards || hasAny(normalized, ["independently lit", "unmotivated glow", "arbitrary particle", "interchangeable element", "decorative cinematic filler", "poorly integrated"]);
  const hasPlannedElements = asArray(creative.planned_mechanisms).length + asArray(creative.planned_objects).length + asArray(creative.planned_effects).length > 0;

  return {
    cards,
    goodCards,
    genericCards,
    floating,
    microeffects,
    microeffectsFunctional,
    highComplexity,
    strongColor,
    genericAssembly,
    hasPlannedElements,
    explicitGeneric,
    normalized
  };
}

function relevanceFor(preferenceId, context) {
  switch (preferenceId) {
    case "MYE_PREF_000008": return context.highComplexity ? "HIGH_RELEVANCE" : null;
    case "MYE_PREF_000009": return context.hasPlannedElements ? (context.highComplexity || context.floating || context.microeffects ? "MEDIUM_RELEVANCE" : "LOW_RELEVANCE") : null;
    case "MYE_PREF_000010": return context.genericAssembly ? "HIGH_RELEVANCE" : null;
    case "MYE_PREF_000011": return context.microeffects && !context.microeffectsFunctional ? "HIGH_RELEVANCE" : context.microeffects ? "LOW_RELEVANCE" : null;
    case "MYE_PREF_000012": return context.floating ? "HIGH_RELEVANCE" : null;
    case "MYE_PREF_000013": return context.strongColor ? "HIGH_RELEVANCE" : null;
    case "MYE_PREF_000016": return context.cards ? "HIGH_RELEVANCE" : null;
    default: return null;
  }
}

function matchedSignals(preferenceId, context) {
  const signals = [];
  if (preferenceId === "MYE_PREF_000008") signals.push("planned high-density or many-element composition");
  if (preferenceId === "MYE_PREF_000009") signals.push("planned visible objects, effects, or mechanisms require functional justification");
  if (preferenceId === "MYE_PREF_000010") signals.push(...(context.explicitGeneric.length ? context.explicitGeneric : CONCRETE_GENERIC_SIGNALS.filter((item) => {
    if (context.genericCards && /card|modular UI|interchangeable/.test(item)) return true;
    if (context.floating && /floating|lit decorative/.test(item)) return true;
    if (context.microeffects && /microdetail|particles|glow/.test(item)) return true;
    return false;
  })));
  if (preferenceId === "MYE_PREF_000011") signals.push("planned particles, small glows, mini-lines, icons, or microelements without an explicit shared function");
  if (preferenceId === "MYE_PREF_000012") signals.push("planned suspended, foreground, orbiting, or floating elements");
  if (preferenceId === "MYE_PREF_000013") signals.push("planned strong chromatic impact, saturation, or contrast behavior");
  if (preferenceId === "MYE_PREF_000016") signals.push(context.goodCards ? "specific content, coherent grouping, and narrative role are explicitly planned" : context.genericCards ? "generic or interchangeable dashboard treatment is explicitly planned" : "card or information-panel system is planned");
  return signals;
}

function loadModel(modelPath) {
  const model = JSON.parse(fs.readFileSync(modelPath, "utf8"));
  if (model.model_id !== "MYE_MODEL_000001" || model.model_version !== 1) throw new Error("My Eyes Query v1 requires MY_EYES_PREFERENCE_MODEL_V1.");
  return model;
}

export function queryMyEyesAdvisory(query, { modelPath = DEFAULT_MODEL_PATH } = {}) {
  validateMyEyesQuery(query);
  const model = loadModel(modelPath);
  const context = analyzeContext(query);
  const scope = new Set(query.query_scope ?? []);
  const candidates = [];
  const filtered = [];
  const filterReasons = [];

  for (const principle of model.principles) {
    const rule = RULES[principle.preference_id];
    if (!rule) {
      filtered.push(principle.preference_id);
      filterReasons.push({ preference_id: principle.preference_id, rule: "NO_QUERY_RULE", rationale: "No deterministic v1 eligibility rule is registered." });
      continue;
    }
    if (scope.size && !scope.has(rule.scope) && !scope.has(principle.preference_id)) {
      filtered.push(principle.preference_id);
      filterReasons.push({ preference_id: principle.preference_id, rule: "OUTSIDE_QUERY_SCOPE", rationale: `Scope ${rule.scope} was not requested.` });
      continue;
    }
    const relevance = relevanceFor(principle.preference_id, context);
    if (!relevance) {
      filtered.push(principle.preference_id);
      filterReasons.push({ preference_id: principle.preference_id, rule: "CONTEXT_SIGNAL_ABSENT", rationale: `No structured or deterministic ${rule.scope} signal was present.` });
      continue;
    }

    candidates.push({
      record_id: `${query.query_id}:${principle.preference_id}:FULL`,
      preference_id: principle.preference_id,
      preference_version: model.model_version,
      model_id: model.model_id,
      human_confirmation_status: principle.human_confirmed ? "HUMAN_CONFIRMED" : "NOT_HUMAN_CONFIRMED",
      preference_status: principle.status,
      relevance,
      actionable_insight: rule.insight,
      operational_signals: matchedSignals(principle.preference_id, context),
      warnings: [rule.warning],
      known_exceptions: structuredClone(principle.exceptions),
      explicitly_not_claimed: structuredClone(principle.explicitly_not_claimed),
      evidence_refs: structuredClone(principle.evidence_refs),
      confidence: principle.confidence,
      authority: "ADVISORY_ONLY"
    });
  }

  const maxItems = normalizeAdvisoryBudget(query.advisory_budget?.max_items);
  const budgeted = applyAdvisoryBudget(candidates, maxItems);
  const compression = deduplicateMyEyesCompact(budgeted.returned);
  const returnedIds = budgeted.returned.map((record) => record.preference_id);
  const cardRecord = budgeted.returned.find((record) => record.preference_id === "MYE_PREF_000016");

  const positiveReferences = cardRecord && context.goodCards ? [{
    full_record_ref: cardRecord.record_id,
    preference_id: cardRecord.preference_id,
    image_id: model.card_execution_profile.positive_reference_image_id,
    reference_ref: "data/my_eyes/approved/6.png",
    mechanism_rationale: "The evidence demonstrates project-specific artifact content organized as a coherent narrative mass with hierarchy, spatial integration, breathing room, and subordination to the main subject.",
    usage_boundary: "Use the demonstrated mechanism-level properties only; do not reproduce cluster shape, palette, density, angles, object count, or pixel arrangement.",
    is_template: false,
    evidence_refs: [model.card_execution_profile.positive_reference_human_reason_id]
  }] : [];

  const conditionalAcceptances = budgeted.returned
    .filter((record) => ["MYE_PREF_000008", "MYE_PREF_000011", "MYE_PREF_000012", "MYE_PREF_000013", "MYE_PREF_000016"].includes(record.preference_id))
    .map((record) => ({ preference_id: record.preference_id, full_record_ref: record.record_id, statement: record.actionable_insight, exception: record.known_exceptions[0] }));

  const result = {
    schema_version: "1.0.0",
    query_id: query.query_id,
    model_ref: { model_id: model.model_id, model_version: model.model_version, source_memory_id: model.source_memory_id, source_memory_version: model.source_memory_version },
    relevant_preferences: budgeted.returned,
    relevant_failure_signatures: budgeted.returned.map((record) => ({ preference_id: record.preference_id, full_record_ref: record.record_id, signature: RULES[record.preference_id].failure, operational_signals: record.operational_signals })),
    conditional_acceptances: conditionalAcceptances,
    positive_references: positiveReferences,
    counterexamples: budgeted.returned.map((record) => ({ preference_id: record.preference_id, full_record_ref: record.record_id, explicitly_not_claimed: record.explicitly_not_claimed })),
    known_exceptions: budgeted.returned.map((record) => ({ preference_id: record.preference_id, full_record_ref: record.record_id, exceptions: record.known_exceptions })),
    contextual_warnings: budgeted.returned.map((record) => ({ preference_id: record.preference_id, full_record_ref: record.record_id, warning: record.warnings[0] })),
    uncertainties: Object.keys(query.creative_context ?? {}).length === 0
      ? ["Creative context is absent; only directly supported project-level matches can be returned."]
      : context.cards && !context.goodCards && !context.genericCards
        ? ["Cards are planned, but content specificity, grouping, and narrative role were not declared."]
        : [],
    evidence_refs: [...new Set(budgeted.returned.flatMap((record) => record.evidence_refs))],
    compact_agent_context: compression.compact,
    advisory_budget: { max_items: maxItems, returned_items: budgeted.returned.length },
    trace: {
      query_id: query.query_id,
      input_context: structuredClone({ project_context: query.project_context ?? {}, creative_context: query.creative_context ?? {}, query_scope: query.query_scope ?? [] }),
      eligible_preferences: candidates.map((record) => ({ preference_id: record.preference_id, relevance: record.relevance, rule: RULES[record.preference_id].scope })),
      filtered_preferences: filtered,
      returned_preferences: returnedIds,
      filter_reasons: filterReasons,
      compression_actions: [budgeted.action, compression.action].filter(Boolean),
      rationale_policy: "STRUCTURED_RULE_AND_EVIDENCE_RATIONALE_ONLY",
      hidden_reasoning_persisted: false
    },
    authority: "ADVISORY_ONLY"
  };

  assertAdvisoryAuthority(result, { source: "MY_EYES_ADVISORY" });
  return validateAdvisoryResult(result, "MY_EYES_ADVISORY");
}

export { CONCRETE_GENERIC_SIGNALS };
