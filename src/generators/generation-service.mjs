import { nanoBananaSemanticAdapter, nanoBananaSemanticProfile } from "./adapters/nano-banana-adapter.mjs";
import { normalizeGenerationResult } from "./normalization/generation-result-normalizer.mjs";
import { GenerationError } from "./generation-errors.mjs";

const failureResponse = ({ error, transport, semanticRequest, at }) => ({
  provider_response_version: "1.0.0",
  transport_status: "FAILED",
  provider: {
    provider_id: transport.providerId ?? "unknown-provider",
    provider_type: transport.providerType ?? "OTHER",
    configured: error.details?.provider_configured ?? transport.providerType === "MOCK",
    protocol_status: transport.providerType === "MOCK" ? "MOCK" : "NOT_CONFIGURED"
  },
  model: { family: "NANO_BANANA", name: semanticRequest.model.name },
  raw_status: error.code,
  outputs: [],
  warnings: [],
  errors: [{ code: error.code, message: error.message, severity: "ERROR", source: "TRANSPORT", retryable: error.retryable ?? false }],
  timing: { requested_at: at, started_at: at, completed_at: at, duration_ms: 0 },
  usage: {},
  response_metadata: {}
});

export class GenerationService {
  constructor({ adapter = nanoBananaSemanticAdapter, profile = nanoBananaSemanticProfile, transport, store = null, normalizer = normalizeGenerationResult, clock = () => new Date(), serviceVersion = "1.0.0" } = {}) {
    this.adapter = adapter;
    this.profile = profile;
    this.transport = transport;
    this.store = store;
    this.normalizer = normalizer;
    this.clock = clock;
    this.serviceVersion = serviceVersion;
  }

  async generate({ compiledRequest, assetResolution, modelName, transport = this.transport, persist = Boolean(this.store) }) {
    if (!transport || typeof transport.generate !== "function") throw new TypeError("GenerationService requires a ProviderTransport.");
    const semanticRequest = this.adapter.adapt({ compiledRequest, assetResolution, profile: this.profile, modelName });
    let providerResponse;
    try {
      providerResponse = await transport.generate(semanticRequest);
    } catch (error) {
      if (!(error instanceof GenerationError)) throw error;
      providerResponse = failureResponse({ error, transport, semanticRequest, at: this.clock().toISOString() });
    }
    const result = this.normalizer({ compiledRequest, semanticRequest, providerResponse, transportId: transport.transportId, clock: this.clock, producerVersion: this.serviceVersion });
    if (persist) {
      if (!this.store) throw new TypeError("Persistence requested without a GenerationResultStore.");
      this.store.save(result);
    }
    return result;
  }
}
