import { indexer, LightGTCRFactory } from "envio";
import { createRegistry } from "../helpers/createLightRegistry";

indexer.onEvent(
  { contract: "LightGTCRFactory", event: "NewGTCR" },
  async ({ event, context }) => {
  const registry = await context.LRegistry.get(
    event.params._address.toLowerCase()
  );
  // Registry may already be created from ConnectedTCRSet event
  if (!registry) {
    createRegistry(event.params._address, event.chainId, context);
    return;
  }

  return;
}
);

indexer.contractRegister(
  { contract: "LightGTCRFactory", event: "NewGTCR" },
  async ({ event, context }) => {
  context.chain.LightGeneralizedTCR.add(event.params._address.toLowerCase());
  context.log.info(`Registered new Light Registry at ${event.params._address}`);
}
);
