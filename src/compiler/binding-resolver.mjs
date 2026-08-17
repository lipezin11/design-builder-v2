import { CompilerError, COMPILER_ERROR_CODES } from "./compiler-errors.mjs";

const LEVEL = Object.freeze({ NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4 });
const lower = (value) => String(value ?? "").toLowerCase();

export function validateCompilerContext(compilerInput, finalFrameSpec) {
  if (!["READY_FOR_COMPILATION", "APPROVED"].includes(finalFrameSpec.status)) {
    throw new CompilerError(COMPILER_ERROR_CODES.FINAL_FRAME_NOT_COMPILABLE, `Final Frame status is ${finalFrameSpec.status}.`);
  }
  if (compilerInput.final_frame_spec_ref.final_frame_spec_id !== finalFrameSpec.frame_spec_id) {
    throw new CompilerError(COMPILER_ERROR_CODES.FINAL_FRAME_REF_MISMATCH, "Compiler Input references a different Final Frame Spec.", { expected: finalFrameSpec.frame_spec_id, received: compilerInput.final_frame_spec_ref.final_frame_spec_id });
  }
  if (compilerInput.final_frame_spec_ref.final_frame_spec_version !== finalFrameSpec.schema_version) {
    throw new CompilerError(COMPILER_ERROR_CODES.FINAL_FRAME_REF_MISMATCH, "Final Frame version does not match Compiler Input reference.");
  }
  if (compilerInput.project_id !== finalFrameSpec.project_id) {
    throw new CompilerError(COMPILER_ERROR_CODES.FINAL_FRAME_REF_MISMATCH, "Compiler Input and Final Frame belong to different projects.", { expected: finalFrameSpec.project_id, received: compilerInput.project_id });
  }
}

export function validateBindings(compilerInput, finalFrameSpec) {
  const assets = new Map(compilerInput.assets.map((asset) => [asset.asset_id, asset]));
  const missing = finalFrameSpec.input_refs.assets.filter((asset) => asset.required && !assets.has(asset.asset_id));
  if (missing.length) throw new CompilerError(COMPILER_ERROR_CODES.MISSING_REQUIRED_ASSET, "Required Final Frame assets are not bound.", { asset_ids: missing.map((asset) => asset.asset_id) });

  for (const binding of compilerInput.identity_bindings) {
    if (!assets.has(binding.identity_asset_id)) throw new CompilerError(COMPILER_ERROR_CODES.INVALID_BINDING, `Identity asset is not bound: ${binding.identity_asset_id}`);
  }
  const exactTexts = finalFrameSpec.typography_system.text_elements.filter((text) => text.copy_is_locked);
  for (const text of exactTexts) {
    const binding = compilerInput.text_bindings.find((item) => item.text_id === text.text_id);
    if (!binding || !binding.exact_text_lock || binding.content !== text.exact_copy) {
      throw new CompilerError(COMPILER_ERROR_CODES.INVALID_BINDING, `Exact text binding is missing or changed: ${text.text_id}`);
    }
  }
  if (finalFrameSpec.reference_constraints.active) {
    const source = finalFrameSpec.reference_constraints;
    if (compilerInput.reference_bindings.length === 0) throw new CompilerError(COMPILER_ERROR_CODES.INVALID_BINDING, "Active reference mode requires a reference binding.");
    for (const binding of compilerInput.reference_bindings) {
      if (LEVEL[binding.transfer_intensity] < LEVEL[source.transfer_intensity]) throw new CompilerError(COMPILER_ERROR_CODES.REFERENCE_DILUTION, "Compiler Input diluted reference intensity.");
    }
  }
  validateVariationMonotonicity(compilerInput.controlled_variation, finalFrameSpec.controlled_variation.domains);
  return true;
}

export function validateVariationMonotonicity(candidateRules, upstreamRules) {
  const upstream = new Map(upstreamRules.map((rule) => [rule.domain, rule]));
  for (const candidate of candidateRules) {
    const source = upstream.get(candidate.domain);
    if (source && LEVEL[candidate.level] > LEVEL[source.level]) {
      throw new CompilerError(COMPILER_ERROR_CODES.HARD_LOCK_CONFLICT, `Variation increased for ${candidate.domain}.`, { upstream: source.level, candidate: candidate.level });
    }
  }
}

