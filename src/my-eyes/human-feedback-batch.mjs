import { validateApprovedDirectionMemory } from "./approved-direction-memory-loader.mjs";
import { ApprovedDirectionMemoryError } from "./approved-direction-memory-indexer.mjs";
import { appendHumanReason, appendStructuredHumanReason } from "./human-evidence-store.mjs";

const clone = (value) => structuredClone(value);
const sequence = (id) => Number(/_([0-9]{6})$/.exec(id ?? "")?.[1] ?? 0);
const allocate = (prefix, ids) => `${prefix}_${String(Math.max(0, ...ids.map(sequence)) + 1).padStart(6, "0")}`;
const sourceRef = "my-eyes://human-feedback/initial-candidate-signal-review";

const feedback = Object.freeze([
  {
    key: "ai_looking_design",
    raw_text: "o design transbordava ia, nao era falta de hierarquia, porque tecnica basica é oque a ia mais sabe. o jeito que a ia colocou os elementos flutuantes, as cores que ela escolheu que uma pessoa que sabe o minimo de design vai saber que é ia pelas cores e contraste",
    candidate_signal_ids: ["MYE_EXT_SIG_000001", "MYE_EXT_SIG_000002", "MYE_EXT_SIG_000004"],
    concept: "AI_LOOKING_DESIGN",
    human_evidence_status: "HUMAN_REPORTED_CONCERN",
    categories: ["AI_VISUAL_SIGNATURE", "COMPOSITION", "COLOR", "VISUAL_EFFECTS"],
    summary: "A technically competent composition can still carry a combination of visual decisions perceived by the human as characteristically AI-generated.",
    conditions: {
      what_is_bad: ["recognizable generic AI visual signature across combined design decisions"],
      when_it_becomes_bad: ["floating-element direction, color choices, and contrast combine into an artificial-looking result"],
      what_is_not_necessarily_bad: ["basic hierarchy competence", "technical correctness", "density by itself"]
    },
    explicitly_not_claimed: ["high_density_is_bad", "technical_correctness_prevents_ai_looking_design", "all_ai_generated_images_are_bad"],
    dimensions: ["floating_element_direction", "color_selection", "contrast", "overall_visual_signature"]
  },
  {
    key: "floating_element_misdirection",
    raw_text: "os dois, elementos flutuantes mal escolhidos exagerademente e em locais ruins e posições piores ainda",
    candidate_signal_ids: ["MYE_EXT_SIG_000004"],
    concept: "FLOATING_ELEMENT_MISDIRECTION",
    human_evidence_status: "HUMAN_REPORTED_SIGNAL",
    categories: ["COMPOSITION", "VISUAL_EFFECTS", "INTENTIONAL_DESIGN"],
    summary: "The human-reported problem concerns how floating elements are selected, quantified, placed, and positioned, not their mere presence.",
    conditions: {
      what_is_bad: ["poor selection", "excessive quantity", "poor placement", "poor positioning"],
      when_it_becomes_bad: ["floating elements are exaggerated or directed without sufficient compositional purpose"],
      what_is_not_necessarily_bad: ["floating elements being present"]
    },
    explicitly_not_claimed: ["floating_elements_are_always_bad", "floating_elements_are_forbidden"],
    dimensions: ["floating_element_selection", "floating_element_quantity", "floating_element_placement", "floating_element_positioning"]
  },
  {
    key: "typography_rule_violation",
    raw_text: "so quando a tipografia ultrapassa as regras de design",
    candidate_signal_ids: ["MYE_EXT_SIG_000003"],
    concept: "TYPOGRAPHY_DESIGN_RULE_VIOLATION",
    human_evidence_status: "HUMAN_REPORTED_SIGNAL",
    categories: ["TYPOGRAPHY", "COMPOSITION", "INTENTIONAL_DESIGN"],
    summary: "Typography becomes a reported problem contextually when its use violates design rules; overlap with the subject is not sufficient by itself.",
    conditions: {
      what_is_bad: ["contextual typography design-rule violation"],
      when_it_becomes_bad: ["typographic execution ceases to support a coherent and intentional design"],
      what_is_not_necessarily_bad: ["typography overlapping a subject"]
    },
    explicitly_not_claimed: ["typography_over_subject_is_always_bad", "text_over_subject_is_forbidden"],
    dimensions: ["legibility", "hierarchy", "spacing", "composition", "alignment", "subject_interaction", "occlusion", "balance", "intentionality"]
  },
  {
    key: "visual_non_convergence",
    raw_text: "sim, mas nao desse jeito, eu olho olho mas nao vejo nada, minha mente bagunda",
    candidate_signal_ids: ["MYE_EXT_SIG_000001"],
    concept: "VISUAL_NON_CONVERGENCE",
    human_evidence_status: "HUMAN_REPORTED_EXPERIENCE",
    categories: ["PERCEPTUAL_COHESION", "COMPOSITION"],
    summary: "The gaze can traverse visible elements without those stimuli converging into a mentally cohesive reading of the whole.",
    conditions: {
      what_is_bad: ["perceptual stimuli do not converge into a clear overall reading"],
      when_it_becomes_bad: ["the viewer sees elements but cannot form a cohesive mental perception of the composition"],
      what_is_not_necessarily_bad: ["clear headline", "clear subject", "clear CTA", "basic hierarchy correctness"]
    },
    explicitly_not_claimed: ["visual_non_convergence_equals_weak_hierarchy", "complexity_is_always_bad"],
    dimensions: ["perceptual_cohesion", "gestalt_cohesion", "mental_readability", "visual_convergence"]
  },
  {
    key: "microdetail_pollution",
    raw_text: "e a ia tem um pequeno problema em geral, que eh colocar literalmente micro efeitos ou detalhes que olhando parece micro coisas, que deixe feio",
    candidate_signal_ids: [],
    concept: "FUNCTIONLESS_MICRODETAIL_ACCUMULATION",
    human_evidence_status: "HUMAN_REPORTED_CONCERN",
    categories: ["DETAIL", "VISUAL_EFFECTS", "INTENTIONAL_DESIGN"],
    summary: "Accumulated small effects or details can degrade cleanliness and cohesion when their individual visual contribution is insufficient.",
    conditions: {
      what_is_bad: ["accumulation of microdetails with insufficient visual function"],
      when_it_becomes_bad: ["many small elements contribute insufficiently to composition, narrative, depth, hierarchy, or atmosphere"],
      what_is_not_necessarily_bad: ["detail", "complexity", "richness", "micro effects"]
    },
    explicitly_not_claimed: ["detail_is_bad", "details_must_be_minimal_only", "complexity_is_bad"],
    dimensions: ["micro_effects", "ornamentation", "functional_contribution", "cleanliness", "cohesion"],
    functional_justification_dimensions: ["DEPTH", "HIERARCHY", "NARRATIVE", "FRAMING", "DIRECTIONALITY", "ATMOSPHERE", "SUBJECT_INTEGRATION", "BRAND_MEANING"]
  }
]);

