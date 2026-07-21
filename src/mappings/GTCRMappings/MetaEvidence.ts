import { indexer, GeneralizedTCR } from "envio";
import { ONE } from "../../utils";
import { getArbitratorClassic } from "../../utils/contract/classic/getArbitrator";
import { createRegistry } from "../helpers/createClassicRegistry";

indexer.onEvent(
  { contract: "GeneralizedTCR", event: "MetaEvidence" },
  async ({ event, context }) => {
    const loaderReturn = await (async ({ event, context }) => {
    let registry = await context.Registry.get(event.srcAddress.toLowerCase());

    // during deployment of Registry, MetaEvidence is processed before NewGTCR. So Registry can be undefined, in that case create a new one.
    if (!registry) {
      const { registry: newRegistry } = createRegistry(
        event.srcAddress,
        event.chainId,
        context
      );
      registry = newRegistry;
    }

    const metaEvidenceID =
      registry.id + "-" + (registry.metaEvidenceCount + ONE).toString();
    const metaEvidence = await context.MetaEvidence.getOrCreate({
      id: metaEvidenceID,
      uri: event.params._evidence,
    });

    context.MetaEvidence.set({ ...metaEvidence, uri: event.params._evidence });

    // even/0 for Registration, odd for Clearing
    const isRegistration =
      event.params._metaEvidenceID % BigInt(2) === BigInt(0);

    context.Registry.set({
      ...registry,
      metaEvidenceCount: registry.metaEvidenceCount + ONE,
      registrationMetaEvidence_id: isRegistration
        ? metaEvidence.id
        : registry.registrationMetaEvidence_id,
      clearingMetaEvidence_id: isRegistration
        ? registry.clearingMetaEvidence_id
        : metaEvidence.id,
    });
  })({ event, context });

  }
);

indexer.contractRegister(
  { contract: "GeneralizedTCR", event: "MetaEvidence" },
  async ({ context, event }) => {
  const arbitratorAddr = await getArbitratorClassic({
    input: {
      contractAddress: event.srcAddress,
      chainId: event.chainId,
      blockNumber: event.block.number,
    },
    context,
  });

  context.chain.IArbitrator.add(arbitratorAddr.toLowerCase());
  context.log.info(
    `Registered new Arbitrator at ${arbitratorAddr} for ${event.srcAddress}`
  );
}
);
