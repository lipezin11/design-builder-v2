import assert from "node:assert/strict";
import test from "node:test";
import { crossAsset, crossBrief, crossPlan } from "./reference-translator-test-helpers.mjs";
import {
  validateReferenceTransferPlanQuality,
  validateReferenceTransferPlanSchema,
  validateReferenceTransferPlanSemantics
} from "../../src/reference-translator/validation/reference-transfer-plan-validator.mjs";

const runtimeContext = () => ({
  briefSpec: crossBrief(),
  referenceAssets: [crossAsset()],
  targetProductCategory: "fragrance",
  projectId: "project_cross_category_perfume",
  protectedSemantics: ["perfume bottle identity", "perfume label"],
  identityConstraints: ["perfume bottle identity"]
});
const codes = (result) => result.diagnostics.map((item) => item.code);

test("cross-category product adaptation fixture passes schema, semantics, and quality", () => {
  const plan = crossPlan();
  assert.equal(validateReferenceTransferPlanSchema(plan).valid, true);
  assert.equal(validateReferenceTransferPlanSemantics(plan, runtimeContext()).valid, true);
  assert.equal(validateReferenceTransferPlanQuality(plan).valid, true);
});

test("a conflict established by an explicit user constraint has valid provenance", () => {
  const plan = crossPlan();
  plan.conflicts[0].provenance = "USER_EXPLICIT";
  assert.equal(validateReferenceTransferPlanSchema(plan).valid, true);
});

test("cross-category support prop cannot use direct TRANSFER", () => {
  const plan = crossPlan();
  plan.design_decision_map[0].action = "TRANSFER";
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("CROSS_CATEGORY_LITERAL_PROP_TRANSFER"));
});

test("cross-category support prop requires the five-part structured adaptation", () => {
  const plan = crossPlan();
  delete plan.design_decision_map[0].cross_category_adaptation;
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.ok(codes(result).includes("CROSS_CATEGORY_ADAPTATION_REQUIRED"));
});

test("cross-category equivalent cannot repeat the literal object", () => {
  const plan = crossPlan();
  plan.design_decision_map[0].cross_category_adaptation.equivalent_adaptation = "Place the handbag beside the perfume.";
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.ok(codes(result).includes("CROSS_CATEGORY_EQUIVALENT_IS_LITERAL_COPY"));
});

test("cross-category classification must match declared source and target", () => {
  const plan = crossPlan();
  plan.design_decision_map[0].cross_category_adaptation.target_product_category = "skincare";
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.ok(codes(result).includes("CROSS_CATEGORY_CLASSIFICATION_MISMATCH"));
});

test("cross-category adaptation structure is rejected outside declared product-support translation", () => {
  const plan = crossPlan();
  const asset = crossAsset();
  delete asset.product_category;
  asset.product_support_observation_ids = [];
  asset.literal_support_elements = [];
  const context = { ...runtimeContext(), referenceAssets: [asset], targetProductCategory: undefined };
  const result = validateReferenceTransferPlanSemantics(plan, context);
  assert.ok(codes(result).includes("CROSS_CATEGORY_ADAPTATION_OUT_OF_SCOPE"));
});

test("source hue cannot become mandatory without explicit target ownership", () => {
  const plan = crossPlan();
  plan.reference_analyses[0].observations.push({
    observation_id: "obs_source_purple",
    category: "COLOR",
    description: "Purple illumination dominates the source environment.",
    region: "full frame",
    salience: "HIGH",
    confidence: "HIGH",
    provenance: "OBSERVED"
  });
  plan.design_decision_map[0].observation_ids.push("obs_source_purple");
  plan.design_decision_map[0].target_in_new_composition = "Maintain purple as the dominant target illumination around the perfume.";
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.ok(codes(result).includes("SOURCE_HUE_OVERANCHOR"));
});

test("explicit target color ownership permits the same hue", () => {
  const plan = crossPlan();
  plan.reference_analyses[0].observations.push({
    observation_id: "obs_source_purple",
    category: "COLOR",
    description: "Purple illumination dominates the source environment.",
    region: "full frame",
    salience: "HIGH",
    confidence: "HIGH",
    provenance: "OBSERVED"
  });
  plan.design_decision_map[0].observation_ids.push("obs_source_purple");
  plan.design_decision_map[0].target_in_new_composition = "Maintain purple as the dominant target illumination around the perfume.";
  const context = runtimeContext();
  context.briefSpec.user_request += " The target brand explicitly requires purple illumination.";
  assert.equal(validateReferenceTransferPlanSemantics(plan, context).valid, true);
});

test("source hue cannot enter must-survive handoff without target authority", () => {
  const plan = crossPlan();
  plan.reference_analyses[0].observations.push({
    observation_id: "obs_source_purple",
    category: "COLOR",
    description: "Purple illumination dominates the source environment.",
    region: "full frame",
    salience: "HIGH",
    confidence: "HIGH",
    provenance: "OBSERVED"
  });
  plan.director_handoff.what_must_survive.push("Purple illumination hierarchy");
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.ok(codes(result).includes("SOURCE_HUE_TREATED_AS_INVARIANT"));
});

