import { contractRegistrations } from "generated";
import { getGTCRContract } from "../contracts";
import { getClient } from "../../client";
import { ZERO_ADDRESS } from "../..";

export const getArbitratorClassic = async ({
  input,
  context,
}: {
  input: { contractAddress: string; chainId: number; blockNumber: number };
  context: contractRegistrations;
}) => {
  const { contractAddress, chainId, blockNumber } = input;
  const gtcr = getGTCRContract(contractAddress);
  const client = getClient(chainId);

  // arbitrator
  let result: `0x${string}`;
  try {
    result = await client.readContract({
      ...gtcr,
      functionName: "arbitrator",
      blockNumber: BigInt(blockNumber),
    });
  } catch (error) {
    context.log.error(
      `Error fetching arbitrator classic info: ${contractAddress}, ${error}`
    );
    result = ZERO_ADDRESS;
  }

  return result;
};
