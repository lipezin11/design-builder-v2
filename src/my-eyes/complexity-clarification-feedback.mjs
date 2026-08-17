import { validateApprovedDirectionMemory } from "./approved-direction-memory-loader.mjs";
import { ApprovedDirectionMemoryError } from "./approved-direction-memory-indexer.mjs";
import { appendHumanReason, appendStructuredHumanReason } from "./human-evidence-store.mjs";

const clone = (value) => structuredClone(value);
const sequence = (id) => Number(/_([0-9]{6})$/.exec(id ?? "")?.[1] ?? 0);
const allocate = (prefix, ids) => `${prefix}_${String(Math.max(0, ...ids.map(sequence)) + 1).padStart(6, "0")}`;
const sourceRef = "my-eyes://human-feedback/complexity-functional-control-clarification";

export const complexityClarificationRawText = `Complexidade é aceitável, inclusive alta complexidade. Eu não tenho um limite fixo de quantidade de elementos. O limite acontece quando a complexidade deixa de trabalhar a favor da peça.

Se existem muitos elementos, mas eles têm função clara, estão bem posicionados, conversam entre si, têm uma lógica visual comum e minha mente consegue entender o conjunto, isso pode ser excelente.

O problema começa quando a complexidade vira excesso perceptual: eu olho para a peça, vejo várias coisas, mas o conjunto não converge. Mesmo que cada elemento isoladamente esteja “bonito” ou tecnicamente correto, a soma começa a parecer artificial, exagerada ou com cara de IA.

Então não quero uma regra como HIGH_COMPLEXITY = BAD nem um número máximo de elementos.

Quero que o sistema avalie complexidade funcional e controlada versus complexidade artificial/descontrolada.

Alguns sinais de que passou do limite:

elementos sem função suficiente;
muitos microdetalhes ou microefeitos acumulados;
objetos flutuantes demais ou mal posicionados;
elementos que parecem pertencer a decisões visuais diferentes;
contraste e cores usados de forma artificial;
excesso de estímulos que não formam um conjunto;
sensação de “eu olho, olho, mas não vejo nada; minha mente bagunça”.

Portanto, confirmo parcialmente a hipótese MYE_HYP_000001, mas com esta correção:

Complexidade com direção e função é aceitável. Não existe um limite quantitativo fixo. O limite é atingido quando a complexidade começa a destruir coesão, intencionalidade, clareza perceptual ou sofisticação visual.

Eu acrescentaria ainda uma distinção importante para o My Eyes:

**“simples vs. complexo” provavelmente é um eixo ruim para a sua régua.**

Um eixo muito melhor seria:

CONTROLLED / INTENTIONAL COMPLEXITY
            ↕
ARTIFICIAL / UNCONTROLLED COMPLEXITY

Isso permite que o Critic aprove uma peça maximalista excelente e rejeite uma imagem relativamente simples que ainda tenha aquela assinatura visual de IA.`;

