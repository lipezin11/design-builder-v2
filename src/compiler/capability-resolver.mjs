const CAPABILITY_STATUS = Object.freeze({ SUPPORTED: "SUPPORTED", PARTIAL: "PARTIAL", UNSUPPORTED: "UNSUPPORTED", UNKNOWN: "UNKNOWN" });

const requirement = (requirementRef, capabilityRef, hard, reason) => ({ requirement_ref: requirementRef, capability_ref: capabilityRef, hard, reason });
const hasHardLock = (compilerInput, pattern) => compilerInput.hard_locks.some((lock) => `${lock.domain} ${lock.target} ${lock.rule}`.toLowerCase().includes(pattern));

export function deriveCapabilityRequirements(compilerInput, finalFrameSpec) {
  const requirements = [];
  requirements.push(requirement("compiler_input.generation_mode", `mode:${compilerInput.generation_mode}`, true, "Requested generation mode must be supported."));
  const references = compilerInput.reference_bindings.length;
  if (references > 0) requirements.push(requirement("compiler_input.reference_bindings", "supports_image_reference", true, "Reference assets are required."));
  if (references > 1) requirements.push(requirement("compiler_input.reference_bindings", "supports_multiple_references", true, "Multiple reference assets are required."));
  if (compilerInput.identity_bindings.length > 0) requirements.push(requirement("compiler_input.identity_bindings", "supports_identity_reference", true, "Identity binding is required."));
  if (compilerInput.generation_mode === "EDIT") {
    requirements.push(requirement("compiler_input.mode_context.edit_target_asset_id", "supports_edit_target", true, "Edit target is structural authority."));
    if ((compilerInput.mode_context?.editable_regions ?? []).length > 0) requirements.push(requirement("compiler_input.mode_context.editable_regions", "supports_masking", true, "Region-scoped edit requires masking."));
  }
  const exactText = compilerInput.text_bindings.some((text) => text.required && text.render_mode === "IN_IMAGE" && text.exact_text_lock);
  const inImageText = compilerInput.text_bindings.some((text) => text.required && text.render_mode === "IN_IMAGE");
  const externalText = compilerInput.text_bindings.some((text) => text.render_mode === "EXTERNAL_OVERLAY");
  if (inImageText) requirements.push(requirement("compiler_input.text_bindings", "supports_text_rendering", true, "In-image text is required."));
  if (exactText) requirements.push(requirement("compiler_input.text_bindings.exact_text_lock", "supports_exact_text", true, "Exact in-image copy is a hard requirement."));
  if (externalText) requirements.push(requirement("compiler_input.text_bindings.render_mode", "supports_external_text_overlay", hasHardLock(compilerInput, "negative_space") || finalFrameSpec.typography_system.text_rendering_mode === "EXTERNAL_OVERLAY", "External overlay region must remain viable."));
  if (finalFrameSpec.generation_requirements.forbidden_visual_elements.length > 0) requirements.push(requirement("final_frame_spec.generation_requirements.forbidden_visual_elements", "supports_negative_constraints", false, "Negative constraints improve faithful execution."));
  if (compilerInput.requested_output.number_of_variants > 1) requirements.push(requirement("compiler_input.requested_output.number_of_variants", "supports_multiple_outputs", true, "Multiple outputs are requested."));
  if (compilerInput.requested_output.transparency === true) requirements.push(requirement("compiler_input.requested_output.transparency", "supports_transparency", true, "Transparent output is required."));
  return requirements;
}

const assessment = (item, status, impact, action) => ({
  requirement_ref: item.requirement_ref,
  capability_ref: item.capability_ref,
  status,
  impact,
  recommended_action: action
});

export function analyzeCapabilities({ compilerInput, finalFrameSpec, profile, requirements = deriveCapabilityRequirements(compilerInput, finalFrameSpec) }) {
  const capabilities = new Map(profile.capabilities.map((item) => [item.capability_id, item]));
  const groups = { supported_requirements: [], partially_supported_requirements: [], unsupported_requirements: [], unknown_capabilities: [] };
  for (const item of requirements) {
    if (item.capability_ref.startsWith("mode:")) {
      const mode = item.capability_ref.slice(5);
      if (profile.supported_generation_modes.includes(mode)) groups.supported_requirements.push(assessment(item, CAPABILITY_STATUS.SUPPORTED, "Mode is supported.", "PROCEED"));
      else groups.unsupported_requirements.push({ ...assessment(item, CAPABILITY_STATUS.UNSUPPORTED, "HARD_LOCK_VIOLATION: requested mode is unsupported.", "FAIL_COMPILATION"), hard: true });
      continue;
    }
    const capability = capabilities.get(item.capability_ref);
    if (!capability) {
      groups.unknown_capabilities.push({ ...assessment(item, CAPABILITY_STATUS.UNKNOWN, item.hard ? "Hard requirement has unknown support." : "Optional capability is unknown.", item.hard ? "REQUEST_HUMAN_DECISION" : "WARN"), hard: item.hard });
    } else if (!capability.supported) {
      groups.unsupported_requirements.push({ ...assessment(item, CAPABILITY_STATUS.UNSUPPORTED, item.hard ? "HARD_LOCK_VIOLATION: capability is unsupported." : "Optional behavior is unsupported.", item.hard ? "FAIL_COMPILATION" : "WARN"), hard: item.hard });
    } else if (capability.confidence === "LOW") {
      groups.partially_supported_requirements.push({ ...assessment(item, CAPABILITY_STATUS.PARTIAL, "Capability support confidence is LOW.", "WARN"), hard: item.hard });
    } else {
      groups.supported_requirements.push(assessment(item, CAPABILITY_STATUS.SUPPORTED, "No loss expected.", "PROCEED"));
    }
  }

  const hardUnsupported = groups.unsupported_requirements.some((item) => item.hard);
  const hardUnknown = groups.unknown_capabilities.some((item) => item.hard);
  let compatibility_status = "FULLY_COMPATIBLE";
  if (hardUnsupported) compatibility_status = "BLOCKED_BY_CAPABILITY";
  else if (hardUnknown) compatibility_status = "HUMAN_DECISION_REQUIRED";
  else if (groups.partially_supported_requirements.length || groups.unsupported_requirements.length || groups.unknown_capabilities.length) compatibility_status = "COMPATIBLE_WITH_WARNINGS";

  const strip = (items) => items.map(({ hard, ...item }) => item);
  return {
    compatibility_status,
    capability_report: {
      profile_data_classification: "HYPOTHETICAL_TEST_DATA",
      supported_requirements: groups.supported_requirements,
      partially_supported_requirements: strip(groups.partially_supported_requirements),
      unsupported_requirements: strip(groups.unsupported_requirements),
      unknown_capabilities: strip(groups.unknown_capabilities)
    }
  };
}