test("generic technology motif lists require verified target evidence", () => {
  const plan = crossPlan();
  delete plan.design_decision_map[0].cross_category_adaptation;
  plan.design_decision_map[0].target_in_new_composition = "Build layered depth from server racks, code screens, circuit patterns, and data visualization planes.";
  plan.design_decision_map[0].rationale = "These elements provide a technical world around the creator.";
  const asset = crossAsset();
  delete asset.product_category;
  asset.product_support_observation_ids = [];
  asset.literal_support_elements = [];
  const briefSpec = crossBrief();
  briefSpec.project_type = "THUMBNAIL";
  briefSpec.user_request = "Create a personal-brand technology thumbnail for a creator.";
  briefSpec.target_context = "Technology creator social thumbnail";
  const result = validateReferenceTransferPlanSemantics(plan, {
    ...runtimeContext(),
    briefSpec,
    referenceAssets: [asset],
    targetProductCategory: undefined
  });
  assert.ok(codes(result).includes("GENERIC_TECH_SUBSTITUTION_UNGROUNDED"));
});

test("user-authorized technology artifacts are not treated as generic substitution", () => {
  const plan = crossPlan();
  delete plan.design_decision_map[0].cross_category_adaptation;
  plan.design_decision_map[0].target_in_new_composition = "Build layered depth from the supplied server racks and code screens.";
  plan.design_decision_map[0].rationale = "The creator explicitly owns and requested these real workflow artifacts.";
  const asset = crossAsset();
  delete asset.product_category;
  asset.product_support_observation_ids = [];
  asset.literal_support_elements = [];
  const briefSpec = crossBrief();
  briefSpec.project_type = "THUMBNAIL";
  briefSpec.user_request = "Create a technology creator thumbnail using the supplied server racks and code screens.";
  briefSpec.target_context = "Technology creator social thumbnail";
  assert.equal(validateReferenceTransferPlanSemantics(plan, {
    ...runtimeContext(),
    briefSpec,
    referenceAssets: [asset],
    targetProductCategory: undefined
  }).valid, true);
});

test("brand and visible reference text cannot leak into target instructions", () => {
  const brand = crossPlan();
  brand.design_decision_map[0].target_in_new_composition += " Display DERMA LABS.";
  assert.ok(codes(validateReferenceTransferPlanSemantics(brand, runtimeContext())).includes("REFERENCE_BRAND_LEAKAGE"));
  const text = crossPlan();
  text.design_decision_map[0].target_in_new_composition += " Render DERMA SOURCE.";
  assert.ok(codes(validateReferenceTransferPlanSemantics(text, runtimeContext())).includes("REFERENCE_TEXT_LEAKAGE"));
});

test("protected product identity cannot be replaced", () => {
  const plan = crossPlan();
  plan.design_decision_map[0].target_in_new_composition = "Replace perfume bottle identity with the reference package.";
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.ok(codes(result).includes("PROTECTED_FIELD_VIOLATION"));
});

test("My Eyes and VKB cannot be elevated into final commands", () => {
  const plan = crossPlan();
  plan.design_decision_map[0].rationale = "My Eyes forbids handbags and mandates this final direction.";
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.ok(codes(result).includes("ADVISORY_AUTHORITY_VIOLATION"));
});

test("generic mood language is rejected as undertransfer", () => {
  const plan = crossPlan();
  plan.design_decision_map[0].rationale = "Make it cinematic.";
  const result = validateReferenceTransferPlanQuality(plan);
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("GENERIC_TRANSFER_PLAN"));
});

test("schema rejects downstream authority and mutation fields", () => {
  for (const mutation of [
    ["copy_reference_palette_exactly", true],
    ["copy_reference_layout", true],
    ["reference_subject_replaces_target", true],
    ["cards_forbidden", true],
    ["floating_elements_forbidden", true],
    ["avoid_ai_look", true],
    ["selected_creative_direction", "x"],
    ["final_frame_spec", {}],
    ["critic_decision", "PASS"],
    ["generation_request", {}]
  ]) {
    const plan = crossPlan();
    plan[mutation[0]] = mutation[1];
    assert.equal(validateReferenceTransferPlanSchema(plan).valid, false, mutation[0]);
  }
});

test("no-reference mode rejects hallucinated reference analysis", () => {
  const plan = crossPlan();
  plan.reference_analyses = [];
  plan.design_decision_map = [];
  const context = { ...runtimeContext(), referenceAssets: [] };
  plan.transfer_intensity.value = "NONE";
  assert.equal(validateReferenceTransferPlanSemantics(plan, context).valid, true);
  plan.reference_analyses = crossPlan().reference_analyses;
  const result = validateReferenceTransferPlanSemantics(plan, context);
  assert.ok(codes(result).includes("REFERENCE_HALLUCINATION"));
});

// ─── HARDENING TESTS ─────────────────────────────────────────────────────────

// Helpers for hardening tests ─────────────────────────────────────────────────

