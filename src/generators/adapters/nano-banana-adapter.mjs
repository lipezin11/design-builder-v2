import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { validateArtifact } from "../../compiler/schema-validator.mjs";
import { GENERATION_ERROR_CODES as C, GenerationError } from "../generation-errors.mjs";

const defaultProfile = JSON.parse(fs.readFileSync(fileURLToPath(new URL("./profiles/nano-banana-semantic-profile.json", import.meta.url)), "utf8"));
const SLOT_ROLE = Object.freeze({
  subject_identity: "SUBJECT_IDENTITY",
  base_image: "BASE_IMAGE",
  edit_target: "EDIT_TARGET",
  primary_reference: "PRIMARY_REFERENCE",
  secondary_reference: "SECONDARY_REFERENCE",
  logo: "LOGO",
  product: "PRODUCT"
});
const ORDER = Object.freeze({ SUBJECT_IDENTITY: 10, BASE_IMAGE: 20, EDIT_TARGET: 30, PRIMARY_REFERENCE: 40, SECONDARY_REFERENCE: 50, LOGO: 60, PRODUCT: 70, OTHER: 100 });
const clone = (value) => structuredClone(value);
const asResolutionMap = (value) => {
  if (value instanceof Map) return value;
  if (Array.isArray(value)) return new Map(value.map((item) => [item.asset_id, item]));
  if (value && typeof value === "object") return new Map(Object.entries(value));
  return new Map();
};
const resolvedUri = (item) => item?.uri ?? item?.mock_uri ?? item?.path ?? null;
const fail = (code, message, details = {}) => { throw new GenerationError(code, message, details); };

export function assertSemanticRequest(request) {
  if (!request || request.semantic_request_version !== "1.0.0" || request.model?.family !== "NANO_BANANA" || request.creative_authority !== "NONE") {
    fail(C.INVALID_GENERATION_REQUEST, "Nano Banana semantic request is invalid.");
  }
  if (!request.instruction?.final_visual_description || !Array.isArray(request.assets?.ordered) || !request.output?.aspect_ratio) {
    fail(C.INVALID_GENERATION_REQUEST, "Nano Banana semantic request is incomplete.");
  }
  return request;
}

export class NanoBananaSemanticAdapter {
  constructor({ adapterId = defaultProfile.adapter_id } = {}) {
    this.adapterId = adapterId;
  }

