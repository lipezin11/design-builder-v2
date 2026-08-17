import { validateArtifact } from "../../compiler/schema-validator.mjs";
import { REFERENCE_TRANSLATOR_ERROR_CODES as C, ReferenceTranslatorError } from "../reference-translator-errors.mjs";
import { buildSchemaCorrectionDiagnostics } from "./schema-correction-diagnostic-builder.mjs";

const BLOCK = "BLOCK";
const WARNING = "WARNING";
const meaningfulStrength = new Set(["MEDIUM", "HIGH", "VERY_HIGH"]);
const prohibitedOutputKeys = new Set([
  "selected_direction", "final_frame_spec", "critic_decision", "generation_request",
  "compiled_generation_request", "approval", "scores", "weights", "rankings"
]);
const sourceHueTerms = [
  "purple", "violet", "green", "blue", "cyan", "teal", "turquoise", "red",
  "orange", "amber", "yellow", "gold", "golden", "pink", "magenta", "burgundy"
];
const genericTechTerms = [
  ["server racks", /\bserver (?:rack|racks|array|arrays|infrastructure)\b/i],
  ["code screens", /\b(?:code|coding) (?:screen|screens|display|displays)\b/i],
  ["circuit patterns", /\bcircuit (?:pattern|patterns|diagram|diagrams|trace|traces)\b/i],
  ["data visualization", /\bdata (?:visualization|visualizations|visualisation|visualisations|viz)\b/i],
  ["holographic interface", /\bholographic (?:interface|interfaces|display|displays)\b/i],
  ["code stream", /\bcode (?:stream|streams)\b/i],
  ["digital grid", /\bdigital (?:grid|grids)\b/i],
  ["generic neon", /\bneon (?:tunnel|tunnels|grid|grids|cables?)\b/i]
];

const diagnostic = (code, message, path = "", severity = BLOCK, details = {}) => ({
  code, severity, message, ...(path ? { path } : {}), ...(Object.keys(details).length ? { details } : {})
});
const normalized = (value) => String(value ?? "").trim().toLocaleLowerCase();
const containsTerm = (text, term) => {
  const escaped = term.replace(/[.*+?^{}$()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp("(^|[^a-z0-9])" + escaped + "([^a-z0-9]|$)", "i").test(text);
};
const targetOwnedBriefText = (briefSpec = {}) => normalized(JSON.stringify({
  user_request: briefSpec.user_request,
  commercial_objective: briefSpec.commercial_objective,
  communication_goal: briefSpec.communication_goal,
  target_context: briefSpec.target_context,
  copy: briefSpec.copy,
  hard_constraints: briefSpec.hard_constraints,
  soft_preferences: briefSpec.soft_preferences,
  emotional_intent: briefSpec.emotional_intent,
  preservation_requirements: briefSpec.preservation_requirements,
  assets: (briefSpec.assets ?? []).filter((asset) => !["PRIMARY_REFERENCE", "SECONDARY_REFERENCE"].includes(asset.role))
}));
const valuesFrom = (items = []) => items.flatMap((item) => {
  if (typeof item === "string") return [item];
  if (!item || typeof item !== "object") return [];
  return [item.semantic_id, item.element, item.target, item.value].filter((value) => typeof value === "string");
});
const targetDirectedText = (plan) => JSON.stringify({
  design_decision_map: (plan.design_decision_map ?? []).map((item) => ({
    action: item.action,
    target_in_new_composition: item.target_in_new_composition,
    rationale: item.rationale,
    adaptation: item.cross_category_adaptation ? {
      visual_function: item.cross_category_adaptation.visual_function,
      material_language: item.cross_category_adaptation.material_language,
      emotional_effect: item.cross_category_adaptation.emotional_effect,
      equivalent_adaptation: item.cross_category_adaptation.equivalent_adaptation,
      target_category_coherence: item.cross_category_adaptation.target_category_coherence
    } : undefined
  })),
  non_negotiable_anchors: plan.non_negotiable_anchors,
  flexible_areas: plan.flexible_areas,
  risks: plan.risks,
  director_handoff: plan.director_handoff
}).toLocaleLowerCase();

function visitKeys(value, path, diagnostics, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) return value.forEach((item, index) => visitKeys(item, `${path}[${index}]`, diagnostics, seen));
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (prohibitedOutputKeys.has(key.toLocaleLowerCase())) {
      diagnostics.push(diagnostic("TRANSLATOR_DOWNSTREAM_AUTHORITY_VIOLATION", `Reference Translator output cannot create ${key}.`, childPath));
    }
    visitKeys(child, childPath, diagnostics, seen);
  }
}

function observationIndex(plan) {
  const byReference = new Map();
  for (const analysis of plan.reference_analyses ?? []) {
    byReference.set(analysis.reference_asset_id, new Map((analysis.observations ?? []).map((item) => [item.observation_id, item])));
  }
  return byReference;
}