/** Build a minimal PRIMARY_REFERENCE plan with a single observation. */
function techPlan() {
  return structuredClone({
    schema_version: "1.1.0",
    plan_id: "plan-test-harness",
    project_id: "project_cross_category_perfume",
    brief_spec_version: "1.0.0",
    status: "READY_FOR_DIRECTOR",
    transfer_mode: "STANDARD_REFERENCE_TRANSFER",
    transfer_intensity: { value: "HIGH", source: "MODEL_INFERENCE", confidence: "HIGH" },
    base_analysis: {
      base_asset_id: "asset_skincare_reference",
      semantic_identity: "Test",
      protected_elements: [],
      elements_allowed_to_change: [],
      elements_forbidden_to_change: []
    },
    reference_analyses: [{
      reference_asset_id: "asset_skincare_reference",
      role: "PRIMARY_REFERENCE",
      scope: "GLOBAL_VISUAL_DIRECTION",
      authority: "USER_PRIMARY_REFERENCE",
      observations: [
        { observation_id: "obs_composition", category: "COMPOSITION", description: "Dense mechanical foreground framing with layered immersive depth.", salience: "DOMINANT", confidence: "HIGH", provenance: "OBSERVED" },
        { observation_id: "obs_lighting", category: "LIGHTING", description: "Violet-dominant atmospheric lighting with electrical energy arcs.", salience: "HIGH", confidence: "HIGH", provenance: "OBSERVED" },
        { observation_id: "obs_typography", category: "TYPOGRAPHY", description: "Acid-green spray-painted graffiti text as high-contrast accent.", salience: "HIGH", confidence: "HIGH", provenance: "OBSERVED" },
        { observation_id: "obs_depth", category: "DEPTH", description: "Layered machine-world environment creating deep spatial immersion.", salience: "MEDIUM", confidence: "HIGH", provenance: "OBSERVED" }
      ],
      reference_dna: { hierarchy: "Central subject with dense mechanical framing", lighting: "Violet-dominant atmosphere", color: "Purple/violet base with acid-green accent", complexity: "High-density layered machine environment" },
      transfer_relevance: "HIGH",
      confidence: "HIGH",
      provenance: "OBSERVED"
    }],
    design_decision_map: [
      { mapping_id: "map_comp", source_reference_asset_id: "asset_skincare_reference", observation_ids: ["obs_composition"], action: "ADAPT", target_in_new_composition: "Maintain central subject dominance with dense layered mechanical framing to reinforce immersion.", rationale: "Central dominance with layered density is the core compositional thesis of this reference.", strength: "HIGH", flexibility: "MEDIUM", confidence: "HIGH", provenance: "INFERRED" },
      { mapping_id: "map_light", source_reference_asset_id: "asset_skincare_reference", observation_ids: ["obs_lighting"], action: "ADAPT", target_in_new_composition: "Use high-contrast saturated ambient light base that integrates with subject skin tones.", rationale: "The atmospheric energy and contrast are transferable; the specific hue must be adapted to the target context.", strength: "HIGH", flexibility: "HIGH", confidence: "HIGH", provenance: "INFERRED" },
      { mapping_id: "map_typo", source_reference_asset_id: "asset_skincare_reference", observation_ids: ["obs_typography"], action: "REINVENT", target_in_new_composition: "Discard source graffiti typography and literal wording; use a high-chroma secondary accent color in target-native text or graphic elements to provide visual tension against the ambient base.", rationale: "The acid-green graffiti provides structural counter-accent tension and compositional mass that is transferable as a high-chroma text accent function without literal style copy.", strength: "MEDIUM", flexibility: "HIGH", confidence: "HIGH", provenance: "INFERRED" }
    ],
    conflicts: [],
    non_negotiable_anchors: [],
    flexible_areas: [],
    risks: [],
    open_questions: [],
    provenance: { translator_version: "1.1.0", created_at: "2026-08-16T00:00:00.000Z", notes: "Test fixture." },
    confidence: { overall: "HIGH", rationale: "Strong reference with clear transferable mechanisms." },
    director_handoff: {
      what_must_survive: ["Subject identity"],
      what_should_survive: ["High-contrast saturated lighting atmosphere", "Central subject hierarchy"],
      what_can_change: ["Specific hue of ambient light", "Environment manifestation"],
      key_conflicts: [],
      recommended_anchors: ["Subject identity", "High-contrast ambient light intensity"],
      creative_opportunities: [],
      warnings: []
    }
  });
}

// ── Check 1 / Check 5: Source hue in observation/warning only → PASS ──────────

test("[HARDENING] source hue in observation description only (no handoff mandate) → PASS", () => {
  const plan = techPlan();
  // The plan already has "violet" in the observation but NOT in any invariant/handoff field.
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.ok(!codes(result).includes("SOURCE_HUE_TREATED_AS_INVARIANT"), "should not flag observation-only hue mention");
  assert.ok(!codes(result).includes("SOURCE_HUE_OVERANCHOR"), "should not flag observation-only hue mention");
});

test("[HARDENING] source hue in warning field with negation prefix → PASS", () => {
  const plan = techPlan();
  plan.director_handoff.warnings = ["Do not mandate violet as the final output hue without target brand justification."];
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.ok(!codes(result).includes("SOURCE_HUE_TREATED_AS_INVARIANT"), "negation-prefixed warning should not trigger invariant check");
});

// ── Check 1: Source hue in what_should_survive without justification → FAIL ──

