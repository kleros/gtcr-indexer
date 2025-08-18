import { LightGeneralizedTCR } from "generated";
import { createRegistry } from "../helpers/createLightRegistry";

LightGeneralizedTCR.ConnectedTCRSet.handlerWithLoader({
  loader: async ({ event, context }) => {
    const registry = await context.LRegistry.get(
      event.srcAddress.toLowerCase()
    );

    // during deployment of Registry, ConnectedTCR is processed before NewGTCR. So Registry can be undefined, in that case create a new one.
    if (!registry) {
      const { registry: newRegistry } = createRegistry(
        event.srcAddress,
        context
      );
      context.LRegistry.set({
        ...newRegistry,
        connectedTCR: event.params._connectedTCR.toLowerCase(),
      });
      return;
    }

    context.LRegistry.set({
      ...registry,
      connectedTCR: event.params._connectedTCR.toLowerCase(),
    });
  },

  handler: async ({ event, context, loaderReturn }) => {},
});
