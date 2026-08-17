import { generatorProfileRegistry } from "../generators/registry/generator-profile-registry.mjs";
import { analyzeCapabilities } from "./capability-resolver.mjs";
import { collectProtectedFields, collectVariationPolicy, compileAssetBindings, validateBindings, validateCompilerContext } from "./binding-resolver.mjs";
import { COMPILER_ERROR_CODES, CompilerError } from "./compiler-errors.mjs";
import { DeterministicInstructionRenderer } from "./instruction-renderer.mjs";
import { assertArtifact } from "./schema-validator.mjs";
import { validateCompilerLoss } from "./validation/compiler-loss-validator.mjs";

const diagnostic = (code, message, severity, source_ref) => ({ code, message, severity, source_ref });
const artifactRef = (id, version, uri, checksum) => ({ artifact_id: id, artifact_version: version, artifact_uri: uri, ...(checksum ? { checksum } : {}) });

function buildControlLayer(compilerInput, finalFrameSpec) {
  return {
    creative_authority: "NONE",
    preserve_identity: finalFrameSpec.subjects.some((subject) => subject.identity_preservation !== "NOT_APPLICABLE"),
    preserve_reference_authority: finalFrameSpec.reference_constraints.active,
    preserve_text_locks: finalFrameSpec.typography_system.text_elements.some((text) => text.copy_is_locked),
    preserve_edit_target: compilerInput.generation_mode === "EDIT",
    preserve_composition: true,
    semantic_change_forbidden: true
  };
}

function compileReferences(compilerInput, finalFrameSpec) {
  if (!finalFrameSpec.reference_constraints.active) return [];
  const anchors = [...finalFrameSpec.reference_constraints.required_reference_anchors, ...finalFrameSpec.reference_constraints.adapted_reference_anchors].map((anchor) => anchor.anchor_id);
  return compilerInput.reference_bindings.map((binding) => ({
    reference_asset_id: binding.reference_asset_id,
    transfer_intensity: finalFrameSpec.reference_constraints.transfer_intensity,
    required_anchors: anchors,
    do_not_copy: [...finalFrameSpec.reference_constraints.reference_elements_explicitly_not_to_copy],
    source_ref: `compiler_input.reference_bindings.${binding.reference_asset_id}`
  }));
}

function compileIdentities(compilerInput) {
  return compilerInput.identity_bindings.map((binding) => ({
    subject_id: binding.subject_id,
    identity_asset_id: binding.identity_asset_id,
    preservation_level: binding.preservation_level,
    recognizability_required: binding.recognizability_required,
    source_ref: `compiler_input.identity_bindings.${binding.subject_id}`
  }));
}

function compileText(compilerInput) {
  return compilerInput.text_bindings.map((binding) => ({
    text_id: binding.text_id,
    content: binding.content,
    exact_text_lock: binding.exact_text_lock,
    render_mode: binding.render_mode,
    required: binding.required,
    source_ref: `compiler_input.text_bindings.${binding.text_id}`
  }));
}

function compileNegatives(finalFrameSpec) {
  const negatives = [];
  finalFrameSpec.generation_requirements.forbidden_visual_elements.forEach((statement, index) => negatives.push({ constraint_id: `forbidden-visual-${index}`, statement, source_ref: `final_frame_spec.generation_requirements.forbidden_visual_elements.${index}` }));
  finalFrameSpec.subjects.forEach((subject) => subject.forbidden_transformations.forEach((statement, index) => negatives.push({ constraint_id: `subject-${subject.subject_id}-${index}`, statement, source_ref: `final_frame_spec.subjects.${subject.subject_id}.forbidden_transformations.${index}` })));
  return negatives;
}

function capabilityDiagnostics(analysis) {
  const warnings = [];
  const errors = [];
  for (const item of analysis.capability_report.partially_supported_requirements) warnings.push(diagnostic("CAPABILITY_PARTIAL", item.impact, "WARNING", item.requirement_ref));
  for (const item of analysis.capability_report.unknown_capabilities) (analysis.compatibility_status === "HUMAN_DECISION_REQUIRED" ? errors : warnings).push(diagnostic("CAPABILITY_UNKNOWN", item.impact, analysis.compatibility_status === "HUMAN_DECISION_REQUIRED" ? "ERROR" : "WARNING", item.requirement_ref));
  for (const item of analysis.capability_report.unsupported_requirements) (analysis.compatibility_status === "BLOCKED_BY_CAPABILITY" ? errors : warnings).push(diagnostic("CAPABILITY_UNSUPPORTED", item.impact, analysis.compatibility_status === "BLOCKED_BY_CAPABILITY" ? "ERROR" : "WARNING", item.requirement_ref));
  return { warnings, errors };
}

export class CompilerCore {
  constructor({ registry = generatorProfileRegistry, renderer = new DeterministicInstructionRenderer(), clock = () => new Date() } = {}) {
    this.registry = registry;
    this.renderer = renderer;
    this.clock = clock;
    this.compilerVersion = "1.0.0";
  }

