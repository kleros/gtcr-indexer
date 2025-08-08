import { LightGeneralizedTCR, LItem, LRequest } from "generated";
import { getExtendedStatus, ONE, ZERO_ADDRESS } from "../../utils";
import { arbitratorDisputeIDToItemID } from "../../utils/contract/arbitratorDisputeIDToItemID";
import { getRequestInfo } from "../../utils/contract/getRequestInfo";
import { updateCounters } from "../helpers/updateCounters";
import { buildNewRound } from "../helpers/buildRound";

LightGeneralizedTCR.Dispute.handlerWithLoader({
  loader: async ({ event, context }) => {
    const itemID = await context.effect(arbitratorDisputeIDToItemID, {
      contractAddress: event.srcAddress,
      chainId: event.chainId,
      blockNumber: event.block.number,
      arbitrator: event.params._arbitrator,
      disputeID: event.params._disputeID,
    });

    const graphItemID = itemID + "@" + event.srcAddress.toLowerCase();

    const [item, registry] = await Promise.all([
      context.LItem.get(graphItemID),
      context.LRegistry.get(event.srcAddress.toLowerCase()),
    ]);

    let requestID;
    let request;
    let requestInfo;
    if (item) {
      const requestIndex = item.numberOfRequests - ONE;
      requestInfo = await context.effect(getRequestInfo, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
        itemID,
        requestIndex,
      });

      requestID = graphItemID + "-" + requestIndex.toString();
      request = await context.LRequest.get(requestID);
    }

    if (!item) {
      context.log.error(`LItem at graphItemID ${graphItemID} not found`);
      return;
    }
    if (!registry) {
      context.log.error(`LRegistry at ${event.srcAddress} not found`);
      return;
    }
    if (!request) {
      context.log.error(`LRequest at requestID ${requestID} not found`);
      return;
    }
    if (!requestInfo) {
      context.log.error(`RequestInfo for requestID ${requestID} not found`);
      return;
    }

    // Accounting
    const previousStatus = getExtendedStatus(item.disputed, item.status);
    const newStatus = getExtendedStatus(true, item.status);
    updateCounters(previousStatus, newStatus, registry, context);

    const updatedItem: LItem = {
      ...item,
      disputed: true,
      latestChallenger: event.transaction.from?.toLowerCase() ?? ZERO_ADDRESS,
    };

    const updatedRequest: LRequest = {
      ...request,
      disputed: true,
      challenger: requestInfo.parties.challenger.toLowerCase(),
      numberOfRounds: BigInt(2),
      disputeID: event.params._disputeID,
    };

    const newRoundID = requestID + "-1"; // When a dispute is created, the new round is always id 1
    const newRound = buildNewRound(
      newRoundID,
      request.id,
      event.block.timestamp
    );

    context.LItem.set(updatedItem);
    context.LRequest.set(updatedRequest);
    context.LRound.set(newRound);
  },

  handler: async ({ event, context, loaderReturn }) => {},
});
