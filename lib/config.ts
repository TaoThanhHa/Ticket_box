import { getFullnodeUrl } from "@iota/iota-sdk/client"
import { createNetworkConfig } from "@iota/dapp-kit";

export const DEVNET_PACKAGE_ID = "0xe62b12ab9c1bbff4249cdfe891f199bb10819563325f7d79ed6228da719c7ac4";
export const TESTNET_PACKAGE_ID = "";
export const MAINNET_PACKAGE_ID = "";

const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
  devnet: { url: getFullnodeUrl("devnet"), variables: { packageId: DEVNET_PACKAGE_ID } },
  testnet: { url: getFullnodeUrl("testnet"), variables: { packageId: TESTNET_PACKAGE_ID } },
  mainnet: { url: getFullnodeUrl("mainnet"), variables: { packageId: MAINNET_PACKAGE_ID } },
});

export { useNetworkVariable, useNetworkVariables, networkConfig };
