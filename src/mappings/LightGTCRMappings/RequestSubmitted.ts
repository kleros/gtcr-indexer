import { LightGeneralizedTCR, LItem, LRound, Request } from "generated";
import {
  getExtendedStatus,
  getStatus,
  NONE,
  ONE,
  REGISTRATION_REQUESTED,
  ZERO,
  ZERO_ADDRESS,
} from "../../utils";
import { getItemInfo } from "../../utils/contract/getItemInfo";
import { getRequestInfo } from "../../utils/contract/getRequestInfo";
import { getRemovalBaseDeposit } from "../../utils/contract/getRemovalBaseDeposit";
import { getSubmissionBaseDeposit } from "../../utils/contract/getSubmissionBaseDeposit";

LightGeneralizedTCR.RequestSubmitted.handlerWithLoader({
  loader: async ({ event, context }) => {
    const graphItemID = event.params._itemID + "@" + event.srcAddress;

    const [registry, item] = await Promise.all([
      context.LRegistry.get(event.srcAddress),
      context.LItem.get(graphItemID),
    ]);
    const itemInfo = await context.effect(getItemInfo, {
      contractAddress: event.srcAddress,
      chainId: event.chainId,
      blockNumber: event.block.number,
      itemID: event.params._itemID,
    });

    const requestInfo = await context.effect(getRequestInfo, {
      contractAddress: event.srcAddress,
      chainId: event.chainId,
      blockNumber: event.block.number,
      itemID: event.params._itemID,
      requestIndex: itemInfo.numberOfRequests,
    });

    const submissionBaseDeposit = await context.effect(
      getSubmissionBaseDeposit,
      {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
      }
    );

    const removalBaseDeposit = await context.effect(getRemovalBaseDeposit, {
      contractAddress: event.srcAddress,
      chainId: event.chainId,
      blockNumber: event.block.number,
    });

    return {
      registry,
      item,
      itemInfo,
      requestInfo,
      submissionBaseDeposit,
      removalBaseDeposit,
    };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const {
      registry,
      item,
      itemInfo,
      requestInfo,
      submissionBaseDeposit,
      removalBaseDeposit,
    } = loaderReturn;

    const graphItemID = event.params._itemID + "@" + event.srcAddress;

    if (!item) {
      context.log.error(`LItem for graphItemID ${graphItemID} not found.`);
      return;
    }

    if (!registry) {
      context.log.error(`LRegistry at address ${event.srcAddress} not found`);
      return;
    }

    // `previousStatus` and `newStatus` are used for accounting.
    // Note that if this is the very first request of an item,
    // item.status and item.dispute are dirty because they were set by
    // handleNewItem, executed before this handler and so `previousStatus`
    // would be wrong. We use a condition to detect if its the very
    // first request and if so, ignore its contents (see below in accounting).
    const previousStatus = getExtendedStatus(item.disputed, item.status);

    const updatedItem: LItem = {
      ...item,
      numberOfRequests: item.numberOfRequests + ONE,
      status: getStatus(itemInfo.status),
      latestRequester: event.transaction.from ?? ZERO_ADDRESS,
      latestRequestResolutionTime: ZERO,
      latestRequestSubmissionTime: BigInt(event.block.timestamp),
    };

    const newStatus = getExtendedStatus(
      updatedItem.disputed,
      updatedItem.status
    );

    const requestIndex = itemInfo.numberOfRequests;
    const requestID = graphItemID + "-" + requestIndex.toString();

    const evidenceGroupID =
      event.params._evidenceGroupID + "@" + event.srcAddress;
    const evidenceGroup = await context.EvidenceGroup.getOrCreate({
      id: evidenceGroupID,
      numberOfEvidence: ZERO,
    });

    const request: Request = {
      id: requestID,
      disputed: false,
      arbitrator: requestInfo.requestArbitrator,
      arbitratorExtraData: requestInfo.requestArbitratorExtraData,
      challenger: ZERO_ADDRESS,
      requester: requestInfo.parties.requester,
      item_id: updatedItem.id,
      registry_id: registry.id,
      registryAddress: event.srcAddress,
      resolutionTime: ZERO,
      disputeOutcome: NONE,
      resolved: false,
      disputeID: ZERO,
      submissionTime: BigInt(event.block.timestamp),
      numberOfRounds: ONE,
      requestType: updatedItem.status,
      evidenceGroup_id: evidenceGroup.id,
      deposit:
        updatedItem.status === REGISTRATION_REQUESTED
          ? submissionBaseDeposit
          : removalBaseDeposit,
      metaEvidence_id:
        updatedItem.status === REGISTRATION_REQUESTED
          ? registry.registrationMetaEvidence_id
          : registry.clearingMetaEvidence_id,
      creationTx: event.transaction.hash,
      resolutionTx: undefined,
      finalRuling: undefined,
    };

    // TODO : create round

    const roundID = requestID + "-0";

    // Note that everything related to the deposit (e.g. contribution creation)
    // is handled in handleContribution.
    const round = buildNewRound(roundID, requestID, event.block.timestamp);

    // TODO: Counters

    //   // Accounting.
    //   if (itemInfo.value1.equals(BigInt.fromI32(1))) {
    //     // This is the first request for this item, which must be
    //     // a registration request.
    //     registry.numberOfRegistrationRequested =
    //       registry.numberOfRegistrationRequested.plus(BigInt.fromI32(1));
    //   } else {
    //     updateCounters(previousStatus, newStatus, event.address);
    //   }

    context.Request.set(request);
    context.LRegistry.set(registry);
    context.LItem.set(updatedItem);
    context.LRound.set(round);
  },
});

function buildNewRound(
  roundID: string,
  requestID: string,
  timestamp: number
): LRound {
  return {
    id: roundID,
    request_id: requestID,
    amountPaidChallenger: ZERO,
    amountPaidRequester: ZERO,
    feeRewards: ZERO,
    hasPaidChallenger: false,
    hasPaidRequester: false,
    lastFundedRequester: ZERO,
    lastFundedChallenger: ZERO,
    appealPeriodStart: ZERO,
    appealPeriodEnd: ZERO,
    rulingTime: ZERO,
    ruling: NONE,
    creationTime: BigInt(timestamp),
    numberOfContributions: ZERO,
    appealed: false,
    appealedAt: undefined,
    txHashAppealDecision: undefined,
    txHashAppealPossible: undefined,
  };
}
