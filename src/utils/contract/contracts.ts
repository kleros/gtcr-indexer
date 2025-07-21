import { Address } from "viem";
import { abi } from "../../../abis/LightGeneralizedTCR";

export const getLGTCRContract = (address: string) => {
  return {
    address: address as Address,
    abi,
  };
};