  adapt({ compiledRequest, assetResolution, profile = defaultProfile, modelName }) {
    const validation = validateArtifact("compiled_generation_request", compiledRequest);
    if (!validation.valid || compiledRequest.status !== "REQUEST_READY") {
      fail(C.INVALID_GENERATION_REQUEST, "Compiled Generation Request must be schema-valid and REQUEST_READY.", { schema_errors: validation.errors, status: compiledRequest?.status });
    }
    if (compiledRequest.control_layer.creative_authority !== "NONE" || profile.creative_authority !== "NONE" || profile.model_family !== "NANO_BANANA") {
      fail(C.INVALID_GENERATION_REQUEST, "Adapter and compiled request must preserve creative_authority NONE and target Nano Banana.");
    }
    const resolvedModel = modelName ?? profile.model_name;
    if (typeof resolvedModel !== "string" || resolvedModel.length === 0 || resolvedModel.startsWith("SUBSTITUA_")) {
      fail(C.INVALID_GENERATION_REQUEST, "Nano Banana model name must come from validated configuration or explicit mock test data.");
    }

    const resolution = asResolutionMap(assetResolution);
    const assets = compiledRequest.asset_bindings.map((binding, inputOrder) => {
      const item = resolution.get(binding.asset_id);
      const uri = resolvedUri(item);
      if (binding.required && !uri) fail(C.ASSET_RESOLUTION_MISSING, `Required asset ${binding.asset_id} has no resolved URI.`, { asset_id: binding.asset_id });
      const role = SLOT_ROLE[binding.adapter_slot] ?? "OTHER";
      return {
        asset_id: binding.asset_id,
        role,
        authority: binding.authority,
        required: binding.required,
        uri,
        mime_type: item?.mime_type ?? null,
        input_order: inputOrder,
        semantic_order: ORDER[role] ?? ORDER.OTHER,
        metadata: clone(item?.metadata ?? {})
      };
    }).sort((a, b) => a.semantic_order - b.semantic_order || a.input_order - b.input_order);

    const byId = new Map(assets.map((item) => [item.asset_id, item]));
    const identityAssets = assets.filter((item) => item.role === "SUBJECT_IDENTITY");
    const referenceAssets = assets.filter((item) => ["PRIMARY_REFERENCE", "SECONDARY_REFERENCE"].includes(item.role));
    if (compiledRequest.control_layer.preserve_identity && identityAssets.length > 0 && compiledRequest.identity_instructions.length === 0) fail(C.IDENTITY_BINDING_MISSING, "Identity authority is enabled but identity instructions are missing.");
    if (compiledRequest.control_layer.preserve_reference_authority && referenceAssets.length > 0 && compiledRequest.reference_instructions.length === 0) fail(C.REFERENCE_BINDING_MISSING, "Reference authority is enabled but reference instructions are missing.");
    for (const identity of compiledRequest.identity_instructions) {
      const bound = byId.get(identity.identity_asset_id);
      if (!bound || bound.role !== "SUBJECT_IDENTITY") fail(C.IDENTITY_BINDING_MISSING, `Identity asset ${identity.identity_asset_id} is missing or has the wrong role.`, { identity_asset_id: identity.identity_asset_id });
    }
    for (const reference of compiledRequest.reference_instructions) {
      const bound = byId.get(reference.reference_asset_id);
      if (!bound || !["PRIMARY_REFERENCE", "SECONDARY_REFERENCE"].includes(bound.role)) fail(C.REFERENCE_BINDING_MISSING, `Reference asset ${reference.reference_asset_id} is missing or has the wrong role.`, { reference_asset_id: reference.reference_asset_id });
    }
    if (compiledRequest.reference_instructions.length > 0 && !compiledRequest.control_layer.preserve_reference_authority) fail(C.INVALID_GENERATION_REQUEST, "Reference instructions require preserve_reference_authority.");
    if (compiledRequest.identity_instructions.length > 0 && !compiledRequest.control_layer.preserve_identity) fail(C.INVALID_GENERATION_REQUEST, "Identity instructions require preserve_identity.");
    if (compiledRequest.text_instructions.some((item) => item.exact_text_lock) && !compiledRequest.control_layer.preserve_text_locks) fail(C.INVALID_GENERATION_REQUEST, "Exact text requires preserve_text_locks.");
    if (compiledRequest.generation_mode === "EDIT" && !assets.some((item) => item.role === "EDIT_TARGET")) fail(C.ASSET_RESOLUTION_MISSING, "EDIT mode requires an EDIT_TARGET asset.");

    const group = (roles) => assets.filter((item) => roles.includes(item.role)).map(clone);
    const textMode = compiledRequest.text_instructions.some((item) => item.render_mode === "EXTERNAL_OVERLAY")
      ? "EXTERNAL_OVERLAY"
      : compiledRequest.text_instructions.some((item) => item.render_mode === "IN_IMAGE") ? "IN_IMAGE" : "NONE";
    const references = compiledRequest.reference_instructions.map((instruction, index) => {
      const asset = byId.get(instruction.reference_asset_id);
      return { reference_order: index, asset_id: asset.asset_id, role: asset.role, authority: asset.authority, uri: asset.uri, transfer_intensity: instruction.transfer_intensity, required_anchors: clone(instruction.required_anchors), do_not_copy: clone(instruction.do_not_copy), source_ref: instruction.source_ref };
    });

    const semanticRequest = {
      semantic_request_version: "1.0.0",
      semantic_request_id: `nbr-${compiledRequest.request_id}`,
      source_request: { request_id: compiledRequest.request_id, request_version: compiledRequest.schema_version, project_id: compiledRequest.project_id, run_id: compiledRequest.run_id, final_frame_spec_ref: clone(compiledRequest.final_frame_spec_ref) },
      model: { family: "NANO_BANANA", name: resolvedModel, semantic_profile_id: profile.profile_id, semantic_profile_version: profile.profile_version, provider_binding: profile.provider_binding },
      mode: compiledRequest.generation_mode,
      creative_authority: "NONE",
      instruction: { type: "FINAL_STATE_DESCRIPTION", final_visual_description: compiledRequest.compiled_instruction.final_visual_description, structured_blocks: clone(compiledRequest.compiled_instruction.structured_blocks ?? []) },
      assets: {
        ordered: assets,
        subject_identity: group(["SUBJECT_IDENTITY"]),
        base_images: group(["BASE_IMAGE", "PRODUCT"]),
        edit_target: group(["EDIT_TARGET"]),
        primary_references: group(["PRIMARY_REFERENCE"]),
        supporting_references: group(["SECONDARY_REFERENCE"]),
        logos: group(["LOGO"]),
        products: group(["PRODUCT"]),
        other: group(["OTHER"])
      },
      references,
      identities: clone(compiledRequest.identity_instructions),
      text: { mode: textMode, requirements: clone(compiledRequest.text_instructions) },
      output: clone(compiledRequest.output_parameters),
      controls: {
        execution_only: true,
        control_layer: clone(compiledRequest.control_layer),
        hard_locks: clone(compiledRequest.protected_fields),
        controlled_variation: clone(compiledRequest.variation_policy),
        negative_constraints: clone(compiledRequest.negative_constraints)
      },
      trace: { adapter_id: this.adapterId, source_request_id: compiledRequest.request_id, final_frame_spec_id: compiledRequest.final_frame_spec_ref.artifact_id }
    };
    return assertSemanticRequest(semanticRequest);
  }
}

export const nanoBananaSemanticProfile = Object.freeze(defaultProfile);
export const nanoBananaSemanticAdapter = new NanoBananaSemanticAdapter();
