import { LRound, Round } from "generated";
import { NONE, ZERO } from "../../utils";

export function buildNewRound(
  roundID: string,
  requestID: string,
  timestamp: number
): LRound {
  return {
    id: roundID,
    request_id: requestID,
    amountPaidChallenger: ZERO,
    amountPaidRequester: ZERO,
    feeRewards: ZERO,
    hasPaidChallenger: false,
    hasPaidRequester: false,
    lastFundedRequester: ZERO,
    lastFundedChallenger: ZERO,
    appealPeriodStart: ZERO,
    appealPeriodEnd: ZERO,
    rulingTime: ZERO,
    ruling: NONE,
    creationTime: BigInt(timestamp),
    numberOfContributions: ZERO,
    appealed: false,
    appealedAt: undefined,
    txHashAppealDecision: undefined,
    txHashAppealPossible: undefined,
  };
}

export function buildNewClassicRound(
  roundID: string,
  requestId: string,
  timestamp: number
): Round {
  return {
    id: roundID,
    amountPaidRequester: ZERO,
    amountPaidChallenger: ZERO,
    feeRewards: ZERO,
    hasPaidRequester: false,
    hasPaidChallenger: false,
    request_id: requestId,
    appealPeriodStart: ZERO,
    appealPeriodEnd: ZERO,
    rulingTime: ZERO,
    ruling: NONE,
    creationTime: BigInt(timestamp),
    appealed: false,
    appealedAt: undefined,
    txHashAppealDecision: undefined,
    txHashAppealPossible: undefined,
  };
}
