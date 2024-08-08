import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-ignition-ethers";

dotenv.config();

let privateKey = process.env.PRIVATE_KEY;
if (!privateKey || privateKey?.length === 0) {
  // We need a dummy key here for CI, even though we don't use the privateKey in our tests.
  // Otherwise hardhat config initialization fails.
  privateKey =
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
}

const config: HardhatUserConfig & {
  etherscan: { apiKey: any; customChains: any };
} = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  ignition: {
    requiredConfirmations: 1,
  },
  sourcify: {
    enabled: false,
  },
 // networks: {
 //   boba_sepolia: {
 //     url: process.env.RPC_URL,
 //     accounts: [privateKey],
 //     allowUnlimitedContractSize: true,
 //   },
 // },
  etherscan: {
    apiKey: {
      boba_sepolia: "boba",
    },
    customChains: [
      {
        network: "boba_sepolia",
        chainId: 28882,
        urls: {
          apiURL:
            "https://api.routescan.io/v2/network/testnet/evm/28882/etherscan",
          browserURL: "https://testnet.bobascan.com",
        },
      },
    ],
  },
};

export default config;
