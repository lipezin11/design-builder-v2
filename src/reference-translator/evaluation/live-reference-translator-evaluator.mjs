const OUTCOMES = new Set(["PASS", "FAIL", "WARNING", "NOT_APPLICABLE", "UNCERTAIN"]);
const check = (category, outcome, evidence) => {
  if (!OUTCOMES.has(outcome)) throw new TypeError("Invalid live evaluation outcome: " + outcome);
  return { category, outcome, evidence };
};
const normalized = (value) => String(value ?? "").toLowerCase();
const targetDirectedText = (plan) => JSON.stringify({
  base_analysis: plan.base_analysis,
  design_decision_map: plan.design_decision_map,
  non_negotiable_anchors: plan.non_negotiable_anchors,
  flexible_areas: plan.flexible_areas,
  director_handoff: plan.director_handoff
}).toLowerCase();

function forbiddenManifestations(caseRecord, text) {
  const items = caseRecord.request.brief_spec.references?.[0]?.do_not_transfer ?? [];
  return items.filter((item) => {
    const phrase = normalized(item).replace(/^source\s+/, "").replace(/^reference\s+/, "").trim();
    if (phrase.length < 5 || /identity|brand|copy|palette|clothing|wardrobe/.test(phrase)) return false;
    return text.includes(phrase);
  });
}

function cognitiveAudit(plan) {
  const observations = (plan.reference_analyses ?? []).flatMap((analysis) =>
    (analysis.observations ?? []).map((item) => item.description)
  );
  const mappings = plan.design_decision_map ?? [];
  const byAction = (actions) => mappings.filter((item) => actions.includes(item.action)).map((item) => ({
    mapping_id: item.mapping_id,
    source_observations: item.observation_ids,
    target_expression: item.target_in_new_composition,
    rationale: item.rationale
  }));
  return {
    what_the_model_thought_was_important: [
      ...observations,
      ...(plan.reference_analyses ?? []).flatMap((analysis) => Object.values(analysis.reference_dna ?? {}))
    ],
    what_it_wanted_to_transfer: byAction(["PRESERVE", "TRANSFER"]),
    what_it_wanted_to_adapt: byAction(["ADAPT"]),
    what_it_wanted_to_reinvent: byAction(["REINVENT"]),
    what_it_discarded: byAction(["DISCARD"]),
    what_it_protected: plan.director_handoff?.what_must_survive ?? [],
    what_risks_it_identified: (plan.risks ?? []).map((risk) => risk.description)
  };
}

