import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCapabilities } from "../../src/compiler/capability-resolver.mjs";
import { registry } from "./test-helpers.mjs";

const analyze = (profile, requirement) => analyzeCapabilities({ compilerInput: {}, finalFrameSpec: {}, profile, requirements: [requirement] });
const req = (capability_ref, hard = false) => ({ requirement_ref: `requirement.${capability_ref}`, capability_ref, hard, reason: "test" });

test("Capability Analyzer: fully compatible", () => {
  const result = analyze(registry.getProfile("profile-hypothetical-v1"), req("supports_exact_text", true));
  assert.equal(result.compatibility_status, "FULLY_COMPATIBLE");
});

test("Capability Analyzer: low-confidence support produces warning", () => {
  const result = analyze(registry.getProfile("profile-hypothetical-limited-v1"), req("supports_negative_constraints", false));
  assert.equal(result.compatibility_status, "COMPATIBLE_WITH_WARNINGS");
  assert.equal(result.capability_report.partially_supported_requirements[0].status, "PARTIAL");
});

test("Capability Analyzer: unsupported optional capability does not block", () => {
  const result = analyze(registry.getProfile("profile-hypothetical-limited-v1"), req("supports_multiple_outputs", false));
  assert.equal(result.compatibility_status, "COMPATIBLE_WITH_WARNINGS");
  assert.equal(result.capability_report.unsupported_requirements[0].recommended_action, "WARN");
});

test("Capability Analyzer: unsupported hard requirement blocks", () => {
  const result = analyze(registry.getProfile("profile-hypothetical-limited-v1"), req("supports_exact_text", true));
  assert.equal(result.compatibility_status, "BLOCKED_BY_CAPABILITY");
  assert.match(result.capability_report.unsupported_requirements[0].impact, /HARD_LOCK_VIOLATION/);
});

test("Capability Analyzer: unknown hard capability requires human decision", () => {
  const result = analyze(registry.getProfile("profile-hypothetical-v1"), req("supports_unknown_future_feature", true));
  assert.equal(result.compatibility_status, "HUMAN_DECISION_REQUIRED");
  assert.equal(result.capability_report.unknown_capabilities[0].status, "UNKNOWN");
});