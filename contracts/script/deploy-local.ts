import { exec, ProcessEnvOptions, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import {DEFAULT_SNAP_VERSION, getLocalIpAddress} from "./utils";
import {execPromise} from './utils'

dotenv.config();

const deployAddr = ethers.getAddress(
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
);
const deployKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const bundlerAddr = ethers.getAddress(
  "0xB834a876b7234eb5A45C0D5e693566e8842400bB"
);
const builderPrivkey =
  "0xf91be07ef5a01328015cae4f2e5aefe3c4577a90abb8e2e913fe071b0e3732ed";

const clientOwner = ethers.getAddress(
  "0x77Fe14A710E33De68855b0eA93Ed8128025328a9"
);
const clientPrivkey =
  "0x541b3e3b20b8bb0e5bae310b2d4db4c8b7912ba09750e6ff161b7e67a26a9bf7";
const ha0Owner = ethers.getAddress(
  "0x2A9099A58E0830A4Ab418c2a19710022466F1ce7"
);
const ha0Privkey =
  "0x75cd983f0f4714969b152baa258d849473732905e2301467303dacf5a09fdd57";

const ha1Owner = ethers.getAddress(
  "0xE073fC0ff8122389F6e693DD94CcDc5AF637448e"
);
const ha1Privkey =
  "0x7c0c629efc797f8c5f658919b7efbae01275470d59d03fdeb0fca1e6bd11d7fa";


const updateEnvVariable = (key: string, value: string, envPath: string) => {
  let envFile = fs.readFileSync(envPath, "utf8");
  const regex = new RegExp(`^${key}=.*`, "m");
  if (regex.test(envFile)) {
    envFile = envFile.replace(regex, `${key}=${value}`);
  } else {
    envFile += `\n${key}=${value}`;
  }
  fs.writeFileSync(envPath, envFile);
  dotenv.config();
};

const parseLocalDeployAddresses = () => {
  const jsonPath = path.resolve(
    __dirname,
    "../broadcast/deploy.s.sol/901/run-latest.json"
  );

  try {
    const data = fs.readFileSync(jsonPath, "utf8");
    const jsonData = JSON.parse(data);

    const contracts: { contractName: string; address: string }[] =
      jsonData.transactions.map((transaction: any) => ({
        contractName: transaction.contractName ?? "",
        address: transaction.contractAddress ?? "",
      }));

    // const hybridAccount = jsonData.transactions
    //   .map((transaction: any) => {
    //     if (
    //       transaction.contractName === "HybridAccountFactory" &&
    //       transaction.function === "createAccount(address,uint256)"
    //     ) {
    //       return {
    //         contractName: "HybridAccount",
    //         address: transaction.additionalContracts[0].address,
    //       };
    //     }
    //   })
    //   .filter((ha: any) => ha); // filter out undefined values

    // contracts.push(...hybridAccount);

    console.log("Parsed JSON data:", contracts);
    return contracts;
  } catch (err) {
    console.error("Error reading or parsing the file:", err);
  }
};

const deleteIgnitionDeployments = () => {
  const deploymentsPath = path.resolve(__dirname, "../ignition/deployments");
  if (fs.existsSync(deploymentsPath)) {
    fs.rmSync(deploymentsPath, { recursive: true, force: true });
    console.log("Ignition deployments folder deleted.");
  } else {
    console.log(
      "Ignition deployments folder does not exist. Skipping deletion."
    );
  }
};

// TODO: fix .env file loading. Currently .env needs to be in /script directory
async function main() {
  try {
     await execPromise(
       "pnpm install",
       [],
       path.resolve(__dirname, "../../boba")
     );
     await execPromise(
       "make devnet-hardhat-up",
       [],
       path.resolve(__dirname, "../../boba")
     );

    const fundL2Vars = {
      ...process.env,
      PRIVATE_KEY: deployKey,
    };
     await execPromise("node fundL2.js", undefined, undefined, fundL2Vars);
    console.log("Funding L2 done...");

    const baseDeployVars = {
      ...process.env,
      PRIVATE_KEY: deployKey,
      BUNDLER_ADDR: bundlerAddr,
      HC_SYS_OWNER: ha1Owner,
      DEPLOY_ADDR: deployAddr,
      BACKEND_URL: process.env.BACKEND_URL,
    };

    await execPromise(
      "forge script --json --broadcast --silent --rpc-url=http://127.0.0.1:9545 deploy.s.sol",
      undefined,
      undefined,
      baseDeployVars
    );
    const contracts = parseLocalDeployAddresses();
    const envVars = {
      HC_HELPER_ADDR: contracts?.find((c) => c.contractName === "HCHelper")
        ?.address,
      HC_SYS_ACCOUNT: contracts?.find((c) => c.contractName === "HybridAccount")
        ?.address,
      HC_SYS_OWNER: ha0Owner,
      HC_SYS_PRIVKEY: ha0Privkey,
      ENTRY_POINTS: contracts?.find((c) => c.contractName === "EntryPoint")
        ?.address,
      BUILDER_PRIVKEY: builderPrivkey,
      NODE_HTTP: `http://${getLocalIpAddress()}:9545`,
      CHAIN_ID: "901",
    };

    await execPromise(
      "docker compose up -d --build rundler-hc",
      [],
      path.resolve(__dirname, "../../rundler-hc/hybrid-compute/"),
      { ...process.env, ...envVars }
    );

    //
    deleteIgnitionDeployments();
    console.log(
      "HA ADDRESS: ",
      contracts?.find((c) => c.contractName === "HybridAccount")?.address
    );
    console.log("path: ", path.resolve(__dirname, "../"));
    const ignitionOutput = await execPromise(
      "npx hardhat ignition deploy ./ignition/modules/TokenPrice.ts --network boba_local",
      ["y"],
      path.resolve(__dirname, "../"),
      {
        ...process.env,
        HYBRID_ACCOUNT: contracts?.find(
          (c) => c.contractName === "HybridAccount"
        )?.address,
      }
    );

    const tokenPriceMatch = ignitionOutput.match(
      /TokenPrice#TokenPrice - (0x[a-fA-F0-9]{40})/
    );
    if (!tokenPriceMatch) {
      throw new Error(
        "Failed to extract TokenPrice address from Ignition output"
      );
    }
    const tokenPriceAddress = tokenPriceMatch[1];
    console.log("TokenPrice Contract deployed to: ", tokenPriceAddress);

    // Frontend env vars
    const frontendEnvPath = path.resolve(__dirname, "../../frontend/.env-local");
    updateEnvVariable(
      "VITE_SMART_CONTRACT",
      tokenPriceAddress,
      frontendEnvPath
    );
    updateEnvVariable(
      "VITE_RPC_PROVIDER",
      "http://localhost:9545",
      frontendEnvPath
    );
    updateEnvVariable(
        "VITE_SNAP_ORIGIN",
        "local:http://localhost:8080",
        frontendEnvPath
    );
    updateEnvVariable(
        "VITE_SNAP_VERSION",
        DEFAULT_SNAP_VERSION,
        frontendEnvPath
    );

    console.log("Frontend ENV vars set...");

    // Backend env vars
    const backendEnvPath = path.resolve(__dirname, "../../backend/.env");
    updateEnvVariable(
      "OC_HYBRID_ACCOUNT",
      contracts?.find((c) => c.contractName === "HybridAccount")?.address ?? "",
      backendEnvPath
    );
    updateEnvVariable(
      "ENTRY_POINTS",
      contracts?.find((c) => c.contractName === "EntryPoint")?.address ?? "",
      backendEnvPath
    );
    updateEnvVariable("CHAIN_ID", "901", backendEnvPath);
    updateEnvVariable("OC_PRIVKEY", deployKey, backendEnvPath);
    updateEnvVariable(
      "HC_HELPER_ADDR",
      contracts?.find((c) => c.contractName === "HCHelper")?.address ?? "",
      backendEnvPath
    );

    console.log("Backend ENV vars set...");

    // Contract env vars
    const contractsEnvPath = path.resolve(__dirname, "../.env");
    updateEnvVariable(
      "HYBRID_ACCOUNT",
      contracts?.find((c) => c.contractName === "HybridAccount")?.address ?? "",
      contractsEnvPath
    );
    updateEnvVariable(
      "ENTRY_POINT",
      contracts?.find((c) => c.contractName === "EntryPoint")?.address ?? "",
      contractsEnvPath
    );
    updateEnvVariable(
      "TOKEN_PRICE_CONTRACT",
      tokenPriceAddress,
      contractsEnvPath
    );
    updateEnvVariable(
      "HC_HELPER_ADDR",
      contracts?.find((c) => c.contractName === "HCHelper")?.address ?? "",
      contractsEnvPath
    );
    updateEnvVariable("PRIVATE_KEY", deployKey, contractsEnvPath);
    updateEnvVariable(
      "CLIENT_ADDR",
      contracts?.find((c) => c.contractName === "SimpleAccount")?.address ?? "",
      contractsEnvPath
    );

    console.log("Contracts ENV vars set...");

    await execPromise(
      "docker compose up -d",
      [],
      path.resolve(__dirname, "../../backend")
    );

    console.log("Backend container started...");

    await execPromise(
      "docker compose up -d",
      [],
      path.resolve(__dirname, "../../frontend")
    );

    console.log("Frontend container started...");
  } catch (error) {
    console.error(error);
  }
}

main();
