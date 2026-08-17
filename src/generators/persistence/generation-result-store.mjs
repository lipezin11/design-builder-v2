import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateArtifact } from "../../compiler/schema-validator.mjs";
import { GENERATION_ERROR_CODES as C, GenerationError } from "../generation-errors.mjs";

const defaultDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../data/generations");
export class GenerationResultStore {
  constructor({ baseDirectory = defaultDirectory, allowOverwrite = false } = {}) {
    this.baseDirectory = path.resolve(baseDirectory);
    this.allowOverwrite = allowOverwrite;
  }

  resultPath(generationId) {
    if (!/^[A-Za-z0-9._-]+$/.test(generationId)) throw new GenerationError(C.PERSISTENCE_FAILED, "Generation ID is unsafe for local persistence.");
    const directory = path.resolve(this.baseDirectory, generationId);
    if (path.relative(this.baseDirectory, directory).startsWith("..")) throw new GenerationError(C.PERSISTENCE_FAILED, "Generation path escapes persistence root.");
    return path.join(directory, "generation-result.json");
  }

  save(result) {
    const validation = validateArtifact("generation_result", result);
    if (!validation.valid) throw new GenerationError(C.INVALID_GENERATION_RESULT, "Only schema-valid Generation Results can be persisted.", { schema_errors: validation.errors });
    const target = this.resultPath(result.generation_id);
    if (!this.allowOverwrite && fs.existsSync(target)) throw new GenerationError(C.PERSISTENCE_FAILED, "Generation Result already exists.", { generation_id: result.generation_id });
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const temporary = `${target}.tmp`;
      fs.writeFileSync(temporary, JSON.stringify(result, null, 2) + "\n", "utf8");
      fs.renameSync(temporary, target);
      return { persisted: true, path: target };
    } catch (error) {
      if (error instanceof GenerationError) throw error;
      throw new GenerationError(C.PERSISTENCE_FAILED, "Could not persist Generation Result.", { generation_id: result.generation_id }, { cause: error });
    }
  }

  load(generationId) {
    const target = this.resultPath(generationId);
    try {
      const result = JSON.parse(fs.readFileSync(target, "utf8"));
      const validation = validateArtifact("generation_result", result);
      if (!validation.valid) throw new GenerationError(C.INVALID_GENERATION_RESULT, "Persisted Generation Result is schema-invalid.", { schema_errors: validation.errors });
      return result;
    } catch (error) {
      if (error instanceof GenerationError) throw error;
      throw new GenerationError(C.PERSISTENCE_FAILED, "Could not load Generation Result.", { generation_id: generationId }, { cause: error });
    }
  }
}
