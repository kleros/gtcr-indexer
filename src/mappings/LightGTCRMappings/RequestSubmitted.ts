import { LightGeneralizedTCR, LItem, LRequest } from "generated";
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
import { updateCounters } from "../helpers/updateCounters";
import { buildNewRound } from "../helpers/buildRound";

LightGeneralizedTCR.RequestSubmitted.handlerWithLoader({
  loader: async ({ event, context }) => {
    const graphItemID =
      event.params._itemID + "@" + event.srcAddress.toLowerCase();

    const itemInfo = await context.effect(getItemInfo, {
      contractAddress: event.srcAddress,
      chainId: event.chainId,
      blockNumber: event.block.number,
      itemID: event.params._itemID,
    });

    const evidenceGroupID =
      event.params._evidenceGroupID.toString() +
      "@" +
      event.srcAddress.toLowerCase();
    const [
      registry,
      item,
      evidenceGroup,
      requestInfo,
      submissionBaseDeposit,
      removalBaseDeposit,
    ] = await Promise.all([
      context.LRegistry.get(event.srcAddress.toLowerCase()),
      context.LItem.get(graphItemID),
      context.EvidenceGroup.getOrCreate({
        id: evidenceGroupID,
        numberOfEvidence: ZERO,
      }),
      context.effect(getRequestInfo, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
        itemID: event.params._itemID,
        // item.numberOfRequests is the count of requests, so we adjust for zero-based indexing
        requestIndex: itemInfo.numberOfRequests - ONE,
      }),
      context.effect(getSubmissionBaseDeposit, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
      }),
      context.effect(getRemovalBaseDeposit, {
        contractAddress: event.srcAddress,
        chainId: event.chainId,
        blockNumber: event.block.number,
      }),
    ]);

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

    const requestIndex = itemInfo.numberOfRequests - ONE;
    const requestID = graphItemID + "-" + requestIndex.toString();

    const request: LRequest = {
      id: requestID,
      disputed: false,
      arbitrator: requestInfo.requestArbitrator.toLowerCase(),
      arbitratorExtraData: requestInfo.requestArbitratorExtraData,
      challenger: ZERO_ADDRESS,
      requester: requestInfo.parties.requester.toLowerCase(),
      item_id: updatedItem.id,
      registry_id: registry.id,
      registryAddress: event.srcAddress.toLowerCase(),
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

    const roundID = requestID + "-0";

    // Note that everything related to the deposit (e.g. contribution creation)
    // is handled in handleContribution.
    const round = buildNewRound(roundID, requestID, event.block.timestamp);

    // Accounting.
    if (itemInfo.numberOfRequests === ONE) {
      // This is the first request for this item, which must be
      // a registration request.
      context.LRegistry.set({
        ...registry,
        numberOfRegistrationRequested:
          registry.numberOfRegistrationRequested + ONE,
      });
    } else {
      updateCounters(previousStatus, newStatus, registry, context);
    }

    context.LRequest.set(request);
    context.LItem.set(updatedItem);
    context.LRound.set(round);
  },
  handler: async ({ event, context, loaderReturn }) => {},
});
