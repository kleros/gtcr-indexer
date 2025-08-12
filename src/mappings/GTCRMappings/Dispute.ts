import { GeneralizedTCR } from "generated";
import {
  getStatus,
  ONE,
  REGISTRATION_REQUESTED,
  ZERO_ADDRESS,
} from "../../utils";
import { getRequestInfo } from "../../utils/contract/getRequestInfo";
import { getItemInfo } from "../../utils/contract/classic/getItemInfo";
import { getArbitrationCost } from "../../utils/contract/getArbitrationCost";
import { buildNewClassicRound } from "../helpers/buildRound";
import { arbitratorDisputeIDToItem } from "../../utils/contract/classic/arbitratorDisputeIDToItem";
import { getSubmissionChallengeBaseDeposit } from "../../utils/contract/classic/getSubmissionChallengeBaseDeposit";
import { getRemovalChallengeBaseDeposit } from "../../utils/contract/classic/getRemovalChallengeBaseDeposit";

GeneralizedTCR.Dispute.handlerWithLoader({
  loader: async ({ event, context }) => {
    const itemID = await context.effect(arbitratorDisputeIDToItem, {
      contractAddress: event.srcAddress,
      chainId: event.chainId,
      blockNumber: event.block.number,
      arbitrator: event.params._arbitrator,
      disputeID: event.params._disputeID,
    });

    const graphItemID = itemID + "@" + event.srcAddress.toLowerCase();

    const [item, itemInfo] = await Promise.all([
      context.Item.get(graphItemID),
      context.effect(getItemInfo, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
        itemID,
      }),
    ]);

    if (!item) {
      context.log.error(`Dispute Item not found: ${graphItemID}`);
      return;
    }

    context.Item.set({
      ...item,
      disputed: true,
      latestChallenger: event.transaction.from?.toLowerCase() ?? ZERO_ADDRESS,
    });

    const requestIndex = itemInfo.numberOfRequests - ONE;
    const requestID = graphItemID + "-" + requestIndex.toString();

    const [request, requestInfo] = await Promise.all([
      context.Request.get(requestID),
      context.effect(getRequestInfo, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
        itemID,
        requestIndex,
        isClassic: true,
      }),
    ]);

    if (!request) {
      context.log.error(`Dispute Round not found: ${requestID}`);
      return;
    }

    context.Request.set({
      ...request,
      disputed: true,
      challenger: requestInfo.parties.challenger.toLowerCase(),
      numberOfRounds: BigInt(2),
      disputeID: event.params._disputeID,
    });

    const roundID =
      requestID + "-" + (requestInfo.numberOfRounds - BigInt(2)).toString();

    const [round, arbitrationCost, submissionBaseDeposit, removalBaseDeposit] =
      await Promise.all([
        context.Round.get(roundID),
        context.effect(getArbitrationCost, {
          contractAddress: request.arbitrator,
          chainId: event.chainId,
          blockNumber: event.block.number,
          extraData: request.arbitratorExtraData,
        }),
        context.effect(getSubmissionChallengeBaseDeposit, {
          contractAddress: event.srcAddress,
          chainId: event.chainId,
          blockNumber: event.block.number,
        }),
        context.effect(getRemovalChallengeBaseDeposit, {
          contractAddress: event.srcAddress,
          chainId: event.chainId,
          blockNumber: event.block.number,
        }),
      ]);

    if (!round) {
      context.log.error(`Dispute Round not found: ${roundID}`);
      return;
    }

    const isRegistration =
      getStatus(itemInfo.status) === REGISTRATION_REQUESTED;

    const amountPaidChallenger = isRegistration
      ? submissionBaseDeposit + arbitrationCost
      : removalBaseDeposit + arbitrationCost;

    context.Round.set({
      ...round,
      amountPaidChallenger,
      feeRewards: round.feeRewards + amountPaidChallenger - arbitrationCost,
      hasPaidChallenger: true,
    });

    const newRoundID =
      requestID + "-" + (requestInfo.numberOfRounds - ONE).toString();

    const newRound = buildNewClassicRound(
      newRoundID,
      requestID,
      event.block.timestamp
    );

    context.Round.set(newRound);
  },
  handler: async ({ event, context, loaderReturn }) => {},
});
