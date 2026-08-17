import assert from "node:assert/strict";
import test from "node:test";
import { queryMyEyesAdvisory, CONCRETE_GENERIC_SIGNALS } from "../../src/my-eyes/query/my-eyes-query-engine.mjs";

const query = (creative_context, extra = {}) => queryMyEyesAdvisory({ query_id: `test-${Math.random()}`, creative_context, ...extra });
const ids = (result) => result.relevant_preferences.map((item) => item.preference_id);
const keysMatching = (value, expression, found = []) => {
  if (Array.isArray(value)) value.forEach((item) => keysMatching(item, expression, found));
  else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) {
    if (expression.test(key)) found.push(key);
    keysMatching(child, expression, found);
  }
  return found;
};

test("My Eyes query returns only preferences relevant to structured context", () => {
  const result = query({ planned_effects: ["particles"], signals: { microeffects: { present: true, functional_purpose: false } } });
  assert.deepEqual(ids(result), ["MYE_PREF_000011", "MYE_PREF_000009"]);
  assert.equal(result.trace.eligible_preferences.length, 2);
  assert.equal(result.trace.returned_preferences.length, 2);
});

test("unrelated card preference is omitted", () => {
  const result = query({ concept: "single portrait", planned_complexity: "LOW" });
  assert.equal(ids(result).includes("MYE_PREF_000016"), false);
  assert.equal(result.trace.filtered_preferences.includes("MYE_PREF_000016"), true);
});

test("card context returns card advisory", () => {
  const result = query({ planned_objects: ["project cards"], signals: { cards: { present: true } } });
  assert.equal(ids(result).includes("MYE_PREF_000016"), true);
});

test("card advisory never forbids cards", () => {
  const result = query({ planned_objects: ["dashboard cards"], signals: { cards: { present: true, generic_dashboard_treatment: true } } });
  const text = JSON.stringify(result).toLowerCase();
  assert.equal(text.includes("cards are forbidden"), false);
  assert.equal(result.conditional_acceptances.some((item) => item.preference_id === "MYE_PREF_000016"), true);
});

test("generic artificial assembly is decomposed into concrete operational signals", () => {
  const result = query({ planned_objects: ["generic dashboard cards"], planned_effects: ["arbitrary particles"], signals: { cards: { present: true, generic_dashboard_treatment: true }, generic_assembly: { present: true } } });
  const generic = result.relevant_preferences.find((item) => item.preference_id === "MYE_PREF_000010");
  assert.ok(generic);
  assert.ok(generic.operational_signals.length >= 2);
  assert.ok(generic.operational_signals.every((item) => CONCRETE_GENERIC_SIGNALS.includes(item)));
});

test("generic advisory never uses a vague AI label as its instruction", () => {
  const result = query({ planned_effects: ["unmotivated glow"], signals: { generic_assembly: { present: true, concrete_signals: ["unmotivated glow"] } } });
  const generic = result.relevant_preferences.find((item) => item.preference_id === "MYE_PREF_000010");
  assert.doesNotMatch(generic.actionable_insight, /avoid ai look|less ai-generated/i);
  assert.match(generic.actionable_insight, /interchangeable|lighting|filler|microeffects/i);
});

test("microdetail context returns its relevant warning", () => {
  const result = query({ planned_effects: ["particles", "small glows", "mini lines"], signals: { microeffects: { present: true, functional_purpose: false } } });
  const record = result.relevant_preferences.find((item) => item.preference_id === "MYE_PREF_000011");
  assert.ok(record);
  assert.match(record.warnings[0], /functionless detail|mental noise/i);
});

test("high complexity does not become an element-count reduction rule", () => {
  const result = query({ planned_complexity: "HIGH", planned_objects: ["many project artifacts"], signals: { high_complexity: { present: true } } });
  const record = result.relevant_preferences.find((item) => item.preference_id === "MYE_PREF_000008");
  const actionable = [record.actionable_insight, ...record.warnings, ...result.conditional_acceptances.map((item) => item.statement)].join(" ");
  assert.ok(record);
  assert.doesNotMatch(actionable, /reduce element count/i);
  assert.ok(record.explicitly_not_claimed.includes("fewer_elements_are_better"));
});

test("positive card evidence can be returned", () => {
  const result = query({ planned_objects: ["specific project screens"], signals: { cards: { present: true, content_specific: true, coherent_grouping: true, narrative_role: true } } });
  assert.equal(result.positive_references[0].image_id, "MYE_IMG_000006");
  assert.equal(result.positive_references[0].reference_ref, "data/my_eyes/approved/6.png");
});

test("positive card reference is never a template instruction", () => {
  const result = query({ signals: { cards: { present: true, content_specific: true, coherent_grouping: true, narrative_role: true } } });
  const reference = result.positive_references[0];
  assert.equal(reference.is_template, false);
  assert.match(reference.usage_boundary, /do not reproduce/i);
  assert.doesNotMatch(JSON.stringify(reference), /place \d+ cards|degree angles/i);
});

test("evidence references are preserved from full record to aggregate output", () => {
  const result = query({ planned_depth_behavior: "floating foreground", signals: { floating_elements: { present: true } } });
  const record = result.relevant_preferences.find((item) => item.preference_id === "MYE_PREF_000012");
  assert.ok(record.evidence_refs.length > 0);
  assert.ok(record.evidence_refs.every((ref) => result.evidence_refs.includes(ref)));
});

test("human confirmation and model version provenance are preserved", () => {
  const result = query({ planned_color_behavior: "strong chromatic impact", signals: { strong_color_impact: { present: true } } });
  const record = result.relevant_preferences.find((item) => item.preference_id === "MYE_PREF_000013");
  assert.equal(record.human_confirmation_status, "HUMAN_CONFIRMED");
  assert.equal(record.preference_version, 1);
  assert.equal(result.model_ref.model_id, "MYE_MODEL_000001");
});

test("My Eyes advisory contains no score fields", () => {
  const result = query({ planned_complexity: "HIGH", signals: { high_complexity: { present: true } } });
  assert.deepEqual(keysMatching(result, /^scores?$/i), []);
});

test("My Eyes advisory contains no preference weight fields", () => {
  const result = query({ planned_color_behavior: "strong color", signals: { strong_color_impact: { present: true } } });
  assert.deepEqual(keysMatching(result, /weight/i), []);
});

test("My Eyes advisory contains no ranking fields", () => {
  const result = query({ planned_objects: ["floating object"], signals: { floating_elements: { present: true } } });
  assert.deepEqual(keysMatching(result, /ranking/i), []);
});
