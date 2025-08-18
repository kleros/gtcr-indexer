import { experimental_createEffect, S } from "envio";
import { tryFetchIpfsFile } from ".";

const itemMetadataSchema = S.schema({
  columns: S.array(
    S.schema({
      label: S.string,
      description: S.string,
      isIdentifier: S.optional(S.boolean),
      type: S.string,
    })
  ),
  values: S.record(S.string),
});

/**
 * Fetches Item's data from ipfs uri provided
 * @param ipfsHash CID of the ipfs file
 * @example uri https://ipfs.io/ipfs/QmS6iwbxLzCUZuMiRxjpbeAuZUU4BkfXaf6knvXVKJtMK4/item.json
 */
export const fetchItemData = experimental_createEffect(
  {
    name: "fetchItemData",
    input: {
      ipfsHash: S.string,
    },
    output: S.union([itemMetadataSchema, null]),
    cache: true,
  },
  async ({ input, context }) => {
    const { ipfsHash } = input;

    try {
      const metadata = await tryFetchIpfsFile(ipfsHash, context);

      const parsed = S.parseOrThrow(metadata, itemMetadataSchema);

      return parsed;
    } catch (err) {
      if (err instanceof Error) {
        context.log.error(`Error fetching Item Metadata: ${err.message}`);
      }
      return null;
    }
  }
);
