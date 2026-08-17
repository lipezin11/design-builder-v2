import { assertAdvisoryAuthority, cloneForAdvisory } from "../../advisory/authority-firewall.mjs";

const TOP_LEVEL_KEYS = new Set([
  "context_id", "brief_ref", "reference_context", "my_eyes_advisory", "vkb_advisory",
  "protected_semantics", "identity_constraints", "transfer_scope"
]);

function rejectUnknown(input) {
  const unknown = Object.keys(input).filter((key) => !TOP_LEVEL_KEYS.has(key));
  if (unknown.length) throw new TypeError(`Reference Translator context input contains unsupported fields: ${unknown.join(", ")}.`);
}

function validateBriefRef(briefRef) {
  if (!briefRef || typeof briefRef !== "object" || Array.isArray(briefRef)) throw new TypeError("brief_ref is required.");
  if (typeof briefRef.artifact_id !== "string" || !briefRef.artifact_id.trim()) throw new TypeError("brief_ref.artifact_id is required.");
  if (typeof briefRef.schema_version !== "string" || !briefRef.schema_version.trim()) throw new TypeError("brief_ref.schema_version is required.");
}

function validateAdvisory(advisory, label) {
  if (advisory === undefined) return;
  if (!advisory || typeof advisory !== "object" || Array.isArray(advisory)) throw new TypeError(`${label} must be an advisory object.`);
  if (advisory.authority !== "ADVISORY_ONLY") throw new TypeError(`${label} must retain ADVISORY_ONLY authority.`);
  assertAdvisoryAuthority(advisory, { source: label });
}

export class ReferenceTranslatorContextBuilder {
  build(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Reference Translator context input must be an object.");
    rejectUnknown(input);
    if (typeof input.context_id !== "string" || !input.context_id.trim()) throw new TypeError("context_id is required.");
    validateBriefRef(input.brief_ref);
    validateAdvisory(input.my_eyes_advisory, "my_eyes_advisory");
    validateAdvisory(input.vkb_advisory, "vkb_advisory");
    for (const field of ["protected_semantics", "identity_constraints", "transfer_scope"]) {
      if (input[field] !== undefined && !Array.isArray(input[field])) throw new TypeError(`${field} must be an array.`);
    }
    assertAdvisoryAuthority(input, { source: "REFERENCE_TRANSLATOR_CONTEXT_INPUT" });

    const notices = [];
    if (input.reference_context === undefined) notices.push("Reference context is optional and was not supplied.");
    if (input.my_eyes_advisory === undefined) notices.push("My Eyes advisory is optional and was not supplied.");
    if (input.vkb_advisory === undefined) notices.push("VKB advisory is optional and was not supplied.");
    const result = {
      schema_version: "1.0.0",
      context_id: input.context_id,
      context_type: "REFERENCE_TRANSLATOR_READINESS_CONTEXT",
      brief_ref: cloneForAdvisory(input.brief_ref),
      ...(input.reference_context !== undefined ? { reference_context: cloneForAdvisory(input.reference_context) } : {}),
      advisory: {
        my_eyes: cloneForAdvisory(input.my_eyes_advisory) ?? null,
        vkb: cloneForAdvisory(input.vkb_advisory) ?? null,
        separation_preserved: true
      },
      protected_semantics: cloneForAdvisory(input.protected_semantics) ?? [],
      identity_constraints: cloneForAdvisory(input.identity_constraints) ?? [],
      transfer_scope: cloneForAdvisory(input.transfer_scope) ?? [],
      validation: {
        brief_reference_present: true,
        reference_context_optional: true,
        advisory_authorities_valid: true,
        protected_semantics_preserved: true,
        identity_constraints_preserved: true,
        notices
      },
      authority_boundaries: {
        builder: "CONTEXT_PACKAGING_ONLY",
        future_translator: "IMPLEMENTED_AS_SEPARATE_RUNTIME",
        creative_translation_performed: false,
        transfer_choices_created: false,
        output_plan_created: false,
        downstream_prompt_injection: false
      },
      trace: {
        context_id: input.context_id,
        rules_applied: ["BRIEF_REFERENCE_REQUIRED", "ADVISORIES_REMAIN_SEPARATE", "PROTECTED_SEMANTICS_CLONED", "IDENTITY_CONSTRAINTS_CLONED", "NO_CREATIVE_TRANSLATION"],
        structured_rationale_only: true,
        hidden_reasoning_persisted: false
      },
      authority: "CONTEXT_PACKAGING_ONLY"
    };
    assertAdvisoryAuthority(result, { source: "REFERENCE_TRANSLATOR_READINESS_CONTEXT" });
    return result;
  }
}

export function buildReferenceTranslatorContext(input) {
  return new ReferenceTranslatorContextBuilder().build(input);
}

