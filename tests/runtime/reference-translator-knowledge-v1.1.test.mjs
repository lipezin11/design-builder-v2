import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { buildReferenceTranslatorKnowledge } from "../../scripts/generate_reference_translator_knowledge_v1_1.mjs";
import {
  assembleReferenceTranslatorSystemPrompt,
  getReferenceTranslatorPromptMetrics,
  loadReferenceTranslatorKnowledgeIndex,
  loadReferenceTranslatorKnowledgeModules
} from "../../src/reference-translator/prompt/reference-translator-knowledge-assembler.mjs";
import { REFERENCE_TRANSLATOR_PROMPT_VERSION } from "../../src/reference-translator/prompt/reference-translator-prompt-builder.mjs";

const occurrences = (text, needle) => text.split(needle).length - 1;

test("v1.1 knowledge generator is deterministic and checked-in modules have no drift", () => {
  assert.deepEqual(buildReferenceTranslatorKnowledge({ check: true }), {
    status: "PASS",
    module_count: 14,
    module_non_empty_lines: 4650,
    mechanism_entries: 195,
    synthetic_teaching_cases: 76,
    cross_domain_cases: 120,
    failure_patterns: 54,
    diagnostics: 51,
    drift: []
  });
});

test("knowledge index has one explicit order and every module assembles exactly once", () => {
  const index = loadReferenceTranslatorKnowledgeIndex();
  const modules = loadReferenceTranslatorKnowledgeModules(index);
  const prompt = assembleReferenceTranslatorSystemPrompt();
  assert.equal(index.version, "REFERENCE_TRANSLATOR_COGNITIVE_KNOWLEDGE_V1_1");
  assert.equal(index.assembly, "DETERMINISTIC_EXPLICIT_ORDER");
  assert.equal(index.epistemic_status, "SYNTHETIC_DESIGN_KNOWLEDGE_NOT_HUMAN_PREFERENCE_EVIDENCE");
  assert.equal(modules.length, 14);
  assert.equal(new Set(modules.map((module) => module.id)).size, 14);
  assert.equal(new Set(modules.map((module) => module.file)).size, 14);
  for (const module of modules) {
    assert.equal(occurrences(prompt, `<!-- KNOWLEDGE_MODULE_START:${module.id} -->`), 1, module.id);
    assert.equal(occurrences(prompt, `<!-- KNOWLEDGE_MODULE_END:${module.id} -->`), 1, module.id);
  }
  const starts = [...prompt.matchAll(/<!-- KNOWLEDGE_MODULE_START:([a-z0-9_]+) -->/g)].map((match) => match[1]);
  assert.deepEqual(starts, index.modules.map((module) => module.id));
});

test("assembled prompt meets the requested factual size and content-density envelope", () => {
  const metrics = getReferenceTranslatorPromptMetrics();
  assert.equal(REFERENCE_TRANSLATOR_PROMPT_VERSION, "REFERENCE_TRANSLATOR_AGENT_V1_1");
  assert.deepEqual(metrics, {
    characters: 492013,
    non_empty_lines: 4840,
    approximate_tokens: 123004,
    module_count: 14,
    module_non_empty_lines: 4650,
    mechanism_entries: 195,
    synthetic_teaching_cases: 76,
    cross_domain_cases: 120,
    failure_patterns: 54,
    diagnostics: 51
  });
  const aggregateContentLines = metrics.non_empty_lines + metrics.module_non_empty_lines;
  assert.ok(aggregateContentLines >= 7000 && aggregateContentLines <= 10000, aggregateContentLines);
});

test("static cognitive audit covers every required operational knowledge area", () => {
  const prompt = assembleReferenceTranslatorSystemPrompt().toLocaleLowerCase();
  for (const required of [
    "centered dominance", "portrait-to-landscape recomposition", "subject-copy territorial separation",
    "structural depth", "pasted subject", "environmental contamination", "motivated rim light",
    "saturation hierarchy", "material contrast pairing", "typographic counter-mass",
    "interface card system", "object meaning is contextual", "handbag skincare to woody perfume",
    "cognac leather", "literal_transfer_allowed", "people, services, personal brands",
    "editorial-to-ad clarity", "controlled intentional complexity", "visual convergence",
    "microdetail", "generic assembly", "undertransfer", "overtransfer", "surface copy",
    "identity protection", "my eyes boundary", "vkb boundary", "target-native superiority",
    "no-reference integrity", "irrelevant-reference handling", "cross-category field scope",
    "source hue authority", "target evidence specificity"
  ]) assert.ok(prompt.includes(required), required);
});

test("module duplication audit finds no repeated module body or repeated entry identity", () => {
  const modules = loadReferenceTranslatorKnowledgeModules();
  const hashes = modules.map((module) => crypto.createHash("sha256").update(module.content).digest("hex"));
  assert.equal(new Set(hashes).size, hashes.length);
  const prompt = assembleReferenceTranslatorSystemPrompt();
  for (const expression of [
    /^### Mechanism: (.+)$/gm,
    /^### Synthetic Teaching Case: (.+)$/gm,
    /^### Cross-Domain Case: (.+)$/gm,
    /^### Failure Pattern: (.+)$/gm,
    /^### Diagnostic: (.+)$/gm
  ]) {
    const identities = [...prompt.matchAll(expression)].map((match) => match[1].trim().toLocaleLowerCase());
    assert.equal(new Set(identities).size, identities.length, expression.toString());
  }
});

test("fluff audit leaves no repeated operational prose beyond two factual target labels", () => {
  const lines = loadReferenceTranslatorKnowledgeModules().flatMap((module) => module.content.split(/\r?\n/))
    .map((line) => line.trim()).filter((line) => line && !line.startsWith("#") && !line.startsWith(">"));
  const counts = new Map();
  for (const line of lines) counts.set(line, (counts.get(line) ?? 0) + 1);
  const repeated = [...counts].filter(([, occurrences]) => occurrences > 1);
  assert.deepEqual(repeated, [["TARGET: designer personal brand.", 2], ["TARGET: education campaign.", 2]]);
});

test("historical v1 prompt remains preserved beside v1.1", async () => {
  const fs = await import("node:fs");
  assert.equal(fs.existsSync("prompts/reference-translator/reference-translator-agent-v1.md"), true);
  assert.equal(fs.existsSync("prompts/reference-translator/reference-translator-agent-v1.1.md"), true);
  assert.match(fs.readFileSync("prompts/reference-translator/reference-translator-agent-v1.md", "utf8"), /^# REFERENCE_TRANSLATOR_AGENT_V1$/m);
});
