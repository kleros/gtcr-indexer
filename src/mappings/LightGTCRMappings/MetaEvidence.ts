import { LightGeneralizedTCR, LRegistry } from "generated";
import { ONE } from "../../utils";
import { getArbitrator } from "../../utils/contract/getArbitrator";

LightGeneralizedTCR.MetaEvidence.handlerWithLoader({
  loader: async ({ event, context }) => {
    try {
      const registry = await context.LRegistry.getOrThrow(event.srcAddress);

      const metaEvidenceID =
        registry.id + "-" + (registry.metaEvidenceCount + ONE).toString();
      const metaEvidence = await context.MetaEvidence.getOrCreate({
        id: metaEvidenceID,
        uri: event.params._evidence,
      });

      // even/0 for Registration, odd for Clearing
      const isRegistration =
        event.params._metaEvidenceID % BigInt(2) === BigInt(0);
      const updateRegistry: LRegistry = {
        ...registry,
        metaEvidenceCount: registry.metaEvidenceCount + ONE,
        registrationMetaEvidence_id: isRegistration
          ? metaEvidence.id
          : registry.registrationMetaEvidence_id,
        clearingMetaEvidence_id: isRegistration
          ? registry.clearingMetaEvidence_id
          : metaEvidence.id,
      };

      context.LRegistry.set(updateRegistry);

      // TODO : handle ipfs metadata fetch
    } catch (error) {
      if (error instanceof Error) {
        context.log.error(`MetaEvidence Error: ${error.message}`);
      }
      context.log.error(`${error}`);
    }
  },

  handler: async ({ event, context, loaderReturn }) => {},
});

LightGeneralizedTCR.MetaEvidence.contractRegister(
  async ({ context, event }) => {
    const arbitratorAddr = await getArbitrator({
      input: {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
      },
      context,
    });

    context.addLightGeneralizedTCR(arbitratorAddr);
    context.log.info(
      `Registered new Arbitrator at ${arbitratorAddr} for ${event.srcAddress}`
    );
  }
);
