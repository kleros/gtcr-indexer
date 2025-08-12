import { GeneralizedTCR } from "generated";

GeneralizedTCR.ConnectedTCRSet.handlerWithLoader({
  loader: async ({ event, context }) => {
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
  },
  handler: async ({ event, context, loaderReturn }) => {},
});
