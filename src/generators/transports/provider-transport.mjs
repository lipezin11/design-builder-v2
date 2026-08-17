import { GENERATION_ERROR_CODES as C, GenerationError } from "../generation-errors.mjs";

export class ProviderTransport {
  constructor({ transportId, providerId, providerType }) {
    if (new.target === ProviderTransport) throw new TypeError("ProviderTransport is abstract.");
    this.transportId = transportId;
    this.providerId = providerId;
    this.providerType = providerType;
  }

  async generate() {
    throw new GenerationError(C.PROVIDER_PROTOCOL_NOT_CONFIGURED, "Provider transport generate() is not implemented.");
  }
}
