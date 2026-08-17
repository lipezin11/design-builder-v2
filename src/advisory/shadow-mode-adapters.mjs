import { ADVISORY_CAPABILITIES, assertAdvisoryAuthority } from "./authority-firewall.mjs";
import { buildDesignAdvisoryContext } from "./design-advisory-context-builder.mjs";
import { queryMyEyesAdvisory } from "../my-eyes/query/my-eyes-query-engine.mjs";
import { queryVkbAdvisory } from "../vkb/query/vkb-query-engine.mjs";

export function getMyEyesAdvisory(query, options) {
  return assertAdvisoryAuthority(queryMyEyesAdvisory(structuredClone(query), options), { source: "MY_EYES_SHADOW_HOOK" });
}

export function getVkbAdvisory(query, options) {
  return assertAdvisoryAuthority(queryVkbAdvisory(structuredClone(query), options), { source: "VKB_SHADOW_HOOK" });
}

export function getDesignAdvisoryContext(input, options) {
  return assertAdvisoryAuthority(buildDesignAdvisoryContext(structuredClone(input), options), { source: "DESIGN_ADVISORY_SHADOW_HOOK" });
}

export const SHADOW_MODE_INTEGRATION = Object.freeze({
  mode: "SHADOW_ADVISORY",
  capabilities: ADVISORY_CAPABILITIES,
  consumers_required_to_obey: false,
  existing_prompt_injection: false,
  existing_runtime_behavior_changed: false
});

