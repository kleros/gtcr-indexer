import { getClient } from "../client";
import { getLGTCRContract } from "./contracts";
import { experimental_createEffect, S } from "envio";

export const getRoundInfo = experimental_createEffect(
  {
    name: "getRoundInfo",
    input: {
      contractAddress: S.string,
      chainId: S.number,
      blockNumber: S.number,
      itemID: S.string,
      requestID: S.bigint,
      roundID: S.bigint,
    },
    output: {
      appealed: S.boolean,
      amountPaid: {
        requester: S.bigint,
        challenger: S.bigint,
      },
      hasPaid: {
        requester: S.boolean,
        challenger: S.boolean,
      },
      feeRewards: S.bigint,
    },
    cache: true,
  },
  async ({ input, context }) => {
    const {
      contractAddress,
      chainId,
      blockNumber,
      itemID,
      requestID,
      roundID,
    } = input;
    const lgtcr = getLGTCRContract(contractAddress);
    const client = getClient(chainId);

    // appealed, amountPaid, hasPaid, feeRewards
    let results: readonly [
      boolean,
      readonly [bigint, bigint, bigint],
      readonly [boolean, boolean, boolean],
      bigint
    ];
    try {
      results = await client.readContract({
        ...lgtcr,
        functionName: "getRoundInfo",
        blockNumber: BigInt(blockNumber),
        args: [itemID as `0x${string}`, requestID, roundID],
      });
    } catch (error) {
      context.log.error(
        `Error fetching round info: ${itemID}-${requestID}-${roundID}, ${error}`
      );
      results = [false, [0n, 0n, 0n], [false, false, false], 0n];
    }

    const [appealed, amountPaid, hasPaid, feeRewards] = results;

    return {
      appealed,
      amountPaid: {
        requester: amountPaid[1],
        challenger: amountPaid[2],
      },
      hasPaid: {
        requester: hasPaid[1],
        challenger: hasPaid[2],
      },
      feeRewards,
    } as const;
  }
);