const categoryForType = (type) => ({
  SUBJECT_IDENTITY: "IDENTITY_LOCK_LOSS", EXACT_TEXT: "TEXT_LOCK_LOSS", COMPOSITION_ANCHOR: "COMPOSITION_LOSS",
  NEGATIVE_SPACE_REGION: "NEGATIVE_SPACE_LOSS", REFERENCE_LIGHTING_BEHAVIOR: "REFERENCE_DILUTION", PRODUCT_SHAPE: "OBJECT_LOSS"
}[type] ?? "PROTECTED_FIELD_LOSS");

const protectedField = (field_id, target, rule, source_ref, loss_category) => ({ field_id, target, rule, source_ref, loss_category });

export function collectProtectedFields(finalFrameSpec) {
  const fields = finalFrameSpec.protected_fields.map((field) => protectedField(field.field_id, field.target, field.rule, `final_frame_spec.protected_fields.${field.field_id}`, categoryForType(field.protection_type)));
  const add = (field) => { if (!fields.some((item) => item.field_id === field.field_id)) fields.push(field); };
  add(protectedField("system-composition", "composition", "Preserve composition strategy, hierarchy and spatial relationships.", "final_frame_spec.composition", "COMPOSITION_LOSS"));
  add(protectedField("system-depth", "depth_system", "Preserve layers, overlaps, integration and separation mechanisms.", "final_frame_spec.depth_system", "DEPTH_LOSS"));
  add(protectedField("system-lighting", "lighting_system", "Preserve lighting intent and regional behavior.", "final_frame_spec.lighting_system", "LIGHTING_INTENT_LOSS"));
  add(protectedField("system-color", "color_system", "Preserve color families and regional behavior.", "final_frame_spec.color_system", "COLOR_INTENT_LOSS"));
  add(protectedField("system-typography", "typography_system", "Preserve typography render mode and behavior.", "final_frame_spec.typography_system", "TYPOGRAPHY_BEHAVIOR_LOSS"));
  for (const region of [...finalFrameSpec.composition.negative_space_regions, ...finalFrameSpec.typography_system.reserved_text_regions]) {
    add(protectedField(`negative-space-${region.region_id}`, `region:${region.region_id}`, `Preserve ${region.semantic_region} region ${region.region_id}: ${region.purpose}`, `final_frame_spec.composition.negative_space_regions.${region.region_id}`, "NEGATIVE_SPACE_LOSS"));
  }
  for (const object of finalFrameSpec.objects.filter((item) => item.required)) add(protectedField(`object-${object.object_id}`, `objects.${object.object_id}`, object.description, `final_frame_spec.objects.${object.object_id}`, "OBJECT_LOSS"));
  finalFrameSpec.compiler_handoff.hard_locks.forEach((rule, index) => add(protectedField(`handoff-lock-${index}`, `compiler_handoff.hard_locks.${index}`, rule, `final_frame_spec.compiler_handoff.hard_locks.${index}`, "HARD_LOCK_LOSS")));
  return fields;
}

export function collectVariationPolicy(finalFrameSpec) {
  const rules = finalFrameSpec.controlled_variation.domains.map((item) => ({ domain: item.domain, level: item.level, rule: item.rule, source_ref: `final_frame_spec.controlled_variation.${item.domain}` }));
  const lockedText = lower(finalFrameSpec.compiler_handoff.hard_locks.join(" "));
  const lockedDomains = new Set();
  if (lockedText.includes("composition") || lockedText.includes("focal order") || finalFrameSpec.protected_fields.some((field) => field.protection_type === "COMPOSITION_ANCHOR")) lockedDomains.add("composition");
  if (lockedText.includes("identity") || finalFrameSpec.protected_fields.some((field) => field.protection_type === "SUBJECT_IDENTITY")) lockedDomains.add("identity");
  if (finalFrameSpec.reference_constraints.active || lockedText.includes("reference")) lockedDomains.add("reference");
  for (const domain of lockedDomains) {
    const existing = rules.find((item) => item.domain === domain);
    if (existing) {
      existing.level = "NONE";
      existing.rule = `${existing.rule} This domain is additionally frozen by an upstream lock.`;
    } else {
      rules.push({ domain, level: "NONE", rule: `${domain} is frozen by upstream protection.`, source_ref: "final_frame_spec.protected_fields" });
    }
  }
  return rules;
}

export function compileAssetBindings(compilerInput) {
  return compilerInput.assets.map((asset) => ({ asset_id: asset.asset_id, adapter_slot: lower(asset.role), authority: asset.authority, required: asset.required, source_ref: `compiler_input.assets.${asset.asset_id}` }));
}