test("[HARDENING] source hue reintroduced as positive what_should_survive without target ownership → FAIL SOURCE_HUE_TREATED_AS_INVARIANT", () => {
  const plan = techPlan();
  plan.director_handoff.what_should_survive.push("Violet/purple atmospheric lighting");
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("SOURCE_HUE_TREATED_AS_INVARIANT"), `got: ${codes(result).join(", ")}`);
});

// ── Check 1: Source hue in recommended_anchors without justification → FAIL ──

test("[HARDENING] source hue in recommended_anchors without target ownership → FAIL SOURCE_HUE_TREATED_AS_INVARIANT", () => {
  const plan = techPlan();
  plan.director_handoff.recommended_anchors.push("Violet/purple lighting atmosphere");
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("SOURCE_HUE_TREATED_AS_INVARIANT"), `got: ${codes(result).join(", ")}`);
});

// ── Check 1: Literal hue required by target brand → PASS ──────────────────────

test("[HARDENING] source hue required by target brand in brief → PASS", () => {
  const plan = techPlan();
  plan.director_handoff.what_should_survive.push("Violet brand lighting");
  const context = runtimeContext();
  context.briefSpec.user_request += " The target brand explicitly requires violet illumination.";
  const result = validateReferenceTransferPlanSemantics(plan, context);
  assert.ok(!codes(result).includes("SOURCE_HUE_TREATED_AS_INVARIANT"), "brief-owned hue should be allowed");
});

// ── Check 2: DOMINANT primary observation with no disposition → FAIL ──────────

test("[HARDENING] DOMINANT primary observation with no disposition → FAIL UNRESOLVED_REFERENCE_OBSERVATION", () => {
  const plan = techPlan();
  // Remove the composition mapping so obs_composition is unresolved.
  plan.design_decision_map = plan.design_decision_map.filter((m) => m.mapping_id !== "map_comp");
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("UNRESOLVED_REFERENCE_OBSERVATION"), `got: ${codes(result).join(", ")}`);
});

// ── Check 2: HIGH observation with explicit DISCARD → PASS ────────────────────

test("[HARDENING] HIGH observation with explicit DISCARD disposition → PASS", () => {
  const plan = techPlan();
  // Replace the lighting ADAPT with a DISCARD.
  plan.design_decision_map.find((m) => m.mapping_id === "map_light").action = "DISCARD";
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.ok(!codes(result).includes("UNRESOLVED_REFERENCE_OBSERVATION"), `should pass; got: ${codes(result).join(", ")}`);
});

// ── Check 2: MEDIUM observation without structural evidence → PASS (no block) ─

test("[HARDENING] MEDIUM observation with no clear structural evidence → PASS (prefer not to block)", () => {
  const plan = techPlan();
  // obs_depth is MEDIUM — it should NOT produce a blocking error in isolation.
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.ok(!codes(result).includes("UNRESOLVED_REFERENCE_OBSERVATION"),
    "MEDIUM observation alone should not block; got: " + codes(result).join(", "));
});

// ── Check 2: MEDIUM observation with two structural evidence signals → FAIL ───

test("[HARDENING] MEDIUM observation with deterministic structural evidence → FAIL UNRESOLVED_REFERENCE_OBSERVATION", () => {
  const plan = techPlan();
  // Provide ≥2 evidence signals for obs_depth:
  // Signal 1 (citedById): reference obs_depth by ID in rationale of an existing resolved mapping.
  plan.design_decision_map[0].rationale += " Depth obs_depth contributes structural layering.";
  // Signal 2 (dnaOverlap): obs_depth desc has "layered" and "machine" (≥6 chars: "layered", "machine")
  // reference_dna.complexity already has "layered" and "machine" → overlap ≥2 words confirmed.
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("UNRESOLVED_REFERENCE_OBSERVATION"), `got: ${codes(result).join(", ")}`);
});

// ── Check 2 / Typography Rule: HIGH typography resolved by REINVENT → PASS ───

test("[HARDENING] HIGH typography observation explicitly REINVENT → PASS (not TYPOGRAPHY_UNRESOLVED)", () => {
  const plan = techPlan();
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.ok(!codes(result).includes("TYPOGRAPHY_UNRESOLVED"), "obs_typography is resolved by map_typo (REINVENT)");
});

// ── Check 2 / Typography Rule: HIGH typography silently disappears → FAIL ────

test("[HARDENING] HIGH typography observation silently ignored → FAIL TYPOGRAPHY_UNRESOLVED", () => {
  const plan = techPlan();
  plan.design_decision_map = plan.design_decision_map.filter((m) => m.mapping_id !== "map_typo");
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("TYPOGRAPHY_UNRESOLVED"), `got: ${codes(result).join(", ")}`);
});

// ── Check 2 / Typography FALSE NEGATIVE: linked but only color transfer → FAIL ───

