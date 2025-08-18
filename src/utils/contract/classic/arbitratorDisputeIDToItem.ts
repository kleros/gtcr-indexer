import { experimental_createEffect, S } from "envio";
import { getGTCRContract } from "../contracts";
import { getClient } from "../../client";
import { ZERO_ADDRESS } from "../..";

export const arbitratorDisputeIDToItem = experimental_createEffect(
  {
    name: "Classic-arbitratorDisputeIDToItem",
    input: {
      contractAddress: S.string,
      chainId: S.number,
      blockNumber: S.number,
      arbitrator: S.string,
      disputeID: S.bigint,
    },
    output: S.string,
    cache: true,
  },
  async ({ input, context }) => {
    const { contractAddress, chainId, blockNumber, arbitrator, disputeID } =
      input;
    const gtcr = getGTCRContract(contractAddress);
    const client = getClient(chainId);

    // itemID
    let result: `0x${string}`;
    try {
      result = await client.readContract({
        ...gtcr,
        functionName: "arbitratorDisputeIDToItem",
        blockNumber: BigInt(blockNumber),
        args: [arbitrator as `0x${string}`, disputeID],
      });
    } catch (error) {
      context.log.error(
        `Error fetching Classic itemID from disputeID info: ${arbitrator}-${disputeID}, ${error}`
      );
      result = ZERO_ADDRESS;
    }

    return result;
  }
);
