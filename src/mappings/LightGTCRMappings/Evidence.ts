import { Evidence, LightGeneralizedTCR } from "generated";
import { extractPath, ONE, ZERO } from "../../utils";
import { fetchEvidenceData } from "../../utils/ipfs/fetchEvidenceData";

LightGeneralizedTCR.Evidence.handlerWithLoader({
  loader: async ({ event, context }) => {
    const evidenceGroupID =
      event.params._evidenceGroupID.toString() + "@" + event.srcAddress;

    const ipfsHash = extractPath(event.params._evidence);

    const [evidenceGroup, evidenceData] = await Promise.all([
      context.EvidenceGroup.getOrCreate({
        id: evidenceGroupID,
        numberOfEvidence: ZERO,
      }),
      context.effect(fetchEvidenceData, { ipfsHash }),
    ]);

    const evidence: Evidence = {
      id: evidenceGroupID + "-" + evidenceGroup.numberOfEvidence.toString(),
      arbitrator: event.params._arbitrator,
      party: event.params._party,
      uri: event.params._evidence,
      number: evidenceGroup.numberOfEvidence,
      timestamp: BigInt(event.block.timestamp),
      txHash: event.transaction.hash,
      evidenceGroup_id: evidenceGroup.id,
      title: evidenceData?.title,
      name: evidenceData?.name,
      description: evidenceData?.description,
      fileURI: evidenceData?.fileURI,
      fileTypeExtension: evidenceData?.fileTypeExtension,
    };

    context.EvidenceGroup.set({
      ...evidenceGroup,
      numberOfEvidence: evidenceGroup.numberOfEvidence + ONE,
    });
    context.Evidence.set(evidence);
  },
  handler: async ({ event, context, loaderReturn }) => {},
});