  compile({ compilerInput, finalFrameSpec }) {
    const startedAt = this.clock().toISOString();
    assertArtifact("compiler_input", compilerInput, COMPILER_ERROR_CODES.INVALID_COMPILER_INPUT);
    assertArtifact("final_frame_spec", finalFrameSpec, COMPILER_ERROR_CODES.FINAL_FRAME_NOT_COMPILABLE);
    validateCompilerContext(compilerInput, finalFrameSpec);
    const profile = this.registry.resolveProfile(compilerInput.target_generator);
    if (compilerInput.generator_capabilities.profile_id !== profile.profile_id || compilerInput.generator_capabilities.profile_version !== profile.profile_version) {
      throw new CompilerError(COMPILER_ERROR_CODES.PROFILE_TARGET_MISMATCH, "Compiler Input capability snapshot does not match resolved profile.");
    }
    validateBindings(compilerInput, finalFrameSpec);

    const analysis = analyzeCapabilities({ compilerInput, finalFrameSpec, profile });
    const { warnings, errors } = capabilityDiagnostics(analysis);
    const controlLayer = buildControlLayer(compilerInput, finalFrameSpec);
    const compiledInstruction = this.renderer.render({ finalFrameSpec, controlLayer, profile });
    const protectedFields = collectProtectedFields(finalFrameSpec);
    const variationPolicy = collectVariationPolicy(finalFrameSpec);
    const completedAt = this.clock().toISOString();
    const status = analysis.compatibility_status === "BLOCKED_BY_CAPABILITY" ? "BLOCKED" : analysis.compatibility_status === "HUMAN_DECISION_REQUIRED" ? "HUMAN_DECISION_REQUIRED" : "REQUEST_READY";

    const compiledRequest = {
      schema_version: "1.0.0",
      request_id: `cgr-${compilerInput.compiler_input_id}`,
      project_id: compilerInput.project_id,
      run_id: compilerInput.run_id,
      compiler_input_ref: artifactRef(compilerInput.compiler_input_id, compilerInput.schema_version, `artifact://compiler-input/${compilerInput.compiler_input_id}/${compilerInput.schema_version}`),
      final_frame_spec_ref: artifactRef(finalFrameSpec.frame_spec_id, finalFrameSpec.schema_version, compilerInput.final_frame_spec_ref.artifact_uri, compilerInput.final_frame_spec_ref.checksum),
      target_generator: structuredClone(compilerInput.target_generator),
      generation_mode: compilerInput.generation_mode,
      ...(compilerInput.mode_context ? { mode_context: structuredClone(compilerInput.mode_context) } : {}),
      compiled_instruction: compiledInstruction,
      control_layer: controlLayer,
      asset_bindings: compileAssetBindings(compilerInput),
      reference_instructions: compileReferences(compilerInput, finalFrameSpec),
      identity_instructions: compileIdentities(compilerInput),
      text_instructions: compileText(compilerInput),
      negative_constraints: compileNegatives(finalFrameSpec),
      output_parameters: structuredClone(compilerInput.requested_output),
      protected_fields: protectedFields,
      variation_policy: variationPolicy,
      capability_report: analysis.capability_report,
      compatibility_status: analysis.compatibility_status,
      warnings,
      errors,
      compiler_trace: {
        compiler_profile: profile.profile_id,
        compiler_version: this.compilerVersion,
        input_artifact: compilerInput.compiler_input_id,
        transformations_applied: [
          { transformation: "Projected frozen visual systems into final-state instruction blocks.", source_ref: "final_frame_spec", semantic_change: false },
          { transformation: "Mapped operational asset bindings to adapter slots.", source_ref: "compiler_input.assets", semantic_change: false },
          { transformation: "Propagated protected fields and controlled variation without relaxation.", source_ref: "final_frame_spec.protected_fields", semantic_change: false }
        ],
        warnings: warnings.map((item) => item.code),
        capability_decisions: [...analysis.capability_report.supported_requirements, ...analysis.capability_report.partially_supported_requirements, ...analysis.capability_report.unsupported_requirements, ...analysis.capability_report.unknown_capabilities].map((item) => `${item.requirement_ref}:${item.status}`),
        output_format_used: profile.instruction_format
      },
      provenance: { producer: "GENERATOR_COMPILER", producer_version: this.compilerVersion, created_at: completedAt, sources: ["FINAL_FRAME_SPEC", "COMPILER_PROFILE", "GENERATOR_CAPABILITY_REGISTRY", "SYSTEM_DERIVED"] },
      status
    };

    assertArtifact("compiled_generation_request", compiledRequest, COMPILER_ERROR_CODES.INVALID_COMPILED_REQUEST);
    const lossValidation = validateCompilerLoss(finalFrameSpec, compiledRequest);
    if (lossValidation.status === "BLOCK") {
      compiledRequest.status = "BLOCKED";
      compiledRequest.errors.push(diagnostic(COMPILER_ERROR_CODES.COMPILER_LOSS_DETECTED, `${lossValidation.summary.blocking} compiler losses detected.`, "ERROR", "compiler_loss_validation"));
      assertArtifact("compiled_generation_request", compiledRequest, COMPILER_ERROR_CODES.INVALID_COMPILED_REQUEST);
    }
    const finalStatus = compiledRequest.status === "REQUEST_READY" && lossValidation.status === "PASS" ? "PASS" : compiledRequest.status === "HUMAN_DECISION_REQUIRED" ? "HUMAN_REVIEW" : "BLOCK";
    return {
      status: finalStatus,
      compiledRequest,
      compatibility: analysis,
      lossValidation,
      trace: {
        run_id: compilerInput.run_id,
        compiler_version: this.compilerVersion,
        profile_id: profile.profile_id,
        profile_version: profile.profile_version,
        started_at: startedAt,
        completed_at: completedAt,
        input_refs: { compiler_input_id: compilerInput.compiler_input_id, final_frame_spec_id: finalFrameSpec.frame_spec_id },
        output_ref: compiledRequest.request_id,
        output_status: compiledRequest.status,
        compatibility_result: analysis.compatibility_status,
        loss_validation_result: lossValidation.status
      }
    };
  }
}

export const compilerCore = new CompilerCore();
export function compile(args) { return compilerCore.compile(args); }