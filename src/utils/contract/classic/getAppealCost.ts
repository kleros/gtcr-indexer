import { experimental_createEffect, S } from "envio";
import { getArbitratorContract } from "../contracts";
import { getClient } from "../../client";
import { ZERO } from "../..";

export const getAppealCost = experimental_createEffect(
  {
    name: "Classic-appealCost",
    input: {
      contractAddress: S.string,
      chainId: S.number,
      blockNumber: S.number,
      disputeID: S.bigint,
      arbitratorExtraData: S.string,
    },
    output: S.bigint,
    cache: true,
  },
  async ({ input, context }) => {
    const {
      contractAddress,
      chainId,
      blockNumber,
      arbitratorExtraData,
      disputeID,
    } = input;
    const contract = getArbitratorContract(contractAddress);
    const client = getClient(chainId);

    // appealCost
    let result: bigint;
    try {
      result = await client.readContract({
        ...contract,
        functionName: "appealCost",
        blockNumber: BigInt(blockNumber),
        args: [disputeID, arbitratorExtraData as `0x${string}`],
      });
    } catch (error) {
      context.log.error(
        `Error fetching Classic appealCost: ${arbitratorExtraData}-${disputeID}, ${error}`
      );
      result = ZERO;
    }

    return result;
  }
);