const reviewDefinitions = Object.freeze([
  { signal_id: "MYE_EXT_SIG_000001", outcome: "CORRELATION_RETAINED_CAUSE_NOT_CONFIRMED", confirmation: "NOT_CONFIRMED", keys: ["ai_looking_design", "visual_non_convergence"], conditions: [], not_claimed: ["density_itself_caused_rejection", "designer_dislikes_high_density"] },
  { signal_id: "MYE_EXT_SIG_000002", outcome: "OBSERVATION_RETAINED_PRIMARY_CAUSE_NOT_CONFIRMED", confirmation: "NOT_CONFIRMED", keys: ["ai_looking_design"], conditions: [], not_claimed: ["weak_hierarchy_was_the_primary_rejection_cause", "visual_non_convergence_equals_weak_hierarchy"] },
  { signal_id: "MYE_EXT_SIG_000003", outcome: "LITERAL_FEATURE_NOT_CONFIRMED_CONDITIONAL_PROBLEM_SUPPORTED", confirmation: "CONDITIONALLY_SUPPORTED", keys: ["typography_rule_violation"], conditions: ["typography_design_rule_violation"], not_claimed: ["typography_over_subject_is_a_failure", "typography_over_subject_is_forbidden"] },
  { signal_id: "MYE_EXT_SIG_000004", outcome: "LITERAL_FEATURE_NOT_CONFIRMED_CONDITIONAL_PROBLEM_SUPPORTED", confirmation: "CONDITIONALLY_SUPPORTED", keys: ["floating_element_misdirection"], conditions: ["poor_selection", "excessive_quantity", "poor_placement", "poor_positioning"], not_claimed: ["floating_elements_present_is_a_failure", "floating_elements_are_forbidden"] }
]);

