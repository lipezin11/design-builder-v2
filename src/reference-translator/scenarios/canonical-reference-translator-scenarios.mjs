const clone = (value) => structuredClone(value);
const named = (plan, suffix) => {
  const result = clone(plan);
  result.plan_id = `${plan.plan_id}_${suffix}`;
  result.provenance.notes = `Canonical Reference Translator scenario ${suffix}; structured rationale only.`;
  return result;
};
const addObservationAndMapping = (plan, suffix, observation, mapping) => {
  const result = named(plan, suffix);
  result.reference_analyses[0].observations.push(observation);
  result.design_decision_map.push(mapping);
  return result;
};

export const REFERENCE_TRANSLATOR_CANONICAL_SCENARIO_IDS = Object.freeze([
  "A_NO_REFERENCE",
  "B_STRONG_REFERENCE",
  "C_WEBSITE_HERO",
  "D_EDIT_MODE",
  "E_REFERENCE_CONFLICTS_WITH_MY_EYES",
  "F_HIGH_COMPLEXITY_REFERENCE",
  "G_MINIMAL_REFERENCE",
  "H_FORMAT_MISMATCH",
  "I_IDENTITY_PROTECTION",
  "J_SURFACE_COPY_TRAP",
  "K_UNDERTRANSFER_TRAP",
  "L_OVERTRANSFER_TRAP",
  "M_GENERIC_AI_REFERENCE",
  "N_CARD_REFERENCE",
  "O_TYPOGRAPHY_HEAVY_REFERENCE"
]);

