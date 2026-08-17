const clone = (value) => structuredClone(value);

export const PREFERENCE_REVIEW_V1_CONTEXT = {
  context_scope: "PREFERENCE_CANDIDATE_REVIEW",
  context_ref: "PREFERENCE_INFERENCE_V1_REVIEW_000001",
  source_ref: "my-eyes://preference-confirmation/review-000001"
};

const REVIEW_GROUP = {
  group_id: "explicit_human_review_000001",
  evidence_refs: ["MYE_RSN_000012"],
  independence_basis: "Explicit human review of all seven Preference Candidates after the v1 report."
};

const OVERRIDES = [
  {
    id: "MYE_PREF_000008",
    previous: "MYE_PREF_000001",
    status: "SUPPORTED",
    statement: "The designer accepts and may sometimes prefer high-information or visually exaggerated compositions when the elements are functional, well integrated, mutually coherent, and converge on one idea; quantity itself is not the failure condition.",
    conditions: [
      "elements contribute to a shared idea or visual logic",
      "placement and relationships remain controlled and well fitted",
      "the whole remains mentally readable despite density",
      "complexity is functional, intentional, and perceptually convergent"
    ],
    exceptions: [
      "a simple composition may still fail when its few elements feel artificial or disconnected",
      "maximalism and visual exaggeration can be desirable when subordinated to the whole"
    ],
    explicitly_not_claimed: [
      "high_complexity_is_bad",
      "low_complexity_is_preferred",
      "maximalism_is_bad",
      "fewer_elements_are_better",
      "a_fixed_maximum_element_count_exists"
    ],
    uncertainties: [
      "Application across new media and non-promotional formats still needs future observation.",
      "Perceptual convergence remains contextual even though the generalized preference is human-confirmed."
    ]
  },
  {
    id: "MYE_PREF_000009",
    previous: "MYE_PREF_000002",
    status: "SUPPORTED",
    statement: "The designer values elements that materially strengthen composition, narrative, atmosphere, depth, meaning, or readability, and devalues elements used mainly to fill space, decorate without contribution, or manufacture impact.",
    conditions: [
      "each prominent element has a strong visual reason to exist",
      "the element strengthens narrative, hierarchy, framing, depth, atmosphere, integration, meaning, or readability",
      "secondary and decorative decisions remain subordinated to the central idea"
    ],
    exceptions: [
      "decoration, effects, and secondary elements can work when they strengthen the piece",
      "an element does not require literal story meaning if its compositional or atmospheric function is strong"
    ],
    explicitly_not_claimed: [
      "decoration_is_bad",
      "effects_are_bad",
      "secondary_elements_are_bad",
      "every_element_requires_literal_story_meaning",
      "all_visual_elements_must_be_minimal"
    ],
    uncertainties: [
      "The boundary between subtle atmospheric contribution and dispensable filler remains contextual.",
      "Future examples may refine which functions deserve the greatest weight."
    ]
  },
  {
    id: "MYE_PREF_000010",
    previous: "MYE_PREF_000003",
    status: "CONTEXTUAL",
    statement: "The designer is strongly sensitive to combinations of generic, artificial, weakly intentional, or interchangeable visual decisions; evaluation should identify the specific decisions producing that result instead of using 'looks AI-generated' as an explanation.",
    scope: "Compositions where multiple impact devices, generic components, lighting choices, color treatments, depth shortcuts, or reusable visual formulas combine without a unifying concept.",
    conditions: [
      "unrelated floating elements or predictable filler positions weaken conceptual convergence",
      "generic dashboard or UI cards behave like ready-made modules around the subject",
      "removable particles, glows, lines, icons, miniobjects, or microeffects accumulate",
      "secondary elements glow independently or fail to share the scene lighting and depth logic",
      "neon colors, saturated gradients, uniform contrast, glow, or rim light lack conceptual or environmental motivation",
      "generic technological backgrounds or foreground blur simulate identity or depth without project specificity",
      "individually acceptable cinematic devices combine without one central idea",
      "the solution could be reused for another client, niche, or subject with little change"
    ],
    exceptions: [
      "the same individual devices can appear in approved work when motivated and integrated",
      "AI generation does not make an image bad and generation artifacts are not required",
      "cards, particles, floating objects, neon color, glow, and cinematic effects are not failure signals by themselves"
    ],
    explicitly_not_claimed: [
      "the_system_can_universally_detect_ai_look",
      "any_ai_generated_image_is_bad",
      "floating_elements_prove_ai_generation",
      "cards_prove_ai_generation",
      "neon_or_high_contrast_proves_ai_generation",
      "technical_polish_is_bad"
    ],
    uncertainties: [
      "The relative contribution of each cue remains contextual and should not be converted into isolated detector weights.",
      "The supplied Creative Director and Critic wording is preserved as future operational guidance only; no runtime integration is authorized in this stage."
    ]
  },
  {
    id: "MYE_PREF_000011",
    previous: "MYE_PREF_000004",
    status: "SUPPORTED",
    statement: "The designer is sensitive to accumulated microdetails when they do not materially strengthen narrative, depth, composition, atmosphere, framing, direction of attention, integration, or meaning, especially when their combined effect creates mental noise or artificial richness.",
    conditions: [
      "many small details accumulate without a shared visual role",
      "the details compete with one another or disturb the mental read",
      "removing a microelement would not cost the piece anything important",
      "each microelement should be treated as removable when no clear narrative, depth, framing, attention, atmosphere, integration, compositional, or semantic function can be identified"
    ],
    exceptions: [
      "an extremely detailed image can work when details remain subordinated to the whole",
      "particles, textures, icons, lines, glows, and other microeffects are not prohibited"
    ],
    explicitly_not_claimed: [
      "detail_is_bad",
      "richness_is_bad",
      "minimalism_is_preferred",
      "particles_are_forbidden",
      "micro_effects_are_forbidden",
      "clean_design_requires_few_elements"
    ],
    uncertainties: [
      "No quantitative threshold for accumulation exists.",
      "Removal value and fine-detail perception may change with output size and viewing distance."
    ]
  },
  {
    id: "MYE_PREF_000012",
    previous: "MYE_PREF_000005",
    status: "CONTEXTUAL",
    statement: "Floating elements can be highly effective for this designer, but each one must justify its presence through narrative, composition, depth, framing, direction of attention, or meaning, while quantity, scale, position, perspective, lighting, and integration follow one spatial and visual logic.",
    conditions: [
      "selection supports the concept or narrative",
      "quantity is justified by function rather than frame filling",
      "scale, position, perspective, depth, and occlusion belong to the scene",
      "lighting responds to the general environment instead of operating independently",
      "the element strengthens subject relationship, framing, motion, or direction of attention"
    ],
    exceptions: [
      "one or many floating elements may work",
      "nonphysical suspension can be intentionally surreal or narrative",
      "no fixed numerical limit is supported"
    ],
    explicitly_not_claimed: [
      "floating_elements_are_bad",
      "floating_elements_are_forbidden",
      "one_floating_element_is_the_limit",
      "nonphysical_elements_are_bad",
      "a_fixed_floating_element_count_exists"
    ],
    uncertainties: [
      "No fixed quantity threshold is supported.",
      "Purposeful atmosphere versus decorative filler remains contextual."
    ]
  },
  {
    id: "MYE_PREF_000013",
    previous: "MYE_PREF_000006",
    status: "CONTEXTUAL",
    statement: "The designer tends to prefer color with presence and contrast strong enough to create impact when both remain coherent with the scene and are applied locally and intentionally rather than becoming artificial saturation.",
    conditions: [
      "avoid washed-out or weak presence when the direction calls for impact",
      "localized saturation and contrast support subject readability, plane separation, atmosphere, focus, depth, and hierarchy",
      "light, skin, environment, and palette remain coherent",
      "contrast strength follows the intended scene rather than a uniform enhancement preset"
    ],
    exceptions: [
      "restrained, pale, dark, or low-saturation palettes can work when conceptually appropriate",
      "neon and saturated gradients can work when motivated by the visual direction"
    ],
    explicitly_not_claimed: [
      "more_saturation_is_better",
      "maximum_contrast_is_better",
      "neon_is_better",
      "every_piece_must_be_colorful",
      "pale_images_are_always_bad",
      "a_numeric_color_target_exists"
    ],
    uncertainties: [
      "Preferred chromatic intensity remains highly dependent on concept, atmosphere, and medium.",
      "No numeric saturation or contrast target is supported."
    ]
  },
  {
    id: "MYE_PREF_000014",
    previous: "MYE_PREF_000007",
    status: "INSUFFICIENT_EVIDENCE",
    confidence: "LOW",
    statement: "Current evidence strongly supports sensitivity to generic or interchangeable cards, but does not safely establish which positive properties make a card excellent for this designer.",
    conditions: [
      "semantic function is a hypothesis for a strong card",
      "project-specific content and visual language are hypotheses for a strong card",
      "compositional and spatial integration, perspective, depth, blur, lighting, and occlusion are hypotheses for a strong card",
      "hierarchy, grouping, subject relationship, controlled internal density, removal value, and non-interchangeability are hypotheses requiring a diagnostic comparison",
      "visual simplicity may still be sophisticated when the card feels inevitable in that composition"
    ],
    exceptions: [
      "cards are not inherently bad",
      "a card may be visually simple and still be excellent",
      "the negative sensitivity to generic cards does not confirm a complete positive model of card excellence"
    ],
    explicitly_not_claimed: [
      "cards_are_bad",
      "cards_are_forbidden",
      "interface_design_is_bad",
      "a_maximum_card_count_exists",
      "positive_card_excellence_criteria_are_confirmed",
      "the_system_can_currently_predict_an_excellent_card"
    ],
    uncertainties: [
      "There is not enough evidence about what makes the designer say that a card execution is excellent.",
      "The proposed positive criteria remain operational hypotheses until a diagnostic card pair is judged.",
      "The negative sensitivity may overlap with the broader generic and interchangeable visual signature."
    ],
    question: "Em um pair diagnóstico no qual ambas as peças usam cards razoavelmente bem, qual execução parece mais design para você, e quais decisões específicas explicam a diferença?"
  }
];

