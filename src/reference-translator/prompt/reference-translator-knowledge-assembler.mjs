import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const promptRoot = fileURLToPath(new URL("../../../prompts/reference-translator/", import.meta.url));
const corePromptPath = path.join(promptRoot, "reference-translator-agent-v1.1.md");
const knowledgeRoot = path.join(promptRoot, "knowledge");
const knowledgeIndexPath = path.join(knowledgeRoot, "knowledge-index.json");

const readUtf8 = (filePath) => fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").trimEnd();

export function loadReferenceTranslatorKnowledgeIndex() {
  const index = JSON.parse(readUtf8(knowledgeIndexPath));
  if (index.version !== "REFERENCE_TRANSLATOR_COGNITIVE_KNOWLEDGE_V1_1") {
    throw new Error(`Unsupported Reference Translator knowledge version: ${index.version}.`);
  }
  if (!Array.isArray(index.modules) || index.modules.length === 0) {
    throw new Error("Reference Translator knowledge index requires at least one module.");
  }
  const ids = index.modules.map((module) => module.id);
  const files = index.modules.map((module) => module.file);
  if (new Set(ids).size !== ids.length) throw new Error("Reference Translator knowledge module IDs must be unique.");
  if (new Set(files).size !== files.length) throw new Error("Reference Translator knowledge module files must be unique.");
  for (const module of index.modules) {
    if (!/^[a-z0-9_]+$/.test(module.id) || !/^[0-9]{2}_[a-z0-9_]+\.md$/.test(module.file)) {
      throw new Error(`Unsafe Reference Translator knowledge module entry: ${JSON.stringify(module)}.`);
    }
  }
  return structuredClone(index);
}

export function loadReferenceTranslatorKnowledgeModules(index = loadReferenceTranslatorKnowledgeIndex()) {
  return index.modules.map((module) => ({
    ...structuredClone(module),
    content: readUtf8(path.join(knowledgeRoot, module.file))
  }));
}

export function assembleReferenceTranslatorSystemPrompt() {
  const index = loadReferenceTranslatorKnowledgeIndex();
  const modules = loadReferenceTranslatorKnowledgeModules(index);
  const sections = [
    readUtf8(corePromptPath),
    "# COGNITIVE KNOWLEDGE INDEX\n\n" + modules.map((module, position) => `${position + 1}. ${module.id} — ${module.title}`).join("\n"),
    ...modules.map((module) => `<!-- KNOWLEDGE_MODULE_START:${module.id} -->\n${module.content}\n<!-- KNOWLEDGE_MODULE_END:${module.id} -->`)
  ];
  return sections.join("\n\n").trimEnd() + "\n";
}

export function getReferenceTranslatorPromptMetrics(prompt = assembleReferenceTranslatorSystemPrompt()) {
  const index = loadReferenceTranslatorKnowledgeIndex();
  const modules = loadReferenceTranslatorKnowledgeModules(index);
  const lines = prompt.split("\n");
  return {
    characters: prompt.length,
    non_empty_lines: lines.filter((line) => line.trim().length > 0).length,
    approximate_tokens: Math.ceil(prompt.length / 4),
    module_count: modules.length,
    module_non_empty_lines: modules.reduce((sum, module) => sum + module.content.split("\n").filter((line) => line.trim().length > 0).length, 0),
    mechanism_entries: modules.reduce((sum, module) => sum + (module.content.match(/^### Mechanism:/gm)?.length ?? 0), 0),
    synthetic_teaching_cases: modules.reduce((sum, module) => sum + (module.content.match(/^### Synthetic Teaching Case:/gm)?.length ?? 0), 0),
    cross_domain_cases: modules.reduce((sum, module) => sum + (module.content.match(/^### Cross-Domain Case:/gm)?.length ?? 0), 0),
    failure_patterns: modules.reduce((sum, module) => sum + (module.content.match(/^### Failure Pattern:/gm)?.length ?? 0), 0),
    diagnostics: modules.reduce((sum, module) => sum + (module.content.match(/^### Diagnostic:/gm)?.length ?? 0), 0)
  };
}

export const REFERENCE_TRANSLATOR_PROMPT_PATHS = Object.freeze({
  prompt_root: promptRoot,
  core_prompt: corePromptPath,
  knowledge_root: knowledgeRoot,
  knowledge_index: knowledgeIndexPath
});
