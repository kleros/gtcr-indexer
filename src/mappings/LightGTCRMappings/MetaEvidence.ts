import { LightGeneralizedTCR, LRegistry } from "generated";
import {
  extractPath,
  JSONValueToBool,
  JSONValueToMaybeString,
  ONE,
} from "../../utils";
import { getArbitrator } from "../../utils/contract/getArbitrator";
import { fetchRegistryMetadata } from "../../utils/ipfs/fetchRegistryMetadata";

LightGeneralizedTCR.MetaEvidence.handlerWithLoader({
  loader: async ({ event, context }) => {
    const ipfsHash = extractPath(event.params._evidence);
    const [registry, registryMetadata] = await Promise.all([
      context.LRegistry.get(event.srcAddress),
      context.effect(fetchRegistryMetadata, { ipfsHash }),
    ]);

    if (!registry) {
      context.log.error(`LRegistry ${event.srcAddress} not found`);
      return;
    }

    const metaEvidenceID =
      registry.id + "-" + (registry.metaEvidenceCount + ONE).toString();
    const metaEvidence = await context.MetaEvidence.getOrCreate({
      id: metaEvidenceID,
      uri: event.params._evidence,
    });

    // even/0 for Registration, odd for Clearing
    const isRegistration =
      event.params._metaEvidenceID % BigInt(2) === BigInt(0);

    const updatedRegistry: LRegistry = {
      ...registry,
      metaEvidenceCount: registry.metaEvidenceCount + ONE,
      registrationMetaEvidence_id: isRegistration
        ? metaEvidence.id
        : registry.registrationMetaEvidence_id,
      clearingMetaEvidence_id: isRegistration
        ? registry.clearingMetaEvidence_id
        : metaEvidence.id,
      title: JSONValueToMaybeString(registryMetadata?.metadata?.tcrTitle),
      description: JSONValueToMaybeString(
        registryMetadata?.metadata?.description
      ),
      itemName: JSONValueToMaybeString(registryMetadata?.metadata?.itemName),
      itemNamePlural: JSONValueToMaybeString(
        registryMetadata?.metadata?.itemNamePlural
      ),
      parentTCRAddress: JSONValueToMaybeString(
        registryMetadata?.metadata?.parentTCRAddress
      ),
      isConnectedTCR: JSONValueToBool(
        registryMetadata?.metadata?.isConnectedTCR
      ),
      isTCRofTcrs: JSONValueToBool(registryMetadata?.metadata?.isTCRofTcrs),
      relTcrDisabled: JSONValueToBool(
        registryMetadata?.metadata?.relTcrDisabled
      ),
      requireRemovalEvidence: JSONValueToBool(
        registryMetadata?.metadata?.requireRemovalEvidence
      ),
    };

    context.LRegistry.set(updatedRegistry);
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

    context.addIArbitrator(arbitratorAddr);
    context.log.info(
      `Registered new Arbitrator at ${arbitratorAddr} for ${event.srcAddress}`
    );
  }
);
