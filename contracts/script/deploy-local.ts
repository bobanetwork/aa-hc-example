import { exec, ProcessEnvOptions, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { getLocalIpAddress } from "./utils";

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

const execPromise = (
  command: string,
  inputs: string[] = [],
  cwd: ProcessEnvOptions["cwd"] = undefined,
  env?: NodeJS.ProcessEnv
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(" ");
    const child = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd,
      env,
    });

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

const parseLocalDeployAddresses = () => {
  const jsonPath = path.resolve(
    __dirname,
    "../broadcast/LocalDeploy.s.sol/901/run-latest.json"
  );

  try {
    const data = fs.readFileSync(jsonPath, "utf8");
    const jsonData = JSON.parse(data);

    const contracts: { contractName: string; address: string }[] =
      jsonData.transactions.map((transaction: any) => ({
        contractName: transaction.contractName ?? "",
        address: transaction.contractAddress ?? "",
      }));

    const hybridAccount = jsonData.transactions
      .map((transaction: any) => {
        if (
          transaction.contractName === "HybridAccountFactory" &&
          transaction.function === "createAccount(address,uint256)"
        ) {
          return {
            contractName: "HybridAccount",
            address: transaction.additionalContracts[0].address,
          };
        }
      })
      .filter((ha: any) => ha); // filter out undefined values

    contracts.push(...hybridAccount);

    console.log("Parsed JSON data:", contracts);
    return contracts;
  } catch (err) {
    console.error("Error reading or parsing the file:", err);
  }
};

// TODO: fix .env file loading. Currently .env needs to be in /script directory
async function main() {
  try {
    updateEnvVariable("DEPLOY_ADDR", deployAddr);
    updateEnvVariable("HC_SYS_OWNER", ha0Owner);
    updateEnvVariable("BUNDLER_ADDR", bundlerAddr);
    //updateEnvVariable("PRIVATE_KEY", deployKey)
    console.log("privkey: ", process.env.PRIVATE_KEY);
    //await execPromise("node fundL2.js")
    //await execPromise("forge script --json --broadcast --silent --rpc-url=http://127.0.0.1:9545 prefund.s.sol")
    //const result = await execPromise("forge script --json --broadcast --silent --rpc-url=http://127.0.0.1:9545 deploy.s.sol")
    //console.log(result)
    //await execPromise("node fundL2.js");
    //    const output = await execPromise(
    //      "forge script --json --broadcast --silent --rpc-url=http://127.0.0.1:9545 LocalDeploy.s.sol:LocalDeploy"
    //    );
    //    console.log("output:", output);
    const contracts = parseLocalDeployAddresses();
    // HC_HELPER_ADDR=0x7d7c459eb74b9f6bd92c9605d6c77f404809bded HC_SYS_ACCOUNT=0x72f4a4fbdd19e8dee9680758c5542b1677125d27 HC_SYS_OWNER=0x2A9099A58E0830A4Ab418c2a19710022466F1ce7 HC_SYS_PRIVKEY=0x75cd983f0f4714969b152baa258d849473732905e2301467303dacf5a09fdd57 ENTRY_POINTS=0xb8fa1a952843bd53d711239b0264d90dc973ca27 BUILDER_PRIVKEY=0xf91be07ef5a01328015cae4f2e5aefe3c4577a90abb8e2e913fe071b0e3732ed NODE_HTTP=http://192.168.178.59:9545 CHAIN_ID=901
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
   await execPromise("docker compose up -d", [], path.resolve(__dirname, "../../backend"))
  } catch (error) {
    console.error(error);
  }
}

main();
