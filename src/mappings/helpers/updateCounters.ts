import { handlerContext, LRegistry } from "generated";
import {
  ABSENT_CODE,
  CHALLENGED_CLEARING_REQUEST_CODE,
  CHALLENGED_REGISTRATION_REQUEST_CODE,
  CLEARING_REQUESTED_CODE,
  ONE,
  REGISTERED_CODE,
  REGISTRATION_REQUESTED_CODE,
} from "../../utils";

/**
 * Decrements and increments registry counters based on item status change.
 *
 * The user should ensure that this function is called once and only once for
 * each status update. What handlers were called before and which will be called
 * after the one this is being called on? Do they call updateCounters?
 * @param previousStatus The previous extended status of the item.
 * @param newStatus The new extended status of the item.
 * @param registry The registry to which update the counters.
 */
export async function updateCounters(
  previousStatus: number,
  newStatus: number,
  registry: LRegistry,
  context: handlerContext
) {
  if (!registry) {
    return;
  }

  type Key =
    | "numberOfAbsent"
    | "numberOfRegistered"
    | "numberOfRegistrationRequested"
    | "numberOfClearingRequested"
    | "numberOfChallengedRegistrations"
    | "numberOfChallengedClearing";
  let decrementKey: Key = "numberOfAbsent";
  if (previousStatus == ABSENT_CODE) {
    decrementKey = "numberOfAbsent";
  } else if (previousStatus == REGISTERED_CODE) {
    decrementKey = "numberOfRegistered";
  } else if (previousStatus == REGISTRATION_REQUESTED_CODE) {
    decrementKey = "numberOfRegistrationRequested";
  } else if (previousStatus == CLEARING_REQUESTED_CODE) {
    decrementKey = "numberOfClearingRequested";
  } else if (previousStatus == CHALLENGED_REGISTRATION_REQUEST_CODE) {
    decrementKey = "numberOfChallengedRegistrations";
  } else if (previousStatus == CHALLENGED_CLEARING_REQUEST_CODE) {
    decrementKey = "numberOfChallengedClearing";
  }

  let incrementKey: Key = "numberOfAbsent";
  if (newStatus == ABSENT_CODE) {
    incrementKey = "numberOfAbsent";
  } else if (newStatus == REGISTERED_CODE) {
    incrementKey = "numberOfRegistered";
  } else if (newStatus == REGISTRATION_REQUESTED_CODE) {
    incrementKey = "numberOfRegistrationRequested";
  } else if (newStatus == CLEARING_REQUESTED_CODE) {
    incrementKey = "numberOfClearingRequested";
  } else if (newStatus == CHALLENGED_REGISTRATION_REQUEST_CODE) {
    incrementKey = "numberOfChallengedRegistrations";
  } else if (newStatus == CHALLENGED_CLEARING_REQUEST_CODE) {
    incrementKey = "numberOfChallengedClearing";
  }

  context.LRegistry.set({
    ...registry,
    [decrementKey]: registry[decrementKey] - ONE,
    [incrementKey]: registry[incrementKey] + ONE,
  });
}