function ensureExternalSignals(externalArtifact) {
  if (externalArtifact?.batch_id !== "MYE_EXT_BATCH_000001") throw new ApprovedDirectionMemoryError("MY_EYES_FEEDBACK_SOURCE_BATCH_MISSING", "The expected external evidence batch is required.");
  const ids = new Set(externalArtifact.candidate_signals.map((item) => item.signal_id));
  for (const definition of reviewDefinitions) if (!ids.has(definition.signal_id)) throw new ApprovedDirectionMemoryError("MY_EYES_FEEDBACK_SIGNAL_MISSING", "A reviewed candidate signal is missing from the source artifact.", { signal_id: definition.signal_id });
}

export function applyInitialCandidateSignalHumanFeedback({ memory, externalArtifact, now = () => new Date() }) {
  ensureExternalSignals(externalArtifact);
  if ((memory.human_reasons ?? []).some((item) => item.provenance.source_ref.startsWith(sourceRef))) throw new ApprovedDirectionMemoryError("MY_EYES_FEEDBACK_BATCH_DUPLICATE", "This human feedback batch was already recorded.");
  const baseline = clone(memory);
  let updated = clone(memory);
  updated.candidate_signal_reviews ??= [];
  updated.system_hypotheses ??= [];
  const timestamp = now().toISOString();
  const fixedNow = () => new Date(timestamp);
  const reasonByKey = new Map();
  const structuredReasons = [];

  for (const item of feedback) {
    const raw = appendHumanReason({ memory: updated, context_scope: item.candidate_signal_ids.length ? "EXTERNAL_CANDIDATE_SIGNAL_REVIEW" : "HUMAN_REPORTED_DESIGN_CONCERN", context_ref: item.candidate_signal_ids.length ? externalArtifact.batch_id : item.concept, related_candidate_signal_ids: item.candidate_signal_ids, related_image_ids: [], raw_text: item.raw_text, source_ref: `${sourceRef}#${item.key}`, now: fixedNow });
    updated = raw.memory;
    reasonByKey.set(item.key, raw.reason.reason_id);
    const structured = appendStructuredHumanReason({ memory: updated, human_reason_id: raw.reason.reason_id, categories: item.categories, polarity: "NEGATIVE", normalized_statement: item.summary, structured_by: "SYSTEM", confirmed_by_human: false, structured_concept: item.concept, structured_summary: item.summary, conditions: item.conditions, explicitly_not_claimed: item.explicitly_not_claimed, related_visual_dimensions: item.dimensions, interpretation_confidence: "MEDIUM", human_confirmation_status: "AWAITING_STRUCTURED_CONFIRMATION", human_evidence_status: item.human_evidence_status, functional_justification_dimensions: item.functional_justification_dimensions ?? [], source_ref: `${sourceRef}#structured:${item.key}`, now: fixedNow });
    updated = structured.memory;
    structuredReasons.push(structured.structured_reason);
  }

  const reviewIds = updated.candidate_signal_reviews.map((item) => item.review_id);
  for (const definition of reviewDefinitions) {
    const reviewId = allocate("MYE_CREV", reviewIds);
    reviewIds.push(reviewId);
    updated.candidate_signal_reviews.push({
      review_id: reviewId,
      candidate_signal_id: definition.signal_id,
      source_batch_id: externalArtifact.batch_id,
      source_artifact_path: "data/my_eyes/imports/MYE_EXT_BATCH_000001/normalized.json",
      candidate_signal_version: 2,
      supersedes_candidate_signal_version: 1,
      review_outcome: definition.outcome,
      correlation_retained: true,
      human_causal_confirmation: definition.confirmation,
      human_supported_conditions: definition.conditions,
      explicitly_not_claimed: definition.not_claimed,
      related_human_reason_ids: definition.keys.map((key) => reasonByKey.get(key)),
      preference_status: "NOT_INFERRED",
      universal_rule_created: false,
      status: "ACTIVE",
      provenance: { asserted_by: "SYSTEM", recorded_by: "APPROVED_DIRECTION_MEMORY_SERVICE", source_type: "CANDIDATE_SIGNAL_REVIEW", source_ref: `${sourceRef}#review:${definition.signal_id}`, recorded_at: timestamp, data_classification: memory.data_classification === "SYNTHETIC_TEST_DATA" ? "SYNTHETIC_TEST_DATA" : "REAL_AI_ANALYSIS" }
    });
  }

  const hypothesisId = allocate("MYE_HYP", updated.system_hypotheses.map((item) => item.hypothesis_id));
  updated.system_hypotheses.push({
    hypothesis_id: hypothesisId,
    statement: "Complexity itself may be acceptable when its elements have clear compositional and functional purpose; the negative response may be associated more strongly with uncontrolled or artificial complexity.",
    status: "HYPOTHESIS_REQUIRING_HUMAN_CONFIRMATION",
    human_confirmed: false,
    related_human_reason_ids: [reasonByKey.get("ai_looking_design"), reasonByKey.get("visual_non_convergence"), reasonByKey.get("microdetail_pollution")],
    explicitly_not_claimed: ["designer_accepts_all_complexity", "designer_rejects_all_complexity", "complexity_without_direction_is_confirmed_human_truth"],
    preference_status: "NOT_INFERRED",
    provenance: { asserted_by: "SYSTEM", recorded_by: "APPROVED_DIRECTION_MEMORY_SERVICE", source_type: "SYSTEM_HYPOTHESIS", source_ref: `${sourceRef}#hypothesis:complexity-with-purpose`, recorded_at: timestamp, data_classification: memory.data_classification === "SYNTHETIC_TEST_DATA" ? "SYNTHETIC_TEST_DATA" : "REAL_AI_ANALYSIS" }
  });

  updated.summary.candidate_signal_review_count = updated.candidate_signal_reviews.length;
  updated.summary.system_hypothesis_count = updated.system_hypotheses.length;
  updated.memory_version += 1;
  updated.updated_at = timestamp;
  if (updated.pairwise_preferences.length !== baseline.pairwise_preferences.length) throw new ApprovedDirectionMemoryError("MY_EYES_FEEDBACK_CREATED_PAIR", "Human reason feedback cannot create pairwise preferences.");
  if (JSON.stringify(updated.inferred_preferences) !== JSON.stringify(baseline.inferred_preferences)) throw new ApprovedDirectionMemoryError("MY_EYES_FEEDBACK_CREATED_PREFERENCE", "Human reason feedback cannot create universal preferences.");
  const validation = validateApprovedDirectionMemory(updated);
  if (!validation.valid) throw new ApprovedDirectionMemoryError("MY_EYES_FEEDBACK_BATCH_INVALID", "Human feedback batch failed memory validation.", { errors: validation.errors });
  return { memory: updated, human_reasons: feedback.map((item) => updated.human_reasons.find((reason) => reason.reason_id === reasonByKey.get(item.key))), structured_reasons: structuredReasons, candidate_signal_reviews: clone(updated.candidate_signal_reviews), system_hypothesis: clone(updated.system_hypotheses.at(-1)), report: { status: "PASS", level_1_created: 5, level_2_created: 5, candidate_signal_reviews_created: 4, system_hypotheses_created: 1, pairwise_preferences_created: 0, universal_preference_rules_created: 0 } };
}

export const initialDesignerFeedbackRawTexts = feedback.map((item) => item.raw_text);
