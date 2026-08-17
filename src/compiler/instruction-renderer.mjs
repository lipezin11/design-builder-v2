const stable = (value) => JSON.stringify(value);

function buildBlocks(finalFrameSpec) {
  const blocks = [
    { block_id: "composition", role: "FINAL_STATE", content: `Composition strategy: ${finalFrameSpec.composition.composition_strategy}. Focal order: ${finalFrameSpec.composition.focal_points.map((point) => `${point.rank}:${point.element_ref}`).join(", ")}.`, source_refs: ["final_frame_spec.composition"] },
    { block_id: "subjects", role: "FINAL_STATE", content: `Subjects: ${stable(finalFrameSpec.subjects.map(({ subject_id, role, frame_region, relative_scale, framing, orientation, gaze, expression, pose_intent, integration_with_environment }) => ({ subject_id, role, frame_region, relative_scale, framing, orientation, gaze, expression, pose_intent, integration_with_environment })))}.`, source_refs: ["final_frame_spec.subjects"] },
    { block_id: "environment", role: "FINAL_STATE", content: `Environment: ${finalFrameSpec.environment.concept}. Spatial character: ${finalFrameSpec.environment.spatial_character}. Regional density: ${stable(finalFrameSpec.environment.regional_density)}.`, source_refs: ["final_frame_spec.environment"] },
    { block_id: "depth", role: "FINAL_STATE", content: `Depth strategy: ${finalFrameSpec.depth_system.depth_strategy}. Layers: ${stable(finalFrameSpec.depth_system.layers.map(({ layer_id, depth_role, elements, occlusion_behavior, atmospheric_behavior, relationship_to_subject }) => ({ layer_id, depth_role, elements, occlusion_behavior, atmospheric_behavior, relationship_to_subject })))}. Separation: ${stable(finalFrameSpec.depth_system.separation_mechanisms)}.`, source_refs: ["final_frame_spec.depth_system"] },
    { block_id: "lighting", role: "FINAL_STATE", content: `Lighting: ${finalFrameSpec.lighting_system.lighting_intent}. Subject separation: ${finalFrameSpec.lighting_system.subject_separation}. Regional luminance: ${stable(finalFrameSpec.lighting_system.regional_luminance_strategy)}.`, source_refs: ["final_frame_spec.lighting_system"] },
    { block_id: "color", role: "FINAL_STATE", content: `Color strategy: ${finalFrameSpec.color_system.contrast_strategy}. Regional behavior: ${stable(finalFrameSpec.color_system.regional_color_behavior)}.`, source_refs: ["final_frame_spec.color_system"] },
    { block_id: "typography", role: "FINAL_STATE", content: `Typography mode: ${finalFrameSpec.typography_system.text_rendering_mode}. Text: ${stable(finalFrameSpec.typography_system.text_elements.map(({ text_id, exact_copy, copy_is_locked, region, hierarchy_rank, occlusion_behavior }) => ({ text_id, exact_copy, copy_is_locked, region, hierarchy_rank, occlusion_behavior })))}.`, source_refs: ["final_frame_spec.typography_system"] }
  ];
  const regions = [...finalFrameSpec.composition.negative_space_regions, ...finalFrameSpec.typography_system.reserved_text_regions];
  if (regions.length) blocks.push({ block_id: "negative-space", role: "FINAL_STATE", content: `Protected negative-space regions: ${stable(regions)}.`, source_refs: ["final_frame_spec.composition.negative_space_regions"] });
  if (finalFrameSpec.objects.length) blocks.push({ block_id: "objects", role: "FINAL_STATE", content: `Required and supporting objects: ${stable(finalFrameSpec.objects)}.`, source_refs: ["final_frame_spec.objects"] });
  return blocks;
}

export class DeterministicInstructionRenderer {
  render({ finalFrameSpec, controlLayer, profile }) {
    const structured_blocks = buildBlocks(finalFrameSpec);
    const final_visual_description = structured_blocks.map((block) => `[${block.source_refs.join(",")}] ${block.content}`).join("\n");
    const control = `CONTROL: creative_authority=${controlLayer.creative_authority}; semantic_change_forbidden=${controlLayer.semantic_change_forbidden}; preserve_identity=${controlLayer.preserve_identity}; preserve_reference_authority=${controlLayer.preserve_reference_authority}; preserve_text_locks=${controlLayer.preserve_text_locks}; preserve_edit_target=${controlLayer.preserve_edit_target}; preserve_composition=${controlLayer.preserve_composition}.`;
    if (profile.instruction_format === "STRUCTURED") return { instruction_format: "STRUCTURED", final_visual_description, structured_blocks };
    if (profile.instruction_format === "MULTIPART") return { instruction_format: "MULTIPART", final_visual_description, system_instruction: "Translate the frozen frame without adding creative decisions.", user_instruction: `${final_visual_description}\n${control}` };
    if (profile.instruction_format === "OTHER") return { instruction_format: "OTHER", final_visual_description, other_payload: { final_visual_description, control } };
    return { instruction_format: "PLAIN_TEXT", final_visual_description, plain_text: `${final_visual_description}\n${control}` };
  }
}