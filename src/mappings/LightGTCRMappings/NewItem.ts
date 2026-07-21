import { indexer, ItemProp, LightGeneralizedTCR, LItem } from "envio";
import {
  extractPath,
  JSONValueToBool,
  JSONValueToMaybeString,
  ZERO,
  ZERO_ADDRESS,
} from "../../utils";
import { fetchItemData } from "../../utils/ipfs/fetchItemData";

// We assume this is an item added via addItemDirectly and care
// only about saving the item json data.
// If it was emitted via addItem, all the missing/wrong data regarding
// things like submission time, arbitrator and deposit will be set in
// handleRequestSubmitted.
//
// Accounting for items added or removed directly is done
// inside handleStatusUpdated.
indexer.onEvent(
  { contract: "LightGeneralizedTCR", event: "NewItem" },
  async ({ event, context }) => {
    const loaderReturn = await (async ({ event, context }) => {
    const ipfsHash = extractPath(event.params._data);

    const [registry, itemMetadata] = await Promise.all([
      context.LRegistry.get(event.srcAddress.toLowerCase()),
      context.effect(fetchItemData, { ipfsHash }),
    ]);

    if (!registry) {
      context.log.error(`LRegistry ${event.srcAddress} not found`);
      return;
    }

    const graphItemID =
      event.params._itemID + "@" + event.srcAddress.toLowerCase();

    const item: LItem = {
      id: graphItemID,
      chainId: event.chainId,
      itemID: event.params._itemID,
      data: event.params._data,
      numberOfRequests: ZERO,
      registry_id: registry.id,
      registryAddress: event.srcAddress.toLowerCase(),
      disputed: false,
      status: "Absent",
      latestRequester: ZERO_ADDRESS,
      latestChallenger: ZERO_ADDRESS,
      latestRequestSubmissionTime: ZERO,
      latestRequestResolutionTime: ZERO,
      key0: undefined,
      key1: undefined,
      key2: undefined,
      key3: undefined,
      key4: undefined,
      keywords: event.srcAddress.toLowerCase(),
    };

    if (!itemMetadata) {
      context.LItem.set(item);
      return;
    }

    // fetch item ipfs info
    const columns = itemMetadata.columns;
    const values = itemMetadata.values;

    let identifier = 0;
    let keywords = item.keywords;
    let key0, key1, key2, key3, key4;

    for (let i = 0; i < columns.length; i++) {
      let col = columns[i];

      let label = col.label;

      // We must account for items with missing fields.
      let checkedLabel = label
        ? label.toString()
        : "missing-label".concat(i.toString());

      let itemProp: ItemProp = {
        id: graphItemID + "@" + checkedLabel,
        label: JSONValueToMaybeString(label),
        value: JSONValueToMaybeString(values?.[checkedLabel]),
        itemType: JSONValueToMaybeString(col.type),
        description: JSONValueToMaybeString(col.description),
        isIdentifier: JSONValueToBool(col.isIdentifier),
        item_id: item.id,
      };

      if (itemProp.isIdentifier) {
        if (identifier == 0) key0 = itemProp.value;
        else if (identifier == 1) key1 = itemProp.value;
        else if (identifier == 2) key2 = itemProp.value;
        else if (identifier == 3) key3 = itemProp.value;
        else if (identifier == 4) key4 = itemProp.value;
        identifier += 1;
      }

      if (itemProp.isIdentifier && itemProp.value != null && item.keywords) {
        keywords = (keywords as string) + " | " + (itemProp.value as string);
      }

      context.ItemProp.set(itemProp);
    }

    context.LItem.set({ ...item, key0, key1, key2, key3, key4, keywords });
  })({ event, context });

  }
);