export function evaluateLiveReferenceTranslatorPlan({ caseRecord, execution }) {
  const plan = execution.plan;
  const validation = execution.trace.validation_outcomes.at(-1) ?? {};
  const invocation = execution.trace.attempts.at(-1)?.model_invocation ?? {};
  const analyses = plan.reference_analyses ?? [];
  const mappings = plan.design_decision_map ?? [];
  const meaningful = mappings.filter((item) => ["MEDIUM", "HIGH", "VERY_HIGH"].includes(item.strength) && !["DISCARD", "CONFLICT"].includes(item.action));
  const text = targetDirectedText(plan);
  const copied = forbiddenManifestations(caseRecord, text);
  const transferRatio = mappings.length ? mappings.filter((item) => item.action === "TRANSFER").length / mappings.length : 0;
  const sourceCopyDeclared = (caseRecord.request.brief_spec.references?.[0]?.do_not_transfer ?? []).some((item) => /copy|brand/i.test(item));
  const myEyesViolation = /my eyes (requires|forbids|bans|mandates)/i.test(text);
  const vkbViolation = /vkb (decides|selects|mandates|requires the final)/i.test(text);
  const checks = [
    check("VISUAL_REFERENCE_ACTUALLY_ANALYZED", analyses.some((item) => item.reference_asset_id === caseRecord.request.reference_assets[0].asset_id && item.observations?.length) && invocation.image_transmission?.length ? "PASS" : "FAIL", "Requires traceable observations and a transport record containing actual image bytes or an HTTPS image."),
    check("MECHANISM_IDENTIFICATION", analyses.some((item) => Object.keys(item.reference_dna ?? {}).length) && mappings.some((item) => item.rationale?.length >= 24) ? "PASS" : "FAIL", "Reference DNA and reference-specific rationales must both be present."),
    check("FUNCTION_BEFORE_APPEARANCE", mappings.some((item) => ["ADAPT", "REINVENT", "DISCARD"].includes(item.action)) ? "PASS" : "WARNING", "At least one source manifestation must be evaluated rather than all being transferred directly."),
    check("REFERENCE_DNA_PRESERVED", analyses.some((item) => Object.keys(item.reference_dna ?? {}).length) && meaningful.length ? "PASS" : "FAIL", "Reference DNA must connect to at least one meaningful target decision."),
    check("TARGET_SEMANTICS_PRESERVED", plan.base_analysis?.protected_elements?.length && plan.director_handoff?.what_must_survive?.length ? "PASS" : "UNCERTAIN", "Structured protection exists; final semantic adequacy remains a human judgment."),
    check("TARGET_NATIVE_ADAPTATION", mappings.some((item) => ["ADAPT", "REINVENT"].includes(item.action)) ? "PASS" : "WARNING", "Target-native adaptation is represented by ADAPT or REINVENT decisions."),
    check("LITERAL_COPY_AVOIDED", copied.length ? "FAIL" : "PASS", copied.length ? "Target-directed text repeats prohibited manifestations: " + copied.join(", ") : "No case-specific prohibited manifestation was found in target-directed instructions."),
    check("SURFACE_COPY_RISK", copied.length || transferRatio > 0.75 ? "WARNING" : "PASS", "Direct transfer ratio and prohibited manifestation leakage are checked without a numeric art score."),
    check("UNDERTRANSFER_RISK", analyses.some((item) => ["HIGH", "VERY_HIGH"].includes(item.transfer_relevance)) && meaningful.length === 0 ? "WARNING" : "PASS", "Highly relevant analysis must produce a meaningful surviving mechanism."),
    check("OVERTRANSFER_RISK", transferRatio > 0.75 && mappings.length >= 4 ? "WARNING" : "PASS", "Nearly universal direct transfer indicates overtransfer."),
    check("IDENTITY_PRESERVED", /same person|copy (the )?reference person|reuse (the )?reference identity/i.test(text) ? "FAIL" : "PASS", "The plan contains no instruction to reuse the reference person."),
    check("SOURCE_TEXT_PRESERVED_AS_NON_TRANSFERABLE", sourceCopyDeclared ? "PASS" : "NOT_APPLICABLE", "The brief explicitly protects target copy from source copy."),
    check("SOURCE_BRAND_PRESERVED_AS_NON_TRANSFERABLE", sourceCopyDeclared ? "PASS" : "NOT_APPLICABLE", "The brief explicitly excludes source brand transfer."),
    check("MY_EYES_AUTHORITY_PRESERVED", myEyesViolation ? "FAIL" : "PASS", "No absolute My Eyes command language is present."),
    check("VKB_AUTHORITY_PRESERVED", vkbViolation ? "FAIL" : "PASS", "No absolute VKB command language is present."),
    check("SCHEMA_VALID", validation.schema === true ? "PASS" : "FAIL", "Existing schema validator outcome."),
    check("SEMANTIC_VALID", validation.semantic === true ? "PASS" : "FAIL", "Existing semantic validator outcome."),
    check("QUALITY_GATE_VALID", validation.quality === true ? "PASS" : "FAIL", "Existing quality validator outcome.")
  ];
  const failed = checks.filter((item) => item.outcome === "FAIL");
  const warnings = checks.filter((item) => item.outcome === "WARNING");
  const qualityClass = failed.some((item) => ["SCHEMA_VALID", "SEMANTIC_VALID", "QUALITY_GATE_VALID"].includes(item.category))
    ? "FAILED_VALIDATION"
    : failed.some((item) => item.category === "LITERAL_COPY_AVOIDED")
      ? "SURFACE_COPY_WARNING"
      : warnings.some((item) => item.category === "UNDERTRANSFER_RISK")
        ? "UNDERTRANSFER_WARNING"
        : warnings.some((item) => item.category === "OVERTRANSFER_RISK")
          ? "OVERTRANSFER_WARNING"
          : warnings.length
            ? "ACCEPTABLE_TRANSLATION"
            : "STRONG_TRANSLATION";
  return {
    case_id: caseRecord.case_id,
    status: "TECHNICALLY_ACCEPTED",
    quality_class: qualityClass,
    creative_approval: "NOT_PERFORMED",
    checks,
    cognitive_audit: cognitiveAudit(plan),
    plan_id: plan.plan_id,
    run_id: execution.trace.run_id
  };
}

