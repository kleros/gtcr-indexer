import { GeneralizedTCR } from "generated";
import { REQUESTER_CODE } from "../../utils";

GeneralizedTCR.AppealContribution.handlerWithLoader({
  loader: async ({ event, context }) => {
    const graphItemID =
      event.params._itemID + "@" + event.srcAddress.toLowerCase();

    const requestID = graphItemID + "-" + event.params._request.toString();

    const roundID = requestID + "-" + event.params._round.toString();

    const [item, request, round] = await Promise.all([
      context.Item.get(graphItemID),
      context.Request.get(requestID),
      context.Round.get(roundID),
    ]);

    if (!item) {
      context.log.error(`AppealContribution Item not found: ${graphItemID}`);
      return;
    }

    if (!request) {
      context.log.error(`AppealContribution Request not found: ${requestID}`);
      return;
    }

    if (!round) {
      context.log.error(`AppealContribution round not found: ${roundID}`);
      return;
    }

    if (event.params._side === BigInt(REQUESTER_CODE)) {
      const amountPaidRequester =
        round.amountPaidRequester + event.params._amount;
      context.Round.set({
        ...round,
        amountPaidRequester,
        feeRewards: round.feeRewards + amountPaidRequester,
      });
    } else {
      const amountPaidChallenger =
        round.amountPaidChallenger + event.params._amount;
      context.Round.set({
        ...round,
        amountPaidChallenger,
        feeRewards: round.feeRewards + amountPaidChallenger,
      });
    }
  },
  handler: async ({ event, context, loaderReturn }) => {},
});
