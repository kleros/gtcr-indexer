import { indexer, LightGeneralizedTCR } from "envio";
import { arbitratorDisputeIDToItemID } from "../../utils/contract/arbitratorDisputeIDToItemID";
import { ONE } from "../../utils";

indexer.onEvent(
  { contract: "LightGeneralizedTCR", event: "Ruling" },
  async ({ event, context }) => {
    const loaderReturn = await (async ({ event, context }) => {
    try {
      const itemID = await context.effect(arbitratorDisputeIDToItemID, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
        arbitrator: event.params._arbitrator,
        disputeID: event.params._disputeID,
      });

      const graphItemID = itemID + "@" + event.srcAddress.toLowerCase();

      const item = await context.LItem.getOrThrow(graphItemID);

      const requestID =
        item.id + "-" + (item.numberOfRequests - ONE).toString();
      const request = await context.LRequest.getOrThrow(requestID);

      context.LRequest.set({
        ...request,
        finalRuling: event.params._ruling,
        resolutionTime: BigInt(event.block.timestamp),
      });
    } catch (error) {
      if (error instanceof Error) {
        context.log.error(`Ruling Error: ${error.message}`);
      }
      context.log.error(`${error}`);
    }
  })({ event, context });

  }
);
