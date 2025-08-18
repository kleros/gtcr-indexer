import { LightGTCRFactory } from "generated";
import { createRegistry } from "../helpers/createLightRegistry";

LightGTCRFactory.NewGTCR.handler(async ({ event, context }) => {
  const registry = await context.LRegistry.get(
    event.params._address.toLowerCase()
  );
  // Registry may already be created from ConnectedTCRSet event
  if (!registry) {
    createRegistry(event.params._address, context);
    return;
  }

  return;
});

LightGTCRFactory.NewGTCR.contractRegister(({ event, context }) => {
  context.addLightGeneralizedTCR(event.params._address.toLowerCase());
  context.log.info(`Registered new Light Registry at ${event.params._address}`);
});
