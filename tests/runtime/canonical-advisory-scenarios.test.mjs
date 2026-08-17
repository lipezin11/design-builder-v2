import assert from "node:assert/strict";
import test from "node:test";
import { CANONICAL_ADVISORY_SCENARIOS_V1 } from "../../src/advisory/canonical-advisory-scenarios.mjs";

for (const scenario of CANONICAL_ADVISORY_SCENARIOS_V1) {
  test(`${scenario.scenario_id} satisfies every canonical expectation`, () => {
    const output = scenario.execute();
    const checks = scenario.verify(output);
    assert.ok(checks.length > 0);
    assert.deepEqual(checks.filter((item) => !item.passed), []);
  });
}