function reviewEvidence(memory) {
  return memory.human_reasons.find((reason) =>
    reason.target?.context_scope === PREFERENCE_REVIEW_V1_CONTEXT.context_scope &&
    reason.target?.context_ref === PREFERENCE_REVIEW_V1_CONTEXT.context_ref &&
    reason.status === "ACTIVE"
  );
}

export function buildPreferenceRevisionsV2({ memory, now = () => new Date() }) {
  const review = reviewEvidence(memory);
  if (!review) throw new Error("The literal human review must be recorded before building Preference Candidate revisions.");
  const timestamp = now().toISOString();
  return OVERRIDES.map((override, index) => {
    const previous = memory.inferred_preferences.find((item) => item.preference_id === override.previous);
    if (!previous) throw new Error(`Missing v1 predecessor ${override.previous}.`);
    const humanConfirmed = index < 6;
    const next = {
      ...clone(previous),
      preference_id: override.id,
      statement: override.statement,
      status: override.status,
      scope: override.scope ?? previous.scope,
      conditions: override.conditions,
      exceptions: override.exceptions,
      explicitly_not_claimed: override.explicitly_not_claimed,
      supporting_evidence_refs: [...new Set([...previous.supporting_evidence_refs, review.reason_id])],
      human_evidence_refs: [...new Set([...previous.human_evidence_refs, review.reason_id])],
      independent_evidence_groups: [...clone(previous.independent_evidence_groups), {
        ...clone(REVIEW_GROUP),
        evidence_refs: [review.reason_id]
      }],
      confidence: override.confidence ?? previous.confidence,
      confidence_basis: {
        ...clone(previous.confidence_basis),
        convergence_summary: humanConfirmed
          ? `${previous.confidence_basis.convergence_summary} The designer explicitly confirmed and refined this generalization in ${review.reason_id}.`
          : "Human review confirms the negative sensitivity but explicitly withholds confirmation of the positive card-excellence model; the proposed positive properties remain hypotheses."
      },
      known_uncertainties: override.uncertainties,
      human_confirmed: humanConfirmed,
      preference_strength_status: humanConfirmed
        ? "HUMAN_CONFIRMED_GENERALIZED_PREFERENCE"
        : "NON_AUTHORITATIVE_CANDIDATE",
      version: previous.version + 1,
      created_at: timestamp,
      supersedes: previous.preference_id,
      revision_reason: humanConfirmed
        ? `Explicit human confirmation and refinement recorded in ${review.reason_id}.`
        : `Explicit human review in ${review.reason_id} set Candidate 7 to NEEDS_MORE_EVIDENCE; negative sensitivity retained, positive excellence criteria remain hypotheses.`,
      human_confirmation_question: override.question ?? "Human-confirmed in review 000001; reopen only if materially contradictory evidence appears.",
      provenance: {
        ...clone(previous.provenance),
        source_ref: `my-eyes://preference-inference/v2#${override.id}`,
        recorded_at: timestamp
      }
    };
    if (humanConfirmed) {
      next.human_confirmation_event = {
        event_id: `MYE_PREF_CONFIRM_${String(index + 1).padStart(6, "0")}`,
        confirmed_by: "HUMAN",
        recorded_at: timestamp,
        raw_human_evidence_ref: review.reason_id
      };
    } else {
      delete next.human_confirmation_event;
    }
    return next;
  });
}

