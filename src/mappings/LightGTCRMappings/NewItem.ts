import { LightGeneralizedTCR, LItem, Status } from "generated";
import { getStatus, ZERO, ZERO_ADDRESS } from "../../utils";
import { getItemInfo } from "../../utils/contract/getItemInfo";

LightGeneralizedTCR.NewItem.handlerWithLoader({
  loader: async ({ event, context }) => {
    const registry = await context.LRegistry.get(event.srcAddress);

    const itemInfo = await context.effect(getItemInfo, {
      contractAddress: event.srcAddress,
      chainId: event.chainId,
      blockNumber: event.block.number,
      itemID: event.params._itemID,
    });
    return {
      registry,
      itemInfo,
    };
  },
  handler: async ({ event, context, loaderReturn }) => {
    // We assume this is an item added via addItemDirectly and care
    // only about saving the item json data.
    // If it was emitted via addItem, all the missing/wrong data regarding
    // things like submission time, arbitrator and deposit will be set in
    // handleRequestSubmitted.
    //
    // Accounting for items added or removed directly is done
    // inside handleStatusUpdated.
    const graphItemID = event.params._itemID + "@" + event.srcAddress;
    const { registry, itemInfo } = loaderReturn;

    if (!registry) {
      console.error(`LRegistry {} not found`, [event.srcAddress]);
      return;
    }

    const LItem: LItem = {
      id: graphItemID,
      itemID: event.params._itemID,
      data: event.params._data,
      numberOfRequests: ZERO,
      registry_id: event.srcAddress,
      registryAddress: event.srcAddress,
      disputed: false,
      status: getStatus(itemInfo.status),
      latestRequester: ZERO_ADDRESS,
      latestChallenger: ZERO_ADDRESS,
      latestRequestSubmissionTime: ZERO,
      latestRequestResolutionTime: ZERO,
      metadata_id: event.params._itemID,
    };

    // TODO : fetch item ipfs info

    context.LItem.set(LItem);
  },
});
