import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendHumanReason, persistApprovedDirectionMemory } from "../src/my-eyes/human-evidence-store.mjs";
import { appendPreferenceRevision } from "../src/my-eyes/preference-candidate-store.mjs";
import { buildMyEyesPreferenceModelV1, persistMyEyesPreferenceModel } from "../src/my-eyes/preference-model-v1.mjs";

const IMAGE_ID = "MYE_IMG_000006";
const SOURCE_REF = "my-eyes://card-positive-reference/approved-6/000001";

function findConfirmation(memory) {
  return memory.human_reasons.find((reason) =>
    reason.status === "ACTIVE" &&
    reason.target?.image_id === IMAGE_ID &&
    reason.provenance.source_ref === SOURCE_REF
  );
}

function buildCandidate7V4({ memory, reason, now }) {
  const previous = memory.inferred_preferences.find((candidate) => candidate.preference_id === "MYE_PREF_000015");
  if (!previous) throw new Error("Candidate 7 v3 (MYE_PREF_000015) is required.");
  const timestamp = now().toISOString();
  return {
    ...structuredClone(previous),
    preference_id: "MYE_PREF_000016",
    statement: "The designer values card systems where specific real-seeming content is transformed into a unified compositional and narrative cluster, with meaningful variation, clear hierarchy, spatial integration, and subordination to the subject and central idea rather than behaving as interchangeable dashboard widgets.",
    status: "CONTEXTUAL",
    related_concepts: [...new Set([...previous.related_concepts, "POSITIVE_CARD_EXECUTION_REFERENCE", "SPECIFIC_NARRATIVE_CARD_SYSTEM"])],
    scope: "Promotional compositions where cards, documents, screens, projects, products, or work artifacts carry concrete narrative context around a primary subject.",
    conditions: [
      "card content represents concrete projects, products, documents, screens, briefings, or other work artifacts specific to the piece",
      "variation in content, proportion, angle, and appearance remains unified by one visual system",
      "cards group into a coherent cluster instead of behaving as independent modules orbiting the subject",
      "the subject remains the primary focus and cards supply context without disturbing the main read",
      "overlap, scale, occlusion, and depth integrate the system across visual planes",
      "the card system carries narrative meaning and materially strengthens the concept when present",
      "positioning preserves breathing room rather than filling every available gap",
      "the system cannot be replaced by generic SaaS metrics or graphs without changing the meaning"
    ],
    exceptions: [
      "approved/6.png is a strong positive reference but not a universal visual template",
      "good cards do not need to copy its cluster shape, palette, density, or physical-artifact aesthetic",
      "dashboard content may work when genuinely required and specifically transformed for the project",
      "one positive reference supports a contextual preference, not complete coverage of every excellent card language"
    ],
    explicitly_not_claimed: [
      "all_good_cards_must_look_like_approved_6",
      "all_good_cards_must_form_one_dense_cluster",
      "dashboard_cards_are_always_bad",
      "multiple_cards_are_always_good",
      "one_positive_example_proves_all_card_styles",
      "card_execution_can_be_judged_without_the_brief"
    ],
    supporting_evidence_refs: [...new Set([...previous.supporting_evidence_refs, reason.reason_id])],
    human_evidence_refs: [...new Set([...previous.human_evidence_refs, reason.reason_id])],
    independent_evidence_groups: [
      ...structuredClone(previous.independent_evidence_groups),
      {
        group_id: "approved_6_positive_card_confirmation",
        evidence_refs: [reason.reason_id],
        independence_basis: "Direct human A — BONS judgment focused exclusively on the cards of approved/6.png."
      }
    ],
    contradiction_search: {
      performed: true,
      query_scope: "All prior generic-card evidence, Card Diagnostic Pair 000001, approved card counterexamples, and the direct positive card-only judgment of approved/6.png.",
      outcome: "COUNTEREVIDENCE_FOUND",
      summary: "Prior evidence rejects generic interchangeable dashboards and prevents universal feature bans. The direct approved/6.png judgment supplies the first strong positive case: specific content, variation with unity, coherent clustering, hierarchy, spatial integration, narrative function, and non-interchangeability."
    },
    sample_context: {
      description: "Negative pairwise evidence plus the first direct positive card-only confirmation on approved/6.png.",
      image_ids: [...new Set([...previous.sample_context.image_ids, IMAGE_ID])],
      pair_ids: structuredClone(previous.sample_context.pair_ids)
    },
    confidence: "MEDIUM",
    confidence_basis: {
      ...structuredClone(previous.confidence_basis),
      convergence_summary: "Multiple negative human comparisons define generic failure, and one explicit card-only A — BONS judgment establishes approved/6.png as a strong positive execution reference. Confidence remains MEDIUM because the positive side currently has one case."
    },
    known_uncertainties: [
      "approved/6.png is currently the only direct human-confirmed positive card reference.",
      "Other excellent card languages, densities, and spatial organizations remain unsampled.",
      "Future positive or contradictory cases may require an append-only Candidate 7 v5 and Preference Model revision."
    ],
    human_confirmed: true,
    human_confirmation_event: {
      event_id: "MYE_PREF_CONFIRM_000007",
      confirmed_by: "HUMAN",
      recorded_at: timestamp,
      raw_human_evidence_ref: reason.reason_id
    },
    preference_strength_status: "HUMAN_CONFIRMED_GENERALIZED_PREFERENCE",
    version: 4,
    created_at: timestamp,
    supersedes: previous.preference_id,
    revision_reason: `Direct human A — BONS judgment in ${reason.reason_id} established approved/6.png as the first strong positive card reference.`,
    human_confirmation_question: "Quando surgir outro card system que você considere excelente, ele confirma estes princípios por uma linguagem diferente ou revela uma nova condição?",
    provenance: {
      ...structuredClone(previous.provenance),
      source_ref: "my-eyes://preference-inference/v4#MYE_PREF_000016",
      recorded_at: timestamp
    }
  };
}

