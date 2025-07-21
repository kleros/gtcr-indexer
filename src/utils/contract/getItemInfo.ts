import { getClient } from "../client";
import { getLGTCRContract } from "./contracts";
import { experimental_createEffect, S } from "envio";

export const getItemInfo = experimental_createEffect(
  {
    name: "getItemInfo",
    input: {
      contractAddress: S.string,
      chainId: S.number,
      blockNumber: S.number,
      itemID: S.string,
    },
    output: {
      status: S.number,
      numberOfRequests: S.bigint,
      sumDeposit: S.bigint,
    },
  },
  async ({ input, context }) => {
    const { contractAddress, chainId, blockNumber, itemID } = input;
    const lgtcr = getLGTCRContract(contractAddress);
    const client = getClient(chainId);

    // status, numberOfRequests, sumDeposit
    let results: readonly [number, bigint, bigint];
    try {
      results = await client.readContract({
        ...lgtcr,
        functionName: "getItemInfo",
        blockNumber: BigInt(blockNumber),
        args: [itemID as `0x${string}`],
      });
    } catch (error) {
      context.log.error(`Error fetching item info: ${itemID}, ${error}`);
      results = [0, 0n, 0n];
    }

    const [status, numberOfRequests, sumDeposit] = results;

    return { status, numberOfRequests, sumDeposit } as const;
  }
);
