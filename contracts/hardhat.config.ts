import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-ignition-ethers";

dotenv.config();

const {PRIVATE_KEY} = process.env;
if (!PRIVATE_KEY) {
  console.warn("[hardhat.config] No PRIVATE_KEY defined!")
}
const DUMMY_PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
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
  networks: {
    boba_sepolia: {
      url: "https://sepolia.boba.network",
      accounts: [PRIVATE_KEY ?? DUMMY_PRIVATE_KEY],
    },
    boba_local: {
      url: "http://localhost:9545",
      accounts: [PRIVATE_KEY ?? DUMMY_PRIVATE_KEY],
    },
  },
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
