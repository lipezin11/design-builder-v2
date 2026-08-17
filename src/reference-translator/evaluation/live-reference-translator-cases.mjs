import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateArtifact } from "../../compiler/schema-validator.mjs";
import { queryMyEyesAdvisory } from "../../my-eyes/query/my-eyes-query-engine.mjs";
import { queryVkbAdvisory } from "../../vkb/query/vkb-query-engine.mjs";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const briefTemplatePath = path.join(workspaceRoot, "tests/fixtures/brief_spec/cross_category_perfume.json");
const clone = (value) => structuredClone(value);

export const REFERENCE_TRANSLATOR_LIVE_CASE_SPECS = Object.freeze([
  {
    case_id: "LIVE_RT_01_SAME_DOMAIN_AUTHORITY",
    family: "STRONG_SAME_DOMAIN_REFERENCE",
    smoke: true,
    image_id: "MYE_IMG_000014",
    reference_path: "data/my_eyes/approved/14.jpeg",
    reference_asset_id: "live_ref_authority_speaker",
    target_type: "executive strategy keynote banner",
    project_type: "BANNER",
    format: { aspect_ratio: "16:9", orientation: "LANDSCAPE", width: 1920, height: 1080, platform: "LinkedIn", usage: "Keynote announcement", text_overlay_expected: true },
    user_request: "Create a keynote announcement banner for an executive strategy advisor. Use the reference for art-direction intelligence while keeping the target professional context, message, and identity distinct.",
    objective: "Communicate composed executive authority and strategic clarity.",
    emotional: { primary: "authority", secondary: ["clarity", "confidence"], avoid: ["spectacle", "aggression"] },
    test_purpose: "Test same-domain mechanism transfer, subject treatment, depth, hierarchy, and source-identity protection.",
    transfer_intent: "Interpret the reference's authority-building subject treatment, hierarchy, depth, and environmental relationship.",
    do_not_transfer: ["reference person identity", "source event brand", "source copy", "source clothing"],
    creative_context: { planned_complexity: "MEDIUM", planned_depth_behavior: "auditorium depth with integrated subject", planned_color_behavior: "controlled contrast", planned_objects: ["speaker environment"] },
    vkb: { project_goals: ["executive authority and clarity"], hierarchy_needs: ["subject and keynote message hierarchy"], depth_needs: ["environmental depth"], integration_problem: "subject must belong to the event environment" }
  },
  {
    case_id: "LIVE_RT_02_PERSONAL_BRAND_CONTEXT_SHIFT",
    family: "PERSONAL_BRAND_HUMAN_SUBJECT",
    image_id: "MYE_IMG_000005",
    reference_path: "data/my_eyes/approved/5.png",
    reference_asset_id: "live_ref_editorial_founder",
    target_type: "climate-tech founder editorial portrait",
    project_type: "EDITORIAL_VISUAL",
    format: { aspect_ratio: "4:5", orientation: "PORTRAIT", width: 1080, height: 1350, platform: "Editorial", usage: "Founder profile", text_overlay_expected: false },
    user_request: "Create an editorial portrait direction for a climate-tech founder. Translate the reference's visual intelligence into a distinct professional world without borrowing the source person, wardrobe, brand, or symbols.",
    objective: "Present credible innovation with human warmth.",
    emotional: { primary: "credibility", secondary: ["warmth", "optimism"], avoid: ["mysticism", "celebrity glamour"] },
    test_purpose: "Test personal-brand translation across professional contexts without identity, wardrobe, symbol, or source-brand copying.",
    transfer_intent: "Interpret subject mass, layered depth, lighting relationship, and editorial authority.",
    do_not_transfer: ["reference person identity", "source wardrobe", "source symbols", "source brand", "source copy"],
    creative_context: { planned_complexity: "MEDIUM", planned_depth_behavior: "layered editorial depth", planned_color_behavior: "warm controlled color", planned_objects: ["domain-specific environmental cues"] },
    vkb: { project_goals: ["credible founder portrait"], desired_emotions: ["warm authority"], depth_needs: ["layered editorial depth"], integration_problem: "subject and climate-tech context must feel unified" }
  },
  {
    case_id: "LIVE_RT_03_HIGH_COMPLEXITY_CONVERGENCE",
    family: "HIGH_COMPLEXITY_REFERENCE",
    image_id: "MYE_IMG_000019",
    reference_path: "data/my_eyes/rejected/3.png",
    reference_asset_id: "live_ref_dense_surreal",
    target_type: "science museum exhibition poster",
    project_type: "SOCIAL_POST",
    format: { aspect_ratio: "4:5", orientation: "PORTRAIT", width: 1080, height: 1350, platform: "Instagram", usage: "Exhibition launch", text_overlay_expected: true },
    user_request: "Create a launch poster for a science museum exhibition about time, matter, and human curiosity. Preserve meaningful complexity where it supports one clear exhibition thesis.",
    objective: "Make a dense intellectual theme feel coherent and inviting.",
    emotional: { primary: "wonder", secondary: ["curiosity", "intelligence"], avoid: ["chaos", "childishness"] },
    test_purpose: "Test whether dense reference logic is understood as convergence, clusters, hierarchy, depth, and narrative rather than reduced by element count.",
    transfer_intent: "Interpret convergence, density gradients, object clusters, visual hierarchy, and narrative purpose.",
    do_not_transfer: ["reference person identity", "source title", "source brand", "source cup", "source object inventory"],
    creative_context: { planned_complexity: "HIGH", planned_depth_behavior: "multiple coherent planes", planned_objects: ["scientific artifacts", "time and matter exhibits"], signals: { high_complexity: { present: true } } },
    vkb: { project_goals: ["coherent intellectual wonder"], hierarchy_needs: ["one focal thesis across dense artifacts"], depth_needs: ["multiple depth planes"], reference_transfer_goals: ["preserve convergence without copying objects"] }
  },
  {
    case_id: "LIVE_RT_04_MINIMAL_RESTRAINT",
    family: "MINIMAL_RESTRAINED_REFERENCE",
    image_id: "MYE_IMG_000008",
    reference_path: "data/my_eyes/approved/8.png",
    reference_asset_id: "live_ref_minimal_hero",
    target_type: "boutique financial advisory landing-page hero",
    project_type: "WEBSITE_HERO",
    format: { aspect_ratio: "16:9", orientation: "LANDSCAPE", width: 1920, height: 1080, platform: "Web", usage: "Landing-page hero", text_overlay_expected: true },
    user_request: "Create a restrained landing-page hero for a boutique financial advisory. Reserve clear copy territory while retaining enough visual evidence of trust, specificity, and service context.",
    objective: "Communicate calm confidence and personal trust.",
    emotional: { primary: "trust", secondary: ["calm", "precision"], avoid: ["flashiness", "emptiness"] },
    test_purpose: "Test restraint versus lack of information, negative-space confidence, focal hierarchy, and necessary target communication.",
    transfer_intent: "Interpret negative-space confidence, single-focal hierarchy, controlled lighting, and subject-to-copy balance.",
    do_not_transfer: ["reference person identity", "source palette", "source brand", "source copy"],
    creative_context: { planned_complexity: "LOW", planned_depth_behavior: "restrained depth", planned_color_behavior: "controlled low-saturation contrast" },
    vkb: { project_goals: ["calm financial trust"], hierarchy_needs: ["clear subject-to-copy balance"], composition_problem: "reserve useful copy territory without visual emptiness" }
  },
  {
    case_id: "LIVE_RT_05_GENERIC_DEVICE_SELECTIVITY",
    family: "GENERIC_VISUAL_DEVICE_REFERENCE",
    image_id: "MYE_IMG_000020",
    reference_path: "data/my_eyes/rejected/4.png",
    reference_asset_id: "live_ref_neon_devices",
    target_type: "pediatric telehealth campaign",
    project_type: "AD_CREATIVE",
    format: { aspect_ratio: "4:5", orientation: "PORTRAIT", width: 1080, height: 1350, platform: "Instagram", usage: "Telehealth campaign", text_overlay_expected: true },
    user_request: "Create a pediatric telehealth campaign visual that feels reassuring, specific, and clinically credible. Use the reference only as an art-direction problem to interpret.",
    objective: "Make remote pediatric care feel accessible and trustworthy.",
    emotional: { primary: "reassurance", secondary: ["care", "clarity"], avoid: ["cyberpunk", "alarm"] },
    test_purpose: "Test selective transfer and concrete diagnosis of neon glow, floating icons, fragments, panels, and filler without vague AI-look language.",
    transfer_intent: "Evaluate hierarchy, subject emphasis, information support, and the actual function of each polished visual device.",
    do_not_transfer: ["reference person identity", "source neon palette", "source service icons", "source copy", "source brand"],
    creative_context: { planned_complexity: "MEDIUM", planned_color_behavior: "controlled reassuring contrast", planned_effects: ["small interface accents"], signals: { generic_assembly: { present: true, concrete_signals: ["unmotivated glow", "visually interchangeable elements", "decorative cinematic filler"] }, microeffects: { present: true, functional_purpose: false }, strong_color_impact: { present: true } } },
    vkb: { project_goals: ["specific reassuring telehealth communication"], hierarchy_needs: ["caregiver and service clarity"], integration_problem: "supporting information cannot become generic floating decoration" }
  },
  {
    case_id: "LIVE_RT_06_CARD_INFORMATION_ARTIFACT",
    family: "CARD_INFORMATION_ARTIFACT_REFERENCE",
    image_id: "MYE_IMG_000018",
    reference_path: "data/my_eyes/rejected/2.png",
    reference_asset_id: "live_ref_card_carousel",
    target_type: "online language curriculum hero",
    project_type: "WEBSITE_HERO",
    format: { aspect_ratio: "16:9", orientation: "LANDSCAPE", width: 1920, height: 1080, platform: "Web", usage: "Curriculum hero", text_overlay_expected: true },
    user_request: "Create a website hero for an online language curriculum where lesson artifacts may support the learner story only when their content and grouping are specific.",
    objective: "Show a coherent path from lessons to confident communication.",
    emotional: { primary: "progress", secondary: ["confidence", "energy"], avoid: ["dashboard overload", "generic technology"] },
    test_purpose: "Test card content specificity, grouping, hierarchy, narrative function, spatial integration, and interchangeability.",
    transfer_intent: "Evaluate the function and integration of the reference's card system, subject gesture, depth, and hierarchy.",
    do_not_transfer: ["reference person identity", "source product cards", "source green energy treatment", "source brand", "source copy"],
    creative_context: { planned_complexity: "MEDIUM", planned_depth_behavior: "integrated lesson artifacts", planned_objects: ["project-specific lesson cards"], signals: { cards: { present: true, content_specific: true, coherent_grouping: true, narrative_role: true }, floating_elements: { present: true } } },
    vkb: { project_goals: ["show curriculum progression"], hierarchy_needs: ["learner first, lesson artifacts second"], integration_problem: "information cards must carry narrative meaning", planned_mechanisms: ["Narrative Information Panels"] }
  },
  {
    case_id: "LIVE_RT_07_SURFACE_COPY_TRAP",
    family: "SURFACE_COPY_TRAP",
    image_id: "MYE_IMG_000002",
    reference_path: "data/my_eyes/approved/2.png",
    reference_asset_id: "live_ref_flooded_booth",
    target_type: "workplace mental-health support campaign",
    project_type: "SOCIAL_POST",
    format: { aspect_ratio: "4:5", orientation: "PORTRAIT", width: 1080, height: 1350, platform: "LinkedIn", usage: "Employee support campaign", text_overlay_expected: true },
    user_request: "Create a workplace mental-health support campaign about reaching help before pressure becomes isolating. The target must remain respectful, credible, and appropriate for an employer program.",
    objective: "Turn urgency into a clear invitation to seek confidential support.",
    emotional: { primary: "empathy", secondary: ["urgency", "hope"], avoid: ["horror", "spectacle"] },
    test_purpose: "Test whether memorable literal objects and palette are left behind while isolation, pressure, refuge, contrast, and narrative tension are interpreted.",
    transfer_intent: "Interpret the deeper narrative, focal contrast, containment, environmental pressure, and route-to-help logic.",
    do_not_transfer: ["reference person identity", "source phone booth", "source floodwater", "source animals", "source copy", "source brand"],
    creative_context: { planned_complexity: "MEDIUM", planned_depth_behavior: "clear pressure-to-relief narrative", planned_color_behavior: "emotionally responsible contrast", planned_objects: ["workplace support context"] },
    vkb: { project_goals: ["empathetic invitation to seek help"], desired_emotions: ["empathy", "hope"], composition_problem: "show pressure and a credible route to relief", lighting_problem: "contrast must support safety rather than spectacle" }
  },
  {
    case_id: "LIVE_RT_08_FORMAT_AND_LIGHT_TRANSLATION",
    family: "FORMAT_MISMATCH_AND_MATERIAL_LIGHTING",
    image_id: "MYE_IMG_000007",
    reference_path: "data/my_eyes/approved/7.png",
    reference_asset_id: "live_ref_lantern_passage",
    target_type: "vertical historical-fiction book launch poster",
    project_type: "EDITORIAL_VISUAL",
    format: { aspect_ratio: "4:5", orientation: "PORTRAIT", width: 1080, height: 1350, platform: "Instagram", usage: "Book launch poster", text_overlay_expected: true },
    user_request: "Create a vertical launch poster for a historical-fiction novel about an archivist uncovering a suppressed civic record. Preserve narrative clarity and room for title and author.",
    objective: "Express discovery, consequence, and historical depth.",
    emotional: { primary: "discovery", secondary: ["mystery", "gravity"], avoid: ["adventure-game imitation", "fantasy spectacle"] },
    test_purpose: "Test format mismatch through mass, territories, hierarchy, density gradient, flow, motivated light, and material atmosphere rather than coordinate or prop copying.",
    transfer_intent: "Interpret motivated illumination, receding depth, material atmosphere, discovery narrative, and copy territory across a new aspect ratio.",
    do_not_transfer: ["reference person identity", "source lantern", "source map", "source ruins", "source clothing", "source palette"],
    creative_context: { planned_complexity: "MEDIUM", planned_depth_behavior: "receding archival depth", planned_color_behavior: "motivated restrained illumination", planned_objects: ["historical record evidence"] },
    vkb: { project_goals: ["historical discovery and consequence"], hierarchy_needs: ["title, archivist, and evidence"], depth_needs: ["receding archival depth"], lighting_problem: "one motivated discovery light must organize the scene", reference_transfer_goals: ["translate landscape mass into portrait territories"] }
  }
]);