test("[TYPOGRAPHY FALSE NEGATIVE] HIGH typography observation linked but only chromatic attribute transferred → FAIL", () => {
  const plan = techPlan();
  // obs_typography describes "Acid-green spray-painted graffiti text as high-contrast accent."
  // Change map_typo to transfer only the color/chroma attribute without addressing typographic function.
  plan.design_decision_map.find((m) => m.mapping_id === "map_typo").target_in_new_composition =
    "Use a high-chroma secondary accent color to provide visual tension.";
  plan.design_decision_map.find((m) => m.mapping_id === "map_typo").rationale =
    "The acid-green color provides necessary chromatic contrast against the ambient base.";
  // Use a minimal context without cross-category concerns.
  const minimalContext = {
    briefSpec: { schema_version: "1.0.0", user_request: "Test" },
    referenceAssets: [{
      asset_id: "asset_skincare_reference",
      role: "PRIMARY_REFERENCE",
      product_category: null,
      product_support_observation_ids: [],
      literal_support_elements: [],
      visible_reference_text: [],
      brand_markers: [],
      reference_subject_identities: []
    }],
    targetProductCategory: null,
    projectId: "project_cross_category_perfume",
    protectedSemantics: [],
    identityConstraints: []
  };
  const result = validateReferenceTransferPlanSemantics(plan, minimalContext);
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("TYPOGRAPHY_UNRESOLVED"),
    `Expected TYPOGRAPHY_UNRESOLVED for color-only transfer; got: ${codes(result).join(", ")}`);
});

// ── Check 2 / Typography Resolution: explicit DISCARD → PASS ─────────────────

test("[TYPOGRAPHY] HIGH typography explicitly DISCARDed with copy disposition → PASS", () => {
  const plan = techPlan();
  plan.design_decision_map.find((m) => m.mapping_id === "map_typo").action = "DISCARD";
  plan.design_decision_map.find((m) => m.mapping_id === "map_typo").target_in_new_composition =
    "Discard the source graffiti typography and do not transfer literal copy.";
  const minimalContext = {
    briefSpec: { schema_version: "1.0.0", user_request: "Test" },
    referenceAssets: [{
      asset_id: "asset_skincare_reference",
      role: "PRIMARY_REFERENCE",
      product_category: null,
      product_support_observation_ids: [],
      literal_support_elements: [],
      visible_reference_text: [],
      brand_markers: [],
      reference_subject_identities: []
    }],
    targetProductCategory: null,
    projectId: "project_cross_category_perfume",
    protectedSemantics: [],
    identityConstraints: []
  };
  const result = validateReferenceTransferPlanSemantics(plan, minimalContext);
  assert.ok(!codes(result).includes("TYPOGRAPHY_UNRESOLVED"),
    `DISCARD is valid functional resolution; got: ${codes(result).join(", ")}`);
});

// ── Check 2 / Typography Resolution: compositional mass preserved → PASS ─────

test("[TYPOGRAPHY] HIGH typography REINVENTed with compositional mass addressed → PASS", () => {
  const plan = techPlan();
  plan.design_decision_map.find((m) => m.mapping_id === "map_typo").target_in_new_composition =
    "Discard source wording but preserve the asymmetric graphic mass and counter-accent function with target-native text treatment.";
  plan.design_decision_map.find((m) => m.mapping_id === "map_typo").rationale =
    "The graffiti provides compositional mass and visual tension that must be functionally reinvented without literal style copy.";
  const minimalContext = {
    briefSpec: { schema_version: "1.0.0", user_request: "Test" },
    referenceAssets: [{
      asset_id: "asset_skincare_reference",
      role: "PRIMARY_REFERENCE",
      product_category: null,
      product_support_observation_ids: [],
      literal_support_elements: [],
      visible_reference_text: [],
      brand_markers: [],
      reference_subject_identities: []
    }],
    targetProductCategory: null,
    projectId: "project_cross_category_perfume",
    protectedSemantics: [],
    identityConstraints: []
  };
  const result = validateReferenceTransferPlanSemantics(plan, minimalContext);
  assert.ok(!codes(result).includes("TYPOGRAPHY_UNRESOLVED"),
    `Compositional mass + discard copy is functional resolution; got: ${codes(result).join(", ")}`);
});

// ── Check 2 / Typography Resolution: hierarchy/placement adapted → PASS ──────

test("[TYPOGRAPHY] HIGH typography ADAPTed with hierarchy and placement addressed → PASS", () => {
  const plan = techPlan();
  plan.design_decision_map.find((m) => m.mapping_id === "map_typo").action = "ADAPT";
  plan.design_decision_map.find((m) => m.mapping_id === "map_typo").target_in_new_composition =
    "Maintain text hierarchy and placement in upper-left territory but adapt stylistic treatment to target context.";
  plan.design_decision_map.find((m) => m.mapping_id === "map_typo").rationale =
    "The placement and scale support the compositional balance; style can be adapted without losing function.";
  const minimalContext = {
    briefSpec: { schema_version: "1.0.0", user_request: "Test" },
    referenceAssets: [{
      asset_id: "asset_skincare_reference",
      role: "PRIMARY_REFERENCE",
      product_category: null,
      product_support_observation_ids: [],
      literal_support_elements: [],
      visible_reference_text: [],
      brand_markers: [],
      reference_subject_identities: []
    }],
    targetProductCategory: null,
    projectId: "project_cross_category_perfume",
    protectedSemantics: [],
    identityConstraints: []
  };
  const result = validateReferenceTransferPlanSemantics(plan, minimalContext);
  assert.ok(!codes(result).includes("TYPOGRAPHY_UNRESOLVED"),
    `Hierarchy + placement is functional resolution; got: ${codes(result).join(", ")}`);
});

