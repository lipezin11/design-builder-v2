#!/usr/bin/env node

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
const response = await fetch("https://integrate.api.nvidia.com/v1/models", {
  headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
});
const body = await response.text();
if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}.`);
const parsed = JSON.parse(body);
const ids = (parsed.data ?? []).map((item) => item.id).filter(Boolean).sort();
console.log(JSON.stringify({ count: ids.length, ids }, null, 2));
