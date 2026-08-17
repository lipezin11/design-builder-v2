import { validateCompilerLoss } from "../compiler/validation/compiler-loss-validator.mjs";
import { CROSS_ARTIFACT_ERROR_CODES as C } from "./cross-artifact-errors.mjs";

const LEVEL = Object.freeze({ NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4, STRICT: 4 });
const AUTHORITY = Object.freeze({ SUBJECT_IDENTITY: "SUBJECT_IDENTITY_AUTHORITY", PRIMARY_REFERENCE: "PRIMARY_REFERENCE_AUTHORITY", USER_PRIMARY_REFERENCE: "PRIMARY_REFERENCE_AUTHORITY", SECONDARY_REFERENCE: "SUPPORTING_REFERENCE_AUTHORITY", PRODUCT: "PRODUCT_AUTHORITY", LOGO: "LOGO_AUTHORITY", EDIT_TARGET: "EDIT_TARGET_AUTHORITY" });
const artifactId = (name, artifact, descriptor) => ({ brief_spec: descriptor.artifact_id, reference_transfer_plan: artifact?.plan_id, creative_direction_spec: artifact?.direction_id, final_frame_spec: artifact?.frame_spec_id, compiler_input: artifact?.compiler_input_id, compiled_generation_request: artifact?.request_id }[name]);
const set = (items = []) => new Set(items);

