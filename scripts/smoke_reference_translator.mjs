#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import { executeReferenceTranslator } from "../src/reference-translator/runtime/reference-translator-runtime.mjs";

export async function runReferenceTranslatorLiveSmoke(env = process.env) {
  const scenarioModule = env.REFERENCE_TRANSLATOR_LIVE_SCENARIO_MODULE;
  if (!scenarioModule) {
    return {
      status: "SKIP",
      provider_connected: false,
      reason: "REFERENCE_TRANSLATOR_LIVE_SCENARIO_MODULE is not configured. Deterministic tests remain fully available."
    };
  }
  const loaded = await import(pathToFileURL(path.resolve(scenarioModule)).href);
  const request = typeof loaded.createRequest === "function" ? await loaded.createRequest() : loaded.default;
  if (!request?.model_adapter) throw new TypeError("Live scenario module must provide a request with model_adapter.");
  const result = await executeReferenceTranslator(request);
  return {
    status: "PASS",
    provider_connected: true,
    run_id: result.trace.run_id,
    plan_id: result.plan.plan_id,
    schema_pass: result.trace.validation_outcomes.at(-1)?.schema === true,
    semantic_pass: result.trace.validation_outcomes.at(-1)?.semantic === true,
    quality_pass: result.trace.validation_outcomes.at(-1)?.quality === true
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/(.:)/, "$1"))) {
  const report = await runReferenceTranslatorLiveSmoke();
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.status === "PASS" || report.status === "SKIP" ? 0 : 1;
}
