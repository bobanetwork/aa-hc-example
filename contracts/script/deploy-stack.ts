import { exec, spawn } from "child_process";
import * as fs from "fs";
import * as dotenv from "dotenv";
import * as path from "path";
import { Readable } from "stream";

dotenv.config();

const execPromise = (
  command: string,
  inputs: string[] = []
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(" ");
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
      console.log(data.toString());
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
      console.error(data.toString());
    });

    const stdinStream = new Readable({
      read() {
        inputs.forEach((input) => {
          this.push(input + "\n");
        });
        this.push(null);
      },
    });

    stdinStream.pipe(child.stdin);

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve(stdout);
      }
    });
  });
};

const updateEnvVariable = (key: string, value: string) => {
  const envPath = path.resolve(__dirname, "../.env");
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
      ["y"]
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
    await execPromise(
      `node script/pushProduction.js ${process.env.RPC_URL} ${process.env.PRIVATE_KEY} ${process.env.HC_HELPER_ADDR} ${hybridAccountAddress} ${tokenPriceAddress} ${process.env.BACKEND_URL}`
    );

    console.log("Deployment process completed successfully!");
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
