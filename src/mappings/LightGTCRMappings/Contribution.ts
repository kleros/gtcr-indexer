import { indexer, LContribution, LightGeneralizedTCR, LRound } from "envio";
import { getRoundInfo } from "../../utils/contract/getRoundInfo";
import { ONE, ZERO } from "../../utils";

// This handler is triggered in 3 situations:
// - When a user places a request
// - When a user challenges a request
// - When a user funds a side of an appeal.
indexer.onEvent(
  { contract: "LightGeneralizedTCR", event: "Contribution" },
  async ({ event, context }) => {
    const loaderReturn = await (async ({ event, context }) => {
    const graphItemID =
      event.params._itemID.toLowerCase() + "@" + event.srcAddress.toLowerCase();

    const requestID = graphItemID + "-" + event.params._requestID.toString();
    const roundID = requestID + "-" + event.params._roundID.toString();

    const round = await context.LRound.get(roundID);

    let roundInfo;
    if (event.params._roundID !== ZERO) {
      roundInfo = await context.effect(getRoundInfo, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
        itemID: event.params._itemID,
        requestID: event.params._requestID,
        roundID: event.params._roundID,
      });
    }

    if (!round) {
      context.log.error(`LRound at roundID ${roundID} not found`);
      return;
    }

    const contribution: LContribution = {
      id: roundID + "-" + round.numberOfContributions.toString(),
      chainId: event.chainId,
      round_id: roundID,
      side: event.params._side,
      withdrawable: false,
      contributor: event.params._contributor.toLowerCase(),
    };

    let amountPaidChallenger = ZERO;
    let amountPaidRequester = ZERO;
    let hasPaidRequester = false;
    let hasPaidChallenger = false;
    let feeRewards;
    if (event.params._roundID === ZERO) {
      if (event.params._side === ONE) {
        amountPaidRequester = event.params._contribution;
        hasPaidRequester = true;
      } else {
        amountPaidChallenger = event.params._contribution;
        hasPaidChallenger = true;
      }
    } else {
      // for round 0 roundInfo is not fetched, so the type here shows as undefined
      hasPaidRequester = roundInfo?.hasPaid.requester ?? false;
      hasPaidChallenger = roundInfo?.hasPaid.challenger ?? false;
      amountPaidRequester = roundInfo?.amountPaid.requester ?? ZERO;
      amountPaidChallenger = roundInfo?.amountPaid.challenger ?? ZERO;
      feeRewards = roundInfo?.feeRewards;
    }

    // Capture the moment each side's appeal becomes fully funded. Only meaningful
    // for appeal rounds (roundID > 0); round 0 holds submission/challenge deposits.
    const appealFullyFundedByRequesterNow =
      event.params._roundID !== ZERO &&
      !round.hasPaidRequester &&
      hasPaidRequester;
    const appealFullyFundedByChallengerNow =
      event.params._roundID !== ZERO &&
      !round.hasPaidChallenger &&
      hasPaidChallenger;

    const updatedRound: LRound = {
      ...round,
      amountPaidRequester,
      amountPaidChallenger,
      hasPaidRequester,
      hasPaidChallenger,
      feeRewards: feeRewards ?? round.feeRewards,
      numberOfContributions: round.numberOfContributions + ONE,
      lastFundedRequester:
        event.params._side === ONE
          ? BigInt(event.block.timestamp)
          : round.lastFundedRequester,
      lastFundedChallenger:
        event.params._side === ONE
          ? round.lastFundedChallenger
          : BigInt(event.block.timestamp),
      txHashAppealFundedRequester: appealFullyFundedByRequesterNow
        ? event.transaction.hash
        : round.txHashAppealFundedRequester,
      txHashAppealFundedChallenger: appealFullyFundedByChallengerNow
        ? event.transaction.hash
        : round.txHashAppealFundedChallenger,
    };

    context.LContribution.set(contribution);
    context.LRound.set(updatedRound);
  })({ event, context });

  }
);
