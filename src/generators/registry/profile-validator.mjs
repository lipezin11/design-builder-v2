import { CompilerError, COMPILER_ERROR_CODES } from "../../compiler/compiler-errors.mjs";

const INSTRUCTION_FORMATS = new Set(["PLAIN_TEXT", "STRUCTURED", "MULTIPART", "OTHER"]);
const GENERATION_MODES = new Set(["GENERATE", "EDIT", "REGENERATE", "VARIANT"]);
const CONFIDENCE_LEVELS = new Set(["LOW", "MEDIUM", "HIGH"]);
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function validateProfile(profile) {
  const errors = [];
  const requiredStrings = ["profile_id", "profile_version", "provider", "model_family", "model_name", "profile_type", "instruction_format", "adapter_id"];
  if (!isRecord(profile)) {
    errors.push("Profile must be an object.");
  } else {
    for (const field of requiredStrings) {
      if (typeof profile[field] !== "string" || profile[field].length === 0) errors.push(`${field} must be a non-empty string.`);
    }
    if (profile.profile_type !== "HYPOTHETICAL_TEST_PROFILE") errors.push("profile_type must be HYPOTHETICAL_TEST_PROFILE.");
    if (!INSTRUCTION_FORMATS.has(profile.instruction_format)) errors.push("instruction_format is unsupported.");
    if (!Array.isArray(profile.supported_generation_modes) || profile.supported_generation_modes.length === 0) {
      errors.push("supported_generation_modes must be a non-empty array.");
    } else if (profile.supported_generation_modes.some((mode) => !GENERATION_MODES.has(mode))) {
      errors.push("supported_generation_modes contains an unknown mode.");
    }
    if (!Array.isArray(profile.capabilities) || profile.capabilities.length === 0) {
      errors.push("capabilities must be a non-empty array.");
    } else {
      const ids = new Set();
      for (const capability of profile.capabilities) {
        if (!isRecord(capability) || typeof capability.capability_id !== "string" || typeof capability.supported !== "boolean") {
          errors.push("Each capability requires capability_id and boolean supported.");
          continue;
        }
        if (ids.has(capability.capability_id)) errors.push(`Duplicate capability: ${capability.capability_id}.`);
        ids.add(capability.capability_id);
        if (!CONFIDENCE_LEVELS.has(capability.confidence)) errors.push(`Invalid confidence for ${capability.capability_id}.`);
        if (typeof capability.source !== "string" || capability.source.length === 0) errors.push(`Missing source for ${capability.capability_id}.`);
      }
    }
    for (const field of ["limits", "asset_rules", "reference_rules", "text_rules", "edit_rules", "output_rules", "metadata"]) {
      if (!isRecord(profile[field])) errors.push(`${field} must be an object.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function assertValidProfile(profile) {
  const result = validateProfile(profile);
  if (!result.valid) throw new CompilerError(COMPILER_ERROR_CODES.INVALID_PROFILE, "Generator profile is invalid.", { errors: result.errors });
  return profile;
}