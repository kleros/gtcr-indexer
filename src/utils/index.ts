/**
 * @description extracts the cid from ipfs strings starting with "/", "/ipfs", "ipfs/", or "ipfs::/"
 * @param inputString the ipfs string
 * @returns returns the cid with path to file
 */
export function extractPath(inputString: string): string {
  if (inputString.startsWith("ipfs/")) return inputString.replace("ipfs/", "");

  if (inputString.startsWith("/ipfs/"))
    return inputString.replace("/ipfs/", "");

  if (inputString.startsWith("/")) return inputString.replace("/", "");

  if (inputString.startsWith("ipfs::/"))
    return inputString.replace("ipfs::/", "");

  return inputString;
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function JSONValueToMaybeString(
  value: any,
  _default: string = "-"
): string {
  // Subgraph considers an empty string to be null and
  // the handler crashes when attempting to save the entity.
  // This is a security vulnerability because an adversary
  // could manually craft an item with missing columns
  // and the item would not show up in the UI, passing
  // the challenge period unoticed.
  //
  // We fix this by setting the field manually to a hifen.
  if (value == null || value === null) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }

  return _default;
}

export function JSONValueToBool(
  value: any,
  _default: boolean = false
): boolean {
  if (value == null || value === null) {
    return _default;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return value !== 0;
  }

  return _default;
}

export const ZERO = 0n;

// Status constants
export const ABSENT = "Absent";
export const REGISTERED = "Registered";
export const REGISTRATION_REQUESTED = "RegistrationRequested";
export const CLEARING_REQUESTED = "ClearingRequested";

// Ruling constants
export const NONE = "None";
export const ACCEPT = "Accept";
export const REJECT = "Reject";

// Ruling codes
export const NO_RULING_CODE = 0;
export const REQUESTER_CODE = 1;
export const CHALLENGER_CODE = 2;

// Status codes
export const ABSENT_CODE = 0;
export const REGISTERED_CODE = 1;
export const REGISTRATION_REQUESTED_CODE = 2;
export const CLEARING_REQUESTED_CODE = 3;
export const CHALLENGED_REGISTRATION_REQUEST_CODE = 4;
export const CHALLENGED_CLEARING_REQUEST_CODE = 5;

export const CONTRACT_STATUS_EXTENDED = new Map<string, number>([
  [ABSENT, ABSENT_CODE],
  [REGISTERED, REGISTERED_CODE],
  [REGISTRATION_REQUESTED, REGISTRATION_REQUESTED_CODE],
  [CLEARING_REQUESTED, CLEARING_REQUESTED_CODE],
]);

export const CONTRACT_STATUS_NAMES = new Map<number, string>([
  [ABSENT_CODE, "Absent"],
  [REGISTERED_CODE, "Registered"],
  [REGISTRATION_REQUESTED_CODE, "RegistrationRequested"],
  [CLEARING_REQUESTED_CODE, "ClearingRequested"],
]);

export function getExtendedStatus(disputed: boolean, status: string): number {
  if (disputed) {
    if (status === CONTRACT_STATUS_NAMES.get(REGISTRATION_REQUESTED_CODE))
      return CHALLENGED_REGISTRATION_REQUEST_CODE;
    else return CHALLENGED_CLEARING_REQUEST_CODE;
  }

  return CONTRACT_STATUS_EXTENDED.get(status) || 0;
}

/**
 * @description Takes in a number representing the item status in contract and returns a human readable status
 */
export function getStatus(index: number) {
  const statusArray = [
    "Absent",
    "Registered",
    "RegistrationRequested",
    "ClearingRequested",
  ] as const;
  return statusArray.at(index) || "None";
}

export function getFinalRuling(outcome: number): string {
  if (outcome === 0) return NONE;
  if (outcome === 1) return ACCEPT;
  if (outcome === 2) return REJECT;
  return "Error";
}
