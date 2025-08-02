import { LightGeneralizedTCR, LItem, LRequest, LRound } from "generated";
import {
  CHALLENGER_CODE,
  CLEARING_REQUESTED_CODE,
  getExtendedStatus,
  getFinalRuling,
  getStatus,
  NO_RULING_CODE,
  ONE,
  REGISTRATION_REQUESTED_CODE,
  REQUESTER_CODE,
  ZERO,
} from "../../utils";
import { getItemInfo } from "../../utils/contract/getItemInfo";
import { updateCounters } from "../helpers/updateCounters";
import { getRequestInfo } from "../../utils/contract/getRequestInfo";

LightGeneralizedTCR.ItemStatusChange.handlerWithLoader({
  loader: async ({ event, context }) => {
    try {
      // This handler is used to handle transactions to item statuses 0 and 1.
      // All other status updates are handled elsewhere.
      const itemInfo = await context.effect(getItemInfo, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
        itemID: event.params._itemID,
      });

      if (
        itemInfo.status === REGISTRATION_REQUESTED_CODE ||
        itemInfo.status === CLEARING_REQUESTED_CODE
      ) {
        // LRequest not yet resolved. No-op as changes are handled
        // elsewhere.
        return;
      }

      const graphItemID = event.params._itemID + "@" + event.srcAddress;
      const [item, registry] = await Promise.all([
        context.LItem.getOrThrow(graphItemID),
        context.LRegistry.getOrThrow(event.srcAddress),
      ]);

      // We take the previous and new extended statuses for accounting purposes.
      const previousStatus = getExtendedStatus(item.disputed, item.status);
      const newStatus = getExtendedStatus(false, getStatus(itemInfo.status));
      if (previousStatus !== newStatus) {
        updateCounters(previousStatus, newStatus, registry, context);
      }

      if (event.params._updatedDirectly) {
        // Direct actions (e.g. addItemDirectly and removeItemDirectly)
        // don't involve any requests. Only the item is updated.
        context.LItem.set({
          ...item,
          disputed: false,
          status: getStatus(itemInfo.status),
        });
        return;
      }

      const updatedItem: LItem = {
        ...item,
        disputed: false,
        status: getStatus(itemInfo.status),
        latestRequestResolutionTime: BigInt(event.block.timestamp),
      };

      const requestIndex = item.numberOfRequests - ONE;
      const requestInfo = await context.effect(getRequestInfo, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
        itemID: event.params._itemID,
        requestIndex,
      });

      const requestID = graphItemID + "-" + requestIndex.toString();
      const request = await context.LRequest.getOrThrow(requestID);

      const updatedRequest: LRequest = {
        ...request,
        resolved: true,
        resolutionTime: BigInt(event.block.timestamp),
        resolutionTx: event.transaction.hash,
        disputeOutcome: getFinalRuling(requestInfo.ruling),
      };

      // Iterate over every contribution and mark it as withdrawable if it is.
      // Start from the second round as the first is automatically withdrawn
      // when the request resolves.
      for (let i = 1; i < Number(request.numberOfRounds); i++) {
        // Iterate over every round of the request.
        const roundID = requestID + "-" + i.toString();
        const round = await context.LRound.getOrThrow(roundID);

        for (let j = 0; j < Number(round.numberOfContributions); j++) {
          // Iterate over every contribution of the round.
          const contributionID = roundID + "-" + j.toString();
          const contribution = await context.LContribution.getOrThrow(
            contributionID
          );
          let withdrawable = false;
          if (requestInfo.ruling == NO_RULING_CODE) {
            // The final ruling is refuse to rule. There is no winner
            // or loser so every contribution is withdrawable.
            withdrawable = true;
          } else if (requestInfo.ruling == REQUESTER_CODE) {
            // The requester won so only contributions to the requester
            // are withdrawable.
            // The only exception is in the case the last round the loser
            // (challenger in this case) raised some funds but not enough
            // to be fully funded before the deadline. In this case
            // the contributors get to withdraw.
            if (contribution.side == BigInt(REQUESTER_CODE)) {
              withdrawable = true;
            } else if (BigInt(i) == request.numberOfRounds - ONE) {
              // Contribution was made to the challenger (loser) and this
              // is the last round.
              withdrawable = true;
            }
          } else {
            // The challenger won so only contributions to the challenger
            // are withdrawable.
            // The only exception is in the case the last round the loser
            // (requester in this case) raised some funds but not enough
            // to be fully funded before the deadline. In this case
            // the contributors get to withdraw.
            if (contribution.side == BigInt(CHALLENGER_CODE)) {
              withdrawable = true;
            } else if (BigInt(i) == request.numberOfRounds - ONE) {
              // Contribution was made to the requester (loser) and this
              // is the last round.
              withdrawable = true;
            }
          }
          context.LContribution.set({
            ...contribution,
            withdrawable,
          });
        }
      }

      context.LItem.set(updatedItem);
      context.LRequest.set(updatedRequest);
    } catch (error) {
      if (error instanceof Error) {
        context.log.error(`ItemStatusChange Error: ${error.message}`);
      }
      context.log.error(`${error}`);
    }
  },

  handler: async ({ event, context, loaderReturn }) => {},
});
