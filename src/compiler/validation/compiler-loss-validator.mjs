const LEVEL = Object.freeze({ NOT_APPLICABLE: -1, NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, STRICT: 4, VERY_HIGH: 4 });

const loss = (category, source_path, compiled_path, message, recommended_action = "RECOMPILE_FROM_FROZEN_SPEC") => ({ category, severity: "BLOCKING", source_path, compiled_path, message, recommended_action });
const instructionCarries = (request, sourceRef) => {
  if (request.compiled_instruction.final_visual_description.includes(`[${sourceRef}]`)) return true;
  return (request.compiled_instruction.structured_blocks ?? []).some((block) => block.source_refs.includes(sourceRef));
};
const protectedIds = (request) => new Set(request.protected_fields.map((field) => field.field_id));

export function validateCompilerLoss(finalFrameSpec, compiledRequest) {
  const losses = [];
  const ids = protectedIds(compiledRequest);
  const add = (...args) => losses.push(loss(...args));

  for (const field of finalFrameSpec.protected_fields) {
    if (!ids.has(field.field_id)) add("PROTECTED_FIELD_LOSS", `final_frame_spec.protected_fields.${field.field_id}`, "compiled_request.protected_fields", `Protected field ${field.field_id} did not survive compilation.`);
  }
  finalFrameSpec.compiler_handoff.hard_locks.forEach((rule, index) => {
    if (!ids.has(`handoff-lock-${index}`)) add("HARD_LOCK_LOSS", `final_frame_spec.compiler_handoff.hard_locks.${index}`, "compiled_request.protected_fields", `Hard lock was not propagated: ${rule}`);
  });

  const identityRequired = finalFrameSpec.subjects.filter((subject) => subject.identity_preservation !== "NOT_APPLICABLE");
  if (identityRequired.length && !compiledRequest.control_layer.preserve_identity) add("IDENTITY_LOCK_LOSS", "final_frame_spec.subjects", "compiled_request.control_layer.preserve_identity", "Identity preservation control is disabled.");
  for (const subject of identityRequired) {
    const instruction = compiledRequest.identity_instructions.find((item) => item.subject_id === subject.subject_id && item.identity_asset_id === subject.asset_ref);
    if (!instruction || LEVEL[instruction.preservation_level] < LEVEL[subject.identity_preservation]) add("IDENTITY_LOCK_LOSS", `final_frame_spec.subjects.${subject.subject_id}`, "compiled_request.identity_instructions", `Identity instruction is missing or weaker for ${subject.subject_id}.`);
  }

  for (const text of finalFrameSpec.typography_system.text_elements.filter((item) => item.copy_is_locked)) {
    const compiled = compiledRequest.text_instructions.find((item) => item.text_id === text.text_id);
    if (!compiled || !compiled.exact_text_lock || compiled.content !== text.exact_copy) add("TEXT_LOCK_LOSS", `final_frame_spec.typography_system.text_elements.${text.text_id}`, "compiled_request.text_instructions", `Exact copy changed or disappeared for ${text.text_id}.`);
  }

  if (finalFrameSpec.reference_constraints.active) {
    const expected = finalFrameSpec.reference_constraints.transfer_intensity;
    const anchors = [...finalFrameSpec.reference_constraints.required_reference_anchors, ...finalFrameSpec.reference_constraints.adapted_reference_anchors].map((item) => item.anchor_id);
    if (!compiledRequest.control_layer.preserve_reference_authority) add("REFERENCE_DILUTION", "final_frame_spec.reference_constraints", "compiled_request.control_layer.preserve_reference_authority", "Reference authority preservation is disabled.");
    if (compiledRequest.reference_instructions.length === 0) add("REFERENCE_DILUTION", "final_frame_spec.reference_constraints", "compiled_request.reference_instructions", "Reference instructions are missing.");
    for (const instruction of compiledRequest.reference_instructions) {
      if (LEVEL[instruction.transfer_intensity] < LEVEL[expected]) add("REFERENCE_DILUTION", "final_frame_spec.reference_constraints.transfer_intensity", "compiled_request.reference_instructions.transfer_intensity", `Reference intensity fell from ${expected} to ${instruction.transfer_intensity}.`);
      for (const anchor of anchors) if (!instruction.required_anchors.includes(anchor)) add("REFERENCE_DILUTION", `final_frame_spec.reference_constraints.${anchor}`, "compiled_request.reference_instructions.required_anchors", `Reference anchor ${anchor} is missing.`);
    }
  }

  const structural = [
    ["system-composition", "COMPOSITION_LOSS", "final_frame_spec.composition"],
    ["system-depth", "DEPTH_LOSS", "final_frame_spec.depth_system"],
    ["system-lighting", "LIGHTING_INTENT_LOSS", "final_frame_spec.lighting_system"],
    ["system-color", "COLOR_INTENT_LOSS", "final_frame_spec.color_system"],
    ["system-typography", "TYPOGRAPHY_BEHAVIOR_LOSS", "final_frame_spec.typography_system"]
  ];
  for (const [fieldId, category, source] of structural) {
    if (!ids.has(fieldId) || !instructionCarries(compiledRequest, source)) add(category, source, "compiled_request.compiled_instruction/protected_fields", `${source} is not represented in both instruction and protection data.`);
  }

  const regions = [...finalFrameSpec.composition.negative_space_regions, ...finalFrameSpec.typography_system.reserved_text_regions];
  for (const region of regions) {
    if (!ids.has(`negative-space-${region.region_id}`) || !instructionCarries(compiledRequest, "final_frame_spec.composition.negative_space_regions")) add("NEGATIVE_SPACE_LOSS", `final_frame_spec.negative_space.${region.region_id}`, "compiled_request.compiled_instruction/protected_fields", `Protected negative-space region ${region.region_id} is missing or untraceable.`);
  }
  for (const object of finalFrameSpec.objects.filter((item) => item.required)) {
    if (!ids.has(`object-${object.object_id}`) || !instructionCarries(compiledRequest, "final_frame_spec.objects")) add("OBJECT_LOSS", `final_frame_spec.objects.${object.object_id}`, "compiled_request.compiled_instruction/protected_fields", `Required object ${object.object_id} is missing.`);
  }

  const compiledVariation = new Map(compiledRequest.variation_policy.map((item) => [item.domain, item]));
  for (const source of finalFrameSpec.controlled_variation.domains) {
    const candidate = compiledVariation.get(source.domain);
    if (!candidate) add("CONTROLLED_VARIATION_VIOLATION", `final_frame_spec.controlled_variation.${source.domain}`, "compiled_request.variation_policy", `Variation rule ${source.domain} disappeared.`);
    else if (LEVEL[candidate.level] > LEVEL[source.level]) add("CONTROLLED_VARIATION_VIOLATION", `final_frame_spec.controlled_variation.${source.domain}`, `compiled_request.variation_policy.${source.domain}`, `Variation increased from ${source.level} to ${candidate.level}.`);
  }
  const compositionLocked = finalFrameSpec.protected_fields.some((field) => field.protection_type === "COMPOSITION_ANCHOR") || finalFrameSpec.compiler_handoff.hard_locks.some((item) => item.toLowerCase().includes("composition"));
  if (compositionLocked && compiledVariation.get("composition")?.level !== "NONE") add("COMPOSITION_LOSS", "final_frame_spec.composition", "compiled_request.variation_policy.composition", "Locked composition has non-zero variation.");

  const blocking = losses.filter((item) => item.severity === "BLOCKING").length;
  const warnings = losses.length - blocking;
  return { status: blocking ? "BLOCK" : warnings ? "WARNING" : "PASS", losses, summary: { blocking, warnings } };
}