export function buildCanonicalReferenceTranslatorScenarios({
  validPlan,
  createReferenceRequest,
  createNoReferenceRequest
}) {
  const scenarios = [];
  scenarios.push({ scenario_id: "A_NO_REFERENCE", request: createNoReferenceRequest("canonical-a"), expectations: { status: "PASS", minimum_attempts: 0 } });

  scenarios.push({ scenario_id: "B_STRONG_REFERENCE", request: createReferenceRequest([named(validPlan, "b")], "canonical-b"), expectations: { status: "PASS", minimum_attempts: 1 } });

  const website = named(validPlan, "c");
  website.design_decision_map[0].target_in_new_composition = "Preserve a low-density communication territory opposite the perfume while adapting the source mass relationship to the target landscape hero format.";
  website.design_decision_map[0].rationale = "The reference separates hero density from calm communication space; the target preserves that territorial function without copying source coordinates.";
  scenarios.push({ scenario_id: "C_WEBSITE_HERO", request: createReferenceRequest([website], "canonical-c"), expectations: { status: "PASS", minimum_attempts: 1 } });

  const edit = named(validPlan, "d");
  edit.base_analysis.existing_composition_constraints.push("Edit only the declared support-surface region.");
  edit.design_decision_map[0].protected_dependencies.push("locked bottle region");
  scenarios.push({ scenario_id: "D_EDIT_MODE", request: createReferenceRequest([edit], "canonical-d"), expectations: { status: "PASS", minimum_attempts: 1 } });

  const advisoryConflict = named(validPlan, "e");
  advisoryConflict.conflicts.push({
    conflict_id: "conflict_my_eyes_filler",
    type: "REFERENCE_VS_ORIGINALITY",
    description: "Reference includes generic floating filler while My Eyes warns about weakly integrated decorative elements.",
    severity: "MEDIUM",
    blocking: false,
    involved_assets: ["asset_skincare_reference"],
    involved_constraints: ["advisory remains conditional"],
    translator_position: "Preserve the tension and discard only functionless manifestations.",
    resolution_status: "ESCALATED_TO_DIRECTOR",
    requires_director_decision: true,
    requires_user_decision: false,
    provenance: "INFERRED"
  });
  scenarios.push({ scenario_id: "E_REFERENCE_CONFLICTS_WITH_MY_EYES", request: createReferenceRequest([advisoryConflict], "canonical-e"), expectations: { status: "PASS", minimum_attempts: 1 } });

  const complexity = addObservationAndMapping(named(validPlan, "f"), "complexity", {
    observation_id: "obs_complex_cluster",
    category: "OTHER",
    description: "Numerous secondary details form one tightly grouped material cluster around the product.",
    region: "midground cluster",
    salience: "HIGH",
    confidence: "HIGH",
    provenance: "OBSERVED"
  }, {
    mapping_id: "map_complex_cluster",
    source_reference_asset_id: "asset_skincare_reference",
    observation_ids: ["obs_complex_cluster"],
    action: "ADAPT",
    target_in_new_composition: "Retain purposeful clustered richness around the perfume while reserving a clean label-reading zone.",
    rationale: "The transferable mechanism is controlled convergence of many related details, not a lower element count or the same decorative inventory.",
    strength: "MEDIUM",
    flexibility: "HIGH",
    protected_dependencies: ["perfume label"],
    confidence: "HIGH",
    provenance: "INFERRED"
  });
  scenarios.push({ scenario_id: "F_HIGH_COMPLEXITY_REFERENCE", request: createReferenceRequest([complexity], "canonical-f"), expectations: { status: "PASS", minimum_attempts: 1 } });

  const minimal = named(validPlan, "g");
  minimal.reference_analyses[0].reference_dna.minimal_discipline = "One hero product, quiet support, and disciplined tonal hierarchy";
  minimal.director_handoff.warnings.push("Preserve target information needs even while keeping reference discipline.");
  scenarios.push({ scenario_id: "G_MINIMAL_REFERENCE", request: createReferenceRequest([minimal], "canonical-g"), expectations: { status: "PASS", minimum_attempts: 1 } });

  const format = named(validPlan, "h");
  format.base_analysis.existing_composition_constraints = ["landscape 16:9 target derived from portrait reference"];
  format.design_decision_map[0].rationale = "Preserve relative hero dominance, tactile support, and negative-space function while recomposing for landscape rather than tracing portrait coordinates.";
  scenarios.push({ scenario_id: "H_FORMAT_MISMATCH", request: createReferenceRequest([format], "canonical-h"), expectations: { status: "PASS", minimum_attempts: 1 } });

  const identity = named(validPlan, "i");
  identity.director_handoff.warnings.push("Reference packaging and source product identity must never replace the supplied perfume.");
  scenarios.push({ scenario_id: "I_IDENTITY_PROTECTION", request: createReferenceRequest([identity], "canonical-i"), expectations: { status: "PASS", minimum_attempts: 1 } });

  const literal = named(validPlan, "j_bad");
  literal.design_decision_map[0].action = "TRANSFER";
  scenarios.push({ scenario_id: "J_SURFACE_COPY_TRAP", request: createReferenceRequest([literal, named(validPlan, "j_fixed")], "canonical-j"), expectations: { status: "PASS", minimum_attempts: 2 } });

  const generic = named(validPlan, "k_bad");
  generic.design_decision_map[0].rationale = "Use similar mood.";
  scenarios.push({ scenario_id: "K_UNDERTRANSFER_TRAP", request: createReferenceRequest([generic, named(validPlan, "k_fixed")], "canonical-k"), expectations: { status: "PASS", minimum_attempts: 2 } });

  const over = named(validPlan, "l_bad");
  for (let index = 0; index < 4; index++) over.design_decision_map.push({
    mapping_id: `map_literal_${index}`,
    source_reference_asset_id: "asset_skincare_reference",
    observation_ids: ["obs_soft_material"],
    action: "TRANSFER",
    target_in_new_composition: `Transfer source surface manifestation ${index} directly into the target.`,
    rationale: "The source surface has visible material contrast, but this candidate incorrectly transfers its manifestation without sufficient target adaptation.",
    strength: "MEDIUM",
    flexibility: "LOW",
    protected_dependencies: [],
    confidence: "MEDIUM",
    provenance: "INFERRED"
  });
  scenarios.push({ scenario_id: "L_OVERTRANSFER_TRAP", request: createReferenceRequest([over, named(validPlan, "l_fixed")], "canonical-l"), expectations: { status: "PASS", minimum_attempts: 2 } });

  const genericAi = addObservationAndMapping(named(validPlan, "m"), "generic_ai", {
    observation_id: "obs_generic_modules",
    category: "OTHER",
    description: "Repeated interchangeable glow modules are independently lit and weakly grouped.",
    region: "frame edges",
    salience: "MEDIUM",
    confidence: "HIGH",
    provenance: "OBSERVED"
  }, {
    mapping_id: "map_generic_modules",
    source_reference_asset_id: "asset_skincare_reference",
    observation_ids: ["obs_generic_modules"],
    action: "DISCARD",
    target_in_new_composition: "Omit interchangeable edge modules that do not support perfume narrative, depth, or hierarchy.",
    rationale: "Concrete weak grouping and independent lighting make these modules filler; this is a mechanism-level diagnosis rather than a vague AI-look label.",
    strength: "NONE",
    flexibility: "HIGH",
    protected_dependencies: [],
    confidence: "HIGH",
    provenance: "INFERRED"
  });
  scenarios.push({ scenario_id: "M_GENERIC_AI_REFERENCE", request: createReferenceRequest([genericAi], "canonical-m"), expectations: { status: "PASS", minimum_attempts: 1 } });

  const cards = addObservationAndMapping(named(validPlan, "n"), "cards", {
    observation_id: "obs_cards",
    category: "NARRATIVE_OBJECT",
    description: "Three product-specific information panels form one subordinate grouped mass.",
    region: "secondary midground",
    salience: "MEDIUM",
    confidence: "HIGH",
    provenance: "OBSERVED"
  }, {
    mapping_id: "map_cards",
    source_reference_asset_id: "asset_skincare_reference",
    observation_ids: ["obs_cards"],
    action: "ADAPT",
    target_in_new_composition: "Translate only the coherent grouping and hierarchy if fragrance-specific information is genuinely required.",
    rationale: "The transferable value is specific content organization, subordinate hierarchy, and spatial integration rather than the source card shapes or count.",
    strength: "MEDIUM",
    flexibility: "HIGH",
    protected_dependencies: ["perfume label"],
    confidence: "MEDIUM",
    provenance: "INFERRED"
  });
  scenarios.push({ scenario_id: "N_CARD_REFERENCE", request: createReferenceRequest([cards], "canonical-n"), expectations: { status: "PASS", minimum_attempts: 1 } });

  const typography = addObservationAndMapping(named(validPlan, "o"), "typography", {
    observation_id: "obs_display_type",
    category: "TYPOGRAPHY",
    description: "Large display typography acts as a left-side visual mass without covering the product.",
    region: "left communication territory",
    salience: "HIGH",
    confidence: "HIGH",
    provenance: "OBSERVED"
  }, {
    mapping_id: "map_display_type",
    source_reference_asset_id: "asset_skincare_reference",
    observation_ids: ["obs_display_type"],
    action: "ADAPT",
    target_in_new_composition: "Preserve display-scale mass and product-safe territorial separation using target brand typography and target copy.",
    rationale: "Typography behavior, hierarchy, and spatial mass are transferable while source font identity and visible wording are explicitly excluded.",
    strength: "MEDIUM",
    flexibility: "HIGH",
    protected_dependencies: ["perfume label"],
    confidence: "HIGH",
    provenance: "INFERRED"
  });
  scenarios.push({ scenario_id: "O_TYPOGRAPHY_HEAVY_REFERENCE", request: createReferenceRequest([typography], "canonical-o"), expectations: { status: "PASS", minimum_attempts: 1 } });

  return scenarios;
}
