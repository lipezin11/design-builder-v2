import fs from "node:fs";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { CompilerError } from "./compiler-errors.mjs";

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const load = (name) => JSON.parse(fs.readFileSync(fileURLToPath(new URL(`../../schemas/${name}.schema.json`, import.meta.url)), "utf8"));
const validators = {
  brief_spec: ajv.compile(load("brief_spec")),
  reference_transfer_plan: ajv.compile(load("reference_transfer_plan")),
  creative_direction_spec: ajv.compile(load("creative_direction_spec")),
  compiler_input: ajv.compile(load("compiler_input")),
  final_frame_spec: ajv.compile(load("final_frame_spec")),
  compiled_generation_request: ajv.compile(load("compiled_generation_request")),
  generation_result: ajv.compile(load("generation_result")),
  critic_report: ajv.compile(load("critic_report")),
  delta_fix_plan: ajv.compile(load("delta_fix_plan")),
  approved_direction_memory: ajv.compile(load("approved_direction_memory")),
  visual_analysis_record: ajv.compile(load("visual_analysis_record")),
  external_visual_analysis_batch: ajv.compile(load("external_visual_analysis_batch")),
  pairwise_session: ajv.compile(load("pairwise_session")),
  my_eyes_preference_model: ajv.compile(load("my_eyes_preference_model"))
};

export function validateArtifact(schemaName, artifact) {
  const validate = validators[schemaName];
  if (!validate) throw new Error(`Unknown schema: ${schemaName}`);
  const valid = validate(artifact);
  return { valid, errors: valid ? [] : structuredClone(validate.errors ?? []) };
}

export function assertArtifact(schemaName, artifact, code) {
  const result = validateArtifact(schemaName, artifact);
  if (!result.valid) throw new CompilerError(code, `${schemaName} failed schema validation.`, { errors: result.errors });
  return artifact;
}
