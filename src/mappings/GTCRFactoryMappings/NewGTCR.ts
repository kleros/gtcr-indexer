import { indexer, GTCRFactory } from "envio";
import { createRegistry } from "../helpers/createClassicRegistry";

indexer.onEvent(
  { contract: "GTCRFactory", event: "NewGTCR" },
  async ({ event, context }) => {
  const registry = await context.Registry.get(
    event.params._address.toLowerCase()
  );
  // Registry may already be created from MetaEvidence event
  if (!registry) {
    createRegistry(event.params._address, event.chainId, context);
    return;
  }

  return;
}
);

indexer.contractRegister(
  { contract: "GTCRFactory", event: "NewGTCR" },
  async ({ event, context }) => {
  context.chain.GeneralizedTCR.add(event.params._address.toLowerCase());
  context.log.info(`Registered new Registry at ${event.params._address}`);
}
);
