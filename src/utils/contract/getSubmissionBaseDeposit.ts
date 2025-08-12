import { getClient } from "../client";
import { getGTCRContract, getLGTCRContract } from "./contracts";
import { experimental_createEffect, S } from "envio";

export const getSubmissionBaseDeposit = experimental_createEffect(
  {
    name: "submissionBaseDeposit",
    input: {
      contractAddress: S.string,
      chainId: S.number,
      blockNumber: S.number,
      isClassic: S.optional(S.boolean),
    },
    output: S.bigint,
    cache: true,
  },
  async ({ input, context }) => {
    const { contractAddress, chainId, blockNumber, isClassic } = input;
    const contract = isClassic
      ? getGTCRContract(contractAddress)
      : getLGTCRContract(contractAddress);
    const client = getClient(chainId);

    let result: bigint;
    try {
      result = await client.readContract({
        address: contract.address,
        abi: contract.abi,
        functionName: "submissionBaseDeposit",
        blockNumber: BigInt(blockNumber),
      });
    } catch (error) {
      context.log.error(`Error fetching submissionBaseDeposit info:, ${error}`);
      result = 0n;
    }

    return result;
  }
);
