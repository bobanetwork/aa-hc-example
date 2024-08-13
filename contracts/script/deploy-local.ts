import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import {DEFAULT_SNAP_VERSION, deleteIgnitionDeployments, getLocalIpAddress, isPortInUse} from "./utils";
import {execPromise} from './utils'
import {SimpleAccountFactory__factory, TokenPaymaster__factory, VerifyingPaymaster__factory} from "../typechain-types";

dotenv.config();

const deployAddr = ethers.getAddress("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
const deployKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const bundlerAddr = ethers.getAddress("0xB834a876b7234eb5A45C0D5e693566e8842400bB");
const builderPrivkey = "0xf91be07ef5a01328015cae4f2e5aefe3c4577a90abb8e2e913fe071b0e3732ed";
const clientOwner = ethers.getAddress("0x77Fe14A710E33De68855b0eA93Ed8128025328a9");
const clientPrivkey = "0x541b3e3b20b8bb0e5bae310b2d4db4c8b7912ba09750e6ff161b7e67a26a9bf7";
const ha0Owner = ethers.getAddress("0x2A9099A58E0830A4Ab418c2a19710022466F1ce7");
const ha0Privkey = "0x75cd983f0f4714969b152baa258d849473732905e2301467303dacf5a09fdd57";
const ha1Owner = ethers.getAddress("0xE073fC0ff8122389F6e693DD94CcDc5AF637448e");
const ha1Privkey = "0x7c0c629efc797f8c5f658919b7efbae01275470d59d03fdeb0fca1e6bd11d7fa";


/** @DEV Configurations */
const snapEnv = '../snap-account-abstraction-keyring/packages/snap/.env-local'
const l2Provider = new ethers.JsonRpcProvider('http://localhost:9545');
const l2Wallet = new ethers.Wallet(deployKey, l2Provider);
let aaConfigFile = fs.readFileSync('../snap-account-abstraction-keyring/packages/snap/src/constants/aa-config.ts', 'utf8');


const updateEnvVariable = (key: string, value: string, envPath: string) => {
  console.log(`Updating ${key} = ${value}`)
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

// TODO: fix .env file loading. Currently .env needs to be in /script directory
async function main() {
  try {
    if (!isPortInUse(8545) && !isPortInUse(9545)) {
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
    } else {
      console.log("Boba Chain already running, skipping")
    }
    const fundL2Vars = {
      ...process.env,
      PRIVATE_KEY: deployKey,
    };

     await execPromise(
         "node fundL2.js",
         undefined,
         path.resolve(__dirname, "../script/"),
         fundL2Vars
     );

    console.log("Funding L2 done...");

    const BACKEND_URL = process.env.BACKEND_URL ?? `http://${getLocalIpAddress()}:1234/rpc`
    if (!process.env.BACKEND_URL) {
      console.warn('[deploy-local.ts] No BACKEND_URL defined. Might be expected for default deployments and CI. Using localhost.')
    }
    const baseDeployVars = {
      ...process.env,
      PRIVATE_KEY: deployKey,
      BUNDLER_ADDR: bundlerAddr,
      HC_SYS_OWNER: ha1Owner,
      DEPLOY_ADDR: deployAddr,
      BACKEND_URL,
    };

    await execPromise(
      "forge script --json --broadcast --rpc-url http://localhost:9545 deploy.s.sol:DeployExample -vvvvv",
      undefined,
        path.resolve(__dirname, "./"),
        baseDeployVars
    );

    const contracts = parseLocalDeployAddresses();
    const hcHelperAddr = contracts?.find((c) => c.contractName === "HCHelper")?.address;
    const hybridAccountAddr = contracts?.find((c) => c.contractName === "HybridAccount")?.address;

    if (!hcHelperAddr || !hybridAccountAddr) {
      throw Error("HC Helper not defined!");
    }

    const entrypoint = contracts?.find((c) => c.contractName === "EntryPoint")?.address
    const envVars = {
      HC_HELPER_ADDR: contracts?.find((c) => c.contractName === "HCHelper")?.address,
      HC_SYS_ACCOUNT: contracts?.find((c) => c.contractName === "HybridAccount")?.address,
      HC_SYS_OWNER: ha0Owner,
      HC_SYS_PRIVKEY: ha0Privkey,
      ENTRY_POINTS: entrypoint,
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

    deleteIgnitionDeployments();

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
    console.log('using hybridAcc: ', hybridAccountAddr);

    /** @DEV Permit Caller */
    const abi = ["function PermitCaller(address caller, bool allow) external"];
    const hybridAccount = new ethers.Contract(hybridAccountAddr, abi, l2Wallet);
    const tx = await hybridAccount.PermitCaller(tokenPriceAddress, true);
    await tx.wait();

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

    if (!entrypoint) {
      throw Error("Entrypoint not defined!")
    }

    updateEnvVariable(
        "ENTRY_POINTS",
        entrypoint,
        backendEnvPath
    );
    updateEnvVariable("CHAIN_ID", "901", backendEnvPath);
    updateEnvVariable("OC_PRIVKEY", deployKey, backendEnvPath);
    updateEnvVariable(
        "HC_HELPER_ADDR",
        hcHelperAddr,
        backendEnvPath
    );

    console.log("Backend ENV vars set...");

    // Contract env vars
    const ENTRYPOINT = contracts?.find((c) => c.contractName === "EntryPoint")?.address ?? ""
    const contractsEnvPath = path.resolve(__dirname, "../.env");
    updateEnvVariable(
        "HYBRID_ACCOUNT",
        hybridAccountAddr,
        contractsEnvPath
    );
    updateEnvVariable(
        "ENTRY_POINT",
        ENTRYPOINT,
        contractsEnvPath
    );
    updateEnvVariable(
        "TOKEN_PRICE_CONTRACT",
        tokenPriceAddress,
        contractsEnvPath
    );
    updateEnvVariable(
        "HC_HELPER_ADDR",
        hcHelperAddr,
        contractsEnvPath
    );
    updateEnvVariable("PRIVATE_KEY", deployKey, contractsEnvPath);
    updateEnvVariable(
        "CLIENT_ADDR",
        contracts?.find((c) => c.contractName === "SimpleAccount")?.address ?? "",
        contractsEnvPath
    );

    /** @DEV deploy simple account factory */
    const SimpleAccountFactory = new SimpleAccountFactory__factory(l2Wallet);
    const simpleAccountFactoryContract = await SimpleAccountFactory.deploy(entrypoint!);
    await simpleAccountFactoryContract.waitForDeployment();
    console.log('SimpleAccountFactory: ', simpleAccountFactoryContract.target)

     /** @DEV deploy verifying paymaster */
    const VerifyingPaymasterFactory = new VerifyingPaymaster__factory(l2Wallet);
    const verifyingPaymasterContract = await VerifyingPaymasterFactory.deploy(entrypoint, l2Wallet.address);
    await verifyingPaymasterContract.waitForDeployment();
    console.log('Verifying paymaster: ', verifyingPaymasterContract.target)

    /** @DEV deploy the token paymaster */
    const TokenPaymasterFactory = new TokenPaymaster__factory(l2Wallet);
    const tokenPaymasterContract = await TokenPaymasterFactory.deploy(
        simpleAccountFactoryContract.target, entrypoint, l2Wallet.address);
    await tokenPaymasterContract.waitForDeployment();
    console.log('Verifying tokenPaymaster: ', tokenPaymasterContract.target)

    const localConfigRegex = /(\[CHAIN_IDS\.LOCAL\]:\s*{[\s\S]*?entryPoint:\s*')([^']*)(\'[\s\S]*?simpleAccountFactory:\s*')([^']*)(\'[\s\S]*?bobaPaymaster:\s*')([^']*)(\'[\s\S]*?})/;

    aaConfigFile = aaConfigFile.replace(localConfigRegex, (match, before1, oldEntryPoint, middle1, oldSimpleAccountFactory, middle2, oldBobaPaymaster, after) => {
      return `${before1}${ENTRYPOINT}${middle1}${simpleAccountFactoryContract.target}${middle2}${tokenPaymasterContract.target}${after}`;
    });

    // Update the AA-config
    fs.writeFileSync('../snap-account-abstraction-keyring/packages/snap/src/constants/aa-config.ts', aaConfigFile, 'utf8');

    // Update LOCAL_ENTRYPOINT
    updateEnvVariable(
        "LOCAL_ENTRYPOINT",
        ENTRYPOINT,
        snapEnv
    );

    // Update Account Factory
    updateEnvVariable(
        "LOCAL_SIMPLE_ACCOUNT_FACTORY",
        simpleAccountFactoryContract.target.toString(),
        snapEnv
    );

    // Update Account Factory
    updateEnvVariable(
        "VERIFYING_PAYMASTER_ADDRESS",
        verifyingPaymasterContract?.target.toString(),
        snapEnv
    );

    // Update Account Factory
    updateEnvVariable(
        "LOCAL_BOBAPAYMASTER",
        tokenPaymasterContract?.target.toString(),
        snapEnv
    );

    /** @DEV bootstrap frontend, backend and snap */
    await execPromise(
        "docker-compose -f docker-compose.local.yml up --build",
        [],
        path.resolve(__dirname, "../../")
    );
  } catch (error) {
    console.error(error);
  }
}

main();
