import test from "node:test";
import assert from "node:assert/strict";
import { CompilerCore } from "../../src/compiler/compiler-core.mjs";
import { validateCompilerLoss } from "../../src/compiler/validation/compiler-loss-validator.mjs";
import { clone, loadScenario } from "./test-helpers.mjs";

const compiler = new CompilerCore({ clock: () => new Date("2026-08-10T03:00:00.000Z") });
const compile = (input, frame, options) => {
  const scenario = loadScenario(input, frame, options);
  return { finalFrameSpec: scenario.finalFrameSpec, request: compiler.compile(scenario).compiledRequest };
};
const expectCategory = (report, category) => {
  assert.equal(report.status, "BLOCK");
  assert.ok(report.losses.some((item) => item.category === category), `Expected ${category}: ${JSON.stringify(report.losses)}`);
};

test("Compiler Loss Validator: complete projection passes", () => {
  const { finalFrameSpec, request } = compile("strong_reference", "strong_reference_transfer");
  assert.deepEqual(validateCompilerLoss(finalFrameSpec, request).summary, { blocking: 0, warnings: 0 });
});

test("Compiler Loss Validator: detects identity loss", () => {
  const { finalFrameSpec, request } = compile("strong_reference", "strong_reference_transfer");
  request.control_layer.preserve_identity = false;
  expectCategory(validateCompilerLoss(finalFrameSpec, request), "IDENTITY_LOCK_LOSS");
});

test("Compiler Loss Validator: detects exact text loss", () => {
  const { finalFrameSpec, request } = compile("no_reference_thumbnail", "no_reference_urgency_thumbnail");
  request.text_instructions[0].content = "Encerramento do Carrinho";
  expectCategory(validateCompilerLoss(finalFrameSpec, request), "TEXT_LOCK_LOSS");
});

test("Compiler Loss Validator: detects composition loss", () => {
  const { finalFrameSpec, request } = compile("no_reference_thumbnail", "no_reference_urgency_thumbnail");
  request.protected_fields = request.protected_fields.filter((field) => field.field_id !== "system-composition");
  expectCategory(validateCompilerLoss(finalFrameSpec, request), "COMPOSITION_LOSS");
});

test("Compiler Loss Validator: detects reference dilution", () => {
  const { finalFrameSpec, request } = compile("strong_reference", "strong_reference_transfer");
  request.reference_instructions[0].transfer_intensity = "MEDIUM";
  expectCategory(validateCompilerLoss(finalFrameSpec, request), "REFERENCE_DILUTION");
});

test("Compiler Loss Validator: detects depth loss", () => {
  const { finalFrameSpec, request } = compile("strong_reference", "strong_reference_transfer");
  request.protected_fields = request.protected_fields.filter((field) => field.field_id !== "system-depth");
  expectCategory(validateCompilerLoss(finalFrameSpec, request), "DEPTH_LOSS");
});

test("Compiler Loss Validator: detects protected negative-space loss", () => {
  const { finalFrameSpec, request } = compile("website_hero", "website_hero_stylist");
  request.protected_fields = request.protected_fields.filter((field) => field.loss_category !== "NEGATIVE_SPACE_LOSS");
  expectCategory(validateCompilerLoss(finalFrameSpec, request), "NEGATIVE_SPACE_LOSS");
});

test("Compiler Loss Validator: detects variation escalation", () => {
  const { finalFrameSpec, request } = compile("website_hero", "website_hero_stylist");
  request.variation_policy.find((item) => item.domain === "environment_details").level = "HIGH";
  expectCategory(validateCompilerLoss(finalFrameSpec, request), "CONTROLLED_VARIATION_VIOLATION");
});

test("Compiler Loss Validator: detects hard-lock loss", () => {
  const { finalFrameSpec, request } = compile("strong_reference", "strong_reference_transfer");
  request.protected_fields = request.protected_fields.filter((field) => !field.field_id.startsWith("handoff-lock-"));
  expectCategory(validateCompilerLoss(finalFrameSpec, request), "HARD_LOCK_LOSS");
});