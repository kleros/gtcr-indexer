import { LContribution, LightGeneralizedTCR, LRound } from "generated";
import { getRoundInfo } from "../../utils/contract/getRoundInfo";
import { ONE, ZERO } from "../../utils";

// This handler is triggered in 3 situations:
// - When a user places a request
// - When a user challenges a request
// - When a user funds a side of an appeal.
LightGeneralizedTCR.Contribution.handlerWithLoader({
  loader: async ({ event, context }) => {
    const graphItemID = event.params._itemID + "@" + event.srcAddress;

    const requestID = graphItemID + "-" + event.params._requestID.toString();
    const roundID = requestID + "-" + event.params._roundID.toString();

    const round = await context.LRound.get(roundID);

    const roundInfo = await context.effect(getRoundInfo, {
      contractAddress: event.srcAddress,
      chainId: event.chainId,
      blockNumber: event.block.number,
      itemID: event.params._itemID,
      requestID: event.params._requestID,
      roundID: event.params._roundID,
    });

    return {
      roundID,
      round,
      roundInfo,
    };
  },

  handler: async ({ event, context, loaderReturn }) => {
    const { roundID, round, roundInfo } = loaderReturn;

    if (!round) {
      context.log.error(`LRound at roundID ${roundID} not found`);
      return;
    }

    const contribution: LContribution = {
      id: roundID + "-" + round.numberOfContributions.toString(),
      round_id: roundID,
      side: event.params._side,
      withdrawable: false,
      contributor: event.params._contributor,
    };

    let amountPaidChallenger = ZERO;
    let amountPaidRequester = ZERO;
    let hasPaidRequester = false;
    let hasPaidChallenger = false;

    if (event.params._roundID === ZERO) {
      if (event.params._side === ONE) {
        amountPaidRequester = event.params._contribution;
        hasPaidRequester = true;
      } else {
        amountPaidChallenger = event.params._contribution;
        hasPaidChallenger = true;
      }
    } else {
      hasPaidRequester = roundInfo.hasPaid.requester;
      hasPaidChallenger = roundInfo.hasPaid.challenger;
      amountPaidRequester = roundInfo.amountPaid.requester;
      amountPaidChallenger = roundInfo.amountPaid.challenger;
    }

    const updatedRound: LRound = {
      ...round,
      amountPaidRequester,
      amountPaidChallenger,
      hasPaidRequester,
      hasPaidChallenger,
      feeRewards: roundInfo.feeRewards,
      numberOfContributions: round.numberOfContributions + ONE,
      lastFundedRequester:
        event.params._side === ONE
          ? BigInt(event.block.timestamp)
          : round.lastFundedRequester,
      lastFundedChallenger:
        event.params._side === ONE
          ? round.lastFundedChallenger
          : BigInt(event.block.timestamp),
    };

    context.LContribution.set(contribution);
    context.LRound.set(updatedRound);
  },
});
