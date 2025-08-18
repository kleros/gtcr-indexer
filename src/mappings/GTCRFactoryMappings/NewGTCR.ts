import { GTCRFactory } from "generated";
import { createRegistry } from "../helpers/createClassicRegistry";

GTCRFactory.NewGTCR.handler(async ({ event, context }) => {
  const registry = await context.Registry.get(
    event.params._address.toLowerCase()
  );
  // Registry may already be created from MetaEvidence event
  if (!registry) {
    createRegistry(event.params._address, context);
    return;
  }

  return;
});

GTCRFactory.NewGTCR.contractRegister(({ event, context }) => {
  context.addGeneralizedTCR(event.params._address.toLowerCase());
  context.log.info(`Registered new Registry at ${event.params._address}`);
});
