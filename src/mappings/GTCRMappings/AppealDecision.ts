import { IArbitrator } from "generated";
import { ONE } from "../../utils";
import { arbitratorDisputeIDToItem } from "../../utils/contract/classic/arbitratorDisputeIDToItem";

IArbitrator.AppealDecision.handlerWithLoader({
  loader: async ({ event, context }) => {
    const [registry, itemID] = await Promise.all([
      context.Registry.get(event.params._arbitrable.toLowerCase()),
      context.effect(arbitratorDisputeIDToItem, {
        contractAddress: event.params._arbitrable,
        chainId: event.chainId,
        blockNumber: event.block.number,
        arbitrator: event.srcAddress,
        disputeID: event.params._disputeID,
      }),
    ]);
    // not related to GTCR
    if (!registry) return;

    const graphItemID = itemID + "@" + event.params._arbitrable.toLowerCase();

    const item = await context.Item.get(graphItemID);

    if (!item) {
      context.log.error(`Appeal Decision Item not found: ${graphItemID}`);
      return;
    }

    const requestID = item.id + "-" + (item.numberOfRequests - ONE).toString();

    const request = await context.Request.get(requestID);

    if (!request) {
      context.log.error(`Appeal Decision Request not found: ${requestID}`);
      return;
    }
    const roundID =
      request.id + "-" + (request.numberOfRounds - ONE).toString();

    const round = await context.Round.get(roundID);

    if (!round) {
      context.log.error(`Appeal Decision Round not found: ${roundID}`);
      return;
    }
    context.Round.set({
      ...round,
      appealed: true,
      appealedAt: BigInt(event.block.timestamp),
      txHashAppealDecision: event.transaction.hash,
    });
  },
  handler: async ({ event, context, loaderReturn }) => {},
});
