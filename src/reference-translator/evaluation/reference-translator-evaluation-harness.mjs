import { executeReferenceTranslator } from "../runtime/reference-translator-runtime.mjs";

export class ReferenceTranslatorEvaluationHarness {
  constructor({ execute = executeReferenceTranslator } = {}) {
    this.execute = execute;
  }

  async run(scenarios) {
    if (!Array.isArray(scenarios) || !scenarios.length) throw new TypeError("scenarios must be a non-empty array.");
    const ids = scenarios.map((item) => item.scenario_id);
    if (new Set(ids).size !== ids.length) throw new TypeError("scenario_id values must be unique.");
    const results = [];
    for (const scenario of scenarios) {
      try {
        const execution = await this.execute(scenario.request);
        const validation = execution.trace.validation_outcomes.at(-1) ?? {};
        const result = {
          scenario_id: scenario.scenario_id,
          status: "PASS",
          expected_status: scenario.expectations.status,
          metrics: {
            schema_pass: validation.schema === true,
            semantic_pass: validation.semantic === true,
            quality_pass: validation.quality === true,
            identity_preserved: true,
            reference_hallucination_absent: true,
            authority_preserved: true,
            attempts: execution.trace.attempts.length,
            idempotent_replay: execution.idempotent_replay
          },
          error_code: null
        };
        if (scenario.expectations.status !== "PASS" || result.metrics.attempts < (scenario.expectations.minimum_attempts ?? 0)) result.status = "EXPECTATION_MISMATCH";
        results.push(result);
      } catch (error) {
        const expectedCodes = scenario.expectations.error_codes ?? [];
        results.push({
          scenario_id: scenario.scenario_id,
          status: scenario.expectations.status === "BLOCK" && expectedCodes.includes(error.code) ? "PASS" : "BLOCK",
          expected_status: scenario.expectations.status,
          metrics: {
            schema_pass: false,
            semantic_pass: false,
            quality_pass: false,
            identity_preserved: !String(error.code).includes("IDENTITY"),
            reference_hallucination_absent: error.code !== "REFERENCE_HALLUCINATION",
            authority_preserved: !String(error.code).includes("AUTHORITY"),
            attempts: error.details?.attempts?.length ?? 0,
            idempotent_replay: false
          },
          error_code: error.code ?? "UNEXPECTED_ERROR"
        });
      }
    }
    return {
      status: results.every((item) => item.status === "PASS") ? "PASS" : "BLOCK",
      results,
      summary: {
        total: results.length,
        passed: results.filter((item) => item.status === "PASS").length,
        blocking: results.filter((item) => item.status !== "PASS").length
      },
      scoring: "CATEGORICAL_ONLY",
      numeric_design_scores_created: 0
    };
  }
}
