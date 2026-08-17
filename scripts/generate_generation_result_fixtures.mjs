import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "tests/fixtures/generation_result");
const clone = structuredClone;
const at = "2026-08-10T16:00:00.000Z";
const base = {
  schema_version: "1.0.0",
  generation_id: "gen-fixture-single-001",
  project_id: "project-generation-fixture",
  run_id: "run-generation-fixture-001",
  request_ref: { artifact_id: "cgr-fixture-001", artifact_version: "1.0.0", artifact_uri: "artifact://compiled-generation-request/cgr-fixture-001/1.0.0" },
  final_frame_spec_ref: { artifact_id: "ffs-fixture-001", artifact_version: "1.0.0", artifact_uri: "artifact://final-frame/ffs-fixture-001/1.0.0" },
  provider: { provider_id: "fixture-third-party", provider_type: "THIRD_PARTY", configured: true, protocol_status: "CONFIGURED" },
  model: { family: "NANO_BANANA", name: "fixture-model-name" },
  generation_mode: "GENERATE",
  status: "SUCCEEDED",
  outputs: [{ output_id: "output-001", type: "IMAGE", uri: "fixture://generations/output-001.png", mime_type: "image/png", width: 1920, height: 1080, aspect_ratio: "16:9", index: 0, checksum: "sha256:fixture-output-001", provider_asset_id: "provider-asset-001", metadata: { data_classification: "FIXTURE" } }],
  provider_metadata: { provider_request_id: "provider-request-001", provider_generation_id: "provider-generation-001", raw_status: "fixture-success", model_name: "fixture-model-name", response_metadata: { data_classification: "FIXTURE" } },
  timing: { requested_at: at, started_at: at, completed_at: at, duration_ms: 0 },
  usage: { cost: null, credits: null, units: null, currency: null, processing_metrics: { data_classification: "FIXTURE" } },
  warnings: [],
  errors: [],
  provenance: { producer: "GENERATION_SERVICE", producer_version: "1.0.0", created_at: at, sources: ["COMPILED_GENERATION_REQUEST", "NANO_BANANA_SEMANTIC_ADAPTER", "PROVIDER_TRANSPORT"] },
  trace: { adapter_id: "nano-banana-semantic-adapter-v1", transport_id: "fixture-transport", semantic_request_id: "nbr-fixture-001", creative_authority: "NONE", provider_configured: true }
};
const fixtures = {};
fixtures["successful_single_image.json"] = clone(base);
const multiple = clone(base);
multiple.generation_id = "gen-fixture-multiple-001";
multiple.outputs.push({ ...clone(multiple.outputs[0]), output_id: "output-002", uri: "fixture://generations/output-002.png", index: 1, checksum: "sha256:fixture-output-002", provider_asset_id: "provider-asset-002" });
fixtures["successful_multiple_images.json"] = multiple;
const edit = clone(base);
edit.generation_id = "gen-fixture-edit-001";
edit.generation_mode = "EDIT";
edit.outputs[0].metadata = { data_classification: "FIXTURE", edit_target_preserved: true };
fixtures["edit_success.json"] = edit;
const warning = clone(base);
warning.generation_id = "gen-fixture-warning-001";
warning.warnings = [{ code: "PROVIDER_METADATA_PARTIAL", message: "Optional dimensions were not returned by the fixture provider.", severity: "WARNING", source: "PROVIDER", retryable: false }];
delete warning.outputs[0].width;
delete warning.outputs[0].height;
fixtures["generation_with_warning.json"] = warning;
const mock = clone(base);
mock.generation_id = "gen-mock-provider-001";
mock.provider = { provider_id: "mock-provider", provider_type: "MOCK", configured: true, protocol_status: "MOCK" };
mock.outputs[0].uri = "mock://generations/generated-image-001.png";
mock.outputs[0].metadata = { data_classification: "MOCK_TEST_DATA" };
mock.provider_metadata = { provider_request_id: "mock-request-001", provider_generation_id: "mock-generation-001", raw_status: "MOCK_SUCCESS", model_name: "nano-banana-mock-model", response_metadata: { data_classification: "MOCK_TEST_DATA" } };
mock.model.name = "nano-banana-mock-model";
mock.trace.transport_id = "mock-provider-transport-v1";
fixtures["mock_provider_success.json"] = mock;
fs.mkdirSync(outputDir, { recursive: true });
for (const [name, value] of Object.entries(fixtures)) fs.writeFileSync(path.join(outputDir, name), JSON.stringify(value, null, 2) + "\n", "utf8");
