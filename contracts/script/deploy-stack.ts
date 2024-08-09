import * as fs from "fs";
import * as dotenv from "dotenv";
import * as path from "path";
import {execPromise, updateEnvVariable} from './utils'

dotenv.config();

const readHybridAccountAddress = () => {
  const jsonPath = path.resolve(
    __dirname,
    "../broadcast/deploy-hybrid-account.s.sol/28882/run-latest.json"
  );
  const jsonContent = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const transaction = jsonContent.transactions.find(
    (tx: any) => tx.transactionType === "CREATE"
  );
  if (!transaction) {
    throw new Error("CREATE transaction not found in the JSON file");
  }
  return transaction.contractAddress;
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

async function main() {
  try {
    // Step 1: Compile Hardhat project
    console.log("Compiling Hardhat project...");
    await execPromise("npx hardhat compile");

    // Step 2: Deploy Hybrid Account
    console.log("Deploying Hybrid Account...");
    const forgeOutput = await execPromise(
      `forge script script/deploy-hybrid-account.s.sol:DeployExample --rpc-url ${process.env.RPC_URL} --broadcast`
    );
    console.log("forgeoutput: ", forgeOutput);

    const hybridAccountAddress = readHybridAccountAddress();

    // Update HYBRID_ACCOUNT in .env
    updateEnvVariable("HYBRID_ACCOUNT", hybridAccountAddress);
    console.log(`Updated HYBRID_ACCOUNT in .env: ${hybridAccountAddress}`);

    // Step 3: Deploy TokenPrice contract
    console.log("Deploying TokenPrice contract...");
    deleteIgnitionDeployments();
    const ignitionOutput = await execPromise(
        "npx hardhat ignition deploy ./ignition/modules/TokenPrice.ts --network boba_sepolia",
        ["y"],
        path.resolve(__dirname, "../"),
        {
          ...process.env,
          HYBRID_ACCOUNT: hybridAccountAddress,
        }
    );

    // Extract the TokenPrice contract address from output
    const tokenPriceMatch = ignitionOutput.match(
      /TokenPrice#TokenPrice - (0x[a-fA-F0-9]{40})/
    );
    if (!tokenPriceMatch) {
      throw new Error(
        "Failed to extract TokenPrice address from Ignition output"
      );
    }
    const tokenPriceAddress = tokenPriceMatch[1];

    // Update TOKEN_PRICE_ADDR in .env
    updateEnvVariable("TOKEN_PRICE_CONTRACT", tokenPriceAddress);
    console.log(`Updated TOKEN_PRICE_CONTRACT in .env: ${tokenPriceAddress}`);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 4: Verify contract
    console.log("Verifying TokenPrice contract...");
    await execPromise(
      `npx hardhat verify --network boba_sepolia ${tokenPriceAddress} ${hybridAccountAddress}`
    );

    // Step 5: Run production push script
    console.log("Running production push script...");
    const {HC_HELPER_ADDR, PRIVATE_KEY, RPC_URL, BACKEND_URL} = process.env
    console.log('HCH = ', HC_HELPER_ADDR)
    console.log('HA = ', hybridAccountAddress);
    console.log('TTP = ', tokenPriceAddress);
    console.log('BE = ', BACKEND_URL)
    console.log('RPC_URL = ', RPC_URL)
    console.log('-------------------')

    if (!BACKEND_URL) {
      console.warn('BACKEND_URL not defined. Using default public endpoint https://aa-hc-example.onrender.com')
    }
    if (!HC_HELPER_ADDR || !hybridAccountAddress || !tokenPriceAddress) {
      throw Error("Configuration missing")
    }

    await execPromise(
      `node script/pushProduction.js ${RPC_URL} ${PRIVATE_KEY} ${HC_HELPER_ADDR} ${hybridAccountAddress} ${tokenPriceAddress} ${BACKEND_URL}`
    );

    console.log("Deployment process completed successfully!");


    // save relevant envs to frontend
    console.log('Saving relevant env variables to frontend. The Boba sepolia config will be used if some variables are missing.')
    updateEnvVariable("VITE_ENTRY_POINT", process.env.ENTRYPOINT ?? '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789', '../../frontend/.env');
    updateEnvVariable("VITE_PRIVATE_KEY", PRIVATE_KEY!, '../../frontend/.env');
    updateEnvVariable("VITE_SMART_CONTRACT", tokenPriceAddress, '../../frontend/.env');
    updateEnvVariable("VITE_RPC_PROVIDER", RPC_URL ?? 'https://sepolia.boba.network', '../../frontend/.env');

  } catch (error) {
    console.error("An error occurred during the deployment process:", error);
  }
}

main();

export {
  main,
  execPromise,
  updateEnvVariable,
  readHybridAccountAddress,
  deleteIgnitionDeployments,
};