// ── Check 3: HIGH intensity + all DOMINANT/HIGH resolved → PASS ──────────────

test("[HARDENING] HIGH transfer intensity with all major mechanisms resolved → PASS", () => {
  const plan = techPlan();
  const result = validateReferenceTransferPlanQuality(plan);
  assert.ok(!codes(result).includes("HIGH_INTENSITY_UNDERTRANSFER"), `should pass; got: ${codes(result).join(", ")}`);
});

// ── Check 3: HIGH intensity + major category entirely unresolved → FAIL ───────

test("[HARDENING] HIGH transfer intensity with LIGHTING category entirely unresolved → FAIL HIGH_INTENSITY_UNDERTRANSFER", () => {
  const plan = techPlan();
  plan.design_decision_map = plan.design_decision_map.filter((m) => m.mapping_id !== "map_light");
  const result = validateReferenceTransferPlanQuality(plan);
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("HIGH_INTENSITY_UNDERTRANSFER"), `got: ${codes(result).join(", ")}`);
});

// ── Check 3 / FUNCTIONAL RESOLUTION PROPAGATION: linked but not functional → FAIL ───

test("[PROPAGATION] HIGH TYPOGRAPHY linked but only chromatic transfer → FAIL HIGH_INTENSITY_UNDERTRANSFER", () => {
  const plan = techPlan();
  // Change map_typo to transfer only color, not typographic function.
  plan.design_decision_map.find((m) => m.mapping_id === "map_typo").target_in_new_composition =
    "Use a high-chroma secondary accent color to provide visual tension.";
  plan.design_decision_map.find((m) => m.mapping_id === "map_typo").rationale =
    "The acid-green color provides necessary chromatic contrast against the ambient base.";
  // Semantic will report TYPOGRAPHY_UNRESOLVED.
  // Quality MUST ALSO report HIGH_INTENSITY_UNDERTRANSFER because TYPOGRAPHY category
  // is not functionally resolved (linked but insufficient).
  const minimalContext = {
    briefSpec: { schema_version: "1.0.0", user_request: "Test" },
    referenceAssets: [{
      asset_id: "asset_skincare_reference",
      role: "PRIMARY_REFERENCE",
      product_category: null,
      product_support_observation_ids: [],
      literal_support_elements: [],
      visible_reference_text: [],
      brand_markers: [],
      reference_subject_identities: []
    }],
    targetProductCategory: null,
    projectId: "project_cross_category_perfume",
    protectedSemantics: [],
    identityConstraints: []
  };
  const semantic = validateReferenceTransferPlanSemantics(plan, minimalContext);
  const quality = validateReferenceTransferPlanQuality(plan);
  
  // Semantic must flag TYPOGRAPHY_UNRESOLVED.
  assert.ok(codes(semantic).includes("TYPOGRAPHY_UNRESOLVED"),
    `Expected TYPOGRAPHY_UNRESOLVED in semantic; got: ${codes(semantic).join(", ")}`);
  
  // Quality must flag HIGH_INTENSITY_UNDERTRANSFER because TYPOGRAPHY is not functionally resolved.
  assert.equal(quality.valid, false,
    `Expected quality FAIL; got valid=${quality.valid}, diagnostics: ${codes(quality).join(", ")}`);
  assert.ok(codes(quality).includes("HIGH_INTENSITY_UNDERTRANSFER"),
    `Expected HIGH_INTENSITY_UNDERTRANSFER in quality; got: ${codes(quality).join(", ")}`);
});

// ── Check 3 / FUNCTIONAL RESOLUTION PROPAGATION: functional REINVENT → PASS ───

test("[PROPAGATION] HIGH TYPOGRAPHY with valid functional REINVENT → coverage PASS", () => {
  const plan = techPlan();
  // techPlan() default has valid typography resolution (discard copy + functional rationale).
  // Quality should NOT flag undertransfer.
  const result = validateReferenceTransferPlanQuality(plan);
  assert.ok(!codes(result).includes("HIGH_INTENSITY_UNDERTRANSFER"),
    `Functionally resolved typography should not trigger undertransfer; got: ${codes(result).join(", ")}`);
});

// ── Check 3 / FUNCTIONAL RESOLUTION PROPAGATION: explicit DISCARD → PASS ──────

test("[PROPAGATION] HIGH TYPOGRAPHY explicitly DISCARDed → counts as functionally resolved for coverage", () => {
  const plan = techPlan();
  plan.design_decision_map.find((m) => m.mapping_id === "map_typo").action = "DISCARD";
  plan.design_decision_map.find((m) => m.mapping_id === "map_typo").target_in_new_composition =
    "Discard the source graffiti typography and do not transfer literal copy.";
  const result = validateReferenceTransferPlanQuality(plan);
  assert.ok(!codes(result).includes("HIGH_INTENSITY_UNDERTRANSFER"),
    `DISCARD is valid functional resolution; got: ${codes(result).join(", ")}`);
});

// ── Check 3: MEDIUM intensity → HIGH_INTENSITY_UNDERTRANSFER skipped ──────────