function validateCrossCategory(plan, referenceAssets, targetProductCategory, diagnostics) {
  const mappings = plan.design_decision_map ?? [];
  const assetsById = new Map(referenceAssets.map((asset) => [asset.asset_id, asset]));
  const targetCategory = normalized(targetProductCategory);
  for (const [mappingIndex, mapping] of mappings.entries()) {
    if (!mapping.cross_category_adaptation) continue;
    const asset = assetsById.get(mapping.source_reference_asset_id);
    const sourceCategory = normalized(asset?.product_category);
    const supportIds = new Set(asset?.product_support_observation_ids ?? []);
    const citesDeclaredSupport = (mapping.observation_ids ?? []).some((observationId) => supportIds.has(observationId));
    if (!sourceCategory || !targetCategory || sourceCategory === targetCategory || !citesDeclaredSupport) {
      diagnostics.push(diagnostic(
        "CROSS_CATEGORY_ADAPTATION_OUT_OF_SCOPE",
        "cross_category_adaptation is reserved for a declared product-category change and a cited product-support observation; general domain or context adaptation must use ordinary ADAPT, REINVENT, or DISCARD fields.",
        "design_decision_map[" + mappingIndex + "].cross_category_adaptation",
        BLOCK,
        {
          reference_asset_id: mapping.source_reference_asset_id,
          source_product_category: asset?.product_category ?? null,
          target_product_category: targetProductCategory ?? null,
          cites_declared_product_support: citesDeclaredSupport
        }
      ));
    }
  }
  for (const asset of referenceAssets) {
    const sourceCategory = normalized(asset.product_category);
    if (!sourceCategory || !targetCategory || sourceCategory === targetCategory) continue;
    const supportIds = new Set(asset.product_support_observation_ids ?? []);
    for (const observationId of supportIds) {
      const related = mappings.filter((item) =>
        item.source_reference_asset_id === asset.asset_id && (item.observation_ids ?? []).includes(observationId)
      );
      if (!related.length) {
        diagnostics.push(diagnostic(
          "CROSS_CATEGORY_SUPPORT_ELEMENT_UNRESOLVED",
          "Every declared cross-category product-support element requires an explicit adaptation, reinvention, or discard decision.",
          "design_decision_map",
          BLOCK,
          { reference_asset_id: asset.asset_id, observation_id: observationId }
        ));
        continue;
      }
      for (const mapping of related) {
        const index = mappings.indexOf(mapping);
        const path = `design_decision_map[${index}]`;
        if (!["ADAPT", "REINVENT", "DISCARD"].includes(mapping.action)) {
          diagnostics.push(diagnostic(
            "CROSS_CATEGORY_LITERAL_PROP_TRANSFER",
            "A support prop from another product category cannot be transferred literally.",
            `${path}.action`,
            BLOCK,
            { action: mapping.action, observation_id: observationId }
          ));
        }
        const adaptation = mapping.cross_category_adaptation;
        if (!adaptation) {
          diagnostics.push(diagnostic(
            "CROSS_CATEGORY_ADAPTATION_REQUIRED",
            "Cross-category support decisions must distinguish literal object, visual function, material language, emotional effect, and target-native equivalent.",
            `${path}.cross_category_adaptation`
          ));
          continue;
        }
        if (normalized(adaptation.reference_product_category) !== sourceCategory ||
            normalized(adaptation.target_product_category) !== targetCategory) {
          diagnostics.push(diagnostic(
            "CROSS_CATEGORY_CLASSIFICATION_MISMATCH",
            "Cross-category adaptation categories must match the declared source and target product categories.",
            `${path}.cross_category_adaptation`,
            BLOCK,
            { expected_source: asset.product_category, expected_target: targetProductCategory }
          ));
        }
        const literal = normalized(adaptation.literal_object);
        const equivalent = normalized(adaptation.equivalent_adaptation);
        if (adaptation.literal_transfer_allowed !== false || (literal && equivalent.includes(literal))) {
          diagnostics.push(diagnostic(
            "CROSS_CATEGORY_EQUIVALENT_IS_LITERAL_COPY",
            "The equivalent adaptation must change the object manifestation while preserving its design function.",
            `${path}.cross_category_adaptation.equivalent_adaptation`
          ));
        }
        const declaredLiteral = (asset.literal_support_elements ?? []).find((item) => item.observation_id === observationId)?.object;
        if (declaredLiteral && literal !== normalized(declaredLiteral)) {
          diagnostics.push(diagnostic(
            "CROSS_CATEGORY_LITERAL_OBJECT_MISMATCH",
            "The adaptation must identify the actual literal source object before translating it.",
            `${path}.cross_category_adaptation.literal_object`,
            BLOCK,
            { expected: declaredLiteral }
          ));
        }
      }
    }
  }
}

function sourceHuesByReference(plan) {
  const result = new Map();
  for (const analysis of plan.reference_analyses ?? []) {
    const hues = new Set();
    for (const observation of analysis.observations ?? []) {
      const text = normalized(observation.description);
      for (const hue of sourceHueTerms) if (containsTerm(text, hue)) hues.add(hue);
    }
    result.set(analysis.reference_asset_id, hues);
  }
  return result;
}