export function evaluateBlockedLiveCase({ caseRecord, error, invocation }) {
  return {
    case_id: caseRecord.case_id,
    status: "PROVIDER_BLOCKED",
    quality_class: "PROVIDER_BLOCKED",
    creative_approval: "NOT_PERFORMED",
    error: {
      code: error?.code ?? "UNKNOWN_PROVIDER_BLOCK",
      message: error?.message ?? "Provider blocked the live case.",
      provider_error_code: invocation?.error?.code ?? null
    },
    checks: [
      check("VISUAL_REFERENCE_ACTUALLY_ANALYZED", "FAIL", "No accepted multimodal model response was produced."),
      check("MECHANISM_IDENTIFICATION", "UNCERTAIN", "No accepted plan exists."),
      check("FUNCTION_BEFORE_APPEARANCE", "UNCERTAIN", "No accepted plan exists."),
      check("REFERENCE_DNA_PRESERVED", "UNCERTAIN", "No accepted plan exists."),
      check("TARGET_SEMANTICS_PRESERVED", "UNCERTAIN", "No accepted plan exists."),
      check("TARGET_NATIVE_ADAPTATION", "UNCERTAIN", "No accepted plan exists."),
      check("LITERAL_COPY_AVOIDED", "UNCERTAIN", "No accepted plan exists."),
      check("SURFACE_COPY_RISK", "UNCERTAIN", "No accepted plan exists."),
      check("UNDERTRANSFER_RISK", "UNCERTAIN", "No accepted plan exists."),
      check("OVERTRANSFER_RISK", "UNCERTAIN", "No accepted plan exists."),
      check("IDENTITY_PRESERVED", "UNCERTAIN", "No accepted plan exists."),
      check("SOURCE_TEXT_PRESERVED_AS_NON_TRANSFERABLE", "UNCERTAIN", "No accepted plan exists."),
      check("SOURCE_BRAND_PRESERVED_AS_NON_TRANSFERABLE", "UNCERTAIN", "No accepted plan exists."),
      check("MY_EYES_AUTHORITY_PRESERVED", "UNCERTAIN", "No accepted plan exists."),
      check("VKB_AUTHORITY_PRESERVED", "UNCERTAIN", "No accepted plan exists."),
      check("SCHEMA_VALID", "NOT_APPLICABLE", "No candidate plan reached validation."),
      check("SEMANTIC_VALID", "NOT_APPLICABLE", "No candidate plan reached validation."),
      check("QUALITY_GATE_VALID", "NOT_APPLICABLE", "No candidate plan reached validation.")
    ],
    cognitive_audit: {
      what_the_model_thought_was_important: [],
      what_it_wanted_to_transfer: [],
      what_it_wanted_to_adapt: [],
      what_it_wanted_to_reinvent: [],
      what_it_discarded: [],
      what_it_protected: [],
      what_risks_it_identified: []
    }
  };
}

function summaryList(value) {
  if (!Array.isArray(value) || value.length === 0) return "None available.";
  return value.slice(0, 8).map((item) => {
    if (typeof item === "string") return "- " + item;
    return "- " + (item.target_expression ?? item.rationale ?? JSON.stringify(item));
  }).join("\n");
}

export function buildReferenceTranslatorHumanReviewPacket({ suiteRunId, manifest, caseResults }) {
  const byId = new Map(caseResults.map((item) => [item.case_id, item]));
  const sections = manifest.cases.map((caseInfo) => {
    const result = byId.get(caseInfo.case_id);
    if (!result) {
      return [
        "## " + caseInfo.case_id,
        "",
        "- Status: NOT_RUN_AFTER_SMOKE_GATE",
        "- Reference: " + caseInfo.reference_path,
        "- Target: " + caseInfo.target_type,
        "- Purpose: " + caseInfo.test_purpose
      ].join("\n");
    }
    const audit = result.cognitive_audit;
    return [
      "## " + caseInfo.case_id,
      "",
      "- Status: " + result.status,
      "- Quality class: " + result.quality_class,
      "- Creative approval: NOT_PERFORMED",
      "- Reference: " + caseInfo.reference_path,
      "- Target: " + caseInfo.target_type,
      "- Purpose: " + caseInfo.test_purpose,
      "- Plan path: " + (result.plan_path ?? "No accepted plan"),
      "",
      "### Primary mechanisms",
      "",
      summaryList(audit.what_the_model_thought_was_important),
      "",
      "### Adaptations",
      "",
      summaryList(audit.what_it_wanted_to_adapt),
      "",
      "### Reinventions",
      "",
      summaryList(audit.what_it_wanted_to_reinvent),
      "",
      "### Discards",
      "",
      summaryList(audit.what_it_discarded),
      "",
      "### Protected semantics",
      "",
      summaryList(audit.what_it_protected),
      "",
      "### Risks",
      "",
      summaryList(audit.what_risks_it_identified),
      "",
      "### Rejected candidate attempts",
      "",
      (result.failed_attempts ?? []).length ? result.failed_attempts.map((item) => "- Attempt " + item.attempt + ": " + (item.validator_error_code ?? "UNKNOWN") + "; schema_valid=" + item.schema_valid + "; observations=" + item.observation_count).join("\n") : "None.",
      "",
      "### Categorical checks",
      "",
      result.checks.map((item) => "- " + item.category + ": " + item.outcome + " - " + item.evidence).join("\n")
    ].join("\n");
  });
  return [
    "# REFERENCE TRANSLATOR LIVE MULTIMODAL HUMAN REVIEW PACKET",
    "",
    "- Suite run: " + suiteRunId,
    "- Artifact classification: EVALUATION_ARTIFACTS_NOT_PRODUCTION",
    "- Decision language: TECHNICALLY_ACCEPTED, never CREATIVELY_APPROVED",
    "- Numeric art scores: 0",
    "",
    ...sections
  ].join("\n\n") + "\n";
}
