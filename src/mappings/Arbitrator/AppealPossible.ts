import {
  handlerContext,
  IArbitrator,
  IArbitrator_AppealPossible_event,
} from "generated";
import { ACCEPT, NONE, ONE, REJECT, ZERO } from "../../utils";
import { arbitratorDisputeIDToItem } from "../../utils/contract/classic/arbitratorDisputeIDToItem";
import { appealPeriod } from "../../utils/contract/appealPeriod";
import { currentRuling } from "../../utils/contract/currentRuling";
import { arbitratorDisputeIDToItemID } from "../../utils/contract/arbitratorDisputeIDToItemID";

IArbitrator.AppealPossible.handlerWithLoader({
  loader: async ({ event, context }) => {
    const [registry, lregistry] = await Promise.all([
      context.Registry.get(event.params._arbitrable.toLowerCase()),
      context.LRegistry.get(event.params._arbitrable.toLowerCase()),
    ]);

    // related to GTCR
    if (registry) {
      await handleClassicAppealPossible(context, event);
    }
    // related to LGTCR
    else if (lregistry) {
      await handleLightAppealPossible(context, event);
    }
  },
  handler: async ({ event, context, loaderReturn }) => {},
});

const handleClassicAppealPossible = async (
  context: handlerContext,
  event: IArbitrator_AppealPossible_event
) => {
  const [itemID, appealPeriods, ruling] = await Promise.all([
    context.effect(arbitratorDisputeIDToItem, {
      contractAddress: event.params._arbitrable,
      chainId: event.chainId,
      blockNumber: event.block.number,
      arbitrator: event.srcAddress,
      disputeID: event.params._disputeID,
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

  const graphItemID = itemID + "@" + event.params._arbitrable.toLowerCase();

  const item = await context.Item.get(graphItemID);

  if (!item) {
    context.log.error(`Appeal Possible Item not found: ${graphItemID}`);
    return;
  }

  const requestID = item.id + "-" + (item.numberOfRequests - ONE).toString();

  const request = await context.Request.get(requestID);

  if (!request) {
    context.log.error(`Appeal Possible Request not found: ${requestID}`);
    return;
  }
  const roundID = request.id + "-" + (request.numberOfRounds - ONE).toString();

  const round = await context.Round.get(roundID);

  if (!round) {
    context.log.error(`Appeal Possible Round not found: ${roundID}`);
    return;
  }
  context.Round.set({
    ...round,
    appealPeriodStart: appealPeriods.appealPeriodStart,
    appealPeriodEnd: appealPeriods.appealPeriodEnd,
    rulingTime: BigInt(event.block.timestamp),
    txHashAppealPossible: event.transaction.hash,
    ruling: ruling === ZERO ? NONE : ruling === ONE ? ACCEPT : REJECT,
  });
};

const handleLightAppealPossible = async (
  context: handlerContext,
  event: IArbitrator_AppealPossible_event
) => {
  const [itemID, appealPeriods, ruling] = await Promise.all([
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
  const roundID = request.id + "-" + (request.numberOfRounds - ONE).toString();

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
};
