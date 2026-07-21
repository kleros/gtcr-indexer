import { EvmOnEventContext, MetaEvidence, Registry } from "envio";
import { ZERO } from "../../utils";

export const createRegistry = (
  registryAddress: string,
  chainId: number,
  context: EvmOnEventContext
) => {
  const registrationMetaEvidence: MetaEvidence = {
    id: `${registryAddress.toLowerCase()}-1`,
    uri: "",
  };

  const clearingMetaEvidence: MetaEvidence = {
    id: `${registryAddress.toLowerCase()}-2`,
    uri: "",
  };

  const registry: Registry = {
    id: registryAddress.toLowerCase(),
    chainId,
    metaEvidenceCount: ZERO,
    registrationMetaEvidence_id: registrationMetaEvidence.id,
    clearingMetaEvidence_id: clearingMetaEvidence.id,
    connectedTCR: undefined,
    numberOfItems: ZERO,
  };

  context.Registry.set(registry);
  context.MetaEvidence.set(registrationMetaEvidence);
  context.MetaEvidence.set(clearingMetaEvidence);

  return { registry, registrationMetaEvidence, clearingMetaEvidence };
};
