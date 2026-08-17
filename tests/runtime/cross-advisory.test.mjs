import assert from "node:assert/strict";
import test from "node:test";
import { buildDesignAdvisoryContext } from "../../src/advisory/design-advisory-context-builder.mjs";

const floatingInput = (extra = {}) => ({
  context_id: `cross-${Math.random()}`,
  proposed_creative_direction: {
    planned_objects: ["floating foreground artifacts"],
    planned_mechanisms: ["Foreground Occlusion"],
    depth_needs: ["foreground floating depth and occlusion"],
    composition_problem: "create depth with suspended foreground objects",
    signals: { floating_elements: { present: true } }
  },
  ...extra
});

test("My Eyes and VKB tension is preserved", () => {
  const result = buildDesignAdvisoryContext(floatingInput());
  assert.ok(result.conflicts.some((item) => item.conflict_id === "CROSS_TENSION_FLOATING_FOREGROUND" && item.preservation_status === "PRESERVED_UNRESOLVED"));
});

test("cross-advisory tension is never auto-resolved", () => {
  const result = buildDesignAdvisoryContext(floatingInput());
  assert.deepEqual(result.trace.automatic_resolutions, []);
  assert.ok(result.conflicts.every((item) => item.resolution_authority === "FUTURE_CREATIVE_AGENT"));
});

test("conflicting advisories remain traceable to both full records", () => {
  const result = buildDesignAdvisoryContext(floatingInput());
  const conflict = result.conflicts.find((item) => item.conflict_id === "CROSS_TENSION_FLOATING_FOREGROUND");
  const myEyesRefs = new Set(result.my_eyes.relevant_preferences.map((item) => item.record_id));
  const vkbRefs = new Set(result.vkb.recommended_mechanisms.map((item) => item.record_id));
  assert.ok(conflict.my_eyes_refs.every((ref) => myEyesRefs.has(ref)));
  assert.ok(conflict.vkb_refs.every((ref) => vkbRefs.has(ref)));
});

test("overlapping My Eyes advisories are compressed without losing source IDs", () => {
  const result = buildDesignAdvisoryContext({ context_id: "cross-dedupe", proposed_creative_direction: { planned_complexity: "HIGH", planned_objects: ["many artifacts"], planned_effects: ["particles"], signals: { high_complexity: { present: true }, microeffects: { present: true, functional_purpose: false } } } });
  assert.ok(result.my_eyes.compact_agent_context.length < result.my_eyes.relevant_preferences.length);
  assert.ok(result.my_eyes.trace.compression_actions.some((item) => item.type === "SEMANTIC_MERGE"));
});

test("compact context references full advisory records", () => {
  const result = buildDesignAdvisoryContext(floatingInput());
  const myEyesRefs = new Set(result.my_eyes.relevant_preferences.map((item) => item.record_id));
  const vkbRefs = new Set(result.vkb.recommended_mechanisms.map((item) => item.record_id));
  assert.ok(result.compact_agent_context.my_eyes.flatMap((item) => item.full_record_refs).every((ref) => myEyesRefs.has(ref)));
  assert.ok(result.compact_agent_context.vkb.every((item) => vkbRefs.has(item.full_record_ref)));
});

test("independent advisory budgets are respected", () => {
  const result = buildDesignAdvisoryContext({
    context_id: "cross-budget",
    advisory_budget: { my_eyes_max_items: 2, vkb_max_items: 2 },
    proposed_creative_direction: {
      planned_complexity: "HIGH",
      planned_objects: ["floating generic dashboard cards"],
      planned_effects: ["particles", "unmotivated glow"],
      planned_color_behavior: "strong saturated contrast",
      planned_mechanisms: ["Foreground Occlusion", "Narrative Information Panels", "Atmospheric Depth Stacking"],
      depth_needs: ["foreground depth and atmospheric planes"],
      color_problem: "strong color contrast",
      composition_problem: "cards and dense asymmetric information",
      signals: { high_complexity: { present: true }, cards: { present: true, generic_dashboard_treatment: true }, floating_elements: { present: true }, microeffects: { present: true, functional_purpose: false }, generic_assembly: { present: true }, strong_color_impact: { present: true } }
    }
  });
  assert.ok(result.my_eyes.relevant_preferences.length <= 2);
  assert.ok(result.vkb.recommended_mechanisms.length <= 2);
});

