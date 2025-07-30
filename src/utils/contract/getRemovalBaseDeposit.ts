import { getClient } from "../client";
import { getLGTCRContract } from "./contracts";
import { experimental_createEffect, S } from "envio";

export const getRemovalBaseDeposit = experimental_createEffect(
  {
    name: "removalBaseDeposit",
    input: {
      contractAddress: S.string,
      chainId: S.number,
      blockNumber: S.number,
    },
    output: S.bigint,
  },
  async ({ input, context }) => {
    const { contractAddress, chainId, blockNumber } = input;
    const lgtcr = getLGTCRContract(contractAddress);
    const client = getClient(chainId);

    let result: bigint;
    try {
      result = await client.readContract({
        ...lgtcr,
        functionName: "removalBaseDeposit",
        blockNumber: BigInt(blockNumber),
      });
    } catch (error) {
      context.log.error(`Error fetching removalBaseDeposit info:, ${error}`);
      result = 0n;
    }

    return result;
  }
);
