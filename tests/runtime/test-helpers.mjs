import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GeneratorProfileRegistry } from "../../src/generators/registry/generator-profile-registry.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const registry = new GeneratorProfileRegistry();
export const loadJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
export const clone = (value) => structuredClone(value);

const authorityFor = (role) => ({
  SUBJECT_IDENTITY: "SUBJECT_IDENTITY_AUTHORITY", PRIMARY_REFERENCE: "PRIMARY_REFERENCE_AUTHORITY",
  SECONDARY_REFERENCE: "SUPPORTING_REFERENCE_AUTHORITY", PRODUCT: "PRODUCT_AUTHORITY",
  LOGO: "LOGO_AUTHORITY", EDIT_TARGET: "EDIT_TARGET_AUTHORITY"
}[role] ?? "OTHER");

const domainForProtected = (type) => ({ SUBJECT_IDENTITY: "identity", EXACT_TEXT: "typography", COMPOSITION_ANCHOR: "composition", NEGATIVE_SPACE_REGION: "negative_space", REFERENCE_LIGHTING_BEHAVIOR: "reference", PRODUCT_SHAPE: "objects" }[type] ?? "protected_field");

export function alignCompilerInput(inputFixture, finalFrameSpec, profileId = "profile-hypothetical-v1", mode = inputFixture.generation_mode) {
  const input = clone(inputFixture);
  const profile = registry.getProfile(profileId);
  input.project_id = finalFrameSpec.project_id;
  input.final_frame_spec_ref = {
    final_frame_spec_id: finalFrameSpec.frame_spec_id,
    final_frame_spec_version: finalFrameSpec.schema_version,
    artifact_uri: `artifact://final-frame/${finalFrameSpec.frame_spec_id}/${finalFrameSpec.schema_version}`,
    checksum: `sha256:test-${finalFrameSpec.frame_spec_id}`,
    status_expected: finalFrameSpec.status
  };
  input.target_generator = { provider: profile.provider, model_family: profile.model_family, model_name: profile.model_name, profile_id: profile.profile_id, profile_version: profile.profile_version };
  input.generation_mode = mode;
  input.generator_capabilities = {
    profile_id: profile.profile_id,
    profile_version: profile.profile_version,
    data_classification: "HYPOTHETICAL_TEST_DATA",
    registry_checked_at: "2026-08-10T00:00:00-03:00",
    capabilities: clone(profile.capabilities)
  };

  const existingEditTarget = input.assets.find((asset) => asset.authority === "EDIT_TARGET_AUTHORITY");
  input.assets = finalFrameSpec.input_refs.assets.map((asset) => ({
    asset_id: asset.asset_id,
    role: asset.role,
    source_ref: `asset://${asset.asset_id}`,
    authority: authorityFor(asset.role),
    required: asset.required,
    usage: `Bind ${asset.role.toLowerCase()} from frozen frame`,
    preservation_level: asset.role === "SUBJECT_IDENTITY" ? "STRICT" : asset.required ? "HIGH" : "MEDIUM",
    binding_scope: [asset.role === "SUBJECT_IDENTITY" ? "subjects.identity" : asset.role.toLowerCase()]
  }));
  if (mode === "EDIT" && existingEditTarget) input.assets.push(existingEditTarget);

  input.identity_bindings = finalFrameSpec.subjects.filter((subject) => subject.identity_preservation !== "NOT_APPLICABLE" && subject.asset_ref).map((subject) => ({
    subject_id: subject.subject_id,
    identity_asset_id: subject.asset_ref,
    preservation_level: subject.identity_preservation,
    recognizability_required: true,
    immutable_characteristics: ["recognizable identity defined by the bound asset"],
    editable_characteristics: subject.allowed_transformations
  }));

  if (finalFrameSpec.reference_constraints.active) {
    const refAsset = finalFrameSpec.input_refs.assets.find((asset) => asset.role === "PRIMARY_REFERENCE" || asset.role === "SECONDARY_REFERENCE");
    input.reference_bindings = [{
      reference_asset_id: refAsset.asset_id,
      role: refAsset.role,
      authority: authorityFor(refAsset.role),
      transfer_intensity: finalFrameSpec.reference_constraints.transfer_intensity,
      required_anchors: [...finalFrameSpec.reference_constraints.required_reference_anchors, ...finalFrameSpec.reference_constraints.adapted_reference_anchors].map((anchor) => anchor.anchor_id),
      do_not_copy: clone(finalFrameSpec.reference_constraints.reference_elements_explicitly_not_to_copy),
      scope: ["composition", "lighting", "color", "depth"]
    }];
  } else input.reference_bindings = [];

  input.text_bindings = finalFrameSpec.typography_system.text_elements.map((text) => ({ text_id: text.text_id, content: text.exact_copy, exact_text_lock: text.copy_is_locked, render_mode: "IN_IMAGE", language: "und", required: true }));
  if (finalFrameSpec.typography_system.text_rendering_mode === "EXTERNAL_OVERLAY") input.text_bindings.push({ text_id: "external-overlay", content: "", exact_text_lock: false, render_mode: "EXTERNAL_OVERLAY", language: "und", required: false });

  input.hard_locks = [
    ...finalFrameSpec.protected_fields.map((field) => ({ lock_id: `lock-${field.field_id}`, domain: domainForProtected(field.protection_type), target: field.target, rule: field.rule, source: `final_frame_spec.protected_fields.${field.field_id}`, failure_policy: "FAIL_COMPILATION" })),
    ...finalFrameSpec.compiler_handoff.hard_locks.map((rule, index) => ({ lock_id: `lock-handoff-${index}`, domain: rule.toLowerCase().includes("composition") ? "composition" : "handoff", target: `compiler_handoff.hard_locks.${index}`, rule, source: `final_frame_spec.compiler_handoff.hard_locks.${index}`, failure_policy: "FAIL_COMPILATION" }))
  ];
  input.strong_targets = finalFrameSpec.compiler_handoff.strong_targets.map((statement, index) => ({ target_id: `strong-${index}`, domain: "visual_system", statement, priority: "HIGH", source: `final_frame_spec.compiler_handoff.strong_targets.${index}`, verification_hint: "Compare against frozen frame requirement." }));
  input.controlled_variation = finalFrameSpec.controlled_variation.domains.map(({ domain, level, rule }) => ({ domain, level, rule }));
  input.requested_output = { aspect_ratio: finalFrameSpec.canvas.aspect_ratio, output_role: finalFrameSpec.canvas.output_role, number_of_variants: 1, deterministic_requirements: clone(finalFrameSpec.generation_requirements.output_constraints) };
  input.incompatibilities = [];
  input.status = "READY_FOR_COMPILATION";

  if (mode === "EDIT") {
    const editTarget = existingEditTarget ?? { asset_id: "asset-edit-target", role: "EDIT_TARGET", source_ref: "asset://edit-target", authority: "EDIT_TARGET_AUTHORITY", required: true, usage: "Direct edit target", preservation_level: "STRICT", binding_scope: ["full_frame"] };
    if (!input.assets.some((asset) => asset.asset_id === editTarget.asset_id)) input.assets.push(editTarget);
    input.mode_context = { edit_target_asset_id: editTarget.asset_id, locked_regions: [{ region_id: "locked-frame", x: 0, y: 0, width: 1, height: 1 }], editable_regions: [{ region_id: "editable-region", x: 0.6, y: 0.4, width: 0.2, height: 0.2 }], edit_delta: "Modify only the declared editable region.", preserve_global_structure: true, reconstruction_forbidden: true };
  } else if (mode === "REGENERATE") {
    input.mode_context = { parent_generation_id: "generation-parent-001", variation_domains: ["environment_details"], previous_failure_context: "Retry execution without changing design decisions." };
  } else if (mode === "VARIANT") {
    input.mode_context = { variation_domains: ["environment_details"] };
  } else delete input.mode_context;
  return input;
}

export function loadScenario(inputName, frameName, options = {}) {
  const frame = loadJson(`tests/fixtures/final_frame_spec/${frameName}.json`);
  const rawInput = loadJson(`tests/fixtures/compiler_input/${inputName}.json`);
  return { finalFrameSpec: frame, compilerInput: alignCompilerInput(rawInput, frame, options.profileId, options.mode ?? rawInput.generation_mode) };
}