function buildBrief(spec) {
  const brief = JSON.parse(fs.readFileSync(briefTemplatePath, "utf8"));
  brief.project_type = spec.project_type;
  brief.user_request = spec.user_request;
  brief.commercial_objective = spec.objective;
  brief.communication_goal = spec.objective;
  brief.target_context = spec.target_type;
  brief.format = clone(spec.format);
  brief.assets = [
    {
      asset_id: "target_" + spec.case_id.toLowerCase(),
      asset_type: "OTHER",
      role: "OTHER",
      origin: "SYSTEM_ASSET",
      authority: "SUBJECT_IDENTITY",
      required: true,
      description: spec.target_type,
      user_instruction: "Preserve the target's professional context, communication goal, and semantic identity.",
      preservation_level: "STRICT"
    },
    {
      asset_id: spec.reference_asset_id,
      asset_type: "IMAGE",
      role: "PRIMARY_REFERENCE",
      origin: "USER_UPLOAD",
      authority: "PRIMARY_REFERENCE",
      required: true,
      description: "Real visual reference supplied for live multimodal interpretation.",
      user_instruction: spec.transfer_intent,
      preservation_level: "HIGH"
    }
  ];
  brief.subject = {
    present: true,
    identity_asset_id: null,
    identity_preservation: "NONE",
    pose_preservation: "NONE",
    expression_preservation: "NONE",
    wardrobe_preservation: "NONE",
    body_orientation_preservation: "NONE",
    age_preservation: "NONE",
    recognizability_required: false,
    user_subject_instructions: "Do not reuse the reference person's identity."
  };
  brief.references = [{
    reference_asset_id: spec.reference_asset_id,
    role: "PRIMARY_REFERENCE",
    scope: "GLOBAL_VISUAL_DIRECTION",
    authority: "PRIMARY_REFERENCE",
    transfer_intent: spec.transfer_intent,
    transfer_intensity: "HIGH",
    user_instruction: "Transfer design intelligence, not source manifestations.",
    protected_from_reference: ["target professional context", "target communication goal"],
    do_not_transfer: clone(spec.do_not_transfer)
  }];
  brief.hard_constraints = [{
    constraint_id: "hc_target_semantics_" + spec.case_id.toLowerCase(),
    description: "Preserve the target professional context and communication goal; do not copy source identity, brand, or copy.",
    provenance: "USER_EXPLICIT",
    confidence: "HIGH"
  }];
  brief.soft_preferences = [{
    preference_id: "sp_target_tone_" + spec.case_id.toLowerCase(),
    description: spec.emotional.primary + " with " + spec.emotional.secondary.join(", "),
    provenance: "USER_EXPLICIT",
    confidence: "HIGH"
  }];
  brief.emotional_intent = clone(spec.emotional);
  brief.creative_freedom = {
    overall: "HIGH",
    composition: "HIGH",
    environment: "HIGH",
    subject_pose: "HIGH",
    wardrobe: "HIGH",
    typography: "HIGH",
    color: "HIGH",
    narrative_objects: "VERY_HIGH"
  };
  brief.preservation_requirements = [
    { element: "target professional context", provenance: "USER_EXPLICIT" },
    { element: "target communication goal", provenance: "USER_EXPLICIT" }
  ];
  brief.allowed_transformations = [
    { transformation: "composition, environment, lighting, color relationships, material language, and target-native narrative devices", provenance: "USER_EXPLICIT" }
  ];
  brief.forbidden_transformations = [
    { transformation: "copy reference identity, brand, copy, clothing, or category-specific objects", provenance: "USER_EXPLICIT" }
  ];
  brief.provenance = { interpreter_version: "1.0.0", created_at: "2026-08-15T12:00:00Z", notes: "Synthetic target brief for a live real-image Reference Translator evaluation." };
  const validation = validateArtifact("brief_spec", brief);
  if (!validation.valid) throw new Error(spec.case_id + " generated an invalid Brief Spec: " + JSON.stringify(validation.errors));
  return brief;
}

function mimeTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  throw new Error("Unsupported live image extension: " + extension);
}

function buildAdvisories(spec) {
  const projectContext = { project_type: spec.project_type, format: spec.format.aspect_ratio, industry_or_domain: spec.target_type, intended_use: spec.format.usage };
  const myEyes = queryMyEyesAdvisory({
    query_id: "MYE_LIVE_" + spec.case_id,
    project_context: projectContext,
    creative_context: clone(spec.creative_context),
    advisory_budget: { max_items: 5 }
  });
  const vkb = queryVkbAdvisory({
    query_id: "VKB_LIVE_" + spec.case_id,
    project_context: projectContext,
    ...clone(spec.vkb),
    advisory_budget: { max_items: 5 }
  });
  return { myEyes, vkb };
}

export function buildReferenceTranslatorLiveCases({ includeImageBytes = true } = {}) {
  return REFERENCE_TRANSLATOR_LIVE_CASE_SPECS.map((spec) => {
    const absoluteImagePath = path.join(workspaceRoot, spec.reference_path);
    if (!fs.existsSync(absoluteImagePath)) throw new Error("Missing live reference image: " + absoluteImagePath);
    const { myEyes, vkb } = buildAdvisories(spec);
    const referenceAsset = {
      asset_id: spec.reference_asset_id,
      role: "PRIMARY_REFERENCE",
      visual_access: "MULTIMODAL",
      visually_accessible: true,
      mime_type: mimeTypeFor(absoluteImagePath),
      visible_reference_text: [],
      brand_markers: [],
      reference_subject_identities: [],
      notes: { evaluation_case_id: spec.case_id, untrusted_label: "Real image; analyze pixels directly." }
    };
    if (includeImageBytes) referenceAsset.bytes_base64 = fs.readFileSync(absoluteImagePath).toString("base64");
    return {
      case_id: spec.case_id,
      family: spec.family,
      smoke: spec.smoke === true,
      image_id: spec.image_id,
      reference_path: spec.reference_path,
      absolute_reference_path: absoluteImagePath,
      target_type: spec.target_type,
      test_purpose: spec.test_purpose,
      request: {
        context: {
          context_id: "ctx_" + spec.case_id.toLowerCase(),
          brief_ref: { artifact_id: "brief_" + spec.case_id.toLowerCase(), schema_version: "1.0.0" },
          reference_context: { evaluation_case_id: spec.case_id, target_type: spec.target_type, test_purpose: spec.test_purpose },
          my_eyes_advisory: myEyes,
          vkb_advisory: vkb,
          protected_semantics: ["target professional context", "target communication goal"],
          identity_constraints: ["reference person identity must not become target identity"],
          transfer_scope: ["composition", "hierarchy", "depth", "lighting", "material", "typography", "narrative_function", "format_translation"]
        },
        brief_spec: buildBrief(spec),
        reference_assets: [referenceAsset],
        run_options: {
          run_id: "run_" + spec.case_id.toLowerCase(),
          project_id: "project_" + spec.case_id.toLowerCase(),
          max_attempts: 3
        }
      }
    };
  });
}

