import { ZERO } from "..";
import { getClient } from "../client";
import { getArbitratorContract } from "./contracts";
import { experimental_createEffect, S } from "envio";

export const currentRuling = experimental_createEffect(
  {
    name: "currentRuling",
    input: {
      contractAddress: S.string,
      chainId: S.number,
      blockNumber: S.number,
      disputeID: S.bigint,
    },
    output: S.bigint,
    cache: true,
  },
  async ({ input, context }) => {
    const { contractAddress, chainId, blockNumber, disputeID } = input;
    const arbitrator = getArbitratorContract(contractAddress);
    const client = getClient(chainId);

    // ruling
    let result: bigint;
    try {
      result = await client.readContract({
        ...arbitrator,
        functionName: "currentRuling",
        blockNumber: BigInt(blockNumber),
        args: [disputeID],
      });
    } catch (error) {
      context.log.error(
        `Error fetching currentRuling details from arbitrator : ${contractAddress}, disputeID: ${disputeID}, ${error}`
      );
      result = ZERO;
    }

    return result;
  }
);
