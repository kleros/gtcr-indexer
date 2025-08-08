import { GTCRFactory, MetaEvidence, Registry } from "generated";
import { ZERO } from "../../utils";

GTCRFactory.NewGTCR.handler(async ({ event, context }) => {
  const registrationMetaEvidence: MetaEvidence = {
    id: `${event.params._address.toLowerCase()}-1`,
    uri: "",
  };

  const clearingMetaEvidence: MetaEvidence = {
    id: `${event.params._address.toLowerCase()}-2`,
    uri: "",
  };

  const registry: Registry = {
    id: event.params._address.toLowerCase(),
    metaEvidenceCount: ZERO,
    registrationMetaEvidence_id: registrationMetaEvidence.id,
    clearingMetaEvidence_id: clearingMetaEvidence.id,
    connectedTCR: undefined,
    numberOfItems: ZERO,
  };

  context.Registry.set(registry);
  context.MetaEvidence.set(registrationMetaEvidence);
  context.MetaEvidence.set(clearingMetaEvidence);
  return;
});

GTCRFactory.NewGTCR.contractRegister(({ event, context }) => {
  context.addGeneralizedTCR(event.params._address.toLowerCase());
  context.log.info(`Registered new Registry at ${event.params._address}`);
});
