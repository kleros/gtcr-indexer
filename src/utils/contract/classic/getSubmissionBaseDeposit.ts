import { experimental_createEffect, S } from "envio";
import { getGTCRContract } from "../contracts";
import { getClient } from "../../client";

export const getSubmissionBaseDeposit = experimental_createEffect(
  {
    name: "Classic-submissionBaseDeposit",
    input: {
      contractAddress: S.string,
      chainId: S.number,
      blockNumber: S.number,
    },
    output: S.bigint,
    cache: true,
  },
  async ({ input, context }) => {
    const { contractAddress, chainId, blockNumber } = input;
    const gtcr = getGTCRContract(contractAddress);
    const client = getClient(chainId);

    let result: bigint;
    try {
      result = await client.readContract({
        ...gtcr,
        functionName: "submissionBaseDeposit",
        blockNumber: BigInt(blockNumber),
      });
    } catch (error) {
      context.log.error(
        `Error fetching Classic submissionBaseDeposit info:, ${error}`
      );
      result = 0n;
    }

    return result;
  }
);
