import { experimental_createEffect, S } from "envio";
import { getGTCRContract } from "../contracts";
import { getClient } from "../../client";
import { ZERO_ADDRESS } from "../..";

export const getItemInfo = experimental_createEffect(
  {
    name: "getClassicItemInfo",
    input: {
      contractAddress: S.string,
      chainId: S.number,
      blockNumber: S.number,
      itemID: S.string,
    },
    output: {
      data: S.string,
      status: S.number,
      numberOfRequests: S.bigint,
    },
    cache: true,
  },
  async ({ input, context }) => {
    const { contractAddress, chainId, blockNumber, itemID } = input;
    const gtcr = getGTCRContract(contractAddress);
    const client = getClient(chainId);

    // data, status, numberOfRequests
    let results: readonly [`0x${string}`, number, bigint];
    try {
      results = await client.readContract({
        ...gtcr,
        functionName: "getItemInfo",
        blockNumber: BigInt(blockNumber),
        args: [itemID as `0x${string}`],
      });
    } catch (error) {
      context.log.error(
        `Error fetching classic item info: ${itemID}, ${error}`
      );
      results = [ZERO_ADDRESS, 0, 0n];
    }

    const [data, status, numberOfRequests] = results;

    return { data, status, numberOfRequests } as const;
  }
);
