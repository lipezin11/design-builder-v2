import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { assembleReferenceTranslatorSystemPrompt } from "./reference-translator-knowledge-assembler.mjs";

export const REFERENCE_TRANSLATOR_PROMPT_VERSION = "REFERENCE_TRANSLATOR_AGENT_V1_1";
const schemaPath = fileURLToPath(new URL("../../../schemas/reference_transfer_plan.schema.json", import.meta.url));

export function loadReferenceTranslatorSystemPrompt() {
  return assembleReferenceTranslatorSystemPrompt();
}

const publicAsset = (asset) => ({
  asset_id: asset.asset_id,
  role: asset.role,
  visual_access: asset.visual_access,
  mime_type: asset.mime_type,
  product_category: asset.product_category,
  product_support_observation_ids: structuredClone(asset.product_support_observation_ids ?? []),
  literal_support_elements: structuredClone(asset.literal_support_elements ?? []),
  visible_reference_text: structuredClone(asset.visible_reference_text ?? []),
  brand_markers: structuredClone(asset.brand_markers ?? []),
  reference_subject_identities: structuredClone(asset.reference_subject_identities ?? []),
  ...(asset.visual_access === "STRUCTURED_TEST" ? { synthetic_observations: structuredClone(asset.synthetic_observations ?? []) } : {}),
  ...(asset.notes !== undefined ? { untrusted_reference_notes: structuredClone(asset.notes) } : {})
});

const imageInput = (asset) => ({
  asset_id: asset.asset_id,
  mime_type: asset.mime_type,
  ...(asset.uri ? { uri: asset.uri } : {}),
  ...(asset.bytes_base64 ? { bytes_base64: asset.bytes_base64 } : {})
});

const correctionDiagnosticForModel = (item) => {
  const allowedKeys = [
    "stage", "code", "path", "schema_path", "keyword", "message", "instruction",
    "received_value", "received_type", "expected_type", "allowed_values", "allowed_values_count",
    "required_property", "additional_property", "required_value", "limit", "actual_items",
    "duplicate_indexes", "schema_branch_count"
  ];
  return Object.fromEntries(allowedKeys
    .filter((key) => Object.prototype.hasOwnProperty.call(item, key) && item[key] !== undefined)
    .map((key) => [key, structuredClone(item[key])]));
};

export function buildReferenceTranslatorPromptRequest({
  readinessContext,
  briefSpec,
  referenceAssets,
  targetProductCategory,
  projectId,
  runId,
  attempt = 1,
  correctionDiagnostics = []
}) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const modelDiagnostics = correctionDiagnostics.map(correctionDiagnosticForModel);
  return {
    prompt_version: REFERENCE_TRANSLATOR_PROMPT_VERSION,
    system_prompt: loadReferenceTranslatorSystemPrompt(),
    structured_context: {
      authority_and_task: {
        agent: "REFERENCE_TRANSLATOR",
        authority: "REFERENCE_INTERPRETATION_ONLY",
        project_id: projectId ?? null,
        run_id: runId ?? null,
        attempt,
        correction_diagnostics: modelDiagnostics,
        ...(modelDiagnostics.length ? {
          correction_protocol: {
            authority: "CONTRACT_CORRECTION_ONLY",
            preserve_valid_semantic_decisions: true,
            correct_only_listed_violations: true,
            return_complete_reference_transfer_plan: true,
            raw_json_object_only: true,
            json_patch_forbidden: true,
            runtime_output_repair: false
          }
        } : {})
      },
      target_brief_and_protected_semantics: {
        brief_spec: structuredClone(briefSpec),
        protected_semantics: structuredClone(readinessContext.protected_semantics),
        identity_constraints: structuredClone(readinessContext.identity_constraints),
        target_product_category: targetProductCategory ?? null
      },
      reference_assets_and_scope: {
        assets: referenceAssets.map(publicAsset),
        transfer_scope: structuredClone(readinessContext.transfer_scope),
        untrusted_reference_context: structuredClone(readinessContext.reference_context ?? null)
      },
      advisories: {
        my_eyes: structuredClone(readinessContext.advisory.my_eyes?.compact_agent_context ?? readinessContext.advisory.my_eyes ?? null),
        vkb: structuredClone(readinessContext.advisory.vkb?.compact_agent_context ?? readinessContext.advisory.vkb ?? null),
        separation_preserved: true,
        authority: "ADVISORY_ONLY"
      },
      output_contract: {
        schema_name: "reference_transfer_plan",
        schema_version_expected: "1.0-compatible",
        raw_json_only: true
      }
    },
    multimodal_inputs: referenceAssets.filter((asset) => asset.visual_access === "MULTIMODAL").map(imageInput),
    output_contract: schema,
    generation_intent: {
      reasoning_consistency: "HIGH",
      creative_interpretation: "MODERATE_WITHIN_TRANSLATOR_AUTHORITY",
      structured_output_strictness: "STRICT"
    }
  };
}
