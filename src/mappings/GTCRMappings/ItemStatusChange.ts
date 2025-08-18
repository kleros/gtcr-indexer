import { GeneralizedTCR } from "generated";
import { getFinalRuling, getStatus } from "../../utils";
import { getRequestInfo } from "../../utils/contract/getRequestInfo";
import { getItemInfo } from "../../utils/contract/classic/getItemInfo";

GeneralizedTCR.ItemStatusChange.handlerWithLoader({
  loader: async ({ event, context }) => {
    if (event.params._resolved === false) return;

    const graphItemID =
      event.params._itemID + "@" + event.srcAddress.toLowerCase();

    const requestID = graphItemID + "-" + event.params._requestIndex.toString();

    const [item, request, itemInfo, requestInfo] = await Promise.all([
      context.Item.get(graphItemID),
      context.Request.get(requestID),
      context.effect(getItemInfo, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
        itemID: event.params._itemID,
      }),
      context.effect(getRequestInfo, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
        itemID: event.params._itemID,
        requestIndex: event.params._requestIndex,
        isClassic: true,
      }),
    ]);

    if (!item) {
      context.log.error(`Item not found: ${graphItemID}`);
      return;
    }

    context.Item.set({
      ...item,
      status: getStatus(itemInfo.status),
      latestRequestResolutionTime: BigInt(event.block.timestamp),
      disputed: false,
    });

    if (!request) {
      context.log.error(`ItemStatusChange Request not found: ${requestID}`);
      return;
    }
    context.Request.set({
      ...request,
      resolved: true,
      resolutionTime: BigInt(event.block.timestamp),
      disputeOutcome: getFinalRuling(requestInfo.ruling),
      resolutionTx: event.transaction.hash,
    });
  },
  handler: async ({ event, context, loaderReturn }) => {},
});
