import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateArtifact } from "../compiler/schema-validator.mjs";
import { CROSS_ARTIFACT_ERROR_CODES as C, CrossArtifactError } from "./cross-artifact-errors.mjs";

export const SCENARIO_ARTIFACTS = Object.freeze([
  "brief_spec", "reference_transfer_plan", "creative_direction_spec",
  "final_frame_spec", "compiler_input", "compiled_generation_request"
]);
const BASE_REQUIRED = SCENARIO_ARTIFACTS.filter((name) => name !== "reference_transfer_plan");
const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../tests/fixtures/scenarios");
const fail = (code, message, details) => { throw new CrossArtifactError(code, message, details); };
const readJson = (file, code) => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { fail(code, `Could not read valid JSON from ${file}.`, { file, cause: error.message }); }
};

function validateManifest(manifest) {
  const required = ["scenario_id", "scenario_version", "project_id", "description", "expected_pipeline_mode", "artifacts", "assets", "expected_status", "expected_compatibility", "expected_loss_validation", "tags"];
  const missing = required.filter((key) => !(key in manifest));
  if (manifest.type !== "CANONICAL_INTEGRATION_SCENARIO" || missing.length || typeof manifest.artifacts !== "object" || !Array.isArray(manifest.assets) || !Array.isArray(manifest.tags)) {
    fail(C.SCENARIO_MANIFEST_INVALID, "Scenario manifest is invalid.", { missing, type: manifest.type });
  }
  const ids = manifest.assets.map((asset) => asset.asset_id);
  if (ids.some((id) => typeof id !== "string") || new Set(ids).size !== ids.length) fail(C.SCENARIO_MANIFEST_INVALID, "Scenario assets must have unique string asset_id values.", { ids });
  for (const [name, descriptor] of Object.entries(manifest.artifacts)) {
    if (!SCENARIO_ARTIFACTS.includes(name) || !descriptor || descriptor.schema_name !== name || !descriptor.path || !descriptor.artifact_id || !descriptor.expected_version) {
      fail(C.SCENARIO_MANIFEST_INVALID, `Invalid artifact descriptor: ${name}.`, { name, descriptor });
    }
  }
  const missingArtifacts = BASE_REQUIRED.filter((name) => !manifest.artifacts[name]);
  if (missingArtifacts.length) fail(C.MISSING_ARTIFACT, "Manifest omits required artifacts.", { missing_artifacts: missingArtifacts });
}

export function resolveScenarioDirectory(input, root = defaultRoot) {
  return path.resolve(path.isAbsolute(input) ? input : path.join(root, input));
}

export function loadScenario(input, options = {}) {
  const directory = resolveScenarioDirectory(input, options.root ?? defaultRoot);
  const manifestPath = path.join(directory, "scenario_manifest.json");
  if (!fs.existsSync(manifestPath)) fail(C.MISSING_ARTIFACT, "scenario_manifest.json is missing.", { path: manifestPath });
  const manifest = readJson(manifestPath, C.SCENARIO_MANIFEST_INVALID);
  validateManifest(manifest);
  const declaredFiles = new Set(["scenario_manifest.json"]);
  const artifacts = {};
  for (const [name, descriptor] of Object.entries(manifest.artifacts)) {
    const file = path.resolve(directory, descriptor.path);
    const relative = path.relative(directory, file);
    if (relative.startsWith("..") || path.isAbsolute(relative)) fail(C.SCENARIO_MANIFEST_INVALID, `Artifact path escapes scenario directory: ${descriptor.path}.`, { name });
    declaredFiles.add(path.normalize(descriptor.path));
    if (!fs.existsSync(file)) fail(C.MISSING_ARTIFACT, `Declared artifact is missing: ${descriptor.path}.`, { name, path: file });
    artifacts[name] = readJson(file, C.LOCAL_SCHEMA_INVALID);
  }
  const unexpected = fs.readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !declaredFiles.has(path.normalize(entry.name))).map((entry) => entry.name);
  if (unexpected.length) fail(C.UNEXPECTED_ARTIFACT, "Scenario contains undeclared JSON artifacts.", { unexpected });
  const schemaErrors = [];
  for (const [name, artifact] of Object.entries(artifacts)) {
    const result = validateArtifact(name, artifact);
    if (!result.valid) schemaErrors.push({ artifact: name, errors: result.errors });
  }
  if (schemaErrors.length) fail(C.LOCAL_SCHEMA_INVALID, "Local artifact schema validation failed; deep validation was not run.", { schema_errors: schemaErrors });
  return { directory, manifestPath, manifest, artifacts, assetsById: new Map(manifest.assets.map((asset) => [asset.asset_id, asset])) };
}

export const canonicalScenarioRoot = defaultRoot;
