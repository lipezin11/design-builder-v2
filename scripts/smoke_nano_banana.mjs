#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validateNanoBananaConfig } from "../src/generators/config/nano-banana-config.mjs";
import { nanoBananaSemanticAdapter, nanoBananaSemanticProfile } from "../src/generators/adapters/nano-banana-adapter.mjs";
import { ThirdPartyNanoBananaTransport } from "../src/generators/transports/third-party-nano-banana-transport.mjs";
import { loadScenario } from "../src/validation/scenario-loader.mjs";

const configurationMessage = "Configure NANO_BANANA_API_KEY, NANO_BANANA_BASE_URL e NANO_BANANA_MODEL no .env antes do smoke test real.";

export async function runNanoBananaSmoke({ env = process.env, transportFactory = (options) => new ThirdPartyNanoBananaTransport(options) } = {}) {
  const validation = validateNanoBananaConfig(env);
  if (!validation.valid) return { status: "SKIPPED", reason: "CONFIGURATION_REQUIRED", provider_configured: false, message: configurationMessage };
  const loaded = loadScenario("no_reference_urgency");
  const assetResolution = Object.fromEntries(loaded.manifest.assets.map((asset) => [asset.asset_id, { uri: asset.mock_uri, metadata: asset.metadata }]));
  const semanticRequest = nanoBananaSemanticAdapter.adapt({ compiledRequest: loaded.artifacts.compiled_generation_request, assetResolution, profile: nanoBananaSemanticProfile, modelName: validation.config.model });
  const transport = transportFactory({ env });
  try {
    const response = await transport.generate(semanticRequest);
    return { status: "COMPLETED", reason: "PROVIDER_RESPONSE_RECEIVED", provider_configured: true, response };
  } catch (error) {
    return { status: "BLOCKED", reason: error.code ?? "SMOKE_TEST_FAILED", provider_configured: true, message: error.message };
  }
}

async function main() {
  const envPath = path.resolve(".env");
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") process.loadEnvFile(envPath);
  const result = await runNanoBananaSmoke();
  console.log(JSON.stringify(result, null, 2));
  if (result.status === "BLOCKED") process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