export function applyCardPositiveReference000001({ rootDir, now = () => new Date(), persist = true }) {
  const manifestPath = path.join(rootDir, "data", "my_eyes", "approved_direction_memory.json");
  const responsePath = path.join(rootDir, "data", "my_eyes", "reviews", "CARD_POSITIVE_REFERENCE_APPROVED_6_000001.md");
  const reportPath = path.join(rootDir, "data", "my_eyes", "reports", "CARD_PREFERENCE_V4.md");
  const modelPath = path.join(rootDir, "data", "my_eyes", "models", "MY_EYES_PREFERENCE_MODEL_V1.json");
  const rawText = fs.readFileSync(responsePath, "utf8");
  let memory = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  let reason = findConfirmation(memory);
  if (!reason) {
    const result = appendHumanReason({
      memory,
      image_id: IMAGE_ID,
      raw_text: rawText,
      source_ref: SOURCE_REF,
      now
    });
    memory = result.memory;
    reason = result.reason;
  } else if (reason.raw_text !== rawText) {
    throw new Error("Stored positive card confirmation does not match the literal HUMAN response.");
  }

  let candidate = memory.inferred_preferences.find((item) => item.preference_id === "MYE_PREF_000016");
  if (!candidate) {
    const revision = buildCandidate7V4({ memory, reason, now });
    memory = appendPreferenceRevision({
      memory,
      previousPreferenceId: revision.supersedes,
      revisedCandidate: revision,
      now
    });
    candidate = memory.inferred_preferences.find((item) => item.preference_id === "MYE_PREF_000016");
  }

  const model = buildMyEyesPreferenceModelV1({ memory });
  const report = `# CARD PREFERENCE v4 — POSITIVE REFERENCE CONFIRMED

## Human judgment

- Image: MYE_IMG_000006 — data/my_eyes/approved/6.png
- Choice: A — BONS
- Use as positive execution reference: yes
- Universal card template: no

## Positive definition

Um card bom transforma conteúdo específico em elemento compositivo e narrativo, com função clara, variação com unidade, agrupamento coerente, hierarquia, integração espacial e subordinação ao sujeito e à ideia central.

## Candidate 7 v4

- ID: ${candidate.preference_id}
- Status: ${candidate.status}
- Confidence: ${candidate.confidence}
- Human confirmed: ${candidate.human_confirmed}
- Strength: ${candidate.preference_strength_status}
- Supersedes: ${candidate.supersedes}
- First positive reference: MYE_IMG_000006

## My Eyes Preference Model v1

- Model ID: ${model.model_id}
- Status: ${model.status}
- Active human-confirmed principles: ${model.principles.length}
- Scores: 0
- Weights: 0
- Ranking coefficients: 0
- Runtime mode: ${model.runtime_integration.mode}
- Creative Director integration: ${model.runtime_integration.creative_director}
- Critic integration: ${model.runtime_integration.critic}
- Compiler integration: ${model.runtime_integration.compiler}
- Generation integration: ${model.runtime_integration.generation}

The model is ready as an auditable evidence artifact. Runtime consumers remain disconnected until a separate integration stage is explicitly authorized.
`;

  if (persist) {
    persistApprovedDirectionMemory({ manifestPath, memory });
    persistMyEyesPreferenceModel({ modelPath, model });
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report, "utf8");
  }

  return { memory, reason, candidate, model, report, manifestPath, responsePath, reportPath, modelPath };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = applyCardPositiveReference000001({ rootDir });
  console.log(JSON.stringify({
    positive_reference_image_id: IMAGE_ID,
    human_choice: "A_BONS",
    candidate_id: result.candidate.preference_id,
    candidate_status: result.candidate.status,
    candidate_human_confirmed: result.candidate.human_confirmed,
    human_confirmed_generalized_preferences: result.memory.summary.human_confirmed_generalized_preference_count,
    preference_model_id: result.model.model_id,
    preference_model_status: result.model.status,
    preference_model_principles: result.model.principles.length,
    scores: 0,
    weights: 0,
    runtime_integration: result.model.runtime_integration,
    model_path: path.relative(rootDir, result.modelPath).replaceAll(path.sep, "/"),
    report_path: path.relative(rootDir, result.reportPath).replaceAll(path.sep, "/")
  }, null, 2));
}
