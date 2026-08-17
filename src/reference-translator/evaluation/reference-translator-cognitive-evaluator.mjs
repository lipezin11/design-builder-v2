const normalized = (value) => String(value ?? "").trim().toLocaleLowerCase();

const baseChecks = {
  MECHANISM_IDENTIFIED: (fixture) =>
    normalized(fixture.candidate.visual_function).length >= 12 &&
    normalized(fixture.candidate.transferable_mechanism).length >= 12,
  TARGET_NATIVE_ADAPTATION_PRESENT: (fixture) =>
    fixture.expectations.action_in.includes(fixture.candidate.action) &&
    normalized(fixture.candidate.target_native_expression).length >= 12,
  LITERAL_COPY_AVOIDED: (fixture) => {
    const target = normalized(fixture.candidate.target_native_expression);
    return fixture.expectations.forbidden_target_terms.every((term) => !target.includes(normalized(term)));
  },
  REFERENCE_DNA_PRESERVED: (fixture) =>
    Array.isArray(fixture.candidate.reference_dna_survives) &&
    fixture.candidate.reference_dna_survives.every((item) => normalized(item).length >= 6) &&
    fixture.candidate.reference_dna_survives.length >= (fixture.expectations.minimum_reference_dna_items ?? 1),
  TARGET_SEMANTICS_PRESERVED: (fixture) => fixture.candidate.protected_semantics_status === "PRESERVED",
  CATEGORY_COHERENCE_PRESERVED: (fixture) => fixture.candidate.category_coherence === "PRESERVED",
  MY_EYES_BOUNDARY_PRESERVED: (fixture) => fixture.candidate.my_eyes_authority === "ADVISORY_ONLY",
  VKB_BOUNDARY_PRESERVED: (fixture) => fixture.candidate.vkb_authority === "ADVISORY_ONLY",
  REQUIRED_TARGET_TERMS_PRESENT: (fixture) => {
    const target = normalized(fixture.candidate.target_native_expression);
    return fixture.expectations.required_target_term_groups.every((group) =>
      group.some((term) => target.includes(normalized(term)))
    );
  },
  IDENTITY_PRESERVED: (fixture) => fixture.candidate.identity_status === "PRESERVED",
  FORMAT_RELATION_TRANSLATED: (fixture) => fixture.candidate.format_relation_translated === true,
  INFORMATION_CLARITY_ADAPTED: (fixture) => fixture.candidate.information_clarity_adapted === true,
  IRRELEVANT_REFERENCE_DISCARDED: (fixture) =>
    fixture.candidate.action === "DISCARD" && fixture.candidate.relevance === "IRRELEVANT",
  CONFLICT_PRESERVED_FOR_DIRECTOR: (fixture) =>
    fixture.candidate.conflict_status === "ESCALATED_TO_DIRECTOR",
  NO_REFERENCE_HALLUCINATION_ABSENT: (fixture) =>
    fixture.candidate.action === "NONE" &&
    normalized(fixture.candidate.visual_function) === "" &&
    normalized(fixture.candidate.transferable_mechanism) === "" &&
    normalized(fixture.candidate.target_native_expression) === "" &&
    Array.isArray(fixture.candidate.reference_dna_survives) &&
    fixture.candidate.reference_dna_survives.length === 0
};

function validateFixtureShape(fixture, index) {
  if (!fixture || typeof fixture !== "object" || Array.isArray(fixture)) throw new TypeError(`Fixture ${index} must be an object.`);
  for (const field of ["fixture_id", "family", "source_observation", "target_context", "candidate", "expectations"]) {
    if (fixture[field] === undefined) throw new TypeError(`Fixture ${index} is missing ${field}.`);
  }
  if (!Array.isArray(fixture.expectations.categories) || !fixture.expectations.categories.length) {
    throw new TypeError(`Fixture ${fixture.fixture_id} requires categorical expectations.`);
  }
  for (const category of fixture.expectations.categories) {
    if (!baseChecks[category]) throw new TypeError(`Fixture ${fixture.fixture_id} uses unknown category ${category}.`);
  }
}

export function evaluateReferenceTranslatorCognitiveFixture(fixture) {
  validateFixtureShape(fixture, 0);
  const checks = fixture.expectations.categories.map((category) => {
    let passed = false;
    try { passed = baseChecks[category](fixture) === true; }
    catch { passed = false; }
    return { category, passed };
  });
  return {
    fixture_id: fixture.fixture_id,
    family: fixture.family,
    status: checks.every((check) => check.passed) ? "PASS" : "BLOCK",
    checks
  };
}

export function evaluateReferenceTranslatorCognitiveFixtures(fixtures) {
  if (!Array.isArray(fixtures) || fixtures.length === 0) throw new TypeError("fixtures must be a non-empty array.");
  fixtures.forEach(validateFixtureShape);
  const ids = fixtures.map((fixture) => fixture.fixture_id);
  if (new Set(ids).size !== ids.length) throw new TypeError("fixture_id values must be unique.");
  const results = fixtures.map(evaluateReferenceTranslatorCognitiveFixture);
  const categoryCheckCount = results.reduce((sum, result) => sum + result.checks.length, 0);
  const passedCategoryChecks = results.reduce((sum, result) => sum + result.checks.filter((check) => check.passed).length, 0);
  return {
    status: results.every((result) => result.status === "PASS") ? "PASS" : "BLOCK",
    results,
    summary: {
      fixture_count: results.length,
      passed_fixtures: results.filter((result) => result.status === "PASS").length,
      blocking_fixtures: results.filter((result) => result.status !== "PASS").length,
      category_check_count: categoryCheckCount,
      passed_category_checks: passedCategoryChecks,
      failed_category_checks: categoryCheckCount - passedCategoryChecks
    },
    scoring: "CATEGORICAL_ONLY",
    numeric_design_scores_created: 0,
    weights_created: 0,
    rankings_created: 0,
    automatic_approvals_created: 0,
    live_model_invoked: false
  };
}

