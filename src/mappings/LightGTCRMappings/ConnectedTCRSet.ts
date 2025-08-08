import { LightGeneralizedTCR } from "generated";

LightGeneralizedTCR.ConnectedTCRSet.handlerWithLoader({
  loader: async ({ event, context }) => {
    try {
      const registry = await context.LRegistry.getOrThrow(
        event.srcAddress.toLowerCase()
      );

      context.LRegistry.set({
        ...registry,
        connectedTCR: event.params._connectedTCR.toLowerCase(),
      });
    } catch (error) {
      if (error instanceof Error) {
        context.log.error(`ConnectedTCRSet Error: ${error.message}`);
      }
      context.log.error(`${error}`);
    }
  },

  handler: async ({ event, context, loaderReturn }) => {},
});
