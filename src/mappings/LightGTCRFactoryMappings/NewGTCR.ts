import { LightGTCRFactory, LRegistry, MetaEvidence } from "generated";
import { ZERO } from "../../utils";

LightGTCRFactory.NewGTCR.handler(async ({ event, context }) => {
  const registrationMetaEvidence: MetaEvidence = {
    id: `${event.params._address}-1`,
    uri: "",
  };

  const clearingMetaEvidence: MetaEvidence = {
    id: `${event.params._address}-2`,
    uri: "",
  };

  const registry: LRegistry = {
    id: event.params._address,
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
    // TODO add ipfs fetch here to get the registry details
    metadata_id: "",
  };
  context.LRegistry.set(registry);
  context.MetaEvidence.set(registrationMetaEvidence);
  context.MetaEvidence.set(clearingMetaEvidence);
  return;
});

LightGTCRFactory.NewGTCR.contractRegister(({ event, context }) => {
  context.addLightGeneralizedTCR(event.params._address);
  context.log.info(`Registered new Light Registry at ${event.params._address}`);
});
