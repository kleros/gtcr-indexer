import { IArbitrator } from "generated";
import { arbitratorDisputeIDToItemID } from "../../utils/contract/arbitratorDisputeIDToItemID";
import { ACCEPT, NONE, ONE, REJECT, ZERO } from "../../utils";
import { appealPeriod } from "../../utils/contract/appealPeriod";
import { currentRuling } from "../../utils/contract/currentRuling";

IArbitrator.AppealPossible.handlerWithLoader({
  loader: async ({ event, context }) => {
    const [registry, itemID, appealPeriods, ruling] = await Promise.all([
      context.LRegistry.get(event.params._arbitrable.toLowerCase()),
      context.effect(arbitratorDisputeIDToItemID, {
        contractAddress: event.params._arbitrable,
        chainId: event.chainId,
        blockNumber: event.block.number,
        disputeID: event.params._disputeID,
        arbitrator: event.srcAddress,
      }),
      context.effect(appealPeriod, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
        disputeID: event.params._disputeID,
      }),
      context.effect(currentRuling, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
        disputeID: event.params._disputeID,
      }),
    ]);
    // event not related to LGTCR
    if (!registry) {
      return;
    }
    const graphItemID = itemID + "@" + event.params._arbitrable.toLowerCase();

    const item = await context.LItem.get(graphItemID);

    if (!item) {
      context.log.error(`Appeal Possible LItem not found: ${graphItemID}`);
      return;
    }

    const requestID = item.id + "-" + (item.numberOfRequests - ONE).toString();

    const request = await context.LRequest.get(requestID);

    if (!request) {
      context.log.error(`Appeal Possible LRequest not found: ${requestID}`);
      return;
    }
    const roundID =
      request.id + "-" + (request.numberOfRounds - ONE).toString();

    const round = await context.LRound.get(roundID);

    if (!round) {
      context.log.error(`Appeal Possible LRound not found: ${roundID}`);
      return;
    }

    context.LRound.set({
      ...round,
      appealPeriodStart: appealPeriods.appealPeriodStart,
      appealPeriodEnd: appealPeriods.appealPeriodEnd,
      rulingTime: BigInt(event.block.timestamp),
      txHashAppealPossible: event.transaction.hash,
      ruling: ruling === ZERO ? NONE : ruling === ONE ? ACCEPT : REJECT,
    });
  },
  handler: async ({ event, context, loaderReturn }) => {},
});
