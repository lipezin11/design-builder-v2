import fs from "node:fs";
import { evaluateReferenceTranslatorCognitiveFixtures } from "../src/reference-translator/evaluation/reference-translator-cognitive-evaluator.mjs";

const suite = JSON.parse(fs.readFileSync("tests/fixtures/reference-translator/cognitive-eval-v1.1.json", "utf8"));
const report = evaluateReferenceTranslatorCognitiveFixtures(suite.fixtures);
process.stdout.write(JSON.stringify({
  suite_id: suite.suite_id,
  epistemic_status: "SYNTHETIC_DETERMINISTIC_EVALUATION_NOT_LIVE_MODEL_PERFORMANCE",
  ...report
}, null, 2) + "\n");
