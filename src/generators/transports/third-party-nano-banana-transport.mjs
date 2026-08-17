import { ProviderTransport } from "./provider-transport.mjs";
import { assertSemanticRequest } from "../adapters/nano-banana-adapter.mjs";
import { assertNanoBananaConfig } from "../config/nano-banana-config.mjs";
import { GENERATION_ERROR_CODES as C, GenerationError } from "../generation-errors.mjs";

export class ThirdPartyNanoBananaTransport extends ProviderTransport {
  constructor({ env = process.env, configLoader = assertNanoBananaConfig, protocolExecutor = null } = {}) {
    super({ transportId: "third-party-nano-banana-transport-v1", providerId: "third-party-provider", providerType: "THIRD_PARTY" });
    this.env = env;
    this.configLoader = configLoader;
    this.protocolExecutor = protocolExecutor;
  }

  async generate(semanticRequest) {
    assertSemanticRequest(semanticRequest);
    const config = this.configLoader(this.env);
    if (typeof this.protocolExecutor !== "function") {
      throw new GenerationError(C.PROVIDER_PROTOCOL_NOT_CONFIGURED, "Third-party Nano Banana provider protocol is not configured yet.", { provider_id: this.providerId, provider_configured: true });
    }
    return this.protocolExecutor({ semanticRequest, config });
  }
}
