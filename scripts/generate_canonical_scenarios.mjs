import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "../src/compiler/compiler-core.mjs";
import { alignCompilerInput } from "../tests/runtime/test-helpers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const clone = structuredClone;
const outRoot = path.join(root, "tests/fixtures/scenarios");
const write = (dir, name, value) => fs.writeFileSync(path.join(dir, name), JSON.stringify(value, null, 2) + "\n", "utf8");
const asset = (asset_id, type, role, authority, description) => ({ asset_id, type, role, authority, origin: "HYPOTHETICAL_TEST_FIXTURE", mock_uri: `mock://assets/${asset_id}`, checksum: `sha256:fixture-${asset_id}`, metadata: { description, binary_required: false } });
const descriptor = (schema_name, artifact_id) => ({ path: `${schema_name}.json`, artifact_id, schema_name, expected_version: "1.0.0" });

function baseManifest({ id, project, description, mode, artifacts, assets, fields, requiredAssets, textLocks = [], negativeSpaces = [], tags }) {
  return {
    type: "CANONICAL_INTEGRATION_SCENARIO",
    scenario_id: id,
    scenario_version: "1.0.0",
    project_id: project,
    description,
    expected_pipeline_mode: mode,
    artifacts,
    assets,
    expected_status: "PASS",
    expected_compatibility: "FULLY_COMPATIBLE",
    expected_loss_validation: "PASS",
    expected_generation_mode: "GENERATE",
    expected_compiled_status: "REQUEST_READY",
    expected_required_protected_fields: fields,
    expected_required_assets: requiredAssets,
    expected_required_text_locks: textLocks,
    expected_negative_space_regions: negativeSpaces,
    tags
  };
}

function materialize({ name, brief, plan, creative, frame, rawInput, inputId, runId, manifest }) {
  const dir = path.join(outRoot, name);
  fs.mkdirSync(dir, { recursive: true });
  const input = alignCompilerInput(rawInput, frame);
  input.compiler_input_id = inputId;
  input.run_id = runId;
  input.project_id = frame.project_id;
  input.provenance.created_at = "2026-08-10T12:00:00-03:00";
  const result = compile({ compilerInput: input, finalFrameSpec: frame, clock: () => new Date("2026-08-10T15:00:00.000Z") });
  if (result.status !== "PASS") throw new Error(`${name} compilation failed: ${JSON.stringify(result, null, 2)}`);
  write(dir, "brief_spec.json", brief);
  if (plan) write(dir, "reference_transfer_plan.json", plan);
  write(dir, "creative_direction_spec.json", creative);
  write(dir, "final_frame_spec.json", frame);
  write(dir, "compiler_input.json", input);
  write(dir, "compiled_generation_request.json", result.compiledRequest);
  write(dir, "scenario_manifest.json", manifest);
}

const noRefBrief = clone(read("tests/fixtures/brief_spec/no_reference_thumbnail.json"));
noRefBrief.user_request = "Crie uma thumbnail 16:9 de ÃƒÂºltima chance com a headline exata ENCERRAMENTO DO CARRINHO, autoridade humana e urgÃƒÂªncia sem clichÃƒÂª promocional barato.";
noRefBrief.assets = [{
  asset_id: "asset-presenter-001", asset_type: "IMAGE", role: "SUBJECT_IDENTITY", origin: "USER_UPLOAD", authority: "SUBJECT_IDENTITY", required: true,
  description: "Identidade fictÃƒÂ­cia do apresentador para o cenÃƒÂ¡rio canÃƒÂ´nico.", user_instruction: "Preservar identidade e autoridade.", preservation_level: "STRICT"
}];
noRefBrief.pipeline_hints.requires_subject_identity_preservation = true;
noRefBrief.emotional_intent = { primary: "urgency", secondary: ["last chance", "speed", "authority"], avoid: ["cheap promotion", "panic"] };
const noRefCreative = clone(read("tests/fixtures/creative_direction_spec/no_reference_urgency.json"));
const noRefFrame = clone(read("tests/fixtures/final_frame_spec/no_reference_urgency_thumbnail.json"));
const noRefInput = clone(read("tests/fixtures/compiler_input/no_reference_thumbnail.json"));
const noRefManifest = baseManifest({
  id: "no_reference_urgency", project: noRefFrame.project_id,
  description: "Thumbnail 16:9 de urgÃƒÂªncia com identidade humana, headline exata e nenhuma referÃƒÂªncia visual.",
  mode: "GENERATE_WITHOUT_REFERENCE",
  artifacts: {
    brief_spec: descriptor("brief_spec", "brief-cart-close-001"),
    creative_direction_spec: descriptor("creative_direction_spec", noRefCreative.direction_id),
    final_frame_spec: descriptor("final_frame_spec", noRefFrame.frame_spec_id),
    compiler_input: descriptor("compiler_input", "ci-canonical-no-reference-urgency"),
    compiled_generation_request: descriptor("compiled_generation_request", "cgr-ci-canonical-no-reference-urgency")
  },
  assets: [asset("asset-presenter-001", "IMAGE", "SUBJECT_IDENTITY", "SUBJECT_IDENTITY_AUTHORITY", "Identidade humana fictÃƒÂ­cia.")],
  fields: noRefFrame.protected_fields.map((x) => x.field_id),
  requiredAssets: ["asset-presenter-001"], textLocks: ["headline"],
  tags: ["canonical", "no-reference", "urgency", "exact-copy", "identity"]
});
materialize({ name: "no_reference_urgency", brief: noRefBrief, creative: noRefCreative, frame: noRefFrame, rawInput: noRefInput, inputId: "ci-canonical-no-reference-urgency", runId: "run-canonical-no-reference-urgency-001", manifest: noRefManifest });

