import { REFERENCE_TRANSLATOR_ERROR_CODES as C, ReferenceTranslatorError } from "../reference-translator-errors.mjs";

export class CognitiveModelAdapter {
  constructor({ adapterId, supportsImages = true } = {}) {
    if (new.target === CognitiveModelAdapter) throw new TypeError("CognitiveModelAdapter is abstract.");
    if (typeof adapterId !== "string" || !adapterId.trim()) throw new TypeError("adapterId is required.");
    this.adapterId = adapterId;
    this.supportsImages = supportsImages;
  }

  async invoke() {
    throw new ReferenceTranslatorError(C.MODEL_INVOCATION_FAILED, "Cognitive model invoke() is not implemented.");
  }
}

export class ScriptedCognitiveModelAdapter extends CognitiveModelAdapter {
  constructor({ responses = [], adapterId = "scripted-cognitive-model-v1", supportsImages = true } = {}) {
    super({ adapterId, supportsImages });
    if (!Array.isArray(responses)) throw new TypeError("responses must be an array.");
    this.responses = [...responses];
    this.invokeCount = 0;
    this.requests = [];
  }

  async invoke(request) {
    this.requests.push(structuredClone(request));
    const index = this.invokeCount++;
    if (index >= this.responses.length) {
      throw new ReferenceTranslatorError(C.MODEL_INVOCATION_FAILED, "Scripted model has no response for this attempt.", { attempt: index + 1 }, { retryable: false });
    }
    const scripted = this.responses[index];
    if (scripted instanceof Error) throw scripted;
    const value = typeof scripted === "function" ? await scripted(structuredClone(request), index) : scripted;
    return structuredClone(value);
  }
}
