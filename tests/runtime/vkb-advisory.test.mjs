import assert from "node:assert/strict";
import test from "node:test";
import { queryVkbAdvisory } from "../../src/vkb/query/vkb-query-engine.mjs";

test("VKB retrieves mechanisms for declared depth and integration problems", () => {
  const result = queryVkbAdvisory({ query_id: "vkb-retrieval", depth_needs: ["foreground depth and atmospheric planes"], integration_problem: "subject looks pasted into the environment" });
  const ids = result.recommended_mechanisms.map((item) => item.mechanism_id);
  assert.ok(ids.includes("VKB_MECH_ATMOSPHERIC_DEPTH_STACKING_V1"));
  assert.ok(ids.includes("VKB_MECH_FOREGROUND_OCCLUSION_V1"));
});

test("VKB filters irrelevant mechanisms", () => {
  const result = queryVkbAdvisory({ query_id: "vkb-filter", typography_problem: "kerning consistency in a legal footnote" });
  assert.equal(result.recommended_mechanisms.length, 0);
  assert.ok(result.trace.discarded_mechanisms.includes("VKB_MECH_FOREGROUND_OCCLUSION_V1"));
});

test("VKB does not output a final design composition, concept, camera, copy, or palette", () => {
  const result = queryVkbAdvisory({ query_id: "vkb-no-design", color_problem: "strong color contrast for focus" });
  const keys = JSON.stringify(result);
  for (const forbidden of ["final_composition", "final_concept", "final_camera", "final_copy", "final_palette", "selected_direction"]) assert.equal(keys.includes(`\"${forbidden}\"`), false);
});

test("VKB declares advisory-only authority", () => {
  const result = queryVkbAdvisory({ query_id: "vkb-authority", composition_problem: "controlled asymmetry and balance" });
  assert.equal(result.authority, "ADVISORY_ONLY");
  assert.ok(result.recommended_mechanisms.every((item) => item.authority === "ADVISORY_ONLY"));
});

test("VKB preserves mechanism anti-patterns", () => {
  const result = queryVkbAdvisory({ query_id: "vkb-antipattern", planned_mechanisms: ["Narrative Information Panels"] });
  assert.ok(result.anti_patterns.some((item) => /generic SaaS metrics/i.test(item.anti_pattern)));
});

test("VKB preserves mechanism interactions", () => {
  const result = queryVkbAdvisory({ query_id: "vkb-interactions", depth_needs: ["atmospheric depth planes"], lighting_problem: "lighting integration and scene light direction", planned_mechanisms: ["Atmospheric Depth Stacking", "Lighting Cohesion"] });
  assert.ok(result.mechanism_interactions.some((item) => item.type === "SUPPORTING_INTERACTION"));
});