test("[HARDENING] MEDIUM transfer intensity does not trigger HIGH_INTENSITY_UNDERTRANSFER", () => {
  const plan = techPlan();
  plan.transfer_intensity.value = "MEDIUM";
  plan.design_decision_map = [];
  const result = validateReferenceTransferPlanQuality(plan);
  assert.ok(!codes(result).includes("HIGH_INTENSITY_UNDERTRANSFER"), "MEDIUM intensity should not trigger check");
});

// ── Check 5: Decision map abstracts hue; handoff restores it → FAIL ───────────

test("[HARDENING] decision map abstracts source hue; handoff what_should_survive restores it → FAIL", () => {
  const plan = techPlan();
  // map_light target has no "violet", but handoff now mandates it.
  plan.director_handoff.what_should_survive.push("Violet/purple atmospheric lighting");
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.equal(result.valid, false);
  const hasSomeContradiction = codes(result).includes("DIRECTOR_HANDOFF_CONTRADICTION") ||
                               codes(result).includes("SOURCE_HUE_TREATED_AS_INVARIANT");
  assert.ok(hasSomeContradiction, `expected contradiction diagnostic; got: ${codes(result).join(", ")}`);
});

test("[HARDENING] decision map discards source hue; handoff recommended_anchors restores it → FAIL", () => {
  const plan = techPlan();
  plan.design_decision_map.find((m) => m.mapping_id === "map_light").action = "DISCARD";
  plan.director_handoff.recommended_anchors.push("Violet atmosphere is the primary mood anchor");
  const result = validateReferenceTransferPlanSemantics(plan, runtimeContext());
  assert.equal(result.valid, false);
  const hasSomeContradiction = codes(result).includes("DIRECTOR_HANDOFF_CONTRADICTION") ||
                               codes(result).includes("SOURCE_HUE_TREATED_AS_INVARIANT");
  assert.ok(hasSomeContradiction, `expected contradiction diagnostic; got: ${codes(result).join(", ")}`);
});

// ── Check 6: Generic target phrase but rationale preserves specificity → PASS ─

test("[HARDENING] generic target phrase with specific functional rationale → PASS", () => {
  const plan = techPlan();
  plan.design_decision_map.find((m) => m.mapping_id === "map_comp").target_in_new_composition =
    "Establish a target-native technical environment around the subject.";
  plan.design_decision_map.find((m) => m.mapping_id === "map_comp").rationale =
    "The dense mechanical foreground framing creates layered immersive depth — preserve that dense layered framing function with target-native elements.";
  const result = validateReferenceTransferPlanQuality(plan);
  assert.ok(!codes(result).includes("TARGET_NATIVE_ADAPTATION_TOO_GENERIC"),
    "specificity preserved in rationale should not block; got: " + codes(result).join(", "));
});

// ── Check 6: Generic target phrase that discards source specificity → FAIL ────

test("[HARDENING] generic target phrase that discards source functional specificity → FAIL TARGET_NATIVE_ADAPTATION_TOO_GENERIC", () => {
  const plan = techPlan();
  plan.design_decision_map.find((m) => m.mapping_id === "map_comp").target_in_new_composition =
    "Replace mechanical framing with target-native technical environment.";
  plan.design_decision_map.find((m) => m.mapping_id === "map_comp").rationale =
    "The environment should reflect the subject's specific technical domain.";
  const result = validateReferenceTransferPlanQuality(plan);
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("TARGET_NATIVE_ADAPTATION_TOO_GENERIC"), `got: ${codes(result).join(", ")}`);
});

// ── Historical regression: plan_tech_thumbnail_001.json must now FAIL ─────────

test("[REGRESSION] plan_tech_thumbnail_001.json NOW PASSES after semantic repair", async () => {
  const { loadJson } = await import("./test-helpers.mjs");
  const plan = loadJson(
    "data/reference-translator/user-live-tests/subject-reference-20260816_11_kie_gemini_2_5_flash_single_persisted_candidate/plans/plan_tech_thumbnail_001.json"
  );

  // Minimal context matching the plan's declared project/brief.
  const histBrief = {
    schema_version: "1.0.0",
    user_request: "Create a personal brand technology thumbnail for a creator.",
    commercial_objective: "Drive clicks for technology content creator.",
    communication_goal: "Authority and technical expertise.",
    target_context: "YouTube thumbnail, technology creator"
  };
  const histAsset = {
    asset_id: "primary_tech_reference",
    role: "PRIMARY_REFERENCE",
    visual_access: "STRUCTURED_TEST",
    visually_accessible: true,
    mime_type: "image/jpeg",
    product_category: null,
    product_support_observation_ids: [],
    literal_support_elements: [],
    visible_reference_text: [],
    brand_markers: [],
    reference_subject_identities: []
  };
  const histContext = {
    briefSpec: histBrief,
    referenceAssets: [histAsset],
    targetProductCategory: null,
    projectId: plan.project_id,
    protectedSemantics: [],
    identityConstraints: []
  };

  const semantic = validateReferenceTransferPlanSemantics(plan, histContext);
  const quality = validateReferenceTransferPlanQuality(plan);

  const semanticCodes = semantic.diagnostics.map((d) => d.code);
  const qualityCodes = quality.diagnostics.map((d) => d.code);

  // After repair, these issues should NO LONGER appear
  const hasSourceHueIssue = semanticCodes.includes("SOURCE_HUE_TREATED_AS_INVARIANT");
  const hasHandoffContradiction = semanticCodes.includes("DIRECTOR_HANDOFF_CONTRADICTION");
  const hasTypographyUnresolved = semanticCodes.includes("TYPOGRAPHY_UNRESOLVED");
  const hasUndertransfer = qualityCodes.includes("HIGH_INTENSITY_UNDERTRANSFER");

  assert.ok(
    semantic.valid && quality.valid,
    `Historical plan should now PASS after repair.\nSemantic valid: ${semantic.valid}, codes: [${semanticCodes.join(", ")}]\nQuality valid: ${quality.valid}, codes: [${qualityCodes.join(", ")}]`
  );
  
  // Verify specific repairs
  assert.ok(!hasSourceHueIssue, "SOURCE_HUE_TREATED_AS_INVARIANT should be fixed");
  assert.ok(!hasHandoffContradiction, "DIRECTOR_HANDOFF_CONTRADICTION should be fixed");
  assert.ok(!hasTypographyUnresolved, "TYPOGRAPHY_UNRESOLVED should be fixed");
  assert.ok(!hasUndertransfer, "HIGH_INTENSITY_UNDERTRANSFER should be fixed");
});

