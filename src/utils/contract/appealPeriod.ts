import { ZERO } from "..";
import { getClient } from "../client";
import { getArbitratorContract } from "./contracts";
import { experimental_createEffect, S } from "envio";

export const appealPeriod = experimental_createEffect(
  {
    name: "appealPeriod",
    input: {
      contractAddress: S.string,
      chainId: S.number,
      blockNumber: S.number,
      disputeID: S.bigint,
    },
    output: {
      appealPeriodStart: S.bigint,
      appealPeriodEnd: S.bigint,
    },
    cache: true,
  },
  async ({ input, context }) => {
    const { contractAddress, chainId, blockNumber, disputeID } = input;
    const arbitrator = getArbitratorContract(contractAddress);
    const client = getClient(chainId);

    // appealPeriodStart, appealPeriodEnd
    let result: readonly [bigint, bigint];
    try {
      result = await client.readContract({
        ...arbitrator,
        functionName: "appealPeriod",
        blockNumber: BigInt(blockNumber),
        args: [disputeID],
      });
    } catch (error) {
      context.log.error(
        `Error fetching appealPeriod details from arbitrator : ${contractAddress} disputeID: ${disputeID}, ${error}`
      );
      result = [ZERO, ZERO];
    }
    const [appealPeriodStart, appealPeriodEnd] = result;

    return {
      appealPeriodStart,
      appealPeriodEnd,
    };
  }
);
