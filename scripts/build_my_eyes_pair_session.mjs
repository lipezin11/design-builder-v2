import fs from "node:fs";
import path from "node:path";
import { validateApprovedDirectionMemory } from "../src/my-eyes/approved-direction-memory-loader.mjs";
import { buildPairwiseSession, persistPairwiseSessionVersion } from "../src/my-eyes/pairwise-session-store.mjs";

const root = process.cwd();
const memoryPath = path.join(root, "data", "my_eyes", "approved_direction_memory.json");
const memory = JSON.parse(fs.readFileSync(memoryPath, "utf8"));
const memoryValidation = validateApprovedDirectionMemory(memory, { rootDir: root, verifyFiles: true });
if (!memoryValidation.valid) throw new Error(`Approved Direction Memory is invalid: ${JSON.stringify(memoryValidation.errors)}`);

const pairDefinitions = [
  {
    pair_type: "STANDARD_PAIR",
    image_a_id: "MYE_IMG_000001",
    image_b_id: "MYE_IMG_000020",
    selection_reason: "Both are portrait promotional compositions centered on an arms-crossed man, oversized typography and technology/design staging. The comparison isolates hierarchy, typography density and subject/type interaction without assuming which treatment is preferable.",
    comparable_dimensions: ["FORMAT", "SUBJECT_PROMINENCE", "TYPOGRAPHY_DENSITY", "VISUAL_HIERARCHY", "DEPTH_STRATEGY"],
    hypothesis_refs: ["MYE_HYP_000002"],
    candidate_signal_refs: ["MYE_EXT_SIG_000002", "MYE_EXT_SIG_000003"],
    refutation_capable: true
  },
  {
    pair_type: "DIAGNOSTIC_PAIR",
    image_a_id: "MYE_IMG_000019",
    image_b_id: "MYE_IMG_000013",
    selection_reason: "Both use a central male subject, surreal scale, numerous floating objects and high visual ambition. This pair tests whether complexity is experienced as functional and convergent or as artificial and uncontrolled; either side may be chosen or tied.",
    comparable_dimensions: ["CONTROLLED_VS_ARTIFICIAL_COMPLEXITY", "VISUAL_CONVERGENCE", "OBJECT_FUNCTION", "MICRODETAIL_DENSITY", "SURREAL_LANGUAGE"],
    hypothesis_refs: ["MYE_HYP_000002"],
    candidate_signal_refs: ["MYE_EXT_SIG_000001", "MYE_EXT_SIG_000002", "MYE_EXT_SIG_000004"],
    external_batch_refs: ["MYE_EXT_BATCH_000001"],
    refutation_capable: true
  },
  {
    pair_type: "DIAGNOSTIC_PAIR",
    image_a_id: "MYE_IMG_000006",
    image_b_id: "MYE_IMG_000017",
    selection_reason: "Both place a photographic male subject inside a technology environment built from floating interface cards and colored rim light. The pair focuses on whether suspended elements support direction, depth and subject integration or become misdirection.",
    comparable_dimensions: ["FLOATING_ELEMENT_USAGE", "SUBJECT_ENVIRONMENT_INTEGRATION", "DEPTH", "HIERARCHY", "TECHNOLOGY_VISUAL_LANGUAGE"],
    hypothesis_refs: ["MYE_HYP_000002"],
    candidate_signal_refs: ["MYE_EXT_SIG_000004"],
    external_batch_refs: ["MYE_EXT_BATCH_000001"],
    refutation_capable: true
  },
  {
    pair_type: "STANDARD_PAIR",
    image_a_id: "MYE_IMG_000018",
    image_b_id: "MYE_IMG_000004",
    selection_reason: "Both are portrait promotional layouts with a centered male subject, green luminous arcs or energy and layered graphic depth. Their shared format and color language make hierarchy, effect integration and focal control directly comparable.",
    comparable_dimensions: ["FORMAT", "SUBJECT_PROMINENCE", "GREEN_NEON_LANGUAGE", "EFFECT_INTEGRATION", "FOCAL_CONTROL"],
    hypothesis_refs: ["MYE_HYP_000002"],
    candidate_signal_refs: ["MYE_EXT_SIG_000002"],
    external_batch_refs: ["MYE_EXT_BATCH_000001"],
    refutation_capable: true
  },
  {
    pair_type: "HARD_PAIR",
    image_a_id: "MYE_IMG_000010",
    image_b_id: "MYE_IMG_000021",
    selection_reason: "Both are intense portrait urgency posters with a centered male subject, oversized warning typography, dark staging, red accents and floating narrative artifacts. Each uses deliberate excess differently, so A, B and TIE remain plausible human outcomes.",
    comparable_dimensions: ["FORMAT", "URGENCY_LANGUAGE", "TYPOGRAPHY", "NARRATIVE_PROPS", "CONTROLLED_EXCESS", "AI_VISUAL_SIGNATURE"],
    hypothesis_refs: ["MYE_HYP_000002"],
    candidate_signal_refs: [],
    refutation_capable: true
  }
];

const session = buildPairwiseSession({ memory, pair_definitions: pairDefinitions, session_id: "MYE_PAIR_SESSION_000001", source_ref: "design-builder://first-human-pairwise-session" });
const persisted = persistPairwiseSessionVersion({ root_dir: root, session });
console.log(JSON.stringify({ session_id: session.session_id, status: session.status, path: path.relative(root, persisted.path).replaceAll("\\", "/"), proposed_pairs: session.summary.proposed_pair_count, completed_pairs: session.summary.completed_pair_count, human_pairwise_evidence: session.summary.human_pairwise_evidence_count, scores_created: session.summary.scores_created, weights_created: session.summary.weights_created, inferred_preferences_created: session.summary.inferred_preferences_created }, null, 2));
