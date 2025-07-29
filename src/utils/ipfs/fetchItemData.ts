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

export const fetchItemData = experimental_createEffect(
  {
    name: "fetchItemData",
    input: {
      ipfsHash: S.string,
    },
    output: S.nullable(itemMetadataSchema),
  },
  async ({ input, context }) => {
    const { ipfsHash } = input;

    try {
      const metadata = await tryFetchIpfsFile(ipfsHash, context);

      S.assertOrThrow(metadata, itemMetadataSchema);

      return metadata;
    } catch (err) {
      if (err instanceof Error) {
        context.log.error(`Error fetching Item Metadata: ${err.message}`);
      }
      return;
    }
  }
);
