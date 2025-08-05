import { Address } from "viem";
import { abi as LGTCRABI } from "../../../abis/LightGeneralizedTCR";
import { abi as ArbitratorABI } from "../../../abis/IArbitrator";

export const getLGTCRContract = (address: string) => {
  return {
    address: address as Address,
    abi: LGTCRABI,
  };
};

export const getArbitratorContract = (address: string) => {
  return {
    address: address as Address,
    abi: ArbitratorABI,
  };
};
