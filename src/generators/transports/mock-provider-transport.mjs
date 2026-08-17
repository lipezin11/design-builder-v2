import { ProviderTransport } from "./provider-transport.mjs";
import { assertSemanticRequest } from "../adapters/nano-banana-adapter.mjs";
import { GENERATION_ERROR_CODES as C, GenerationError } from "../generation-errors.mjs";

const diagnostic = (code, message, severity = "ERROR") => ({ code, message, severity, source: "PROVIDER", retryable: code === C.PROVIDER_TIMEOUT });
export class MockProviderTransport extends ProviderTransport {
  constructor({ behavior = "SUCCESS", outputCount, warnings = [], clock = () => new Date() } = {}) {
    super({ transportId: "mock-provider-transport-v1", providerId: "mock-provider", providerType: "MOCK" });
    this.behavior = behavior;
    this.outputCount = outputCount;
    this.mockWarnings = warnings;
    this.clock = clock;
  }

  async generate(semanticRequest) {
    assertSemanticRequest(semanticRequest);
    const started = this.clock();
    if (this.behavior === "TIMEOUT") throw new GenerationError(C.PROVIDER_TIMEOUT, "Mock provider timed out.", { provider_id: this.providerId }, { retryable: true });
    const completed = this.clock();
    const failed = this.behavior === "FAILURE";
    const partial = this.behavior === "WARNING";
    const count = failed ? 0 : this.outputCount ?? semanticRequest.output.number_of_variants ?? 1;
    return {
      provider_response_version: "1.0.0",
      transport_status: failed ? "FAILED" : partial ? "PARTIAL_SUCCESS" : "SUCCESS",
      provider: { provider_id: this.providerId, provider_type: "MOCK", configured: true, protocol_status: "MOCK" },
      model: { family: "NANO_BANANA", name: semanticRequest.model.name },
      provider_request_id: `mock-request-${semanticRequest.semantic_request_id}`,
      provider_generation_id: `mock-generation-${semanticRequest.semantic_request_id}`,
      raw_status: failed ? "MOCK_FAILURE" : partial ? "MOCK_SUCCESS_WITH_WARNING" : "MOCK_SUCCESS",
      outputs: Array.from({ length: count }, (_, index) => ({ provider_asset_id: `mock-asset-${index + 1}`, uri: `mock://generations/${semanticRequest.semantic_request_id}-${index + 1}.png`, mime_type: "image/png", index, aspect_ratio: semanticRequest.output.aspect_ratio, metadata: { data_classification: "MOCK_TEST_DATA" } })),
      warnings: [...this.mockWarnings, ...(partial ? [diagnostic("MOCK_PROVIDER_WARNING", "Mock provider completed with a simulated warning.", "WARNING")] : [])],
      errors: failed ? [diagnostic(C.PROVIDER_GENERATION_FAILED, "Mock provider simulated generation failure.")] : [],
      timing: { requested_at: started.toISOString(), started_at: started.toISOString(), completed_at: completed.toISOString(), duration_ms: Math.max(0, completed.getTime() - started.getTime()) },
      usage: { cost: null, credits: null, units: null, currency: null, processing_metrics: { data_classification: "MOCK_TEST_DATA" } },
      response_metadata: { data_classification: "MOCK_TEST_DATA", behavior: this.behavior }
    };
  }
}
