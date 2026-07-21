import { indexer, GeneralizedTCR } from "envio";

indexer.onEvent(
  { contract: "GeneralizedTCR", event: "ConnectedTCRSet" },
  async ({ event, context }) => {
    const loaderReturn = await (async ({ event, context }) => {
    const registry = await context.Registry.get(event.srcAddress.toLowerCase());

    if (!registry) {
      context.log.error(
        `ConnectedTCRSet Registry not found: ${event.srcAddress}`
      );
      return;
    }
    context.Registry.set({
      ...registry,
      connectedTCR: event.params._connectedTCR.toLowerCase(),
    });
  })({ event, context });

  }
);
