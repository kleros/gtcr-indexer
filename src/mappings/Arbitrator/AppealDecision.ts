import { indexer, EvmOnEventContext, IArbitrator, IArbitrator_AppealDecision_event, LRegistry } from "envio";
import { ONE } from "../../utils";
import { arbitratorDisputeIDToItem } from "../../utils/contract/classic/arbitratorDisputeIDToItem";
import { arbitratorDisputeIDToItemID } from "../../utils/contract/arbitratorDisputeIDToItemID";
import { buildNewRound } from "../helpers/buildRound";

indexer.onEvent(
  { contract: "IArbitrator", event: "AppealDecision" },
  async ({ event, context }) => {
    const loaderReturn = await (async ({ event, context }) => {
    const [registry, lregistry] = await Promise.all([
      context.Registry.get(event.params._arbitrable.toLowerCase()),
      context.LRegistry.get(event.params._arbitrable.toLowerCase()),
    ]);

    // related to GTCR
    if (registry) {
      await handlerClassicAppealDecision(context, event);
    }
    // related to LGTCR
    else if (lregistry) {
      await handleLightAppealDecision(context, event, lregistry);
    }
  })({ event, context });

  }
);

const handlerClassicAppealDecision = async (
  context: EvmOnEventContext,
  event: IArbitrator_AppealDecision_event
) => {
  const itemID = await context.effect(arbitratorDisputeIDToItem, {
    contractAddress: event.params._arbitrable,
    chainId: event.chainId,
    blockNumber: event.block.number,
    arbitrator: event.srcAddress,
    disputeID: event.params._disputeID,
  });

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
  const roundID = request.id + "-" + (request.numberOfRounds - ONE).toString();

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
};

const handleLightAppealDecision = async (
  context: EvmOnEventContext,
  event: IArbitrator_AppealDecision_event,
  registry: LRegistry
) => {
  const itemID = await context.effect(arbitratorDisputeIDToItemID, {
    contractAddress: event.params._arbitrable,
    chainId: event.chainId,
    blockNumber: event.block.number,
    disputeID: event.params._disputeID,
    arbitrator: event.srcAddress,
  });

  const graphItemID = itemID + "@" + event.params._arbitrable.toLowerCase();

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
  const roundID = request.id + "-" + (request.numberOfRounds - ONE).toString();

  const round = await context.LRound.get(roundID);

  if (!round) {
    context.log.error(`Appeal Decision LRound not found: ${roundID}`);
    return;
  }

  const newRoundID = request.id + "-" + request.numberOfRounds.toString();
  const newRound = buildNewRound(newRoundID, request.id, event.block.timestamp);

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
};