export function applyComplexityClarificationFeedback({ memory, now = () => new Date() }) {
  if (memory.human_reasons.some((item) => item.provenance.source_ref === sourceRef)) throw new ApprovedDirectionMemoryError("MY_EYES_COMPLEXITY_CLARIFICATION_DUPLICATE", "This complexity clarification was already recorded.");
  const baseline = clone(memory);
  let updated = clone(memory);
  const timestamp = now().toISOString();
  const fixedNow = () => new Date(timestamp);
  const originalHypothesis = updated.system_hypotheses?.find((item) => item.hypothesis_id === "MYE_HYP_000001");
  const densityReview = updated.candidate_signal_reviews?.find((item) => item.candidate_signal_id === "MYE_EXT_SIG_000001" && item.status === "ACTIVE");
  if (!originalHypothesis) throw new ApprovedDirectionMemoryError("MY_EYES_COMPLEXITY_HYPOTHESIS_MISSING", "MYE_HYP_000001 is required for this clarification.");
  if (!densityReview) throw new ApprovedDirectionMemoryError("MY_EYES_COMPLEXITY_DENSITY_REVIEW_MISSING", "The active density candidate review is required.");

  const raw = appendHumanReason({
    memory: updated,
    context_scope: "SYSTEM_HYPOTHESIS_REVIEW",
    context_ref: originalHypothesis.hypothesis_id,
    related_candidate_signal_ids: ["MYE_EXT_SIG_000001", "MYE_EXT_SIG_000004"],
    related_image_ids: [],
    raw_text: complexityClarificationRawText,
    source_ref: sourceRef,
    now: fixedNow
  });
  updated = raw.memory;

  const summary = "Complexity, including high complexity, is acceptable when it is functional, intentionally directed, mutually coherent, and perceptually convergent; no fixed element-count threshold applies.";
  const structured = appendStructuredHumanReason({
    memory: updated,
    human_reason_id: raw.reason.reason_id,
    categories: ["COMPOSITION", "PERCEPTUAL_COHESION", "INTENTIONAL_DESIGN", "AI_VISUAL_SIGNATURE", "DETAIL"],
    polarity: "MIXED",
    normalized_statement: summary,
    structured_by: "SYSTEM",
    confirmed_by_human: false,
    structured_concept: "CONTROLLED_VS_ARTIFICIAL_COMPLEXITY",
    structured_summary: summary,
    conditions: {
      what_is_bad: ["artificial or uncontrolled complexity", "perceptual excess that prevents the whole from converging"],
      when_it_becomes_bad: ["complexity degrades cohesion, intentionality, perceptual clarity, or visual sophistication", "elements lack sufficient function, shared logic, mutual coherence, or controlled placement"],
      what_is_not_necessarily_bad: ["high complexity", "many elements", "maximalist design", "technical correctness of individual elements"]
    },
    explicitly_not_claimed: ["high_complexity_is_bad", "a_fixed_maximum_element_count_exists", "simple_design_is_always_better", "maximalist_design_is_bad", "quantity_alone_determines_failure"],
    related_visual_dimensions: ["functional_purpose", "element_positioning", "mutual_coherence", "shared_visual_logic", "perceptual_convergence", "intentionality", "visual_sophistication", "generic_ai_visual_signature"],
    interpretation_confidence: "HIGH",
    human_confirmation_status: "DERIVED_FROM_CONFIRMED_HUMAN_CLARIFICATION",
    human_evidence_status: "HUMAN_CONFIRMED_CLARIFICATION",
    evaluation_axis: { positive_pole: "CONTROLLED_INTENTIONAL_COMPLEXITY", negative_pole: "ARTIFICIAL_UNCONTROLLED_COMPLEXITY", fixed_quantitative_limit: false, quantity_is_decisive: false },
    source_ref: `${sourceRef}#structured-axis`,
    now: fixedNow
  });
  updated = structured.memory;

  const hypothesisV1 = updated.system_hypotheses.find((item) => item.hypothesis_id === originalHypothesis.hypothesis_id);
  const densityReviewV2 = updated.candidate_signal_reviews.find((item) => item.review_id === densityReview.review_id);
  hypothesisV1.version ??= 1;
  hypothesisV1.record_status = "SUPERSEDED";
  hypothesisV1.human_confirmation_status ??= "AWAITING_HUMAN_CONFIRMATION";
  densityReviewV2.status = "SUPERSEDED";

  const hypothesisId = allocate("MYE_HYP", updated.system_hypotheses.map((item) => item.hypothesis_id));
  const correctedHypothesis = {
    hypothesis_id: hypothesisId,
    statement: "Complexity, including high complexity, is acceptable when elements have clear function, sound positioning, mutual coherence, shared visual logic, and perceptual convergence. No fixed quantitative element limit applies; the functional limit is reached when complexity degrades cohesion, intentionality, perceptual clarity, or visual sophistication.",
    status: "PARTIALLY_CONFIRMED_WITH_CORRECTION",
    human_confirmed: false,
    human_confirmation_status: "PARTIALLY_CONFIRMED_WITH_CORRECTION",
    version: 2,
    supersedes_hypothesis_id: hypothesisV1.hypothesis_id,
    correction_reason_id: raw.reason.reason_id,
    record_status: "ACTIVE",
    related_human_reason_ids: [...new Set([...hypothesisV1.related_human_reason_ids, raw.reason.reason_id])],
    explicitly_not_claimed: ["high_complexity_is_bad", "a_fixed_maximum_element_count_exists", "quantity_alone_defines_the_limit", "simple_is_better_than_complex"],
    preference_status: "NOT_INFERRED",
    provenance: { asserted_by: "SYSTEM", recorded_by: "APPROVED_DIRECTION_MEMORY_SERVICE", source_type: "SYSTEM_HYPOTHESIS", source_ref: `${sourceRef}#corrected-hypothesis`, recorded_at: timestamp, data_classification: memory.data_classification === "SYNTHETIC_TEST_DATA" ? "SYNTHETIC_TEST_DATA" : "REAL_AI_ANALYSIS" }
  };
  updated.system_hypotheses.push(correctedHypothesis);

  const reviewId = allocate("MYE_CREV", updated.candidate_signal_reviews.map((item) => item.review_id));
  const densityReviewV3 = {
    review_id: reviewId,
    candidate_signal_id: densityReview.candidate_signal_id,
    source_batch_id: densityReview.source_batch_id,
    source_artifact_path: densityReview.source_artifact_path,
    candidate_signal_version: 3,
    supersedes_candidate_signal_version: 2,
    supersedes_review_id: densityReviewV2.review_id,
    review_outcome: "CORRELATION_RETAINED_QUANTITATIVE_LIMIT_REJECTED_FUNCTIONAL_AXIS_CONFIRMED",
    correlation_retained: true,
    human_causal_confirmation: "HUMAN_CLARIFIED",
    human_supported_conditions: ["functional_purpose", "controlled_positioning", "mutual_coherence", "shared_visual_logic", "perceptual_convergence"],
    explicitly_not_claimed: ["designer_dislikes_high_complexity", "high_complexity_is_bad", "a_fixed_maximum_element_count_exists", "density_alone_causes_rejection"],
    related_human_reason_ids: [raw.reason.reason_id],
    preference_status: "NOT_INFERRED",
    universal_rule_created: false,
    status: "ACTIVE",
    provenance: { asserted_by: "SYSTEM", recorded_by: "APPROVED_DIRECTION_MEMORY_SERVICE", source_type: "CANDIDATE_SIGNAL_REVIEW", source_ref: `${sourceRef}#density-review-v3`, recorded_at: timestamp, data_classification: memory.data_classification === "SYNTHETIC_TEST_DATA" ? "SYNTHETIC_TEST_DATA" : "REAL_AI_ANALYSIS" }
  };
  updated.candidate_signal_reviews.push(densityReviewV3);

  updated.summary.human_reason_count = updated.human_reasons.length;
  updated.summary.structured_reason_count = updated.structured_human_reasons.length;
  updated.summary.candidate_signal_review_count = updated.candidate_signal_reviews.length;
  updated.summary.system_hypothesis_count = updated.system_hypotheses.length;
  updated.memory_version += 1;
  updated.updated_at = timestamp;
  if (updated.pairwise_preferences.length !== baseline.pairwise_preferences.length) throw new ApprovedDirectionMemoryError("MY_EYES_COMPLEXITY_CLARIFICATION_CREATED_PAIR", "Complexity clarification cannot create pairs.");
  if (JSON.stringify(updated.inferred_preferences) !== JSON.stringify(baseline.inferred_preferences)) throw new ApprovedDirectionMemoryError("MY_EYES_COMPLEXITY_CLARIFICATION_CREATED_PREFERENCE", "Complexity clarification cannot create inferred preferences.");
  const validation = validateApprovedDirectionMemory(updated);
  if (!validation.valid) throw new ApprovedDirectionMemoryError("MY_EYES_COMPLEXITY_CLARIFICATION_INVALID", "Complexity clarification failed memory validation.", { errors: validation.errors });
  return { memory: updated, human_reason: clone(raw.reason), structured_reason: clone(structured.structured_reason), superseded_hypothesis_id: hypothesisV1.hypothesis_id, corrected_hypothesis: clone(correctedHypothesis), superseded_review_id: densityReviewV2.review_id, density_review_v3: clone(densityReviewV3), report: { status: "PASS", level_1_created: 1, level_2_created: 1, hypotheses_created: 1, candidate_signal_reviews_created: 1, pairs_created: 0, inferred_preferences_created: 0, fixed_quantitative_limits_created: 0, scores_created: 0, weights_created: 0 } };
}