const strongBrief = clone(read("tests/fixtures/brief_spec/strong_reference_ad.json"));
strongBrief.user_request = "Crie uma campanha 16:9 com identidade e produto fornecidos, absorvendo fortemente composiÃƒÂ§ÃƒÂ£o, profundidade, foreground, iluminaÃƒÂ§ÃƒÂ£o, energia, densidade e comportamento tipogrÃƒÂ¡fico da referÃƒÂªncia sem mimetizar pixels.";
strongBrief.format = { aspect_ratio: "16:9", orientation: "LANDSCAPE", width: 1920, height: 1080, platform: "Digital Campaign", usage: "Social Ad", text_overlay_expected: true };
strongBrief.assets = [
  { asset_id: "asset-product-subject-001", asset_type: "IMAGE", role: "SUBJECT_IDENTITY", origin: "USER_UPLOAD", authority: "SUBJECT_IDENTITY", required: true, description: "Identidade visual principal fictÃƒÂ­cia.", user_instruction: "Preservar identidade.", preservation_level: "STRICT" },
  { asset_id: "asset-reference-001", asset_type: "IMAGE", role: "PRIMARY_REFERENCE", origin: "USER_UPLOAD", authority: "PRIMARY_REFERENCE", required: true, description: "ReferÃƒÂªncia visual primÃƒÂ¡ria fictÃƒÂ­cia.", user_instruction: "Transferir comportamentos, sem copiar pixels.", preservation_level: "HIGH" },
  { asset_id: "asset-product-001", asset_type: "PRODUCT", role: "PRODUCT", origin: "USER_UPLOAD", authority: "SUBJECT_IDENTITY", required: true, description: "Base de produto fictÃƒÂ­cia.", user_instruction: "Preservar forma e identidade.", preservation_level: "STRICT" }
];
strongBrief.pipeline_hints.requires_subject_identity_preservation = true;
strongBrief.pipeline_hints.text_generation_required = true;
strongBrief.format.text_overlay_expected = true;
const strongPlan = clone(read("tests/fixtures/reference_transfer_plan/strong_single_reference.json"));
strongPlan.plan_id = "rtp-strong-ref-001";
strongPlan.transfer_intensity.value = "VERY_HIGH";
strongPlan.project_id = "project-strong-ref-001";
strongPlan.base_analysis.base_asset_id = "asset-product-001";
strongPlan.reference_analyses[0].reference_asset_id = "asset-reference-001";
strongPlan.design_decision_map.forEach((x) => { x.source_reference_asset_id = "asset-reference-001"; });
const anchorTemplate = strongPlan.non_negotiable_anchors[0];
strongPlan.non_negotiable_anchors = [
  { ...clone(anchorTemplate), anchor_id: "anchor-depth-001", source_reference_asset_id: "asset-reference-001", description: "Aggressive layered depth and foreground behavior", function: "Real depth and environmental integration" },
  { ...clone(anchorTemplate), anchor_id: "anchor-light-001", source_reference_asset_id: "asset-reference-001", description: "Energetic silhouette separation", function: "Lighting energy and subject authority" },
  { ...clone(anchorTemplate), anchor_id: "anchor-mass-001", source_reference_asset_id: "asset-reference-001", description: "Asymmetrical mass tension", function: "Composition, density and protected copy balance" }
];
strongPlan.director_handoff.recommended_anchors = strongPlan.non_negotiable_anchors.map((x) => x.anchor_id);
strongPlan.director_handoff.what_must_survive = ["identity", "semantic campaign idea", "layered depth", "foreground behavior", "lighting energy", "density", "typography behavior"];
strongPlan.director_handoff.warnings = ["Transfer functional behaviors; do not reproduce source pixels or exact geometry."];
const strongCreative = clone(read("tests/fixtures/creative_direction_spec/strong_reference_transfer.json"));
strongCreative.reference_integration.transfer_intensity = "VERY_HIGH";
const strongFrame = clone(read("tests/fixtures/final_frame_spec/strong_reference_transfer.json"));
strongFrame.reference_constraints.transfer_intensity = "VERY_HIGH";
const strongInput = clone(read("tests/fixtures/compiler_input/strong_reference.json"));
const strongManifest = baseManifest({
  id: "strong_reference", project: strongFrame.project_id,
  description: "TransferÃƒÂªncia HIGH de referÃƒÂªncia com base, identidade e referÃƒÂªncia primÃƒÂ¡ria, preservando anchors sem mimetismo de pixels.",
  mode: "GENERATE_WITH_STRONG_REFERENCE",
  artifacts: {
    brief_spec: descriptor("brief_spec", "brief-strong-ref-001"),
    reference_transfer_plan: descriptor("reference_transfer_plan", strongPlan.plan_id),
    creative_direction_spec: descriptor("creative_direction_spec", strongCreative.direction_id),
    final_frame_spec: descriptor("final_frame_spec", strongFrame.frame_spec_id),
    compiler_input: descriptor("compiler_input", "ci-canonical-strong-reference"),
    compiled_generation_request: descriptor("compiled_generation_request", "cgr-ci-canonical-strong-reference")
  },
  assets: [
    asset("asset-product-subject-001", "IMAGE", "SUBJECT_IDENTITY", "SUBJECT_IDENTITY_AUTHORITY", "Identidade principal fictÃƒÂ­cia."),
    asset("asset-reference-001", "IMAGE", "PRIMARY_REFERENCE", "PRIMARY_REFERENCE_AUTHORITY", "ReferÃƒÂªncia visual primÃƒÂ¡ria fictÃƒÂ­cia."),
    asset("asset-product-001", "PRODUCT", "PRODUCT", "PRODUCT_AUTHORITY", "Base de produto fictÃƒÂ­cia.")
  ],
  fields: strongFrame.protected_fields.map((x) => x.field_id),
  requiredAssets: strongFrame.compiler_handoff.required_assets, textLocks: ["headline"],
  tags: ["canonical", "strong-reference", "high-transfer", "anchors", "identity", "anti-mimicry"]
});
strongManifest.expected_reference_transfer_intensity = "VERY_HIGH";
materialize({ name: "strong_reference", brief: strongBrief, plan: strongPlan, creative: strongCreative, frame: strongFrame, rawInput: strongInput, inputId: "ci-canonical-strong-reference", runId: "run-canonical-strong-reference-001", manifest: strongManifest });