// ═══ DIAGNOSTIC HARNESS ═══════════════════════════════════════════════════════
// Independent evaluation of all validator stages for offline diagnostic analysis.
// Production runtime may stop after semantic failure; this harness evaluates all.

test("[DIAGNOSTIC HARNESS] plan_tech_thumbnail_001.json — independent stage evaluation", async () => {
  const { loadJson } = await import("./test-helpers.mjs");
  const plan = loadJson(
    "data/reference-translator/user-live-tests/subject-reference-20260816_11_kie_gemini_2_5_flash_single_persisted_candidate/plans/plan_tech_thumbnail_001.json"
  );

  const histBrief = {
    schema_version: "1.0.0",
    user_request: "Create a personal brand technology thumbnail for a creator.",
    commercial_objective: "Drive clicks for technology content creator.",
    communication_goal: "Authority and technical expertise.",
    target_context: "YouTube thumbnail, technology creator"
  };
  const histAsset = {
    asset_id: "primary_tech_reference",
    role: "PRIMARY_REFERENCE",
    visual_access: "STRUCTURED_TEST",
    visually_accessible: true,
    mime_type: "image/jpeg",
    product_category: null,
    product_support_observation_ids: [],
    literal_support_elements: [],
    visible_reference_text: [],
    brand_markers: [],
    reference_subject_identities: []
  };
  const histContext = {
    briefSpec: histBrief,
    referenceAssets: [histAsset],
    targetProductCategory: null,
    projectId: plan.project_id,
    protectedSemantics: [],
    identityConstraints: []
  };

  // Evaluate all three stages independently.
  const schema = validateReferenceTransferPlanSchema(plan);
  const semantic = validateReferenceTransferPlanSemantics(plan, histContext);
  const quality = validateReferenceTransferPlanQuality(plan);

  // Log results to test output for diagnostic review.
  console.log("\n═══ HISTORICAL PLAN DIAGNOSTIC EVALUATION ═══");
  console.log("\n[SCHEMA]");
  console.log(`  Valid: ${schema.valid}`);
  if (schema.diagnostics.length > 0) {
    console.log(`  Diagnostics (${schema.diagnostics.length}):`);
    for (const d of schema.diagnostics) {
      console.log(`    • ${d.code} at ${d.path || "/"}: ${d.message}`);
    }
  } else {
    console.log("  Diagnostics: none");
  }

  console.log("\n[SEMANTIC]");
  console.log(`  Valid: ${semantic.valid}`);
  if (semantic.diagnostics.length > 0) {
    console.log(`  Diagnostics (${semantic.diagnostics.length}):`);
    for (const d of semantic.diagnostics) {
      console.log(`    • ${d.code} at ${d.path || "/"}`);
      console.log(`      ${d.message}`);
      if (d.details) console.log(`      Details:`, JSON.stringify(d.details, null, 2).split('\n').map(l => `      ${l}`).join('\n'));
    }
  } else {
    console.log("  Diagnostics: none");
  }

  console.log("\n[QUALITY]");
  console.log(`  Valid: ${quality.valid}`);
  if (quality.diagnostics.length > 0) {
    console.log(`  Diagnostics (${quality.diagnostics.length}):`);
    for (const d of quality.diagnostics) {
      console.log(`    • ${d.code} at ${d.path || "/"}`);
      console.log(`      ${d.message}`);
      if (d.details) console.log(`      Details:`, JSON.stringify(d.details, null, 2).split('\n').map(l => `      ${l}`).join('\n'));
    }
  } else {
    console.log("  Diagnostics: none");
  }

  console.log("\n═══════════════════════════════════════════════\n");

  // This test always passes; it's for diagnostic output only.
  assert.ok(true, "Diagnostic harness completed");
});

