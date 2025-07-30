import { EffectContext } from "envio";
import axios from "axios";
async function fetchFromEndpoint(
  endpoint: string,
  ipfsHash: string,
  context: EffectContext
): Promise<JSON | null> {
  try {
    const response = await axios.get(`${endpoint}/${ipfsHash}`, {
      timeout: 20_000,
    });

    if (response.data) {
      const metadata: any = response.data;
      context.log.info(metadata);
      return metadata;
    } else {
      throw new Error("Unable to fetch from endpoint");
    }
  } catch (e) {
    context.log.warn(`Unable to fetch from ${endpoint}/${ipfsHash} : ${e}`);
  }
  return null;
}

export async function tryFetchIpfsFile(
  tokenId: string,
  context: EffectContext
): Promise<JSON | null> {
  const endpoints = [
    process.env.KLEROS_CDN_LINK || "",
    "https://cloudflare-ipfs.com/ipfs",
    "https://ipfs.io/ipfs",
  ];

  for (const endpoint of endpoints) {
    if (!endpoint) continue;

    const metadata = await fetchFromEndpoint(endpoint, tokenId, context);
    if (metadata) {
      return metadata;
    }
  }

  context.log.error("Unable to fetch from all endpoints");
  return null;
}
