import { REFERENCE_TRANSLATOR_PROMPT_VERSION } from "../src/reference-translator/prompt/reference-translator-prompt-builder.mjs";
import {
  getReferenceTranslatorPromptMetrics,
  loadReferenceTranslatorKnowledgeModules
} from "../src/reference-translator/prompt/reference-translator-knowledge-assembler.mjs";

const count = (text, expression) => text.match(expression)?.length ?? 0;
const nonEmpty = (text) => text.split(/\r?\n/).filter((line) => line.trim()).length;
const modules = loadReferenceTranslatorKnowledgeModules();
const prompt = getReferenceTranslatorPromptMetrics();

process.stdout.write(JSON.stringify({
  prompt_version: REFERENCE_TRANSLATOR_PROMPT_VERSION,
  prompt,
  aggregate_module_and_assembled_non_empty_lines: prompt.non_empty_lines + prompt.module_non_empty_lines,
  context_window_note: "Approximate tokens use characters divided by four; validate the complete request against the selected production model before live evaluation.",
  modules: modules.map((module) => ({
    id: module.id,
    file: module.file,
    non_empty_lines: nonEmpty(module.content),
    mechanism_entries: count(module.content, /^### Mechanism:/gm),
    synthetic_teaching_cases: count(module.content, /^### Synthetic Teaching Case:/gm),
    cross_domain_cases: count(module.content, /^### Cross-Domain Case:/gm),
    failure_patterns: count(module.content, /^### Failure Pattern:/gm),
    diagnostics: count(module.content, /^### Diagnostic:/gm)
  }))
}, null, 2) + "\n");
