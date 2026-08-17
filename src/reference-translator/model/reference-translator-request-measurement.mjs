import fs from "node:fs";
import { loadReferenceTranslatorKnowledgeModules, REFERENCE_TRANSLATOR_PROMPT_PATHS } from "../prompt/reference-translator-knowledge-assembler.mjs";

const json = (value) => JSON.stringify(value ?? null);
const chars = (value) => json(value).length;

export function buildReferenceTranslatorProviderUserText(request) {
  return [
    "Analyze every supplied image directly. Return exactly one raw JSON object matching the output contract; no Markdown, commentary, or hidden reasoning.",
    "DESIGN_BUILDER_STRUCTURED_CONTEXT",
    JSON.stringify(request.structured_context, null, 2),
    "REFERENCE_TRANSFER_PLAN_OUTPUT_CONTRACT",
    JSON.stringify(request.output_contract, null, 2),
    "GENERATION_INTENT",
    JSON.stringify(request.generation_intent, null, 2)
  ].join("\n\n");
}

export function measureReferenceTranslatorRequest(request, {
  providerBody,
  contextLimitTokens = null,
  outputBudgetTokens = 8192,
  actualInputTokens = null
} = {}) {
  const corePrompt = fs.readFileSync(REFERENCE_TRANSLATOR_PROMPT_PATHS.core_prompt, "utf8").replace(/\r\n/g, "\n").trimEnd();
  const modules = loadReferenceTranslatorKnowledgeModules();
  const knowledgeCharacters = modules.reduce((sum, module) => sum + module.content.length, 0);
  const userText = buildReferenceTranslatorProviderUserText(request);
  const advisories = request.structured_context?.advisories ?? {};
  const retryDiagnostics = request.structured_context?.authority_and_task?.correction_diagnostics ?? [];
  const totalTextualCharacters = request.system_prompt.length + userText.length;
  const estimatedInputTokens = Math.ceil(totalTextualCharacters / 4);
  const inputTokensForCapacity = Number.isInteger(actualInputTokens) ? actualInputTokens : estimatedInputTokens;
  const limit = Number.isInteger(contextLimitTokens) && contextLimitTokens > 0 ? contextLimitTokens : null;
  const headroom = limit === null ? null : limit - inputTokensForCapacity - outputBudgetTokens;
  const classification = limit === null
    ? "UNKNOWN"
    : headroom < 0
      ? "EXCEEDS_LIMIT"
      : headroom / limit <= 0.1
        ? "NEAR_LIMIT"
        : "SAFE";
  const images = request.multimodal_inputs ?? [];

  return {
    measurement_version: "1.0.0",
    prompt_version: request.prompt_version,
    core_prompt_characters: corePrompt.length,
    knowledge_characters: knowledgeCharacters,
    knowledge_wrapper_and_index_characters: Math.max(0, request.system_prompt.length - corePrompt.length - knowledgeCharacters),
    assembled_system_prompt_characters: request.system_prompt.length,
    schema_characters: chars(request.output_contract),
    brief_context_characters: chars(request.structured_context?.target_brief_and_protected_semantics),
    reference_context_characters: chars(request.structured_context?.reference_assets_and_scope),
    my_eyes_advisory_characters: chars(advisories.my_eyes),
    vkb_advisory_characters: chars(advisories.vkb),
    retry_diagnostic_characters: chars(retryDiagnostics),
    provider_user_text_characters: userText.length,
    total_textual_characters: totalTextualCharacters,
    multimodal_image_count: images.length,
    image_base64_transport_characters: images.reduce((sum, image) => sum + (image.bytes_base64?.length ?? 0), 0),
    serialized_http_body_characters: providerBody ? JSON.stringify(providerBody).length : null,
    input_tokens: Number.isInteger(actualInputTokens) ? actualInputTokens : estimatedInputTokens,
    input_token_measurement: Number.isInteger(actualInputTokens) ? "PROVIDER_REPORTED_ACTUAL" : "ESTIMATED_NOT_PROVIDER_EXACT",
    output_budget_tokens: outputBudgetTokens,
    context_limit_tokens: limit,
    headroom_tokens: headroom,
    context_classification: classification
  };
}
