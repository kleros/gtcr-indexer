import { GeneralizedTCR } from "generated";
import { ONE, REQUESTER_CODE } from "../../utils";
import { getRequestInfo } from "../../utils/contract/getRequestInfo";
import { getAppealCost } from "../../utils/contract/classic/getAppealCost";
import { buildNewClassicRound } from "../helpers/buildRound";

GeneralizedTCR.HasPaidAppealFee.handlerWithLoader({
  loader: async ({ event, context }) => {
    const graphItemID =
      event.params._itemID + "@" + event.srcAddress.toLowerCase();

    const requestID = graphItemID + "-" + event.params._request.toString();

    const roundID = requestID + "-" + event.params._round.toString();

    const [item, request, round, requestInfo] = await Promise.all([
      context.Item.get(graphItemID),
      context.Request.get(requestID),
      context.Round.get(roundID),
      context.effect(getRequestInfo, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
        itemID: event.params._itemID,
        requestIndex: event.params._request,
        isClassic: true,
      }),
    ]);

    if (!item) {
      context.log.error(`HasPaidAppealFee Item not found: ${graphItemID}`);
      return;
    }

    if (!request) {
      context.log.error(`HasPaidAppealFee Request not found: ${requestID}`);
      return;
    }

    if (!round) {
      context.log.error(`HasPaidAppealFee round not found: ${roundID}`);
      return;
    }

    const isRequester = event.params._side === BigInt(REQUESTER_CODE);

    const bothSidesPaid =
      (isRequester ? true : round.hasPaidRequester) &&
      (isRequester ? round.hasPaidChallenger : true);

    const appealCost = await context.effect(getAppealCost, {
      contractAddress: request.arbitrator,
      chainId: event.chainId,
      blockNumber: event.block.number,
      disputeID: request.disputeID,
      arbitratorExtraData: request.arbitratorExtraData,
    });

    context.Round.set({
      ...round,
      hasPaidRequester: isRequester ? true : round.hasPaidRequester,
      hasPaidChallenger: isRequester ? round.hasPaidChallenger : true,
      feeRewards: bothSidesPaid
        ? round.feeRewards - appealCost
        : round.feeRewards,
    });

    // new round is created
    if (bothSidesPaid) {
      const newRoundID =
        requestID + "-" + (requestInfo.numberOfRounds - ONE).toString();

      const newRound = buildNewClassicRound(
        newRoundID,
        requestID,
        event.block.timestamp
      );

      context.Round.set(newRound);
      context.Request.set({
        ...request,
        numberOfRounds: request.numberOfRounds + ONE,
      });
    }

    context.HasPaidAppealFee.set({
      id: roundID + "-" + event.params._side.toString(),
      item_id: graphItemID,
      request_id: requestID,
      round_id: roundID,
      timestamp: BigInt(event.block.timestamp),
      side: event.params._side,
    });
  },
  handler: async ({ event, context, loaderReturn }) => {},
});
