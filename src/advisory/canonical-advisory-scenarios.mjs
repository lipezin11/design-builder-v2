import { buildDesignAdvisoryContext } from "./design-advisory-context-builder.mjs";
import { queryMyEyesAdvisory } from "../my-eyes/query/my-eyes-query-engine.mjs";

const serialized = (value) => JSON.stringify(value).toLowerCase();
const hasPreference = (result, id) => result.relevant_preferences.some((item) => item.preference_id === id);

export const CANONICAL_ADVISORY_SCENARIOS_V1 = Object.freeze([
  {
    scenario_id: "ADVISORY_SCENARIO_01_HIGH_COMPLEXITY",
    description: "A dense direction with many elements and explicit high complexity.",
    execute: () => queryMyEyesAdvisory({
      query_id: "canonical-high-complexity",
      creative_context: {
        concept: "One convergent ecosystem of project artifacts",
        planned_complexity: "HIGH",
        planned_objects: ["subject", "project artifacts", "environment layers", "typography"],
        signals: { high_complexity: { present: true } }
      }
    }),
    verify: (result) => [
      { check: "controlled_complexity_relevant", passed: hasPreference(result, "MYE_PREF_000008") },
      { check: "no_reduce_element_count_instruction", passed: !serialized(result).includes("reduce element count") }
    ]
  },
  {
    scenario_id: "ADVISORY_SCENARIO_02_FLOATING_ELEMENTS",
    description: "A direction with suspended foreground objects.",
    execute: () => queryMyEyesAdvisory({
      query_id: "canonical-floating-elements",
      creative_context: { planned_objects: ["suspended project artifacts", "foreground object"], planned_depth_behavior: "foreground and middle-ground separation", signals: { floating_elements: { present: true } } }
    }),
    verify: (result) => [
      { check: "floating_execution_relevant", passed: hasPreference(result, "MYE_PREF_000012") },
      { check: "no_remove_all_floating_instruction", passed: !serialized(result).includes("remove all floating elements") }
    ]
  },
  {
    scenario_id: "ADVISORY_SCENARIO_03_GENERIC_CARDS",
    description: "Multiple interchangeable dashboard cards around the subject.",
    execute: () => queryMyEyesAdvisory({
      query_id: "canonical-generic-cards",
      creative_context: { planned_objects: ["generic dashboard cards", "miniature charts"], signals: { cards: { present: true, generic_dashboard_treatment: true }, generic_assembly: { present: true, concrete_signals: ["repeated modular UI treatment", "visually interchangeable elements"] } } }
    }),
    verify: (result) => [
      { check: "card_sensitivity_relevant", passed: hasPreference(result, "MYE_PREF_000016") },
      { check: "generic_assembly_relevant", passed: hasPreference(result, "MYE_PREF_000010") },
      { check: "concrete_signals_present", passed: result.relevant_failure_signatures.some((item) => item.operational_signals.length > 0) },
      { check: "no_vague_ai_only_instruction", passed: !serialized(result).includes("avoid ai look") && !serialized(result).includes("make it less ai-generated") }
    ]
  },
  {
    scenario_id: "ADVISORY_SCENARIO_04_GOOD_CARD_CONTEXT",
    description: "Specific cards form a coherent, integrated narrative group.",
    execute: () => queryMyEyesAdvisory({
      query_id: "canonical-good-cards",
      creative_context: { planned_objects: ["specific project artifacts"], signals: { cards: { present: true, content_specific: true, coherent_grouping: true, narrative_role: true, generic_dashboard_treatment: false } } }
    }),
    verify: (result) => [
      { check: "cards_conditionally_accepted", passed: result.conditional_acceptances.some((item) => item.preference_id === "MYE_PREF_000016") },
      { check: "positive_reference_returned", passed: result.positive_references.some((item) => item.image_id === "MYE_IMG_000006" && item.is_template === false) },
      { check: "reference_is_mechanism_not_template", passed: result.positive_references.every((item) => /mechanism-level|project-specific|coherent narrative/i.test(`${item.mechanism_rationale} ${item.usage_boundary}`)) }
    ]
  },
  {
    scenario_id: "ADVISORY_SCENARIO_05_MICRODETAIL_POLLUTION",
    description: "Particles, small glows, icons, lines, and microelements lack a declared shared function.",
    execute: () => queryMyEyesAdvisory({
      query_id: "canonical-microdetail",
      creative_context: { planned_effects: ["particles", "small glows", "decorative icons", "mini lines"], signals: { microeffects: { present: true, functional_purpose: false } } }
    }),
    verify: (result) => [{ check: "microdetail_discipline_relevant", passed: hasPreference(result, "MYE_PREF_000011") }]
  },
  {
    scenario_id: "ADVISORY_SCENARIO_06_COLOR",
    description: "The direction requests strong chromatic impact.",
    execute: () => queryMyEyesAdvisory({
      query_id: "canonical-color",
      creative_context: { planned_color_behavior: "strong chromatic impact with localized contrast", signals: { strong_color_impact: { present: true } } }
    }),
    verify: (result) => [
      { check: "color_vitality_relevant", passed: hasPreference(result, "MYE_PREF_000013") },
      { check: "no_maximize_instruction", passed: !serialized(result).includes("maximize saturation") && !serialized(result).includes("maximize contrast") }
    ]
  },
  {
    scenario_id: "ADVISORY_SCENARIO_07_LOW_RELEVANCE",
    description: "A simple project without cards, floating objects, or microeffects.",
    execute: () => queryMyEyesAdvisory({ query_id: "canonical-low-relevance", project_context: { project_type: "SIMPLE_EDITORIAL", intended_use: "single calm cover" }, creative_context: { concept: "single subject with plain background", planned_complexity: "LOW" } }),
    verify: (result) => [
      { check: "card_preference_omitted", passed: !hasPreference(result, "MYE_PREF_000016") },
      { check: "floating_preference_omitted", passed: !hasPreference(result, "MYE_PREF_000012") },
      { check: "microdetail_preference_omitted", passed: !hasPreference(result, "MYE_PREF_000011") },
      { check: "context_not_diluted", passed: result.relevant_preferences.length === 0 }
    ]
  },
  {
    scenario_id: "ADVISORY_SCENARIO_08_VKB_MY_EYES_TENSION",
    description: "VKB retrieves a foreground depth mechanism while My Eyes raises floating-element execution risk.",
    execute: () => buildDesignAdvisoryContext({
      context_id: "canonical-cross-tension",
      proposed_creative_direction: {
        planned_objects: ["floating foreground artifacts"],
        planned_mechanisms: ["Foreground Occlusion"],
        depth_needs: ["foreground floating depth and occlusion"],
        composition_problem: "create depth with suspended foreground objects",
        signals: { floating_elements: { present: true } }
      }
    }),
    verify: (result) => [
      { check: "tension_preserved", passed: result.conflicts.some((item) => item.type === "POTENTIAL_TENSION" && item.preservation_status === "PRESERVED_UNRESOLVED") },
      { check: "no_automatic_resolution", passed: result.trace.automatic_resolutions.length === 0 }
    ]
  }
]);

export function runCanonicalAdvisoryScenarios() {
  return CANONICAL_ADVISORY_SCENARIOS_V1.map((scenario) => {
    try {
      const output = scenario.execute();
      const checks = scenario.verify(output);
      return { scenario_id: scenario.scenario_id, description: scenario.description, passed: checks.every((item) => item.passed), checks, output };
    } catch (error) {
      return { scenario_id: scenario.scenario_id, description: scenario.description, passed: false, checks: [], error: { name: error.name, message: error.message, code: error.code } };
    }
  });
}

