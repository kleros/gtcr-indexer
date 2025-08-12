import { Address } from "viem";
import { abi as LGTCRABI } from "../../../abis/LightGeneralizedTCR";
import { abi as ArbitratorABI } from "../../../abis/IArbitrator";
import { abi as GTCRABI } from "../../../abis/GeneralizedTCR";

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

export const getGTCRContract = (address: string) => {
  return {
    address: address as Address,
    abi: GTCRABI,
  };
};
