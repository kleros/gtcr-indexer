import { IArbitrator } from "generated";
import { arbitratorDisputeIDToItemID } from "../../utils/contract/arbitratorDisputeIDToItemID";
import { ONE } from "../../utils";
import { buildNewRound } from "../helpers/buildRound";

IArbitrator.AppealDecision.handlerWithLoader({
  loader: async ({ event, context }) => {
    const [registry, itemID] = await Promise.all([
      context.LRegistry.get(event.params._arbitrable),
      context.effect(arbitratorDisputeIDToItemID, {
        contractAddress: event.params._arbitrable,
        chainId: event.chainId,
        blockNumber: event.block.number,
        disputeID: event.params._disputeID,
        arbitrator: event.srcAddress,
      }),
    ]);
    // event not related to LGTCR
    if (!registry) {
      return;
    }
    const graphItemID = itemID + "@" + event.params._arbitrable;

    const item = await context.LItem.get(graphItemID);

    if (!item) {
      context.log.error(`Appeal Decision LItem not found: ${graphItemID}`);
      return;
    }

    const requestID = item.id + "-" + (item.numberOfRequests - ONE).toString();

    const request = await context.LRequest.get(requestID);

    if (!request) {
      context.log.error(`Appeal Decision LRequest not found: ${requestID}`);
      return;
    }
    const roundID =
      request.id + "-" + (request.numberOfRounds - ONE).toString();

    const round = await context.LRound.get(roundID);

    if (!round) {
      context.log.error(`Appeal Decision LRound not found: ${roundID}`);
      return;
    }

    const newRoundID = request.id + "-" + request.numberOfRounds.toString();
    const newRound = buildNewRound(
      newRoundID,
      registry.id,
      event.block.timestamp
    );

    context.LRound.set(newRound);
    context.LRound.set({
      ...round,
      appealed: true,
      appealedAt: BigInt(event.block.timestamp),
      txHashAppealDecision: event.transaction.hash,
    });
    context.LRequest.set({
      ...request,
      numberOfRounds: request.numberOfRounds + ONE,
    });
  },
  handler: async ({ event, context, loaderReturn }) => {},
});
