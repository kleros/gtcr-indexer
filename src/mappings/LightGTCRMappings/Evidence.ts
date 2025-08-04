import { Evidence, LightGeneralizedTCR } from "generated";
import { ONE, ZERO } from "../../utils";

LightGeneralizedTCR.Evidence.handlerWithLoader({
  loader: async ({ event, context }) => {
    const evidenceGroupID =
      event.params._evidenceGroupID.toString() + "@" + event.srcAddress;

    const evidenceGroup = await context.EvidenceGroup.getOrCreate({
      id: evidenceGroupID,
      numberOfEvidence: ZERO,
    });

    const evidence: Evidence = {
      id: evidenceGroupID + "-" + evidenceGroup.numberOfEvidence.toString(),
      arbitrator: event.params._arbitrator,
      party: event.params._party,
      uri: event.params._evidence,
      number: evidenceGroup.numberOfEvidence,
      timestamp: BigInt(event.block.timestamp),
      txHash: event.transaction.hash,
      evidenceGroup_id: evidenceGroup.id,
    };

    context.EvidenceGroup.set({
      ...evidenceGroup,
      numberOfEvidence: evidenceGroup.numberOfEvidence + ONE,
    });
    context.Evidence.set(evidence);

    // TODO: ipfs fetching
  },

  handler: async ({ event, context, loaderReturn }) => {},
});