export function validateCrossArtifactScenario(loaded) {
  const { manifest: m, artifacts: a, assetsById } = loaded;
  const checks = [], errors = [], warnings = [];
  const record = (stage, code, ok, message, source_artifact, target_artifact, paths = []) => {
    const check = { stage, code, status: ok ? "PASS" : "BLOCK", message, source_artifact, target_artifact, ...(paths.length ? { paths } : {}) };
    checks.push(check);
    if (!ok) errors.push(check);
    return ok;
  };
  const equal = (stage, code, actual, expected, source, target, paths, label) =>
    record(stage, code, actual === expected, `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`, source, target, paths);
  const has = (stage, code, condition, message, source, target, paths) =>
    record(stage, code, Boolean(condition), message, source, target, paths);

  for (const [name, descriptor] of Object.entries(m.artifacts)) {
    equal("LOCAL_SCHEMA", C.ARTIFACT_ID_MISMATCH, artifactId(name, a[name], descriptor), descriptor.artifact_id, "scenario_manifest", name, [`artifacts.${name}.artifact_id`], `${name} identity`);
    equal("LOCAL_SCHEMA", C.ARTIFACT_VERSION_MISMATCH, a[name].schema_version, descriptor.expected_version, "scenario_manifest", name, [`artifacts.${name}.expected_version`], `${name} version`);
  }
  for (const [name, artifact] of Object.entries(a)) {
    if (name !== "brief_spec" && artifact.project_id !== undefined) equal("PROJECT", C.PROJECT_ID_MISMATCH, artifact.project_id, m.project_id, name, "scenario_manifest", ["project_id"], `${name} project`);
  }

  const brief = a.brief_spec, plan = a.reference_transfer_plan, creative = a.creative_direction_spec;
  const frame = a.final_frame_spec, input = a.compiler_input, request = a.compiled_generation_request;
  const briefId = m.artifacts.brief_spec.artifact_id;
  const refExpected = brief.pipeline_hints.has_reference || brief.pipeline_hints.requires_reference_translator;
  has("REFERENCE_MODE", refExpected ? C.REFERENCE_PLAN_MISSING : C.UNEXPECTED_REFERENCE_PLAN, refExpected ? Boolean(plan) : !plan, refExpected ? "Reference mode requires a transfer plan." : "No-reference mode forbids a transfer plan.", "brief_spec", "reference_transfer_plan", ["pipeline_hints"]);
  equal("REFERENCE_MODE", C.REFERENCE_MODE_MISMATCH, creative.input_refs.reference_mode_active, refExpected, "brief_spec", "creative_direction_spec", ["pipeline_hints.has_reference", "input_refs.reference_mode_active"], "Creative reference mode");
  equal("REFERENCE_MODE", C.REFERENCE_MODE_MISMATCH, frame.input_refs.reference_mode_active, refExpected, "brief_spec", "final_frame_spec", ["pipeline_hints.has_reference", "input_refs.reference_mode_active"], "Frame reference mode");
  equal("REFERENCE_MODE", C.REFERENCE_MODE_MISMATCH, frame.reference_constraints.active, refExpected, "brief_spec", "final_frame_spec", ["pipeline_hints.has_reference", "reference_constraints.active"], "Frame reference constraints");
  if (brief.pipeline_hints.requires_subject_identity_preservation) has("BRIEF_TO_CREATIVE", C.PROTECTED_FIELD_NOT_PROPAGATED, creative.protected_elements.some((item) => item.type === "SUBJECT_IDENTITY" || item.type === "PRODUCT_IDENTITY"), "Creative direction must preserve the Brief identity requirement.", "brief_spec", "creative_direction_spec", ["pipeline_hints.requires_subject_identity_preservation", "protected_elements"]);

  equal("BRIEF_TO_CREATIVE", C.UPSTREAM_REF_MISMATCH, creative.input_refs.brief_spec_id, briefId, "brief_spec", "creative_direction_spec", ["input_refs.brief_spec_id"], "Brief reference");
  equal("BRIEF_TO_CREATIVE", C.ARTIFACT_VERSION_MISMATCH, creative.input_refs.brief_spec_version, brief.schema_version, "brief_spec", "creative_direction_spec", ["input_refs.brief_spec_version"], "Brief version");
  equal("CREATIVE_TO_FRAME", C.UPSTREAM_REF_MISMATCH, frame.input_refs.creative_direction_spec_id, creative.direction_id, "creative_direction_spec", "final_frame_spec", ["input_refs.creative_direction_spec_id"], "Creative direction reference");
  equal("CREATIVE_TO_FRAME", C.ARTIFACT_VERSION_MISMATCH, frame.input_refs.creative_direction_spec_version, creative.schema_version, "creative_direction_spec", "final_frame_spec", ["input_refs.creative_direction_spec_version"], "Creative direction version");
  equal("CREATIVE_TO_FRAME", C.UPSTREAM_REF_MISMATCH, frame.input_refs.brief_spec_id, briefId, "brief_spec", "final_frame_spec", ["input_refs.brief_spec_id"], "Frame brief reference");
  equal("CREATIVE_TO_FRAME", C.ARTIFACT_VERSION_MISMATCH, frame.input_refs.brief_spec_version, brief.schema_version, "brief_spec", "final_frame_spec", ["input_refs.brief_spec_version"], "Frame brief version");
  equal("FRAME_TO_INPUT", C.UPSTREAM_REF_MISMATCH, input.final_frame_spec_ref.final_frame_spec_id, frame.frame_spec_id, "final_frame_spec", "compiler_input", ["final_frame_spec_ref.final_frame_spec_id"], "Final frame reference");
  equal("FRAME_TO_INPUT", C.ARTIFACT_VERSION_MISMATCH, input.final_frame_spec_ref.final_frame_spec_version, frame.schema_version, "final_frame_spec", "compiler_input", ["final_frame_spec_ref.final_frame_spec_version"], "Final frame version");
  equal("INPUT_TO_REQUEST", C.UPSTREAM_REF_MISMATCH, request.compiler_input_ref.artifact_id, input.compiler_input_id, "compiler_input", "compiled_generation_request", ["compiler_input_ref.artifact_id"], "Compiler input reference");
  equal("INPUT_TO_REQUEST", C.ARTIFACT_VERSION_MISMATCH, request.compiler_input_ref.artifact_version, input.schema_version, "compiler_input", "compiled_generation_request", ["compiler_input_ref.artifact_version"], "Compiler input version");
  equal("INPUT_TO_REQUEST", C.UPSTREAM_REF_MISMATCH, request.final_frame_spec_ref.artifact_id, frame.frame_spec_id, "final_frame_spec", "compiled_generation_request", ["final_frame_spec_ref.artifact_id"], "Compiled frame reference");
  equal("INPUT_TO_REQUEST", C.ARTIFACT_VERSION_MISMATCH, request.final_frame_spec_ref.artifact_version, frame.schema_version, "final_frame_spec", "compiled_generation_request", ["final_frame_spec_ref.artifact_version"], "Compiled frame version");
  equal("INPUT_TO_REQUEST", C.UPSTREAM_REF_MISMATCH, request.target_generator.profile_id, input.target_generator.profile_id, "compiler_input", "compiled_generation_request", ["target_generator.profile_id"], "Generator profile");
  equal("INPUT_TO_REQUEST", C.UPSTREAM_REF_MISMATCH, request.generation_mode, input.generation_mode, "compiler_input", "compiled_generation_request", ["generation_mode"], "Generation mode");

  const manifestIds = set(m.assets.map((asset) => asset.asset_id));
  const uses = [];
  brief.assets.forEach((x) => uses.push(["brief_spec", x.asset_id, x.role, AUTHORITY[x.role] ? x.role : x.authority]));
  frame.input_refs.assets.forEach((x) => uses.push(["final_frame_spec", x.asset_id, x.role, null]));
  input.assets.forEach((x) => uses.push(["compiler_input", x.asset_id, x.role, x.authority]));
  if (plan) {
    uses.push(["reference_transfer_plan", plan.base_analysis.base_asset_id, null, null]);
    plan.reference_analyses.forEach((x) => uses.push(["reference_transfer_plan", x.reference_asset_id, x.role, x.authority]));
  }
  for (const [source, id, role, authority] of uses) {
    const declared = assetsById.get(id);
    has("ASSET_INTEGRITY", C.ASSET_NOT_FOUND, manifestIds.has(id), `Asset ${id} referenced by ${source} must exist in the manifest.`, source, "scenario_manifest", ["assets"]);
    if (declared && role) equal("ASSET_INTEGRITY", C.ASSET_ROLE_MISMATCH, role, declared.role, source, "scenario_manifest", [id, "role"], `Asset ${id} role`);
    if (declared && authority) equal("ASSET_INTEGRITY", C.ASSET_AUTHORITY_MISMATCH, AUTHORITY[authority] ?? authority, AUTHORITY[declared.authority] ?? declared.authority, source, "scenario_manifest", [id, "authority"], `Asset ${id} authority`);
  }
  const bound = set(input.assets.map((x) => x.asset_id));
  const compiledAssets = set(request.asset_bindings.map((x) => x.asset_id));
  for (const id of frame.compiler_handoff.required_assets) has("FRAME_TO_INPUT", C.MISSING_REQUIRED_ASSET_BINDING, bound.has(id), `Required frame asset ${id} must be bound in compiler input.`, "final_frame_spec", "compiler_input", ["compiler_handoff.required_assets", "assets"]);
  for (const item of input.assets.filter((x) => x.required)) has("INPUT_TO_REQUEST", C.MISSING_REQUIRED_ASSET_BINDING, compiledAssets.has(item.asset_id), `Required compiler asset ${item.asset_id} must reach the compiled request.`, "compiler_input", "compiled_generation_request", ["assets", "asset_bindings"]);
  for (const subject of frame.subjects.filter((x) => x.identity_preservation !== "NOT_APPLICABLE")) has("FRAME_TO_INPUT", C.MISSING_REQUIRED_ASSET_BINDING, input.identity_bindings.some((x) => x.subject_id === subject.subject_id && x.identity_asset_id === subject.asset_ref), `Identity binding for ${subject.subject_id} must survive.`, "final_frame_spec", "compiler_input", ["subjects", "identity_bindings"]);

  if (plan) {
    equal("REFERENCE_TO_CREATIVE", C.UPSTREAM_REF_MISMATCH, creative.input_refs.reference_transfer_plan_id, plan.plan_id, "reference_transfer_plan", "creative_direction_spec", ["input_refs.reference_transfer_plan_id"], "Transfer plan reference");
    equal("REFERENCE_TO_CREATIVE", C.ARTIFACT_VERSION_MISMATCH, creative.input_refs.reference_transfer_plan_version, plan.schema_version, "reference_transfer_plan", "creative_direction_spec", ["input_refs.reference_transfer_plan_version"], "Transfer plan version");
    equal("REFERENCE_TO_FRAME", C.UPSTREAM_REF_MISMATCH, frame.reference_constraints.transfer_plan_id, plan.plan_id, "reference_transfer_plan", "final_frame_spec", ["reference_constraints.transfer_plan_id"], "Frame transfer plan");
    equal("REFERENCE_TO_FRAME", C.ARTIFACT_VERSION_MISMATCH, frame.input_refs.reference_transfer_plan_version, plan.schema_version, "reference_transfer_plan", "final_frame_spec", ["input_refs.reference_transfer_plan_version"], "Frame transfer plan version");
    const planAnchors = set(plan.non_negotiable_anchors.map((x) => x.anchor_id));
    const creativeAnchors = set([...creative.reference_integration.accepted_anchors, ...creative.reference_integration.modified_anchors].map((x) => x.anchor_id));
    const frameAnchors = set([...frame.reference_constraints.required_reference_anchors, ...frame.reference_constraints.adapted_reference_anchors].map((x) => x.anchor_id));
    for (const item of [...creative.reference_integration.accepted_anchors, ...creative.reference_integration.modified_anchors, ...creative.reference_integration.rejected_anchors]) has("REFERENCE_TO_CREATIVE", C.UPSTREAM_REF_MISMATCH, planAnchors.has(item.anchor_id), `Creative anchor ${item.anchor_id} must exist in the transfer plan.`, "reference_transfer_plan", "creative_direction_spec", ["non_negotiable_anchors", "reference_integration"]);
    for (const item of creative.reference_integration.director_overrides) has("REFERENCE_TO_CREATIVE", C.UPSTREAM_REF_MISMATCH, planAnchors.has(item.anchor_id), `Director override ${item.override_id} must target an existing transfer-plan anchor.`, "reference_transfer_plan", "creative_direction_spec", ["non_negotiable_anchors", "director_overrides"]);
    for (const anchor of planAnchors) {
      has("REFERENCE_TO_CREATIVE", C.REFERENCE_ANCHOR_LOST, creativeAnchors.has(anchor), `Required reference anchor ${anchor} must be traceable in creative direction.`, "reference_transfer_plan", "creative_direction_spec", ["non_negotiable_anchors", "reference_integration"]);
      has("REFERENCE_TO_FRAME", C.REFERENCE_ANCHOR_LOST, frameAnchors.has(anchor), `Required reference anchor ${anchor} must be traceable in final frame.`, "reference_transfer_plan", "final_frame_spec", ["non_negotiable_anchors", "reference_constraints"]);
    }
    has("REFERENCE_INTENSITY", C.REFERENCE_INTENSITY_DILUTION, LEVEL[creative.reference_integration.transfer_intensity] >= LEVEL[plan.transfer_intensity.value], "Creative reference intensity may not dilute the transfer plan.", "reference_transfer_plan", "creative_direction_spec", ["transfer_intensity"]);
    has("REFERENCE_INTENSITY", C.REFERENCE_INTENSITY_DILUTION, LEVEL[frame.reference_constraints.transfer_intensity] >= LEVEL[creative.reference_integration.transfer_intensity], "Final frame reference intensity may not dilute creative direction.", "creative_direction_spec", "final_frame_spec", ["transfer_intensity"]);
    for (const binding of input.reference_bindings) has("REFERENCE_INTENSITY", C.REFERENCE_INTENSITY_DILUTION, LEVEL[binding.transfer_intensity] >= LEVEL[frame.reference_constraints.transfer_intensity], "Compiler input reference intensity may not dilute final frame.", "final_frame_spec", "compiler_input", ["reference_bindings.transfer_intensity"]);
    for (const instruction of request.reference_instructions) {
      has("REFERENCE_INTENSITY", C.REFERENCE_INTENSITY_DILUTION, LEVEL[instruction.transfer_intensity] >= LEVEL[frame.reference_constraints.transfer_intensity], "Compiled reference intensity may not dilute final frame.", "final_frame_spec", "compiled_generation_request", ["reference_instructions.transfer_intensity"]);
      for (const anchor of frameAnchors) has("INPUT_TO_REQUEST", C.REFERENCE_ANCHOR_LOST, instruction.required_anchors.includes(anchor), `Compiled request must preserve reference anchor ${anchor}.`, "final_frame_spec", "compiled_generation_request", ["reference_instructions.required_anchors"]);
    }
  }

  for (const text of frame.typography_system.text_elements.filter((x) => x.copy_is_locked)) {
    const binding = input.text_bindings.find((x) => x.text_id === text.text_id);
    has("TEXT_LOCKS", C.EXACT_TEXT_MISMATCH, binding?.exact_text_lock && binding.content === text.exact_copy, `Exact text ${text.text_id} must reach compiler input unchanged.`, "final_frame_spec", "compiler_input", ["typography_system.text_elements", "text_bindings"]);
    const compiled = request.text_instructions.find((x) => x.text_id === text.text_id);
    has("TEXT_LOCKS", C.EXACT_TEXT_MISMATCH, compiled?.exact_text_lock && compiled.content === text.exact_copy, `Exact text ${text.text_id} must reach compiled request unchanged.`, "final_frame_spec", "compiled_generation_request", ["typography_system.text_elements", "text_instructions"]);
  }
  const protectedIds = set(request.protected_fields.map((x) => x.field_id));
  for (const field of frame.protected_fields) {
    has("PROTECTION", C.PROTECTED_FIELD_NOT_PROPAGATED, input.hard_locks.some((lock) => lock.source === `final_frame_spec.protected_fields.${field.field_id}`), `Protected field ${field.field_id} must become a compiler-input hard lock.`, "final_frame_spec", "compiler_input", ["protected_fields", "hard_locks"]);
    has("PROTECTION", C.PROTECTED_FIELD_NOT_PROPAGATED, protectedIds.has(field.field_id), `Protected field ${field.field_id} must reach compiled request.`, "final_frame_spec", "compiled_generation_request", ["protected_fields"]);
  }
  frame.compiler_handoff.hard_locks.forEach((_, index) => {
    has("PROTECTION", C.HARD_LOCK_NOT_PROPAGATED, input.hard_locks.some((lock) => lock.source === `final_frame_spec.compiler_handoff.hard_locks.${index}`), `Handoff hard lock ${index} must reach compiler input.`, "final_frame_spec", "compiler_input", ["compiler_handoff.hard_locks", "hard_locks"]);
    has("PROTECTION", C.HARD_LOCK_NOT_PROPAGATED, protectedIds.has(`handoff-lock-${index}`), `Handoff hard lock ${index} must reach compiled request.`, "final_frame_spec", "compiled_generation_request", ["compiler_handoff.hard_locks", "protected_fields"]);
  });
  const frameVariation = new Map(frame.controlled_variation.domains.map((x) => [x.domain, x.level]));
  for (const item of input.controlled_variation) has("FRAME_TO_INPUT", C.CONTROLLED_VARIATION_ESCALATION, frameVariation.has(item.domain) && LEVEL[item.level] <= LEVEL[frameVariation.get(item.domain)], `Compiler input variation for ${item.domain} may not exceed the final frame.`, "final_frame_spec", "compiler_input", ["controlled_variation"]);
  const requestedVariation = new Map(input.controlled_variation.map((x) => [x.domain, x.level]));
  request.variation_policy.forEach((x) => has("VARIATION", C.CONTROLLED_VARIATION_ESCALATION, requestedVariation.has(x.domain) ? LEVEL[x.level] <= LEVEL[requestedVariation.get(x.domain)] : x.level === "NONE", `Variation for ${x.domain} may not increase after compilation.`, "compiler_input", "compiled_generation_request", ["controlled_variation", "variation_policy"]));

  equal("COPY_MODE", C.COPY_MODE_MISMATCH, frame.compiler_handoff.text_rendering_mode, frame.typography_system.text_rendering_mode, "final_frame_spec", "final_frame_spec", ["compiler_handoff.text_rendering_mode", "typography_system.text_rendering_mode"], "Frozen copy mode");
  if (frame.typography_system.text_rendering_mode === "EXTERNAL_OVERLAY") {
    has("COPY_MODE", C.COPY_MODE_MISMATCH, input.text_bindings.some((x) => x.render_mode === "EXTERNAL_OVERLAY") && !input.text_bindings.some((x) => x.required && x.render_mode === "IN_IMAGE"), "External overlay mode must forbid required in-image text bindings.", "final_frame_spec", "compiler_input", ["typography_system.text_rendering_mode", "text_bindings"]);
  }
  equal("OUTPUT", C.OUTPUT_REQUIREMENT_MISMATCH, input.requested_output.aspect_ratio, frame.canvas.aspect_ratio, "final_frame_spec", "compiler_input", ["canvas.aspect_ratio", "requested_output.aspect_ratio"], "Output aspect ratio");
  has("OUTPUT", C.OUTPUT_REQUIREMENT_MISMATCH, JSON.stringify(request.output_parameters) === JSON.stringify(input.requested_output), "Compiled output parameters must equal compiler-input output requirements.", "compiler_input", "compiled_generation_request", ["requested_output", "output_parameters"]);
  equal("FRAME_TO_INPUT", C.UPSTREAM_REF_MISMATCH, input.final_frame_spec_ref.status_expected, frame.status, "final_frame_spec", "compiler_input", ["status", "final_frame_spec_ref.status_expected"], "Expected frame status");
  has("PROVENANCE", C.PROVENANCE_MISMATCH, frame.provenance.decision_sources.includes("CREATIVE_DIRECTION_SPEC"), "Final Frame provenance must declare Creative Direction as a decision source.", "creative_direction_spec", "final_frame_spec", ["provenance.decision_sources"]);
  if (plan) has("PROVENANCE", C.PROVENANCE_MISMATCH, frame.provenance.decision_sources.includes("REFERENCE_TRANSFER_PLAN"), "Reference-mode Final Frame provenance must declare the transfer plan.", "reference_transfer_plan", "final_frame_spec", ["provenance.decision_sources"]);
  has("PROVENANCE", C.PROVENANCE_MISMATCH, request.provenance.sources.includes("FINAL_FRAME_SPEC"), "Compiled request provenance must include Final Frame Spec.", "final_frame_spec", "compiled_generation_request", ["provenance.sources"]);

  const lossValidation = validateCompilerLoss(frame, request);
  lossValidation.losses.forEach((item) => record("COMPILER_LOSS", C.COMPILER_LOSS, false, item.message, "final_frame_spec", "compiled_generation_request", [item.source_path, item.compiled_path]));

  const actualPipelineMode = refExpected ? "GENERATE_WITH_STRONG_REFERENCE" : frame.typography_system.text_rendering_mode === "EXTERNAL_OVERLAY" ? "GENERATE_EXTERNAL_TEXT_OVERLAY" : "GENERATE_WITHOUT_REFERENCE";
  equal("EXPECTATIONS", C.EXPECTATION_MISMATCH, actualPipelineMode, m.expected_pipeline_mode, "scenario_manifest", "validation_result", ["expected_pipeline_mode"], "Expected pipeline mode");
  equal("EXPECTATIONS", C.EXPECTATION_MISMATCH, input.generation_mode, m.expected_generation_mode ?? input.generation_mode, "scenario_manifest", "compiler_input", ["expected_generation_mode"], "Expected generation mode");
  equal("EXPECTATIONS", C.EXPECTATION_MISMATCH, request.status, m.expected_compiled_status ?? request.status, "scenario_manifest", "compiled_generation_request", ["expected_compiled_status"], "Expected compiled status");
  equal("EXPECTATIONS", C.EXPECTATION_MISMATCH, request.compatibility_status, m.expected_compatibility, "scenario_manifest", "compiled_generation_request", ["expected_compatibility"], "Expected compatibility");
  if (m.expected_reference_transfer_intensity) {
    equal("EXPECTATIONS", C.EXPECTATION_MISMATCH, frame.reference_constraints.transfer_intensity, m.expected_reference_transfer_intensity, "scenario_manifest", "final_frame_spec", ["expected_reference_transfer_intensity"], "Expected reference transfer intensity");
    for (const item of request.reference_instructions) equal("EXPECTATIONS", C.EXPECTATION_MISMATCH, item.transfer_intensity, m.expected_reference_transfer_intensity, "scenario_manifest", "compiled_generation_request", ["expected_reference_transfer_intensity"], "Compiled reference transfer intensity");
  }
  equal("EXPECTATIONS", C.EXPECTATION_MISMATCH, lossValidation.status, m.expected_loss_validation, "scenario_manifest", "compiled_generation_request", ["expected_loss_validation"], "Expected loss validation");
  for (const field of m.expected_required_protected_fields ?? []) has("EXPECTATIONS", C.EXPECTATION_MISMATCH, protectedIds.has(field), `Expected protected field ${field} is missing.`, "scenario_manifest", "compiled_generation_request", ["expected_required_protected_fields"]);
  for (const id of m.expected_required_assets ?? []) has("EXPECTATIONS", C.EXPECTATION_MISMATCH, request.asset_bindings.some((x) => x.asset_id === id), `Expected asset binding ${id} is missing.`, "scenario_manifest", "compiled_generation_request", ["expected_required_assets"]);
  for (const id of m.expected_required_text_locks ?? []) has("EXPECTATIONS", C.EXPECTATION_MISMATCH, request.text_instructions.some((x) => x.text_id === id && x.exact_text_lock), `Expected exact text lock ${id} is missing.`, "scenario_manifest", "compiled_generation_request", ["expected_required_text_locks"]);
  for (const id of m.expected_negative_space_regions ?? []) has("EXPECTATIONS", C.EXPECTATION_MISMATCH, protectedIds.has(`negative-space-${id}`), `Expected negative-space region ${id} is missing.`, "scenario_manifest", "compiled_generation_request", ["expected_negative_space_regions"]);

  const preliminary = errors.length ? "BLOCK" : warnings.length ? "WARNING" : "PASS";
  if (preliminary !== m.expected_status) record("EXPECTATIONS", C.EXPECTATION_MISMATCH, false, `Scenario expected ${m.expected_status} but validation produced ${preliminary}.`, "scenario_manifest", "validation_result", ["expected_status"]);
  return { scenario_id: m.scenario_id, status: errors.length ? "BLOCK" : warnings.length ? "WARNING" : "PASS", checks, errors, warnings, loss_validation: lossValidation, summary: { passed: checks.filter((x) => x.status === "PASS").length, warnings: warnings.length, blocking: errors.length } };
}
