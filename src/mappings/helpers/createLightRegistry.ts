import { HandlerContext, LRegistry, MetaEvidence } from "generated";
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

  const registry: LRegistry = {
    id: registryAddress.toLowerCase(),
    metaEvidenceCount: ZERO,
    registrationMetaEvidence_id: registrationMetaEvidence.id,
    clearingMetaEvidence_id: clearingMetaEvidence.id,
    numberOfAbsent: ZERO,
    numberOfRegistered: ZERO,
    numberOfRegistrationRequested: ZERO,
    numberOfClearingRequested: ZERO,
    numberOfChallengedClearing: ZERO,
    numberOfChallengedRegistrations: ZERO,
    connectedTCR: undefined,
    title: undefined,
    description: undefined,
    itemName: undefined,
    itemNamePlural: undefined,
    isConnectedTCR: undefined,
    requireRemovalEvidence: undefined,
    isTCRofTcrs: undefined,
    parentTCRAddress: undefined,
    relTcrDisabled: undefined,
  };

  context.LRegistry.set(registry);
  context.MetaEvidence.set(registrationMetaEvidence);
  context.MetaEvidence.set(clearingMetaEvidence);

  return { registry, registrationMetaEvidence, clearingMetaEvidence };
};
