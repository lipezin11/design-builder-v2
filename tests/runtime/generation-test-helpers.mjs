import { loadScenario } from "../../src/validation/scenario-loader.mjs";
import { nanoBananaSemanticAdapter, nanoBananaSemanticProfile } from "../../src/generators/adapters/nano-banana-adapter.mjs";

export const fixedDate = () => new Date("2026-08-10T16:00:00.000Z");
export const clone = structuredClone;
export function canonical(name) {
  const loaded = loadScenario(name);
  const assetResolution = Object.fromEntries(loaded.manifest.assets.map((asset) => [asset.asset_id, { uri: asset.mock_uri, mime_type: "image/png", metadata: asset.metadata }]));
  return { loaded, request: loaded.artifacts.compiled_generation_request, assetResolution };
}
export function syntheticResolution(request) {
  return Object.fromEntries(request.asset_bindings.map((asset) => [asset.asset_id, { uri: `mock://assets/${asset.asset_id}.png`, mime_type: "image/png", metadata: { data_classification: "MOCK_TEST_DATA" } }]));
}
export function adaptCanonical(name, requestMutator) {
  const data = canonical(name);
  const request = clone(data.request);
  requestMutator?.(request, data.assetResolution);
  return nanoBananaSemanticAdapter.adapt({ compiledRequest: request, assetResolution: data.assetResolution, profile: nanoBananaSemanticProfile, modelName: "nano-banana-mock-model" });
}
