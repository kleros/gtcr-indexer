import { contractRegistrations } from "generated";
import { ZERO_ADDRESS } from "..";
import { getClient } from "../client";
import { getLGTCRContract } from "./contracts";

export const getArbitrator = async ({
  input,
  context,
}: {
  input: { contractAddress: string; chainId: number; blockNumber: number };
  context: contractRegistrations;
}) => {
  const { contractAddress, chainId, blockNumber } = input;
  const lgtcr = getLGTCRContract(contractAddress);
  const client = getClient(chainId);

  // arbitrator
  let result: `0x${string}`;
  try {
    result = await client.readContract({
      ...lgtcr,
      functionName: "arbitrator",
      blockNumber: BigInt(blockNumber),
    });
  } catch (error) {
    context.log.error(
      `Error fetching arbitrator info: ${contractAddress}, ${error}`
    );
    result = ZERO_ADDRESS;
  }

  return result;
};
