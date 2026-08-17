const FORBIDDEN_KEYS = new Set([
  "decision",
  "pass",
  "fail",
  "approve",
  "reject",
  "selected_direction",
  "critic_decision",
  "approval_status",
  "final_frame_spec",
  "compiled_generation_request",
  "generation_request",
  "generate",
  "regenerate",
  "score",
  "scores",
  "weight",
  "weights",
  "ranking",
  "rankings",
  "preference_weight",
  "cards_forbidden",
  "floating_elements_forbidden",
  "avoid_ai_look",
  "copy_positive_reference_layout",
  "reference_transfer_plan",
  "design_decision_map"
]);

const FORBIDDEN_AUTHORITIES = new Set([
  "CREATIVE_AUTHORITY",
  "EVALUATION_AUTHORITY",
  "APPROVAL_AUTHORITY",
  "GENERATION_AUTHORITY"
]);

export class AdvisoryAuthorityError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AdvisoryAuthorityError";
    this.code = code;
    this.details = details;
  }
}

function visit(value, path, violations, seen) {
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, `${path}[${index}]`, violations, seen));
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) violations.push({ path: childPath, reason: "FORBIDDEN_WRITE_CAPABILITY" });
    if (typeof child === "string" && FORBIDDEN_AUTHORITIES.has(child)) violations.push({ path: childPath, reason: "FORBIDDEN_AUTHORITY_CLAIM" });
    visit(child, childPath, violations, seen);
  }
}

export function inspectAdvisoryAuthority(payload) {
  const violations = [];
  visit(payload, "", violations, new WeakSet());
  return { valid: violations.length === 0, violations };
}

export function assertAdvisoryAuthority(payload, { source = "ADVISORY" } = {}) {
  const inspection = inspectAdvisoryAuthority(payload);
  if (!inspection.valid) {
    throw new AdvisoryAuthorityError(
      "ADVISORY_AUTHORITY_FIREWALL_VIOLATION",
      `${source} attempted to cross the advisory-only authority boundary.`,
      { source, violations: inspection.violations }
    );
  }
  return payload;
}

export function cloneForAdvisory(value) {
  return value === undefined ? undefined : structuredClone(value);
}

export function assertProtectedArtifactsUnchanged(before, after) {
  const domains = ["selected_direction", "critic_decision", "approval_status", "final_frame_spec", "compiled_generation_request", "generation_trigger"];
  const changed = domains.filter((domain) => JSON.stringify(before?.[domain]) !== JSON.stringify(after?.[domain]));
  if (changed.length) {
    throw new AdvisoryAuthorityError(
      "ADVISORY_PROTECTED_ARTIFACT_MUTATION",
      "Shadow-mode advisory execution mutated a protected downstream domain.",
      { changed }
    );
  }
  return true;
}

export const ADVISORY_CAPABILITIES = Object.freeze({
  authority: "ADVISORY_ONLY",
  may_select_direction: false,
  may_evaluate: false,
  may_approve: false,
  may_write_final_frame: false,
  may_write_compiled_request: false,
  may_trigger_generation: false,
  automatic_prompt_injection: false
});

