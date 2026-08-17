import assert from "node:assert/strict";
import test from "node:test";
import { ADVISORY_CAPABILITIES, AdvisoryAuthorityError, assertAdvisoryAuthority, assertProtectedArtifactsUnchanged } from "../../src/advisory/authority-firewall.mjs";
import { SHADOW_MODE_INTEGRATION } from "../../src/advisory/shadow-mode-adapters.mjs";
import { queryMyEyesAdvisory } from "../../src/my-eyes/query/my-eyes-query-engine.mjs";
import { queryVkbAdvisory } from "../../src/vkb/query/vkb-query-engine.mjs";

const rejected = (payload) => assert.throws(() => assertAdvisoryAuthority(payload), AdvisoryAuthorityError);

test("My Eyes advisory cannot create a selected creative direction", () => rejected({ authority: "ADVISORY_ONLY", selected_direction: { concept: "x" } }));

test("VKB advisory cannot create a selected creative direction", () => rejected({ authority: "ADVISORY_ONLY", selected_direction: "VKB selection" }));

test("advisory cannot set critic outcome", () => rejected({ authority: "ADVISORY_ONLY", critic_decision: "FAIL" }));

test("advisory cannot set approval status", () => rejected({ authority: "ADVISORY_ONLY", approval_status: "APPROVED" }));

test("advisory execution cannot mutate Final Frame Spec", () => {
  const protectedState = { final_frame_spec: { frame_spec_id: "frame-1", status: "FROZEN" } };
  const before = structuredClone(protectedState);
  queryMyEyesAdvisory({ query_id: "firewall-frame", creative_context: { planned_complexity: "LOW" } });
  assert.equal(assertProtectedArtifactsUnchanged(before, protectedState), true);
  assert.throws(() => assertProtectedArtifactsUnchanged(before, { final_frame_spec: { frame_spec_id: "frame-1", status: "MUTATED" } }), AdvisoryAuthorityError);
});

test("advisory execution cannot mutate compiled generation request", () => {
  const protectedState = { compiled_generation_request: { request_id: "request-1", prompt: "frozen" } };
  const before = structuredClone(protectedState);
  queryVkbAdvisory({ query_id: "firewall-request", composition_problem: "controlled asymmetry" });
  assert.equal(assertProtectedArtifactsUnchanged(before, protectedState), true);
  assert.throws(() => assertProtectedArtifactsUnchanged(before, { compiled_generation_request: { request_id: "request-1", prompt: "changed" } }), AdvisoryAuthorityError);
});

test("advisory cannot trigger generation or inject itself into prompts", () => {
  assert.equal(ADVISORY_CAPABILITIES.may_trigger_generation, false);
  assert.equal(ADVISORY_CAPABILITIES.automatic_prompt_injection, false);
  assert.equal(SHADOW_MODE_INTEGRATION.existing_prompt_injection, false);
  assert.equal(SHADOW_MODE_INTEGRATION.existing_runtime_behavior_changed, false);
  rejected({ authority: "ADVISORY_ONLY", generate: true });
});

test("mutation fields for bans, vague labels, weights, and layout copying are rejected", () => {
  for (const payload of [
    { cards_forbidden: true },
    { floating_elements_forbidden: true },
    { avoid_ai_look: true },
    { preference_weight: 0.9 },
    { copy_positive_reference_layout: true }
  ]) rejected(payload);
});

