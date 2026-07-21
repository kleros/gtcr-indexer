import { indexer, LightGeneralizedTCR } from "envio";

indexer.onEvent(
  { contract: "LightGeneralizedTCR", event: "RewardWithdrawn" },
  async ({ event, context }) => {
    const loaderReturn = await (async ({ event, context }) => {
    try {
      const graphItemID =
        event.params._itemID + "@" + event.srcAddress.toLowerCase();
      const requestID = graphItemID + "-" + event.params._request.toString();
      const roundID = requestID + "-" + event.params._round.toString();

      const contributions = await context.LContribution.getWhere.round_id.eq(
        roundID
      );

      for (const contr of contributions) {
        if (
          contr.contributor.toLowerCase() !==
          event.params._beneficiary.toLowerCase()
        ) {
          continue;
        }
        context.LContribution.set({ ...contr, withdrawable: false });
      }
    } catch (error) {
      if (error instanceof Error) {
        context.log.error(`Reward Withdrawn Error: ${error.message}`);
      }
      context.log.error(`${error}`);
    }
  })({ event, context });

  }
);
