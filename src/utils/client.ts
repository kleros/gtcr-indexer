import { createPublicClient, fallback, http, PublicClient } from "viem";
import { chains } from "../constants";

const RPCS = {
  1: process.env.ENVIO_MAINNET_RPC_URL,
  100: process.env.ENVIO_GNOSIS_RPC_URL,
  11155111: process.env.ENVIO_SEPOLIA_RPC_URL,
};

const clients = chains.reduce<Record<number, PublicClient>>((acc, chain) => {
  acc[chain.id] = createPublicClient({
    chain,
    // TODO: provide more RPC's
    transport: fallback([http(RPCS[chain.id], { batch: true })], {
      retryCount: 7,
      retryDelay: 500,
    }),
    batch: {
      multicall: true,
    },
  });
  return acc;
}, {});

export const getClient = (chainId: number) => {
  return clients[chainId];
};
