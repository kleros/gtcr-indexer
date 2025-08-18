import { HandlerContext, MetaEvidence, Registry } from "generated";
import { ZERO } from "../../utils";

export const createRegistry = (
  registryAddress: string,
  context: HandlerContext
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
