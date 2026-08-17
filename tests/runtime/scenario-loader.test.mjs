import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { canonicalScenarioRoot, loadScenario, resolveScenarioDirectory } from "../../src/validation/scenario-loader.mjs";

test("scenario loader resolves a canonical scenario by name", () => {
  const loaded = loadScenario("no_reference_urgency");
  assert.equal(loaded.manifest.scenario_id, "no_reference_urgency");
  assert.equal(loaded.artifacts.reference_transfer_plan, undefined);
  assert.equal(loaded.artifacts.final_frame_spec.frame_spec_id, "ffs-urgency-001");
});

test("scenario loader accepts an absolute scenario directory", () => {
  const directory = path.join(canonicalScenarioRoot, "strong_reference");
  const loaded = loadScenario(directory);
  assert.equal(loaded.directory, resolveScenarioDirectory(directory));
  assert.equal(loaded.artifacts.reference_transfer_plan.plan_id, "rtp-strong-ref-001");
});

test("scenario loader validates all six local schemas in reference mode", () => {
  const loaded = loadScenario("strong_reference");
  assert.deepEqual(Object.keys(loaded.artifacts).sort(), [
    "brief_spec", "compiled_generation_request", "compiler_input", "creative_direction_spec", "final_frame_spec", "reference_transfer_plan"
  ]);
});

test("scenario manifest assets provide one unique operational view", () => {
  const loaded = loadScenario("website_hero");
  assert.equal(loaded.assetsById.size, loaded.manifest.assets.length);
  assert.equal(loaded.assetsById.get("asset-stylist-001").role, "SUBJECT_IDENTITY");
});