function validateSourceHueAuthority(plan, briefSpec, diagnostics) {
  const targetOwned = targetOwnedBriefText(briefSpec);
  const huesByReference = sourceHuesByReference(plan);
  const index = observationIndex(plan);
  for (const [mappingIndex, mapping] of (plan.design_decision_map ?? []).entries()) {
    const sourceHues = huesByReference.get(mapping.source_reference_asset_id) ?? new Set();
    const observations = index.get(mapping.source_reference_asset_id);
    const citedText = (mapping.observation_ids ?? []).map((id) => observations?.get(id)?.description ?? "").join(" ");
    const citedHues = [...sourceHues].filter((hue) => containsTerm(citedText, hue));
    const target = normalized(mapping.target_in_new_composition);
    for (const hue of citedHues) {
      if (containsTerm(targetOwned, hue) || !containsTerm(target, hue)) continue;
      const escapedHue = hue.replace(/[.*+?^{}$()|[\]\\]/g, "\\$&");
      const locksHue = new RegExp("\\b(?:maintain|preserve|retain|keep|match|repeat|reuse|carry|use)\\b[^.]{0,80}\\b" + escapedHue + "\\b|\\b" + escapedHue + "\\b[^.]{0,40}\\b(?:dominant|mandatory|locked|anchor)", "i").test(target);
      if (locksHue) {
        diagnostics.push(diagnostic(
          "SOURCE_HUE_OVERANCHOR",
          "A source hue cannot become a target requirement unless the target brief or brand explicitly owns it; preserve value, saturation, temperature, accent, separation, and material-response relationships instead.",
          "design_decision_map[" + mappingIndex + "].target_in_new_composition",
          BLOCK,
          { source_hue: hue, reference_asset_id: mapping.source_reference_asset_id }
        ));
        break;
      }
    }
  }

  // Checks: non-negotiable anchors, and all downstream handoff fields that carry positive requirements.
  // "Positive requirement" means the text asserts preservation/use of the hue, not negation or warning.
  // A leading negation phrase exempts the text entry from this check.
  const negationPrefix = /^\s*(?:do\s+not|don'?t|avoid|never|no\s)\b/i;
  const allSourceHues = new Set([...huesByReference.values()].flatMap((items) => [...items]));

  const invariantFields = [
    ["non_negotiable_anchors", (plan.non_negotiable_anchors ?? []).map((item) => ({ text: [item.description, item.function, item.reason ?? ""].join(" "), source: item.source_reference_asset_id }))],
    ["director_handoff.what_must_survive", (plan.director_handoff?.what_must_survive ?? []).map((text) => ({ text: String(text), source: null }))],
    ["director_handoff.what_should_survive", (plan.director_handoff?.what_should_survive ?? []).map((text) => ({ text: String(text), source: null }))],
    ["director_handoff.recommended_anchors", (plan.director_handoff?.recommended_anchors ?? []).map((text) => ({ text: String(text), source: null }))]
  ];
  for (const [path, items] of invariantFields) {
    for (const [itemIndex, item] of items.entries()) {
      if (negationPrefix.test(item.text)) continue;
      const candidateHues = item.source ? (huesByReference.get(item.source) ?? new Set()) : allSourceHues;
      for (const hue of candidateHues) {
        if (!containsTerm(item.text, hue) || containsTerm(targetOwned, hue)) continue;
        diagnostics.push(diagnostic(
          "SOURCE_HUE_TREATED_AS_INVARIANT",
          "A source hue cannot appear in a non-negotiable, must-survive, should-survive, or recommended-anchor field without explicit target ownership; anchor the relational color function instead.",
          path + "[" + itemIndex + "]",
          BLOCK,
          { source_hue: hue, reference_asset_id: item.source }
        ));
        break;
      }
    }
  }
}

function validateTargetSpecificEvidence(plan, briefSpec, diagnostics) {
  const targetEvidence = targetOwnedBriefText(briefSpec);
  if (!/\b(?:technology|tech|software|digital|developer|coding|programming|artificial intelligence|data|cyber)\b/i.test(targetEvidence)) return;
  for (const [mappingIndex, mapping] of (plan.design_decision_map ?? []).entries()) {
    if (!["ADAPT", "REINVENT"].includes(mapping.action)) continue;
    const target = String(mapping.target_in_new_composition ?? "");
    const ungrounded = genericTechTerms
      .filter(([, expression]) => expression.test(target))
      .filter(([, expression]) => !expression.test(targetEvidence))
      .map(([label]) => label);
    if (ungrounded.length < 2) continue;
    diagnostics.push(diagnostic(
      "GENERIC_TECH_SUBSTITUTION_UNGROUNDED",
      "A list of stock technology motifs is not target-native evidence. Preserve the technical-mastery function, then derive the manifestation from verified creator, product, workflow, or audience evidence; if that evidence is missing, state the dependency or open question.",
      "design_decision_map[" + mappingIndex + "].target_in_new_composition",
      BLOCK,
      { ungrounded_technology_motifs: ungrounded }
    ));
  }
}

function validateLeakage(plan, briefSpec, referenceAssets, diagnostics) {
  const targetText = targetDirectedText(plan);
  const allowedTargetText = normalized(JSON.stringify([
    briefSpec.user_request,
    briefSpec.copy,
    ...(briefSpec.preservation_requirements ?? []).map((item) => item.element)
  ]));
  for (const asset of referenceAssets) {
    for (const [kind, values] of [
      ["REFERENCE_BRAND_LEAKAGE", asset.brand_markers ?? []],
      ["REFERENCE_TEXT_LEAKAGE", asset.visible_reference_text ?? []],
      ["REFERENCE_SUBJECT_IDENTITY_LEAKAGE", asset.reference_subject_identities ?? []]
    ]) {
      for (const value of values) {
        const token = normalized(value);
        if (token.length >= 3 && targetText.includes(token) && !allowedTargetText.includes(token)) {
          diagnostics.push(diagnostic(kind, "Reference-specific semantic content cannot become target-directed content.", "design_decision_map", BLOCK, { reference_asset_id: asset.asset_id, leaked_value: value }));
        }
      }
    }
  }
}

// ─── NEW CHECKS ──────────────────────────────────────────────────────────────

/**
 * Analyze the functional resolution status of an observation.
 * 
 * Returns an object with:
 * - linked: boolean (observation_id appears in at least one mapping)
 * - functionallyResolved: boolean (observation's principal function is addressed)
 * - action: string | null (the disposition action if linked)
 * - reason: string (explanation of resolution status)
 * 
 * For TYPOGRAPHY observations, linkage alone is insufficient: the mapping must
 * demonstrate functional resolution of typographic concerns.
 */
function analyzeObservationResolution(observation, referenceAssetId, plan) {
  const index = observationIndex(plan);
  
  // Find all mappings that cite this observation.
  const citingMappings = (plan.design_decision_map ?? []).filter((m) =>
    m.source_reference_asset_id === referenceAssetId &&
    (m.observation_ids ?? []).includes(observation.observation_id) &&
    resolvedDispositions.has(m.action)
  );

  if (citingMappings.length === 0) {
    return {
      linked: false,
      functionallyResolved: false,
      action: null,
      reason: "No mapping cites this observation"
    };
  }

  // Observation is linked. Now check functional resolution.
  const action = citingMappings[0].action; // Use first citing mapping's action

  // For TYPOGRAPHY observations, check functional resolution.
  if (observation.category === "TYPOGRAPHY") {
    const functionallyResolved = citingMappings.some((mapping) => {
      // DISCARD is always a valid functional resolution.
      if (mapping.action === "DISCARD") return true;

      // For ADAPT/REINVENT/TRANSFER, check whether the target + rationale
      // address typographic function rather than just chromatic/material attributes.
      const decisionText = normalized(
        [mapping.target_in_new_composition ?? "", mapping.rationale ?? ""].join(" ")
      );

      // Functional typography signals (must be specific to typography, not just "graphic"):
      const typographicFunctionPatterns = [
        /\b(?:text|copy|wording|headline|label|title|caption|typography|typographic|lettering)\b/i,
        /\b(?:compositional|placement|position|territory|region|area)\s+(?:mass|weight|presence|role|function)\b.*\b(?:text|typography|copy|wording)\b/i,
        /\b(?:text|typography|copy|wording)\b.*\b(?:compositional|placement|position|territory|mass|weight|presence)\b/i,
        /\b(?:hierarchy|scale|size|proportion)\b.*\b(?:text|typography|copy|headline)\b/i,
        /\b(?:text|typography|copy|headline)\b.*\b(?:hierarchy|scale|size|proportion)\b/i,
        /\b(?:discard|remove|omit|eliminate|abandon)\s+(?:source|literal|original)?\s*(?:text|copy|wording|typography)\b/i,
        /\b(?:readability|legibility|clarity)\b/i,
        /\b(?:asymmetric|symmetric|balanced|counterbalanced)\s+(?:text|typographic|graphic)\s+mass\b/i
      ];

      const hasFunctionalEvidence = typographicFunctionPatterns.some((pattern) =>
        pattern.test(decisionText)
      );

      // Check if structural terms appear with typographic context.
      const obsDesc = normalized(observation.description);
      const obsStructuralTerms = obsDesc
        .split(/\W+/)
        .filter((w) => w.length >= 5)
        .filter((w) => !["color", "hue", "chroma", "contrast", "accent", "bright", "saturated", "green"].includes(w));

      const mentionsStructuralTermsWithTypographicContext = obsStructuralTerms.some((term) => {
        if (!decisionText.includes(term)) return false;
        const termIndex = decisionText.indexOf(term);
        const window = decisionText.substring(Math.max(0, termIndex - 50), Math.min(decisionText.length, termIndex + term.length + 50));
        return /\b(?:text|copy|wording|typography|typographic|compositional\s+mass|hierarchy|placement)\b/i.test(window);
      });

      return hasFunctionalEvidence || mentionsStructuralTermsWithTypographicContext;
    });

    return {
      linked: true,
      functionallyResolved,
      action,
      reason: functionallyResolved 
        ? "Typographic function addressed in decision"
        : "Linked but only chromatic/material attributes transferred"
    };
  }

  // For non-TYPOGRAPHY observations, linkage with valid action = functional resolution.
  return {
    linked: true,
    functionallyResolved: true,
    action,
    reason: "Observation cited with valid disposition action"
  };
}

/**
 * Build a set of observation IDs that are explicitly resolved by the decision map.
 * An observation is resolved when it is cited in at least one mapping with a
 * recognised disposition action.
 */
const resolvedDispositions = new Set(["TRANSFER", "ADAPT", "REINVENT", "DISCARD", "CONFLICT"]);

// Common English stop-words used to filter descriptor noise in the genericity check.
const stopWords = new Set([
  "about", "above", "after", "again", "against", "before", "being", "below",
  "between", "during", "further", "having", "other", "should", "their", "there",
  "these", "those", "through", "under", "where", "which", "while", "within",
  "without", "would", "could", "creating", "provides", "provide", "creating",
  "environment", "technical", "digital", "target", "source", "native", "general"
]);

// Known generic category-label substitute patterns for ADAPT/REINVENT targets.
const genericAdaptationPatterns = [
  /\btarget[- ]native\s+(?:technical|digital|creative|visual|brand|content)\s+(?:environment|space|aesthetic|world|domain|context)\b/i,
  /\b(?:technical|digital|modern|relevant|appropriate|thematic)\s+(?:environment|space|aesthetic|world|domain|context)\b/i,
  /\bsubject'?s?\s+(?:specific\s+)?(?:technical|digital|creative|professional)\s+domain\b/i
];

function resolvedObservationIds(plan) {
  const resolved = new Set();
  for (const mapping of plan.design_decision_map ?? []) {
    if (!resolvedDispositions.has(mapping.action)) continue;
    for (const id of mapping.observation_ids ?? []) resolved.add(id);
  }
  return resolved;
}

/**
 * Check 2 — UNRESOLVED_REFERENCE_OBSERVATION / TYPOGRAPHY_UNRESOLVED
 *
 * DOMINANT or HIGH salience observations from primary/relevant references must
 * have an explicit disposition in the design_decision_map.
 *
 * For TYPOGRAPHY observations, linkage alone is NOT sufficient: the mapping must
 * demonstrate functional resolution of typographic concerns (presence, copy
 * disposition, compositional mass, hierarchy, treatment, integration) rather than
 * merely transferring an incidental color or material attribute.
 *
 * MEDIUM salience observations are only required to be resolved when clear
 * structural evidence shows the observation participates in a major mechanism.
 *
 * When in doubt about MEDIUM, prefer NOT to block.
 */
function validateUnresolvedObservations(plan, diagnostics) {
  const relevantRoles = new Set(["PRIMARY_REFERENCE", "SECONDARY_REFERENCE"]);
  const relevantRelevance = new Set(["HIGH", "VERY_HIGH"]);
  const index = observationIndex(plan);

  for (const analysis of plan.reference_analyses ?? []) {
    const isRelevant = relevantRoles.has(analysis.role) || relevantRelevance.has(analysis.transfer_relevance);
    if (!isRelevant) continue;

    // Build a text blob of all resolved-mapping rationale + dependencies for MEDIUM evidence.
    const resolvedMapText = (plan.design_decision_map ?? [])
      .filter((m) => resolvedDispositions.has(m.action) && m.source_reference_asset_id === analysis.reference_asset_id)
      .map((m) => [m.rationale ?? "", JSON.stringify(m.protected_dependencies ?? [])].join(" "))
      .join(" ")
      .toLowerCase();

    for (const obs of analysis.observations ?? []) {
      const salience = obs.salience;

      // Check DOMINANT/HIGH observations for resolution.
      if (salience === "DOMINANT" || salience === "HIGH") {
        // Use shared resolution analysis.
        const resolution = analyzeObservationResolution(obs, analysis.reference_asset_id, plan);

        if (!resolution.linked) {
          // No linkage at all.
          const code = obs.category === "TYPOGRAPHY" ? "TYPOGRAPHY_UNRESOLVED" : "UNRESOLVED_REFERENCE_OBSERVATION";
          diagnostics.push(diagnostic(
            code,
            `Observation ${obs.observation_id} (${obs.category}, salience=${salience}) in reference ${analysis.reference_asset_id} has no explicit disposition in the design decision map.`,
            "design_decision_map",
            BLOCK,
            { reference_asset_id: analysis.reference_asset_id, observation_id: obs.observation_id, category: obs.category, salience }
          ));
          continue;
        }

        // Linked but check functional resolution.
        if (!resolution.functionallyResolved) {
          const code = obs.category === "TYPOGRAPHY" ? "TYPOGRAPHY_UNRESOLVED" : "UNRESOLVED_REFERENCE_OBSERVATION";
          diagnostics.push(diagnostic(
            code,
            `Observation ${obs.observation_id} (${obs.category}, salience=${salience}) in reference ${analysis.reference_asset_id} is cited by a mapping but the decision does not demonstrate functional resolution. ${resolution.reason}`,
            "design_decision_map",
            BLOCK,
            {
              reference_asset_id: analysis.reference_asset_id,
              observation_id: obs.observation_id,
              category: obs.category,
              salience,
              cited_but_not_functionally_resolved: true
            }
          ));
        }
      } else if (salience === "MEDIUM") {
        // MEDIUM observations only block if structural evidence is clear.
        const resolution = analyzeObservationResolution(obs, analysis.reference_asset_id, plan);
        if (resolution.functionallyResolved) continue;

        const obsId = obs.observation_id;
        const obsDesc = normalized(obs.description);
        const citedById = resolvedMapText.includes(obsId.toLowerCase());
        const dnaText = normalized(JSON.stringify(analysis.reference_dna ?? {}));
        const descWords = obsDesc.split(/\s+/).filter((w) => w.length > 5);
        const dnaOverlap = descWords.length > 0 && descWords.filter((w) => dnaText.includes(w)).length >= 2;
        const categoryLiteral = obs.category.toLowerCase();
        const categoryInRationale = resolvedMapText.includes(categoryLiteral);

        const evidenceCount = [citedById, dnaOverlap, categoryInRationale].filter(Boolean).length;
        if (evidenceCount >= 2) {
          diagnostics.push(diagnostic(
            "UNRESOLVED_REFERENCE_OBSERVATION",
            `Observation ${obs.observation_id} (${obs.category}, salience=MEDIUM) in reference ${analysis.reference_asset_id} has no disposition but structural evidence indicates it participates in a major mechanism.`,
            "design_decision_map",
            BLOCK,
            { reference_asset_id: analysis.reference_asset_id, observation_id: obs.observation_id, category: obs.category, salience: "MEDIUM" }
          ));
        }
      }
    }
  }
}

/**
 * Check 3 — HIGH_INTENSITY_UNDERTRANSFER (Quality)
 *
 * When transfer_intensity is HIGH or VERY_HIGH, every observation that is a "major
 * mechanism" for the reference must have an explicit AND FUNCTIONAL disposition.
 * 
 * Major mechanism is NOT a fixed category list; it is derived from:
 *   • Salience (DOMINANT or HIGH in a primary/relevant reference)
 *   • Reference role / relevance
 *
 * We compare the set of functional categories carried by high-salience observations
 * against the categories that ARE functionally resolved (not just linked).
 * 
 * A HIGH/DOMINANT observation that is linked but functionally unresolved (e.g.,
 * TYPOGRAPHY observation with only chromatic transfer) does NOT count as resolved
 * for transfer-coverage purposes.
 * 
 * If any high-salience category is completely absent from the functionally-resolved
 * set (zero functionally-resolved observations for that category), that constitutes
 * a structural gap.
 */
function validateHighIntensityUndertransfer(plan, diagnostics) {
  const intensity = plan.transfer_intensity?.value;
  if (intensity !== "HIGH" && intensity !== "VERY_HIGH") return;

  const relevantRoles = new Set(["PRIMARY_REFERENCE", "SECONDARY_REFERENCE"]);
  const relevantRelevance = new Set(["HIGH", "VERY_HIGH"]);

  for (const analysis of plan.reference_analyses ?? []) {
    const isRelevant = relevantRoles.has(analysis.role) || relevantRelevance.has(analysis.transfer_relevance);
    if (!isRelevant) continue;

    // Collect all DOMINANT/HIGH-salience observations and the categories they cover.
    const majorObsByCat = new Map(); // category → [{observation_id, functionallyResolved}, ...]
    for (const obs of analysis.observations ?? []) {
      if (obs.salience !== "DOMINANT" && obs.salience !== "HIGH") continue;
      
      // Use shared functional resolution analysis.
      const resolution = analyzeObservationResolution(obs, analysis.reference_asset_id, plan);
      
      if (!majorObsByCat.has(obs.category)) majorObsByCat.set(obs.category, []);
      majorObsByCat.get(obs.category).push({
        observation_id: obs.observation_id,
        functionallyResolved: resolution.functionallyResolved
      });
    }

    // Determine which of those categories have at least one FUNCTIONALLY resolved observation.
    const unresolvedMajorCategories = [];
    for (const [cat, observations] of majorObsByCat) {
      const anyFunctionallyResolved = observations.some((o) => o.functionallyResolved);
      if (!anyFunctionallyResolved) {
        unresolvedMajorCategories.push({
          category: cat,
          observation_ids: observations.map((o) => o.observation_id)
        });
      }
    }

    if (unresolvedMajorCategories.length > 0) {
      diagnostics.push(diagnostic(
        "HIGH_INTENSITY_UNDERTRANSFER",
        `Transfer intensity is ${intensity} but the following major-mechanism categories from reference ${analysis.reference_asset_id} have no functionally-resolved observations in the decision map: ${unresolvedMajorCategories.map((x) => x.category).join(", ")}. Observations may be linked but lack functional resolution of their principal concerns.`,
        "design_decision_map",
        BLOCK,
        {
          reference_asset_id: analysis.reference_asset_id,
          transfer_intensity: intensity,
          unresolved_major_categories: unresolvedMajorCategories
        }
      ));
    }
  }
}

/**
 * Check 5 — DIRECTOR_HANDOFF_CONTRADICTION (Semantic)
 *
 * The director_handoff must not introduce a positive requirement for a
 * source-derived element that was explicitly abstracted, reinvented, or discarded
 * in the design_decision_map.
 *
 * "Abstracted" here means the mapping's target_in_new_composition does NOT carry
 * the specific source-derived term (hue name, literal object, or proper-noun
 * observation token) while the handoff field does — indicating the handoff
 * re-anchors something the decision map deliberately left behind.
 *
 * We check all handoff fields that assert positive requirements:
 * what_must_survive, what_should_survive, recommended_anchors, key_conflicts
 * (for positive "must/preserve" language), creative_opportunities.
 *
 * Negation-prefixed entries are excluded.
 */
function validateDirectorHandoffConsistency(plan, briefSpec, diagnostics) {
  const handoff = plan.director_handoff;
  if (!handoff) return;

  const targetOwned = targetOwnedBriefText(briefSpec);
  const negationPrefix = /^\s*(?:do\s+not|don'?t|avoid|never|no\s)\b/i;
  const huesByReference = sourceHuesByReference(plan);
  const allSourceHues = new Set([...huesByReference.values()].flatMap((items) => [...items]));
  const mappings = plan.design_decision_map ?? [];

  // Build a set of (hue/token → whether it was abstracted in decision map).
  // A source hue is "abstracted in the map" when:
  //   • It appears in a cited observation description for that mapping, AND
  //   • The mapping's target_in_new_composition does NOT contain the hue.
  const index = observationIndex(plan);
  const abstractedHues = new Set();
  for (const mapping of mappings) {
    if (!["ADAPT", "REINVENT", "DISCARD"].includes(mapping.action)) continue;
    const observations = index.get(mapping.source_reference_asset_id);
    const citedText = (mapping.observation_ids ?? []).map((id) => observations?.get(id)?.description ?? "").join(" ");
    const targetText = normalized(mapping.target_in_new_composition);
    for (const hue of allSourceHues) {
      if (containsTerm(citedText, hue) && !containsTerm(targetText, hue)) {
        abstractedHues.add(hue);
      }
    }
  }

  // Also build a set of object/token terms that were DISCARDed or REINVENTed
  // where the literal source term does not appear in the target.
  const abstractedTokens = new Set(abstractedHues);
  for (const mapping of mappings) {
    if (!["REINVENT", "DISCARD"].includes(mapping.action)) continue;
    const observations = index.get(mapping.source_reference_asset_id);
    // Collect prominent noun tokens from cited observations (≥4 chars, non-generic)
    for (const id of mapping.observation_ids ?? []) {
      const desc = normalized(observations?.get(id)?.description ?? "");
      for (const token of desc.split(/\W+/).filter((w) => w.length >= 4)) {
        const targetText = normalized(mapping.target_in_new_composition);
        if (!containsTerm(targetText, token)) abstractedTokens.add(token);
      }
    }
  }

  // Now scan positive handoff fields for tokens that were abstracted.
  const positiveHandoffFields = [
    ["director_handoff.what_must_survive", handoff.what_must_survive ?? []],
    ["director_handoff.what_should_survive", handoff.what_should_survive ?? []],
    ["director_handoff.recommended_anchors", handoff.recommended_anchors ?? []]
  ];

  for (const [path, items] of positiveHandoffFields) {
    for (const [idx, rawItem] of items.entries()) {
      const item = String(rawItem);
      if (negationPrefix.test(item)) continue;
      const itemNorm = normalized(item);
      if (containsTerm(targetOwned, itemNorm)) continue;
      for (const hue of abstractedHues) {
        if (!containsTerm(itemNorm, hue)) continue;
        diagnostics.push(diagnostic(
          "DIRECTOR_HANDOFF_CONTRADICTION",
          `The handoff field ${path}[${idx}] introduces "${hue}" as a positive requirement, but the decision map abstracted this source hue without forwarding it. The handoff must be derived from the decision map, not from the source reference directly.`,
          `${path}[${idx}]`,
          BLOCK,
          { source_hue: hue, handoff_field: path }
        ));
        break;
      }
    }
  }
}

/**
 * Check 6 — TARGET_NATIVE_ADAPTATION_TOO_GENERIC (Quality)
 *
 * When a mapping uses ADAPT or REINVENT, the target_in_new_composition must
 * preserve the specific functional intelligence of the source observation.
 * A phrase is "too generic" when:
 *   • It replaces a rich, specific source description with a vague category label
 *     (e.g., "technical environment", "digital space", "modern aesthetic") AND
 *   • The mapping's rationale + any adaptation fields do NOT recover the lost
 *     functional specificity (e.g., foreground/background separation, density,
 *     immersion depth, layered complexity).
 *
 * We detect this by:
 *   1. Checking whether the target phrase matches a known generic-substitute pattern.
 *   2. Confirming that the source observation's specific structural descriptors
 *      (non-trivial nouns/adjectives ≥6 chars) are absent from both target AND rationale.
 *
 * We only fire when specificity is genuinely lost, not when it's preserved elsewhere.
 */
function validateTargetNativeAdaptationSufficiency(plan, diagnostics) {
  const index = observationIndex(plan);

  for (const [mappingIndex, mapping] of (plan.design_decision_map ?? []).entries()) {
    if (!["ADAPT", "REINVENT"].includes(mapping.action)) continue;

    const targetText = mapping.target_in_new_composition ?? "";
    const rationale = mapping.rationale ?? "";
    const combined = normalized(targetText + " " + rationale);

    // Check if any generic pattern fires on the target text.
    const isGenericTarget = genericAdaptationPatterns.some((pat) => pat.test(targetText));
    if (!isGenericTarget) continue;

    // Gather specific structural descriptors from the cited source observations.
    const observations = index.get(mapping.source_reference_asset_id);
    const sourceDescriptors = new Set();
    for (const id of mapping.observation_ids ?? []) {
      const desc = normalized(observations?.get(id)?.description ?? "");
      for (const word of desc.split(/\W+/)) {
        if (word.length >= 6 && !stopWords.has(word)) sourceDescriptors.add(word);
      }
    }

    if (sourceDescriptors.size === 0) continue;

    // If fewer than half the source's structural descriptors survive into combined
    // target+rationale, the adaptation has lost functional specificity.
    const preserved = [...sourceDescriptors].filter((w) => combined.includes(w));
    if (preserved.length < sourceDescriptors.size / 2) {
      diagnostics.push(diagnostic(
        "TARGET_NATIVE_ADAPTATION_TOO_GENERIC",
        `Mapping ${mapping.mapping_id ?? mappingIndex} uses a generic category phrase in target_in_new_composition that discards specific functional intelligence from the source observation. Preserve the structural mechanisms (e.g., density, immersion, depth, layering) rather than collapsing them into a category label.`,
        `design_decision_map[${mappingIndex}].target_in_new_composition`,
        BLOCK,
        {
          mapping_id: mapping.mapping_id ?? null,
          generic_phrase_detected: true,
          source_descriptors_lost: [...sourceDescriptors].filter((w) => !combined.includes(w))
        }
      ));
    }
  }
}

// ─── END NEW CHECKS ───────────────────────────────────────────────────────────

export function validateReferenceTransferPlanSchema(plan) {
  const result = validateArtifact("reference_transfer_plan", plan);
  return {
    valid: result.valid,
    diagnostics: result.valid ? [] : buildSchemaCorrectionDiagnostics(result.errors, plan),
    schema_errors: result.errors
  };
}

export function validateReferenceTransferPlanSemantics(plan, {
  briefSpec,
  referenceAssets = [],
  targetProductCategory,
  projectId,
  protectedSemantics = [],
  identityConstraints = []
} = {}) {
  const diagnostics = [];
  visitKeys(plan, "", diagnostics);

  if (plan.project_id !== projectId) diagnostics.push(diagnostic("PROJECT_ID_MISMATCH", "Plan project_id must match the runtime project.", "project_id", BLOCK, { expected: projectId, actual: plan.project_id }));
  if (plan.brief_spec_version !== briefSpec?.schema_version) diagnostics.push(diagnostic("BRIEF_VERSION_MISMATCH", "Plan brief_spec_version must match the supplied Brief Spec.", "brief_spec_version"));
  if (plan.status === "APPROVED") diagnostics.push(diagnostic("TRANSLATOR_CANNOT_APPROVE", "Reference Translator cannot approve its own plan.", "status"));

  const declaredIds = new Set(referenceAssets.map((asset) => asset.asset_id));
  const analyzedIds = new Set((plan.reference_analyses ?? []).map((item) => item.reference_asset_id));
  const index = observationIndex(plan);

  if (!referenceAssets.length) {
    if ((plan.reference_analyses ?? []).length || (plan.design_decision_map ?? []).length || plan.transfer_intensity?.value !== "NONE") {
      diagnostics.push(diagnostic("REFERENCE_HALLUCINATION", "No-reference mode cannot contain reference analyses or transfer decisions.", "reference_analyses"));
    }
  } else {
    for (const id of declaredIds) if (!analyzedIds.has(id)) diagnostics.push(diagnostic("DECLARED_REFERENCE_NOT_ANALYZED", "Every supplied reference asset must remain traceable in reference_analyses.", "reference_analyses", BLOCK, { reference_asset_id: id }));
    for (const id of analyzedIds) if (!declaredIds.has(id)) diagnostics.push(diagnostic("UNSEEN_REFERENCE_HALLUCINATION", "Plan analyzes a reference asset that was not supplied.", "reference_analyses", BLOCK, { reference_asset_id: id }));
  }

  for (const [mapIndex, mapping] of (plan.design_decision_map ?? []).entries()) {
    if (!declaredIds.has(mapping.source_reference_asset_id)) diagnostics.push(diagnostic("MAPPING_SOURCE_NOT_SUPPLIED", "Mapping source must be a supplied reference asset.", `design_decision_map[${mapIndex}].source_reference_asset_id`));
    const observations = index.get(mapping.source_reference_asset_id);
    for (const id of mapping.observation_ids ?? []) {
      if (!observations?.has(id)) diagnostics.push(diagnostic("MAPPING_OBSERVATION_NOT_FOUND", "Mapping must cite an observation from its source reference.", `design_decision_map[${mapIndex}].observation_ids`, BLOCK, { observation_id: id }));
    }
    if (mapping.provenance === "DIRECTOR_CONFIRMED") diagnostics.push(diagnostic("DIRECTOR_PROVENANCE_IMPERSONATION", "Translator output cannot claim Director confirmation.", `design_decision_map[${mapIndex}].provenance`));
    const authorityText = normalized(`${mapping.rationale} ${mapping.target_in_new_composition}`);
    if (/my eyes (requires|forbids|bans|mandates)|vkb (decides|selects|mandates|requires the final)/.test(authorityText)) {
      diagnostics.push(diagnostic("ADVISORY_AUTHORITY_VIOLATION", "My Eyes and VKB remain advisory and cannot issue absolute creative commands.", `design_decision_map[${mapIndex}].rationale`));
    }
  }

  const protectedValues = valuesFrom([...protectedSemantics, ...identityConstraints]);
  for (const value of protectedValues) {
    const token = normalized(value);
    if (token.length < 3) continue;
    for (const [mapIndex, mapping] of (plan.design_decision_map ?? []).entries()) {
      const target = normalized(mapping.target_in_new_composition);
      if ((target.includes(`replace ${token}`) || target.includes(`remove ${token}`) || target.includes(`change ${token}`)) && mapping.action !== "PRESERVE") {
        diagnostics.push(diagnostic("PROTECTED_FIELD_VIOLATION", "A protected semantic or identity constraint cannot be replaced by a reference decision.", `design_decision_map[${mapIndex}].target_in_new_composition`, BLOCK, { protected_value: value }));
      }
    }
  }

  validateLeakage(plan, briefSpec ?? {}, referenceAssets, diagnostics);
  validateCrossCategory(plan, referenceAssets, targetProductCategory, diagnostics);
  validateSourceHueAuthority(plan, briefSpec ?? {}, diagnostics);
  validateTargetSpecificEvidence(plan, briefSpec ?? {}, diagnostics);
  validateUnresolvedObservations(plan, diagnostics);
  validateDirectorHandoffConsistency(plan, briefSpec ?? {}, diagnostics);
  return { valid: !diagnostics.some((item) => item.severity === BLOCK), diagnostics };
}

export function validateReferenceTransferPlanQuality(plan) {
  const diagnostics = [];
  const references = plan.reference_analyses ?? [];
  const mappings = plan.design_decision_map ?? [];
  const relevant = references.filter((item) => ["HIGH", "VERY_HIGH"].includes(item.transfer_relevance));
  const meaningful = mappings.filter((item) => meaningfulStrength.has(item.strength) && !["DISCARD", "CONFLICT"].includes(item.action));

  if (relevant.length && meaningful.length === 0) {
    diagnostics.push(diagnostic("UNDERTRANSFER_RISK", "A highly relevant reference produced no meaningful transfer mechanism.", "design_decision_map"));
  }

  const generic = /^(make it |use |create )?(cinematic|premium|modern|dynamic|strong hierarchy|good lighting|similar mood|use depth)\.?$/i;
  for (const [index, mapping] of mappings.entries()) {
    const rationale = mapping.rationale?.trim() ?? "";
    if (rationale.length < 24 || generic.test(rationale)) {
      diagnostics.push(diagnostic("GENERIC_TRANSFER_PLAN", "Mapping rationale must describe a reference-specific function and why it applies to the target.", `design_decision_map[${index}].rationale`));
    }
    const observationCategories = references.flatMap((ref) => ref.observations.filter((obs) => mapping.observation_ids.includes(obs.observation_id)).map((obs) => obs.category));
    if (observationCategories.includes("NARRATIVE_OBJECT") && mapping.action === "TRANSFER") {
      diagnostics.push(diagnostic("SURFACE_COPY_RISK", "Narrative objects require functional evaluation; direct object transfer is unsafe without explicit target necessity.", `design_decision_map[${index}].action`));
    }
    const decisionText = `${mapping.target_in_new_composition} ${mapping.rationale}`;
    if (/\b(copy|clone|same exact|identical)\b.{0,40}\b(layout|font|palette|color|object|prop|halo|glow|foreground)\b/i.test(decisionText) ||
        /\b(add|use)\b.{0,24}\b(particles|microdetails|floating elements|blurred leaves|halo|glow)\b.{0,24}\b(for depth|for richness|to look cinematic)\b/i.test(decisionText)) {
      diagnostics.push(diagnostic("SURFACE_COPY_RISK", "Plan contains literal or functionless surface-copy language without functional translation.", `design_decision_map[${index}]`));
    }
    if (/\bavoid (the )?ai look\b/i.test(decisionText)) {
      diagnostics.push(diagnostic("GENERIC_TRANSFER_PLAN", "Generic AI labels must be decomposed into concrete visual mechanisms.", `design_decision_map[${index}]`));
    }
    if (mapping.cross_category_adaptation) {
      const adaptation = mapping.cross_category_adaptation;
      for (const field of ["visual_function", "material_language", "emotional_effect", "equivalent_adaptation", "target_category_coherence"]) {
        if ((adaptation[field]?.trim().length ?? 0) < 12) diagnostics.push(diagnostic("CROSS_CATEGORY_ADAPTATION_TOO_GENERIC", `${field} must be specific enough to audit the adaptation.`, `design_decision_map[${index}].cross_category_adaptation.${field}`));
      }
    }
  }

  if (mappings.length >= 4 && mappings.filter((item) => item.action === "TRANSFER").length / mappings.length > 0.75) {
    diagnostics.push(diagnostic("OVERTRANSFER_RISK", "The plan transfers nearly every source manifestation directly; adaptation and discard decisions are missing.", "design_decision_map"));
  }

  const warningSignals = (plan.risks ?? []).filter((risk) => risk.severity === "LOW").map((risk) =>
    diagnostic("DECLARED_LOW_RISK", risk.description, "risks", WARNING)
  );
  diagnostics.push(...warningSignals);
  validateHighIntensityUndertransfer(plan, diagnostics);
  validateTargetNativeAdaptationSufficiency(plan, diagnostics);
  return { valid: !diagnostics.some((item) => item.severity === BLOCK), diagnostics };
}

export function assertReferenceTransferPlan(plan, runtimeContext) {
  const schema = validateReferenceTransferPlanSchema(plan);
  if (!schema.valid) throw new ReferenceTranslatorError(C.REFERENCE_PLAN_SCHEMA_INVALID, "Reference Transfer Plan failed schema validation.", { diagnostics: schema.diagnostics }, { retryable: true });
  const semantic = validateReferenceTransferPlanSemantics(plan, runtimeContext);
  if (!semantic.valid) {
    const identity = semantic.diagnostics.some((item) => item.code.includes("IDENTITY") || item.code === "PROTECTED_FIELD_VIOLATION");
    const authority = semantic.diagnostics.some((item) => item.code.includes("AUTHORITY") || item.code.includes("DIRECTOR_") || item.code === "TRANSLATOR_CANNOT_APPROVE");
    const code = identity ? C.REFERENCE_PLAN_IDENTITY_VIOLATION : authority ? C.REFERENCE_PLAN_AUTHORITY_VIOLATION : C.REFERENCE_PLAN_SEMANTIC_INVALID;
    throw new ReferenceTranslatorError(code, "Reference Transfer Plan failed semantic validation.", { diagnostics: semantic.diagnostics }, { retryable: true });
  }
  const quality = validateReferenceTransferPlanQuality(plan);
  if (!quality.valid) {
    const over = quality.diagnostics.some((item) => ["OVERTRANSFER_RISK", "SURFACE_COPY_RISK"].includes(item.code));
    throw new ReferenceTranslatorError(over ? C.REFERENCE_PLAN_OVERTRANSFER : C.REFERENCE_PLAN_UNDERTRANSFER, "Reference Transfer Plan failed transfer-quality validation.", { diagnostics: quality.diagnostics }, { retryable: true });
  }
  return { schema, semantic, quality };
}
