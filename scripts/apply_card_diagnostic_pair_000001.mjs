import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendPairwisePreference, persistApprovedDirectionMemory } from "../src/my-eyes/human-evidence-store.mjs";
import { appendPreferenceRevision } from "../src/my-eyes/preference-candidate-store.mjs";

const PAIR = {
  left_image_id: "MYE_IMG_000017",
  right_image_id: "MYE_IMG_000020",
  preferred_image_id: "MYE_IMG_000020",
  source_ref: "my-eyes://card-diagnostic-pair/000001"
};

const unorderedKey = (left, right) => [left, right].sort().join("::");

function findPair(memory) {
  const key = unorderedKey(PAIR.left_image_id, PAIR.right_image_id);
  return memory.pairwise_preferences.find((item) =>
    item.status === "ACTIVE" && unorderedKey(item.left_image_id, item.right_image_id) === key
  );
}

function buildCandidate7V3({ memory, pair, reason, now }) {
  const previous = memory.inferred_preferences.find((item) => item.preference_id === "MYE_PREF_000014");
  if (!previous) throw new Error("Candidate 7 v2 (MYE_PREF_000014) is required.");
  const timestamp = now().toISOString();
  return {
    ...structuredClone(previous),
    preference_id: "MYE_PREF_000015",
    statement: "Strong evidence defines a generic card as an interchangeable ready-made dashboard or UI component with weakly specific content, repeated format and visual language, and positioning that fills space or orbits the subject instead of participating organically in the visual direction; evidence remains insufficient to define an excellent card positively.",
    status: "INSUFFICIENT_EVIDENCE",
    conditions: [
      "dashboard-like metrics, mini charts, thin borders, glow, and repeated modules can become interchangeable when they do not belong specifically to the project",
      "labels and numbers that could be replaced with generic SaaS or marketing content without changing the direction are a negative signal",
      "many similarly formatted independent modules orbiting the subject are weaker than an information block grouped around the piece's actual purpose",
      "content specificity and grouping are supported as improvements over generic dashboards but are not sufficient evidence of card excellence",
      "using visual information around the subject remains a valid concept when execution participates organically in composition",
      "semantic function, project-specific visual language, hierarchy, spatial integration, subject relationship, controlled density, and inevitability remain positive hypotheses requiring genuinely good examples"
    ],
    exceptions: [
      "dashboard aesthetics are not universally bad when the project specifically requires and transforms them",
      "multiple cards can work when they form a coherent system rather than independent filler modules",
      "B winning this diagnostic means less generic card execution, not that B is a positive excellence reference",
      "information around a subject can remain a valid concept even though the cards in A are not a positive reference"
    ],
    explicitly_not_claimed: [
      "cards_are_bad",
      "cards_are_forbidden",
      "dashboard_aesthetics_are_always_bad",
      "multiple_cards_are_always_bad",
      "candidate_B_is_an_excellent_card_reference",
      "positive_card_excellence_criteria_are_confirmed",
      "the_system_can_currently_predict_an_excellent_card"
    ],
    supporting_evidence_refs: [...new Set([...previous.supporting_evidence_refs, pair.pair_id, reason.reason_id])],
    human_evidence_refs: [...new Set([...previous.human_evidence_refs, reason.reason_id])],
    pairwise_refs: [...new Set([...previous.pairwise_refs, pair.pair_id])],
    independent_evidence_groups: [
      ...structuredClone(previous.independent_evidence_groups),
      {
        group_id: "card_diagnostic_pair_000001",
        evidence_refs: [pair.pair_id, reason.reason_id],
        independence_basis: "Direct human comparison of two card-heavy rejected works, explicitly judged only on card execution."
      }
    ],
    contradiction_search: {
      performed: true,
      query_scope: "Prior approved card counterexamples plus Card Diagnostic Pair 000001 comparing two card-heavy rejected works.",
      outcome: previous.contradiction_search.outcome,
      summary: "The new pair strengthens the negative definition of interchangeability, generic dashboard language, repeated modules, and orbiting placement. The human explicitly rejected treating the less-bad winner as positive evidence, so no excellent-card counterexample has been established."
    },
    sample_context: {
      description: "Prior card evidence plus Diagnostic Pair 000001, where B was preferred only as less bad and the comparison was EASY when judging cards alone.",
      image_ids: [...new Set([...previous.sample_context.image_ids, PAIR.left_image_id, PAIR.right_image_id])],
      pair_ids: [...new Set([...previous.sample_context.pair_ids, pair.pair_id])]
    },
    confidence: "LOW",
    confidence_basis: {
      ...structuredClone(previous.confidence_basis),
      convergence_summary: "Negative sensitivity now has stronger direct-human evidence: interchangeable dashboard content, repeated module language, weak grouping, and orbiting placement are explicit failure cues. Positive excellence remains unconfirmed because the human judged B only as less bad."
    },
    known_uncertainties: [
      "No current image is human-confirmed as a positive example of excellent card execution.",
      "Content specificity and grouping improve B relative to A but have not been shown sufficient for excellence.",
      "One or two genuinely good card references are still required to establish the positive preference boundary."
    ],
    human_confirmed: false,
    preference_strength_status: "NON_AUTHORITATIVE_CANDIDATE",
    version: 3,
    created_at: timestamp,
    supersedes: previous.preference_id,
    revision_reason: `Card Diagnostic Pair ${pair.pair_id} strengthened the negative definition while explicitly withholding positive confirmation.`,
    human_confirmation_question: "Envie uma ou duas peças do banco aprovado ou rejeitado cujos cards você realmente considere bons; o que torna esses cards específicos, inevitáveis e sofisticados naquela composição?",
    provenance: {
      ...structuredClone(previous.provenance),
      source_ref: "my-eyes://preference-inference/v3#MYE_PREF_000015",
      recorded_at: timestamp
    }
  };
}

