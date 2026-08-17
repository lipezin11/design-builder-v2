import { assertAdvisoryAuthority } from "./authority-firewall.mjs";
import { queryMyEyesAdvisory } from "../my-eyes/query/my-eyes-query-engine.mjs";
import { queryVkbAdvisory } from "../vkb/query/vkb-query-engine.mjs";

const arrayOf = (value) => value === undefined ? [] : Array.isArray(value) ? value : [value];

function projectContextFrom(input) {
  const brief = input.brief_context ?? {};
  const explicit = input.project_context ?? {};
  return {
    ...(explicit.project_type !== undefined || brief.project_type !== undefined ? { project_type: explicit.project_type ?? brief.project_type } : {}),
    ...(explicit.format !== undefined || brief.format !== undefined ? { format: explicit.format ?? brief.format } : {}),
    ...(explicit.industry_or_domain !== undefined ? { industry_or_domain: explicit.industry_or_domain } : {}),
    ...(explicit.intended_use !== undefined || brief.target_context !== undefined ? { intended_use: explicit.intended_use ?? brief.target_context } : {}),
    ...(explicit.brand_context !== undefined ? { brand_context: explicit.brand_context } : {})
  };
}

function creativeContextFrom(input) {
  const brief = input.brief_context ?? {};
  const direction = input.proposed_creative_direction ?? {};
  return {
    ...(direction.concept !== undefined || brief.communication_goal !== undefined ? { concept: direction.concept ?? brief.communication_goal } : {}),
    ...(direction.visual_thesis !== undefined || brief.user_request !== undefined ? { visual_thesis: direction.visual_thesis ?? brief.user_request } : {}),
    ...(direction.planned_mechanisms !== undefined ? { planned_mechanisms: structuredClone(direction.planned_mechanisms) } : {}),
    ...(direction.planned_objects !== undefined ? { planned_objects: structuredClone(direction.planned_objects) } : {}),
    ...(direction.planned_effects !== undefined ? { planned_effects: structuredClone(direction.planned_effects) } : {}),
    ...(direction.planned_typography_behavior !== undefined ? { planned_typography_behavior: direction.planned_typography_behavior } : {}),
    ...(direction.planned_complexity !== undefined ? { planned_complexity: direction.planned_complexity } : {}),
    ...(direction.planned_color_behavior !== undefined ? { planned_color_behavior: direction.planned_color_behavior } : {}),
    ...(direction.planned_depth_behavior !== undefined ? { planned_depth_behavior: direction.planned_depth_behavior } : {}),
    ...(direction.signals !== undefined ? { signals: structuredClone(direction.signals) } : {})
  };
}

function buildVkbQuery(input, queryId, projectContext, creativeContext) {
  const brief = input.brief_context ?? {};
  const direction = input.proposed_creative_direction ?? {};
  const desiredEmotions = brief.emotional_intent
    ? [brief.emotional_intent.primary, ...arrayOf(brief.emotional_intent.secondary)].filter(Boolean)
    : arrayOf(direction.desired_emotions);
  return {
    query_id: `${queryId}:VKB`,
    project_context: projectContext,
    project_goals: [brief.commercial_objective, brief.communication_goal, ...arrayOf(direction.project_goals)].filter(Boolean),
    desired_emotions: desiredEmotions,
    hierarchy_needs: arrayOf(direction.hierarchy_needs ?? creativeContext.planned_typography_behavior),
    depth_needs: arrayOf(direction.depth_needs ?? creativeContext.planned_depth_behavior),
    ...(direction.composition_problem !== undefined ? { composition_problem: direction.composition_problem } : {}),
    ...(direction.lighting_problem !== undefined ? { lighting_problem: direction.lighting_problem } : {}),
    ...(direction.color_problem !== undefined || creativeContext.planned_color_behavior !== undefined ? { color_problem: direction.color_problem ?? creativeContext.planned_color_behavior } : {}),
    ...(direction.integration_problem !== undefined ? { integration_problem: direction.integration_problem } : {}),
    ...(direction.typography_problem !== undefined ? { typography_problem: direction.typography_problem } : {}),
    reference_transfer_goals: arrayOf(input.reference_context?.transfer_goals),
    planned_mechanisms: arrayOf(creativeContext.planned_mechanisms),
    ...(input.vkb_query_scope !== undefined ? { query_scope: structuredClone(input.vkb_query_scope) } : {}),
    ...(input.advisory_budget?.vkb_max_items !== undefined ? { advisory_budget: { max_items: input.advisory_budget.vkb_max_items } } : {})
  };
}