const heroBrief = clone(read("tests/fixtures/brief_spec/website_hero.json"));
heroBrief.user_request = "Crie um hero 16:9 premium com a identidade da stylist no lado de alta densidade, profundidade real e integraÃƒÂ§ÃƒÂ£o, preservando a regiÃƒÂ£o de copy externa e sem renderizar texto na imagem.";
heroBrief.assets = [{
  asset_id: "asset-stylist-001", asset_type: "IMAGE", role: "SUBJECT_IDENTITY", origin: "USER_UPLOAD", authority: "SUBJECT_IDENTITY", required: true,
  description: "Identidade fictÃƒÂ­cia da stylist.", user_instruction: "Preservar identidade e integrar ao ambiente.", preservation_level: "STRICT"
}];
heroBrief.pipeline_hints.requires_subject_identity_preservation = true;
heroBrief.pipeline_hints.text_generation_required = false;
const heroCreative = clone(read("tests/fixtures/creative_direction_spec/website_hero_stylist.json"));
const heroFrame = clone(read("tests/fixtures/final_frame_spec/website_hero_stylist.json"));
const heroInput = clone(read("tests/fixtures/compiler_input/website_hero.json"));
const heroManifest = baseManifest({
  id: "website_hero", project: heroFrame.project_id,
  description: "Hero 16:9 premium com identidade ÃƒÂ  direita, densidade controlada e copy externa protegida ÃƒÂ  esquerda.",
  mode: "GENERATE_EXTERNAL_TEXT_OVERLAY",
  artifacts: {
    brief_spec: descriptor("brief_spec", "brief-stylist-001"),
    creative_direction_spec: descriptor("creative_direction_spec", heroCreative.direction_id),
    final_frame_spec: descriptor("final_frame_spec", heroFrame.frame_spec_id),
    compiler_input: descriptor("compiler_input", "ci-canonical-website-hero"),
    compiled_generation_request: descriptor("compiled_generation_request", "cgr-ci-canonical-website-hero")
  },
  assets: [asset("asset-stylist-001", "IMAGE", "SUBJECT_IDENTITY", "SUBJECT_IDENTITY_AUTHORITY", "Identidade humana fictÃƒÂ­cia.")],
  fields: heroFrame.protected_fields.map((x) => x.field_id),
  requiredAssets: ["asset-stylist-001"], negativeSpaces: ["left-copy-field", "html-copy-zone"],
  tags: ["canonical", "website-hero", "negative-space", "external-overlay", "identity", "premium"]
});
materialize({ name: "website_hero", brief: heroBrief, creative: heroCreative, frame: heroFrame, rawInput: heroInput, inputId: "ci-canonical-website-hero", runId: "run-canonical-website-hero-001", manifest: heroManifest });
