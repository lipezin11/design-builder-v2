import fs from "node:fs";
import path from "node:path";
import { validateArtifact } from "../compiler/schema-validator.mjs";

const TITLES = new Map([
  ["MYE_PREF_000008", "Controlled intentional complexity"],
  ["MYE_PREF_000009", "Elements with real visual function"],
  ["MYE_PREF_000010", "Specific diagnosis of generic artificial assembly"],
  ["MYE_PREF_000011", "Functional microdetail discipline"],
  ["MYE_PREF_000012", "Floating element execution discipline"],
  ["MYE_PREF_000013", "Color vitality with controlled contrast"],
  ["MYE_PREF_000016", "Specific narrative card systems"]
]);

function activePreferences(memory) {
  return memory.inferred_preferences.filter((candidate) => candidate.status !== "SUPERSEDED");
}

export function buildMyEyesPreferenceModelV1({ memory }) {
  const active = activePreferences(memory);
  if (active.length !== 7) throw new Error(`My Eyes Preference Model v1 requires exactly seven active preferences; found ${active.length}.`);
  const unconfirmed = active.filter((candidate) => candidate.human_confirmed !== true);
  if (unconfirmed.length) throw new Error(`Every model v1 principle must be human-confirmed; unresolved: ${unconfirmed.map((item) => item.preference_id).join(", ")}.`);
  const unsupported = active.filter((candidate) => !["SUPPORTED", "CONTEXTUAL"].includes(candidate.status));
  if (unsupported.length) throw new Error(`Preference Model v1 cannot project unresolved candidates: ${unsupported.map((item) => item.preference_id).join(", ")}.`);

  const card = active.find((candidate) => candidate.preference_id === "MYE_PREF_000016");
  if (!card) throw new Error("Human-confirmed Candidate 7 v4 is required.");
  const confirmationReason = card.human_confirmation_event.raw_human_evidence_ref;

  const model = {
    schema_version: "1.0.0",
    model_id: "MYE_MODEL_000001",
    model_version: 1,
    status: "HUMAN_CONFIRMED_CONTEXTUAL_MODEL",
    source_memory_id: memory.memory_id,
    source_memory_version: memory.memory_version,
    generated_at: card.created_at,
    design_scope: "Qualitative designer-preference guidance distilled from the current Approved Direction Memory. Every principle remains contextual to the brief and supplied evidence.",
    principles: active.map((candidate) => ({
      preference_id: candidate.preference_id,
      title: TITLES.get(candidate.preference_id) ?? candidate.related_concepts[0],
      statement: candidate.statement,
      status: candidate.status,
      confidence: candidate.confidence,
      human_confirmed: true,
      scope: candidate.scope,
      conditions: structuredClone(candidate.conditions),
      exceptions: structuredClone(candidate.exceptions),
      explicitly_not_claimed: structuredClone(candidate.explicitly_not_claimed),
      evidence_refs: structuredClone(candidate.supporting_evidence_refs),
      positive_reference_image_ids: candidate.preference_id === card.preference_id ? ["MYE_IMG_000006"] : []
    })),
    card_execution_profile: {
      status: "HUMAN_CONFIRMED_CONTEXTUAL",
      positive_reference_image_id: "MYE_IMG_000006",
      positive_reference_human_reason_id: confirmationReason,
      positive_definition: "A good card is specific content transformed into a compositional and narrative element, with clear function, hierarchy, coherent grouping, spatial integration, and subordination to the subject and central idea.",
      supported_positive_properties: [
        "content represents concrete projects, products, documents, screens, or work artifacts rather than interchangeable metrics",
        "visual variation in content, proportion, angle, and appearance remains unified by one system language",
        "cards form a coherent cluster instead of independent modules orbiting the subject",
        "the subject remains the primary focus while cards provide context",
        "overlap, scale, occlusion, and depth distribute the system across believable visual planes",
        "the card system carries narrative meaning and would materially weaken the idea if removed",
        "the arrangement preserves breathing room instead of filling every empty region",
        "the system cannot be replaced by generic SaaS graphs without changing the piece's meaning"
      ],
      generic_failure_definition: "A generic card is an interchangeable ready-made dashboard or UI component with weakly specific content, repeated format and language, and placement that fills space or orbits the subject instead of participating organically in the visual direction.",
      generic_failure_signals: [
        "generic metrics and miniature charts that could be swapped across unrelated SaaS or marketing ads",
        "many independent modules using the same border, glow, metric, and mini-graph formula",
        "cards competing individually instead of forming a hierarchy or group",
        "content added to signal technology rather than serve the piece's actual message",
        "placement around the subject without organic compositional or narrative participation"
      ],
      unresolved_boundaries: [
        "approved/6.png is the first strong positive reference, not a universal template",
        "other excellent card languages and formats have not yet been sampled",
        "future contradictory or diverse positive evidence may require append-only model revision"
      ]
    },
    global_boundaries: {
      context_relative_to_brief: true,
      quantity_alone_is_not_failure: true,
      features_are_not_universal_verdicts: true,
      not_a_style_guide: true,
      human_evidence_has_highest_authority: true
    },
    runtime_integration: {
      mode: "EVIDENCE_ARTIFACT_ONLY",
      creative_director: false,
      critic: false,
      compiler: false,
      generation: false
    },
    provenance: {
      producer: "MY_EYES_PREFERENCE_MODEL_BUILDER",
      producer_version: "1.0.0",
      asserted_by: "SYSTEM_PROJECTION_OF_HUMAN_CONFIRMED_PREFERENCES",
      source_preference_ids: active.map((candidate) => candidate.preference_id)
    }
  };

  const validation = validateArtifact("my_eyes_preference_model", model);
  if (!validation.valid) throw new Error(`My Eyes Preference Model v1 failed validation: ${JSON.stringify(validation.errors)}`);
  return model;
}

export function persistMyEyesPreferenceModel({ modelPath, model }) {
  const validation = validateArtifact("my_eyes_preference_model", model);
  if (!validation.valid) throw new Error(`Refusing to persist invalid My Eyes Preference Model: ${JSON.stringify(validation.errors)}`);
  fs.mkdirSync(path.dirname(modelPath), { recursive: true });
  const temporary = `${modelPath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(model, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    fs.copyFileSync(temporary, modelPath);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
  return modelPath;
}
