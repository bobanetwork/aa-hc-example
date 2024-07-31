import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-ignition-ethers";

const config: HardhatUserConfig & {
  etherscan: { apiKey: any; customChains: any };
} = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    boba_sepolia: {
      url: "https://sepolia.boba.network",
      //accounts: [process.env.DEPLOYER_PK ?? ""],
      accounts: [
        "76311f390a17908fe1f07a11d5dc4b4e3bc326d3011d2c4c547e71648ed06511",
      ],
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