export function referenceTranslatorLiveManifest() {
  return {
    manifest_version: "1.0.0",
    suite_id: "REFERENCE_TRANSLATOR_LIVE_MULTIMODAL_COGNITIVE_EVALUATION_V1",
    artifact_classification: "EVALUATION_ARTIFACTS_NOT_PRODUCTION",
    input_mode: "MULTIMODAL",
    cases: REFERENCE_TRANSLATOR_LIVE_CASE_SPECS.map((spec) => ({
      case_id: spec.case_id,
      family: spec.family,
      smoke: spec.smoke === true,
      image_id: spec.image_id,
      reference_path: spec.reference_path,
      target_type: spec.target_type,
      test_purpose: spec.test_purpose
    })),
    unavailable_required_case: {
      family: "CROSS_CATEGORY_PRODUCT_REFERENCE",
      status: "REAL_ASSET_UNAVAILABLE",
      exact_missing_image_type: "A real product campaign reference containing a category-native support prop, preferably skincare with a handbag or comparable tactile fashion prop.",
      suggested_filename: "cross-category-skincare-support-prop-reference.jpg",
      target_folder: "data/reference-translator/live-evals/source-assets/",
      verifies: "Literal object versus visual function, material language, emotional effect, compositional role, and target-native product adaptation."
    },
    synthetic_image_observations_used: false,
    my_eyes_memory_mutated: false,
    vkb_mutated: false
  };
}
