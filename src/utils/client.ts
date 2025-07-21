import { createPublicClient, fallback, http, PublicClient } from "viem";
import { chains } from "../constants";

const RPC_URL = process.env.RPC_URL;

const clients = chains.reduce<Record<number, PublicClient>>((acc, chain) => {
  acc[chain.id] = createPublicClient({
    chain,
    // TODO: provide more RPC's
    transport: fallback([http(RPC_URL, { batch: true })], { retryCount: 3 }),
    batch: {
      multicall: true,
    },
  });
  return acc;
}, {});

export const getClient = (chainId: number) => {
  return clients[chainId];
};
