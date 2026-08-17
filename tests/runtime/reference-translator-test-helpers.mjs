import { loadJson } from "./test-helpers.mjs";

export const fixedClock = () => new Date("2026-08-15T12:00:00.000Z");
export const crossBrief = () => structuredClone(loadJson("tests/fixtures/brief_spec/cross_category_perfume.json"));
export const crossPlan = () => structuredClone(loadJson("tests/fixtures/reference_transfer_plan/cross_category_product_adaptation.json"));
export const crossContext = () => ({
  context_id: "ctx-cross-category-perfume",
  brief_ref: { artifact_id: "brief-cross-category-perfume", schema_version: "1.0.0" },
  reference_context: { target_product_category: "fragrance", user_notes: "Translate support-prop function rather than literal category object." },
  protected_semantics: ["perfume bottle identity", "perfume label"],
  identity_constraints: ["perfume bottle identity"],
  transfer_scope: ["material", "narrative_object", "mood", "color_relationship"]
});
export const crossAsset = () => ({
  asset_id: "asset_skincare_reference",
  role: "PRIMARY_REFERENCE",
  visual_access: "STRUCTURED_TEST",
  visually_accessible: true,
  mime_type: "image/png",
  product_category: "skincare",
  product_support_observation_ids: ["obs_handbag_support"],
  literal_support_elements: [{ observation_id: "obs_handbag_support", object: "handbag" }],
  visible_reference_text: ["DERMA SOURCE"],
  brand_markers: ["DERMA LABS"],
  reference_subject_identities: [],
  synthetic_observations: [
    {
      observation_id: "obs_handbag_support",
      category: "NARRATIVE_OBJECT",
      description: "A soft neutral handbag is placed beside the skincare product.",
      region: "midground beside product",
      salience: "HIGH",
      confidence: "HIGH"
    },
    {
      observation_id: "obs_soft_material",
      category: "MATERIAL",
      description: "Supple matte texture creates warm tonal continuity.",
      region: "product support area",
      salience: "HIGH",
      confidence: "HIGH"
    }
  ]
});
export const runtimeRequest = (options = {}) => ({
  context: crossContext(),
  brief_spec: crossBrief(),
  reference_assets: [crossAsset()],
  model_adapter: options.adapter,
  run_options: {
    run_id: options.run_id ?? "run-cross-category-perfume",
    project_id: "project_cross_category_perfume",
    target_product_category: "fragrance",
    max_attempts: options.max_attempts ?? 3,
    clock: fixedClock
  },
  ...(options.store ? { store: options.store } : {})
});
