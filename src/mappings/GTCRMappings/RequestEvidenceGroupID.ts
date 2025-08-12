import { GeneralizedTCR, Request } from "generated";
import {
  getStatus,
  NONE,
  ONE,
  REGISTRATION_REQUESTED,
  ZERO,
  ZERO_ADDRESS,
} from "../../utils";
import { getRequestInfo } from "../../utils/contract/getRequestInfo";
import { buildNewClassicRound } from "../helpers/buildRound";
import { getItemInfo } from "../../utils/contract/classic/getItemInfo";
import { getArbitrationCost } from "../../utils/contract/getArbitrationCost";
import { getSubmissionBaseDeposit } from "../../utils/contract/classic/getSubmissionBaseDeposit";
import { getRemovalBaseDeposit } from "../../utils/contract/classic/getRemovalBaseDeposit";

GeneralizedTCR.RequestEvidenceGroupID.handlerWithLoader({
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
      context.Registry.get(event.srcAddress.toLowerCase()),
      context.Item.get(graphItemID),
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
        isClassic: true,
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

    const arbitrationCost = await context.effect(getArbitrationCost, {
      contractAddress: requestInfo.requestArbitrator,
      chainId: event.chainId,
      blockNumber: event.block.number,
      extraData: requestInfo.requestArbitratorExtraData,
    });

    if (!registry) {
      context.log.error(`Registry at address ${event.srcAddress} not found`);
      return;
    }

    if (!item) {
      context.Item.set({
        id: graphItemID,
        itemID: event.params._itemID,
        data: itemInfo.data,
        numberOfRequests: ONE,
        registry_id: registry.id,
        registryAddress: event.srcAddress.toLowerCase(),
        disputed: false,
        status: getStatus(itemInfo.status),
        latestRequester: event.transaction.from?.toLowerCase() ?? ZERO_ADDRESS,
        latestChallenger: ZERO_ADDRESS,
        latestRequestResolutionTime: ZERO,
        latestRequestSubmissionTime: BigInt(event.block.timestamp),
      });
      context.Registry.set({
        ...registry,
        numberOfItems: registry.numberOfItems + ONE,
      });
    } else {
      context.Item.set({
        ...item,
        status: getStatus(itemInfo.status),
        latestRequester: event.transaction.from?.toLowerCase() ?? ZERO_ADDRESS,
        latestChallenger: ZERO_ADDRESS,
        latestRequestResolutionTime: ZERO,
        latestRequestSubmissionTime: BigInt(event.block.timestamp),
        numberOfRequests: item.numberOfRequests + ONE,
      });
    }

    const requestID =
      graphItemID + "-" + (itemInfo.numberOfRequests - ONE).toString();

    const roundID = requestID + "-0";
    // Note that everything related to the deposit (e.g. contribution creation)
    // is handled in handleContribution.
    const round = buildNewClassicRound(
      roundID,
      requestID,
      event.block.timestamp
    );

    const isRegistration =
      getStatus(itemInfo.status) === REGISTRATION_REQUESTED;

    const amountPaidRequester = isRegistration
      ? submissionBaseDeposit + arbitrationCost
      : removalBaseDeposit + arbitrationCost;

    const request: Request = {
      id: requestID,
      disputed: false,
      arbitrator: requestInfo.requestArbitrator.toLowerCase(),
      arbitratorExtraData: requestInfo.requestArbitratorExtraData,
      challenger: ZERO_ADDRESS,
      requester: requestInfo.parties.requester.toLowerCase(),
      item_id: graphItemID,
      registry_id: registry.id,
      registryAddress: event.srcAddress.toLowerCase(),
      resolutionTime: ZERO,
      disputeOutcome: NONE,
      resolved: false,
      disputeID: ZERO,
      submissionTime: BigInt(event.block.timestamp),
      numberOfRounds: ONE,
      requestType: getStatus(itemInfo.status),
      creationTx: event.transaction.hash.toLowerCase(),
      evidenceGroup_id: evidenceGroup.id,
      deposit: isRegistration ? submissionBaseDeposit : removalBaseDeposit,
      metaEvidence_id: isRegistration
        ? registry.registrationMetaEvidence_id
        : registry.clearingMetaEvidence_id,
      finalRuling: undefined,
      resolutionTx: undefined,
    };

    context.Round.set({
      ...round,
      amountPaidRequester,
      feeRewards: amountPaidRequester,
      hasPaidRequester: true,
    });
    context.Request.set(request);
  },
  handler: async ({ event, context, loaderReturn }) => {},
});
