import { ZERO_ADDRESS } from "..";
import { getClient } from "../client";
import { getLGTCRContract } from "./contracts";
import { experimental_createEffect, S } from "envio";

export const arbitratorDisputeIDToItemID = experimental_createEffect(
  {
    name: "arbitratorDisputeIDToItemID",
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
    const lgtcr = getLGTCRContract(contractAddress);
    const client = getClient(chainId);

    // itemID
    let result: `0x${string}`;
    try {
      result = await client.readContract({
        ...lgtcr,
        functionName: "arbitratorDisputeIDToItemID",
        blockNumber: BigInt(blockNumber),
        args: [arbitrator as `0x${string}`, disputeID],
      });
    } catch (error) {
      context.log.error(
        `Error fetching itemID from disputeID info: ${arbitrator}-${disputeID}, ${error}`
      );
      result = ZERO_ADDRESS;
    }

    return result;
  }
);