export function applyCardDiagnosticPair000001({ rootDir, now = () => new Date(), persist = true }) {
  const manifestPath = path.join(rootDir, "data", "my_eyes", "approved_direction_memory.json");
  const responsePath = path.join(rootDir, "data", "my_eyes", "reviews", "CARD_DIAGNOSTIC_PAIR_000001_RESPONSE.md");
  const reportPath = path.join(rootDir, "data", "my_eyes", "reports", "CARD_PREFERENCE_V3.md");
  const rawText = fs.readFileSync(responsePath, "utf8");
  let memory = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  let pair = findPair(memory);
  let reason;
  if (!pair) {
    const result = appendPairwisePreference({
      memory,
      left_image_id: PAIR.left_image_id,
      right_image_id: PAIR.right_image_id,
      human_choice: "RIGHT",
      pair_type: "DIAGNOSTIC_PAIR",
      comparison_context: "Both are rejected portrait technology promotions with a central male subject and multiple floating informational cards. The comparison is explicitly limited to card content, specificity, grouping, hierarchy, subject relationship, and interchangeability; neither side is assumed to be a positive excellence reference.",
      human_reason_raw: rawText,
      source_ref: PAIR.source_ref,
      now
    });
    memory = result.memory;
    pair = result.pair;
    reason = result.human_reason;
  } else {
    if (pair.result !== "RIGHT_PREFERRED" || pair.preferred_image_id !== PAIR.preferred_image_id || pair.pair_type !== "DIAGNOSTIC_PAIR") {
      throw new Error("Existing card diagnostic pair does not match the explicit HUMAN decision.");
    }
    reason = memory.human_reasons.find((item) => pair.human_reason_ids.includes(item.reason_id));
    if (!reason || reason.raw_text !== rawText) throw new Error("Existing card diagnostic pair does not preserve the literal HUMAN response.");
  }

  const existingV3 = memory.inferred_preferences.find((item) => item.preference_id === "MYE_PREF_000015");
  if (!existingV3) {
    const revision = buildCandidate7V3({ memory, pair, reason, now });
    memory = appendPreferenceRevision({
      memory,
      previousPreferenceId: revision.supersedes,
      revisedCandidate: revision,
      now
    });
  }

  const candidate = memory.inferred_preferences.find((item) => item.preference_id === "MYE_PREF_000015");
  const active = memory.inferred_preferences.filter((item) => item.status !== "SUPERSEDED");
  const currentCardCandidate = active.find((item) => item.related_concepts.includes("GENERIC_CARD_TREATMENT_SENSITIVITY"));
  const preferenceModelV1Ready = active.length === 7 && active.every((item) => item.human_confirmed === true);
  const report = `# CARD PREFERENCE v3

## Diagnostic decision

- Pair: ${pair.pair_id}
- A: ${PAIR.left_image_id} — data/my_eyes/rejected/1.png
- B: ${PAIR.right_image_id} — data/my_eyes/rejected/4.png
- Human choice: B
- Difficulty: EASY when judging only the cards
- Interpretation: B is less bad, not a positive example of card excellence

## Strengthened negative definition

Card genérico é um componente visual intercambiável, com aparência de dashboard/UI pronta, conteúdo pouco específico, repetição de formato e linguagem, e posicionamento que parece preencher espaço em vez de participar organicamente da direção visual.

## Candidate 7 v3

- ID: ${candidate.preference_id}
- Status: ${candidate.status}
- Human confirmed: ${candidate.human_confirmed}
- Strength: ${candidate.preference_strength_status}
- Supersedes: ${candidate.supersedes}
- Positive excellence model established: no
- Scores: 0
- Weights: 0
- Critic integration: 0
- Creative Director integration: 0

## Historical stage outcome

At Candidate 7 v3, one or two genuinely good card references were still required. The less-bad result was not promoted into a positive excellence standard.

## Current state after later append-only revisions

- Active card candidate: ${currentCardCandidate.preference_id}
- Active card candidate status: ${currentCardCandidate.status}
- Active card candidate human confirmed: ${currentCardCandidate.human_confirmed}
- My Eyes Preference Model v1 ready: ${preferenceModelV1Ready ? "yes" : "no"}
`;

  if (persist) {
    persistApprovedDirectionMemory({ manifestPath, memory });
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report, "utf8");
  }

  return { memory, pair, reason, candidate, currentCardCandidate, preferenceModelV1Ready, report, manifestPath, responsePath, reportPath };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = applyCardDiagnosticPair000001({ rootDir });
  console.log(JSON.stringify({
    pair_id: result.pair.pair_id,
    human_choice: result.pair.result,
    difficulty: "EASY",
    candidate_id: result.candidate.preference_id,
    candidate_status: result.candidate.status,
    human_confirmed: result.candidate.human_confirmed,
    positive_card_model_established: result.currentCardCandidate.human_confirmed,
    current_card_candidate_id: result.currentCardCandidate.preference_id,
    my_eyes_preference_model_v1_ready: result.preferenceModelV1Ready,
    scores: 0,
    weights: 0,
    report_path: path.relative(rootDir, result.reportPath).replaceAll(path.sep, "/")
  }, null, 2));
}
