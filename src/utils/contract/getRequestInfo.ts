import { Address } from "viem";
import { ZERO_ADDRESS } from "..";
import { getClient } from "../client";
import { getLGTCRContract } from "./contracts";
import { experimental_createEffect, S } from "envio";

export const getRequestInfo = experimental_createEffect(
  {
    name: "getRequestInfo",
    input: {
      contractAddress: S.string,
      chainId: S.number,
      blockNumber: S.number,
      itemID: S.string,
      requestIndex: S.bigint,
    },
    output: {
      disputed: S.boolean,
      disputeID: S.bigint,
      submissionTime: S.bigint,
      resolved: S.boolean,
      parties: {
        requester: S.string,
        challenger: S.string,
      },
      numberOfRounds: S.bigint,
      ruling: S.number,
      requestArbitrator: S.string,
      requestArbitratorExtraData: S.string,
      metaEvidenceID: S.bigint,
    },
    cache: true,
  },
  async ({ input, context }) => {
    const { contractAddress, chainId, blockNumber, itemID, requestIndex } =
      input;
    const lgtcr = getLGTCRContract(contractAddress);
    const client = getClient(chainId);

    // disputed, disputeID, submissionTime, resolved, parties, numberOfRounds, ruling, requestArbitrator, requestArbitratorExtraData, metaEvidenceID
    let results: readonly [
      boolean,
      bigint,
      bigint,
      boolean,
      readonly [string, string, string],
      bigint,
      number,
      string,
      string,
      bigint
    ];
    try {
      results = await client.readContract({
        ...lgtcr,
        functionName: "getRequestInfo",
        blockNumber: BigInt(blockNumber),
        args: [itemID as `0x${string}`, requestIndex],
      });
    } catch (error) {
      context.log.error(
        `Error fetching request info: ${itemID}-${requestIndex}, ${error}`
      );
      results = [
        false,
        0n,
        0n,
        false,
        [ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
        0n,
        0,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        0n,
      ];
    }

    const [
      disputed,
      disputeID,
      submissionTime,
      resolved,
      parties,
      numberOfRounds,
      ruling,
      requestArbitrator,
      requestArbitratorExtraData,
      metaEvidenceID,
    ] = results;

    return {
      disputed,
      disputeID,
      submissionTime,
      resolved,
      parties: {
        requester: parties[1] as Address,
        challenger: parties[2] as Address,
      },
      numberOfRounds,
      ruling,
      requestArbitrator,
      requestArbitratorExtraData,
      metaEvidenceID,
    } as const;
  }
);