function preserveCrossTensions(myEyes, vkb) {
  const preferences = new Map(myEyes.relevant_preferences.map((item) => [item.preference_id, item]));
  const mechanisms = new Map(vkb.recommended_mechanisms.map((item) => [item.mechanism_id, item]));
  const conflicts = [];
  const notes = [];

  if (preferences.has("MYE_PREF_000012") && mechanisms.has("VKB_MECH_FOREGROUND_OCCLUSION_V1")) {
    conflicts.push({
      conflict_id: "CROSS_TENSION_FLOATING_FOREGROUND",
      type: "POTENTIAL_TENSION",
      my_eyes_refs: [preferences.get("MYE_PREF_000012").record_id],
      vkb_refs: [mechanisms.get("VKB_MECH_FOREGROUND_OCCLUSION_V1").record_id],
      description: "VKB identifies foreground or floating depth cues as a viable mechanism. My Eyes evidence indicates increased risk when such elements lack clear narrative or compositional function, coherent placement, shared lighting, or spatial integration.",
      preservation_status: "PRESERVED_UNRESOLVED",
      resolution_authority: "FUTURE_CREATIVE_AGENT"
    });
  }

  if (preferences.has("MYE_PREF_000016") && mechanisms.has("VKB_MECH_NARRATIVE_INFORMATION_PANELS_V1")) {
    conflicts.push({
      conflict_id: "CROSS_TENSION_INFORMATION_PANELS",
      type: "POTENTIAL_TENSION",
      my_eyes_refs: [preferences.get("MYE_PREF_000016").record_id],
      vkb_refs: [mechanisms.get("VKB_MECH_NARRATIVE_INFORMATION_PANELS_V1").record_id],
      description: "VKB identifies information panels as a possible exposition mechanism. My Eyes evidence is sensitive to generic dashboard cards and requires project-specific content, coherent grouping, hierarchy, narrative role, and integration.",
      preservation_status: "PRESERVED_UNRESOLVED",
      resolution_authority: "FUTURE_CREATIVE_AGENT"
    });
  }

  if (preferences.has("MYE_PREF_000013") && mechanisms.has("VKB_MECH_LOCALIZED_COLOR_CONTRAST_V1")) {
    notes.push({
      note_id: "CROSS_NOTE_COLOR_ALIGNMENT",
      type: "COMPLEMENTARY_CONTEXT",
      my_eyes_refs: [preferences.get("MYE_PREF_000013").record_id],
      vkb_refs: [mechanisms.get("VKB_MECH_LOCALIZED_COLOR_CONTRAST_V1").record_id],
      description: "Both advisors identify localized, conceptually motivated chromatic separation as relevant; neither specifies a final palette, saturation target, or contrast setting."
    });
  }

  return { conflicts, notes };
}

export class DesignAdvisoryContextBuilder {
  constructor({ myEyesQuery = queryMyEyesAdvisory, vkbQuery = queryVkbAdvisory } = {}) {
    this.myEyesQuery = myEyesQuery;
    this.vkbQuery = vkbQuery;
  }

  build(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Design Advisory Context input must be an object.");
    if (typeof input.context_id !== "string" || !input.context_id.trim()) throw new TypeError("context_id is required.");
    assertAdvisoryAuthority(input, { source: "DESIGN_ADVISORY_CONTEXT_INPUT" });
    const projectContext = projectContextFrom(input);
    const creativeContext = creativeContextFrom(input);
    const myEyesQuery = {
      query_id: `${input.context_id}:MY_EYES`,
      project_context: projectContext,
      creative_context: creativeContext,
      ...(input.my_eyes_query_scope !== undefined ? { query_scope: structuredClone(input.my_eyes_query_scope) } : {}),
      ...(input.advisory_budget?.my_eyes_max_items !== undefined ? { advisory_budget: { max_items: input.advisory_budget.my_eyes_max_items } } : {})
    };
    const vkbQuery = buildVkbQuery(input, input.context_id, projectContext, creativeContext);
    const myEyes = this.myEyesQuery(myEyesQuery);
    const vkb = this.vkbQuery(vkbQuery);
    const cross = preserveCrossTensions(myEyes, vkb);
    const result = {
      schema_version: "1.0.0",
      context_id: input.context_id,
      mode: "SHADOW_ADVISORY",
      input_context: {
        project_context: projectContext,
        brief_context_ref: input.brief_context?.schema_version ? { schema_version: input.brief_context.schema_version, project_type: input.brief_context.project_type } : null,
        reference_context_present: input.reference_context !== undefined,
        proposed_creative_direction_present: input.proposed_creative_direction !== undefined
      },
      my_eyes: myEyes,
      vkb,
      cross_advisory_notes: cross.notes,
      conflicts: cross.conflicts,
      uncertainties: [...myEyes.uncertainties, ...vkb.uncertainties],
      compact_agent_context: {
        my_eyes: structuredClone(myEyes.compact_agent_context),
        vkb: structuredClone(vkb.compact_agent_context),
        conflicts: cross.conflicts.map(({ conflict_id, description, my_eyes_refs, vkb_refs }) => ({ conflict_id, description, full_record_refs: [...my_eyes_refs, ...vkb_refs] }))
      },
      trace: {
        context_id: input.context_id,
        source_query_ids: [myEyes.query_id, vkb.query_id],
        conflicts_preserved: cross.conflicts.map((item) => item.conflict_id),
        automatic_resolutions: [],
        automatic_prompt_injection: false,
        structured_rationale_only: true
      },
      authority: { my_eyes: "ADVISORY_ONLY", vkb: "ADVISORY_ONLY", builder: "CONTEXT_ASSEMBLY_ONLY" }
    };
    assertAdvisoryAuthority(result, { source: "DESIGN_ADVISORY_CONTEXT" });
    return result;
  }
}

export function buildDesignAdvisoryContext(input, options) {
  return new DesignAdvisoryContextBuilder(options).build(input);
}

