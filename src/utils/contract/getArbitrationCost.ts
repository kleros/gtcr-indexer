import { ZERO } from "..";
import { getClient } from "../client";
import { getArbitratorContract } from "./contracts";
import { experimental_createEffect, S } from "envio";

export const getArbitrationCost = experimental_createEffect(
  {
    name: "arbitrationCost",
    input: {
      contractAddress: S.string,
      chainId: S.number,
      blockNumber: S.number,
      extraData: S.string,
    },
    output: S.bigint,
    cache: true,
  },
  async ({ input, context }) => {
    const { contractAddress, chainId, blockNumber, extraData } = input;
    const arbitrator = getArbitratorContract(contractAddress);
    const client = getClient(chainId);

    // arbitrationCost
    let result: bigint;
    try {
      result = await client.readContract({
        ...arbitrator,
        functionName: "arbitrationCost",
        blockNumber: BigInt(blockNumber),
        args: [extraData as `0x${string}`],
      });
    } catch (error) {
      context.log.error(
        `Error fetching arbitration cost details from arbitrator : ${contractAddress}, ${error}`
      );
      result = ZERO;
    }

    return result;
  }
);
