import { GENERATION_ERROR_CODES as C, NanoBananaConfigError } from "../generation-errors.mjs";

const FIELDS = Object.freeze([
  ["api_key", "NANO_BANANA_API_KEY", C.NANO_BANANA_API_KEY_NOT_CONFIGURED],
  ["base_url", "NANO_BANANA_BASE_URL", C.NANO_BANANA_BASE_URL_NOT_CONFIGURED],
  ["model", "NANO_BANANA_MODEL", C.NANO_BANANA_MODEL_NOT_CONFIGURED]
]);
const configuredValue = (value) => typeof value === "string" && value.trim().length > 0 && !value.trim().startsWith("SUBSTITUA_");

export function validateNanoBananaConfig(env = process.env) {
  const errors = [];
  const values = {};
  for (const [field, envName, code] of FIELDS) {
    const value = env?.[envName];
    if (!configuredValue(value)) errors.push({ code, field, env_name: envName });
    else values[field] = value.trim();
  }
  return { valid: errors.length === 0, provider_configured: errors.length === 0, config: errors.length === 0 ? Object.freeze({ ...values }) : null, errors };
}

export function assertNanoBananaConfig(env = process.env) {
  const result = validateNanoBananaConfig(env);
  if (!result.valid) throw new NanoBananaConfigError(result.errors[0].code, { missing_or_placeholder_fields: result.errors.map((item) => item.env_name) });
  return result.config;
}

export const loadNanoBananaConfig = assertNanoBananaConfig;