const list = (values) => values.length ? values.map((value) => `- ${value}`).join("\n") : "- None.";

export function renderPreferenceReviewV2Report({ memory, candidates }) {
  const current = memory.inferred_preferences.filter((candidate) => candidate.status !== "SUPERSEDED");
  const confirmed = current.filter((candidate) => candidate.human_confirmed).length;
  const sections = candidates.map((candidate) => `## ${candidate.preference_id}

SUPERSEDES: ${candidate.supersedes}
STATUS: ${candidate.status}
TYPE: ${candidate.type}
STATEMENT: ${candidate.statement}
CONFIDENCE: ${candidate.confidence} (qualitative; not a score)
HUMAN CONFIRMED: ${candidate.human_confirmed}
STRENGTH: ${candidate.preference_strength_status}
CONDITIONS:
${list(candidate.conditions)}
EXCEPTIONS:
${list(candidate.exceptions)}
EXPLICITLY NOT CLAIMED:
${list(candidate.explicitly_not_claimed)}
KNOWN UNCERTAINTIES:
${list(candidate.known_uncertainties)}
NEXT HUMAN QUESTION:
${candidate.human_confirmation_question}
`).join("\n");

  return `# PREFERENCE CANDIDATES v2 — HUMAN REVIEW APPLIED

The literal review is preserved as MYE_RSN_000012. Version 1 records remain preserved and superseded append-only.

## State

- Active Preference Candidates: ${current.length}
- Preference Candidate v2 records rendered: ${candidates.length}
- Active v2 records: ${candidates.filter((candidate) => candidate.status !== "SUPERSEDED").length}
- Historical Preference Candidate records: ${memory.inferred_preferences.length}
- Human-confirmed generalized preferences: ${confirmed}
- Needs more evidence: ${current.filter((candidate) => candidate.status === "INSUFFICIENT_EVIDENCE").length}
- Scores: 0
- Weights: 0
- Ranking coefficients: 0
- Critic integration: 0
- Creative Director integration: 0

${sections}
## Candidate 7 diagnostic requirement

Create one diagnostic pair focused only on cards. Both executions must use cards reasonably well so the comparison reveals the positive preference boundary rather than merely contrasting good versus obviously generic execution.
`;
}
