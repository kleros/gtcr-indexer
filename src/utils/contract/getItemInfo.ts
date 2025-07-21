import { erc20Abi } from "viem";
import { getClient } from "../client";
import { getLGTCRContract } from "./contracts";

export const getItemInfo = async (
  contractAddress: string,
  chainId: number,
  blockNumber: number,
  itemID: string
) => {
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
    console.error(`Error fetching item info: ${itemID}, ${error}`);
    results = [0, 0n, 0n];
  }

  const [status, numberOfRequests, sumDeposit] = results;

  return { status, numberOfRequests, sumDeposit } as const;
};
