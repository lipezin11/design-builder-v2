#!/usr/bin/env node
import https from "node:https";

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

const apiKey = await readSecret();
const started = Date.now();
const response = await new Promise((resolve, reject) => {
  const request = https.request({
    hostname: "api.kie.ai",
    port: 443,
    path: "/api/v1/chat/credit",
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
  }, (incoming) => {
    let body = "";
    incoming.setEncoding("utf8");
    incoming.on("data", (chunk) => { body += chunk; });
    incoming.on("end", () => resolve({ status: incoming.statusCode, body }));
  });
  request.setTimeout(30000, () => request.destroy(new Error("Request timed out.")));
  request.on("error", reject);
  request.end();
});
const text = response.body;
let payload;
try { payload = JSON.parse(text); } catch { payload = { raw: text.slice(0, 500) }; }
console.log(JSON.stringify({ http_status: response.status, latency_ms: Date.now() - started, response: payload }, null, 2));
