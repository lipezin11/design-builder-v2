import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildReferenceTranslatorLiveCases, referenceTranslatorLiveManifest } from "../../src/reference-translator/evaluation/live-reference-translator-cases.mjs";
import { buildReferenceTranslatorHumanReviewPacket, evaluateBlockedLiveCase } from "../../src/reference-translator/evaluation/live-reference-translator-evaluator.mjs";
import { validateArtifact } from "../../src/compiler/schema-validator.mjs";

test("live manifest defines eight independent real-image cases and one smoke", () => {
  const cases = buildReferenceTranslatorLiveCases({ includeImageBytes: false });
  assert.equal(cases.length, 8);
  assert.equal(cases.filter((item) => item.smoke).length, 1);
  assert.equal(new Set(cases.map((item) => item.case_id)).size, 8);
  assert.ok(cases.every((item) => fs.existsSync(item.absolute_reference_path)));
  assert.ok(cases.every((item) => item.request.reference_assets[0].visual_access === "MULTIMODAL"));
  assert.ok(cases.every((item) => !("synthetic_observations" in item.request.reference_assets[0])));
  assert.ok(cases.every((item) => validateArtifact("brief_spec", item.request.brief_spec).valid));
});

test("live cases include actual image bytes only in execution memory", () => {
  const withBytes = buildReferenceTranslatorLiveCases({ includeImageBytes: true });
  const withoutBytes = buildReferenceTranslatorLiveCases({ includeImageBytes: false });
  assert.ok(withBytes.every((item) => item.request.reference_assets[0].bytes_base64.length > 1000));
  assert.ok(withoutBytes.every((item) => !("bytes_base64" in item.request.reference_assets[0])));
  assert.equal(JSON.stringify(referenceTranslatorLiveManifest()).includes("bytes_base64"), false);
});

test("required cognitive families are represented and missing product case is explicit", () => {
  const manifest = referenceTranslatorLiveManifest();
  const families = new Set(manifest.cases.map((item) => item.family));
  for (const family of [
    "STRONG_SAME_DOMAIN_REFERENCE",
    "PERSONAL_BRAND_HUMAN_SUBJECT",
    "HIGH_COMPLEXITY_REFERENCE",
    "MINIMAL_RESTRAINED_REFERENCE",
    "GENERIC_VISUAL_DEVICE_REFERENCE",
    "CARD_INFORMATION_ARTIFACT_REFERENCE",
    "SURFACE_COPY_TRAP",
    "FORMAT_MISMATCH_AND_MATERIAL_LIGHTING"
  ]) assert.ok(families.has(family));
  assert.equal(manifest.unavailable_required_case.family, "CROSS_CATEGORY_PRODUCT_REFERENCE");
  assert.equal(manifest.unavailable_required_case.status, "REAL_ASSET_UNAVAILABLE");
});

test("real advisory interfaces remain advisory-only in every live case", () => {
  const cases = buildReferenceTranslatorLiveCases({ includeImageBytes: false });
  for (const item of cases) {
    assert.equal(item.request.context.my_eyes_advisory.authority, "ADVISORY_ONLY");
    assert.equal(item.request.context.vkb_advisory.authority, "ADVISORY_ONLY");
  }
});

test("provider-blocked evaluation is categorical and cannot self-approve", () => {
  const caseRecord = buildReferenceTranslatorLiveCases({ includeImageBytes: false })[0];
  const result = evaluateBlockedLiveCase({
    caseRecord,
    error: { code: "MODEL_UNSUPPORTED_IMAGE", message: "text only" },
    invocation: { error: { code: "MODEL_UNSUPPORTED_IMAGE" } }
  });
  assert.equal(result.status, "PROVIDER_BLOCKED");
  assert.equal(result.creative_approval, "NOT_PERFORMED");
  assert.equal(result.checks.find((item) => item.category === "VISUAL_REFERENCE_ACTUALLY_ANALYZED").outcome, "FAIL");
  assert.equal(JSON.stringify(result).match(/"score"/gi), null);
});

test("human review packet includes run status, references, checks, and no approval", () => {
  const manifest = referenceTranslatorLiveManifest();
  const caseRecord = buildReferenceTranslatorLiveCases({ includeImageBytes: false })[0];
  const blocked = evaluateBlockedLiveCase({ caseRecord, error: { code: "MODEL_UNSUPPORTED_IMAGE", message: "text only" }, invocation: {} });
  const packet = buildReferenceTranslatorHumanReviewPacket({ suiteRunId: "unit-live", manifest, caseResults: [blocked] });
  assert.match(packet, /LIVE_RT_01_SAME_DOMAIN_AUTHORITY/);
  assert.match(packet, /NOT_RUN_AFTER_SMOKE_GATE/);
  assert.match(packet, /VISUAL_REFERENCE_ACTUALLY_ANALYZED: FAIL/);
  assert.match(packet, /Creative approval: NOT_PERFORMED/);
  assert.doesNotMatch(packet, /Creative approval: CREATIVELY_APPROVED/);
});
