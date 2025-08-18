import { GeneralizedTCR } from "generated";
import { ONE } from "../../utils";
import { arbitratorDisputeIDToItem } from "../../utils/contract/classic/arbitratorDisputeIDToItem";

GeneralizedTCR.Ruling.handlerWithLoader({
  loader: async ({ event, context }) => {
    const itemID = await context.effect(arbitratorDisputeIDToItem, {
      contractAddress: event.srcAddress,
      chainId: event.chainId,
      blockNumber: event.block.number,
      arbitrator: event.params._arbitrator,
      disputeID: event.params._disputeID,
    });

    const graphItemID = itemID + "@" + event.srcAddress.toLowerCase();

    const item = await context.Item.get(graphItemID);

    if (!item) {
      context.log.error(`Ruling Item not found: ${graphItemID}`);
      return;
    }

    const requestID =
      graphItemID + "-" + (item.numberOfRequests - ONE).toString();

    const request = await context.Request.get(requestID);

    if (!request) {
      context.log.error(`Ruling Round not found: ${requestID}`);
      return;
    }

    context.Request.set({
      ...request,
      finalRuling: event.params._ruling,
      resolutionTime: BigInt(event.block.timestamp),
    });
  },
  handler: async ({ event, context, loaderReturn }) => {},
});
