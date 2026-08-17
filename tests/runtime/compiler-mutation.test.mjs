import test from "node:test";
import assert from "node:assert/strict";
import { CompilerCore } from "../../src/compiler/compiler-core.mjs";
import { validateCompilerLoss } from "../../src/compiler/validation/compiler-loss-validator.mjs";
import { alignCompilerInput, clone, loadJson, loadScenario } from "./test-helpers.mjs";

const compiler = new CompilerCore({ clock: () => new Date("2026-08-10T03:00:00.000Z") });
const block = (frame, request, category) => {
  const report = validateCompilerLoss(frame, request);
  assert.equal(report.status, "BLOCK");
  assert.ok(report.losses.some((item) => item.category === category));
};

test("Mutation: removing subject identity protection blocks", () => {
  const scenario = loadScenario("strong_reference", "strong_reference_transfer");
  const request = clone(compiler.compile(scenario).compiledRequest);
  request.control_layer.preserve_identity = false;
  request.identity_instructions = [];
  request.protected_fields = request.protected_fields.filter((field) => field.loss_category !== "IDENTITY_LOCK_LOSS");
  block(scenario.finalFrameSpec, request, "IDENTITY_LOCK_LOSS");
});

test("Mutation: VERY_HIGH to MEDIUM reference intensity blocks", () => {
  const frame = loadJson("tests/fixtures/final_frame_spec/strong_reference_transfer.json");
  frame.reference_constraints.transfer_intensity = "VERY_HIGH";
  const raw = loadJson("tests/fixtures/compiler_input/strong_reference.json");
  const compilerInput = alignCompilerInput(raw, frame);
  const request = clone(compiler.compile({ compilerInput, finalFrameSpec: frame }).compiledRequest);
  request.reference_instructions[0].transfer_intensity = "MEDIUM";
  block(frame, request, "REFERENCE_DILUTION");
});

test("Mutation: changing one locked headline letter blocks", () => {
  const scenario = loadScenario("no_reference_thumbnail", "no_reference_urgency_thumbnail");
  const request = clone(compiler.compile(scenario).compiledRequest);
  request.text_instructions[0].content = "ENCERRAMENTO DO CARRINH0";
  block(scenario.finalFrameSpec, request, "TEXT_LOCK_LOSS");
});

test("Mutation: removing protected negative-space region blocks", () => {
  const scenario = loadScenario("website_hero", "website_hero_stylist");
  const request = clone(compiler.compile(scenario).compiledRequest);
  request.protected_fields = request.protected_fields.filter((field) => field.loss_category !== "NEGATIVE_SPACE_LOSS");
  block(scenario.finalFrameSpec, request, "NEGATIVE_SPACE_LOSS");
});

test("Mutation: increasing composition freedom from NONE to MEDIUM blocks", () => {
  const scenario = loadScenario("no_reference_thumbnail", "no_reference_urgency_thumbnail");
  const request = clone(compiler.compile(scenario).compiledRequest);
  request.variation_policy.find((item) => item.domain === "composition").level = "MEDIUM";
  block(scenario.finalFrameSpec, request, "COMPOSITION_LOSS");
});