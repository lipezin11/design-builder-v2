#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readSecret() {
  process.stdout.write("WAITING_FOR_API_KEY_STDIN\n");
  return new Promise((resolve, reject) => {
    let value = "";
    const raw = process.stdin.isTTY && typeof process.stdin.setRawMode === "function";
    if (raw) process.stdin.setRawMode(true);
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      value += chunk;
      const match = value.match(/[\r\n]/);
      if (!match) return;
      if (raw) process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write(raw ? "\n" : "");
      const secret = value.slice(0, match.index).trim();
      if (!secret) reject(new Error("Empty API key."));
      else resolve(secret);
    });
    process.stdin.on("error", reject);
  });
}

function parseSimpleJson(content) {
  if (typeof content !== "string") return null;
  const unfenced = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(unfenced); }
  catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try { return JSON.parse(unfenced.slice(start, end + 1)); }
    catch { return null; }
  }
}

const modelId = argument("--model");
const imagePath = path.resolve(argument("--image") || "data/my_eyes/approved/16.jpeg");
const safeModelId = modelId?.replace(/[^a-z0-9_-]+/gi, "_") || "unknown";
const reportPath = path.resolve(argument("--report") || `data/reference-translator/model-preflight/${safeModelId}.json`);
if (!modelId) throw new Error("--model is required.");
const apiKey = await readSecret();
const imageBytes = fs.readFileSync(imagePath);
const imageData = `data:image/jpeg;base64,${imageBytes.toString("base64")}`;
const requestBody = {
  model: modelId,
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "Observe the attached image. Return only compact JSON with exactly these keys: {\"image_received\":true,\"short_description\":\"one concrete visible detail\"}." },
      { type: "image_url", image_url: { url: imageData } }
    ]
  }],
  temperature: 0.2,
  max_tokens: 128,
  seed: 42,
  stream: false
};

const started = Date.now();
let report;
try {
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(120000)
  });
  const responseText = await response.text();
  let payload = null;
  try { payload = JSON.parse(responseText); } catch {}
  const content = payload?.choices?.[0]?.message?.content;
  const simple = parseSimpleJson(content);
  const unsupported = /image[^\n]{0,80}(unsupported|not supported|cannot|unable)|unsupported[^\n]{0,80}image/i.test(String(responseText));
  const passed = response.ok && !unsupported && simple?.image_received === true && typeof simple?.short_description === "string" && simple.short_description.trim().length > 0;
  report = {
    model_id: modelId,
    http_status: response.status,
    result: response.ok ? "RESPONSE_RETURNED" : "HTTP_REJECTED",
    model_endpoint_accessible: response.status !== 404,
    multimodal_supported_in_practice: passed,
    latency_ms: Date.now() - started,
    selected_or_rejected: passed ? "SELECTED" : "REJECTED",
    rejection_reason: passed ? null : unsupported ? "IMAGE_INPUT_UNSUPPORTED" : payload?.error?.message || "EXPECTED_MULTIMODAL_JSON_NOT_RETURNED",
    response_excerpt: typeof content === "string" ? content.slice(0, 500) : null,
    image: { path: imagePath, byte_length: imageBytes.length }
  };
} catch (error) {
  report = {
    model_id: modelId,
    http_status: null,
    result: "TRANSPORT_ERROR",
    model_endpoint_accessible: false,
    multimodal_supported_in_practice: false,
    latency_ms: Date.now() - started,
    selected_or_rejected: "REJECTED",
    rejection_reason: error?.name === "TimeoutError" ? "TIMEOUT" : error?.message || String(error),
    response_excerpt: null,
    image: { path: imagePath, byte_length: imageBytes.length }
  };
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ ...report, report_path: reportPath }, null, 2));
