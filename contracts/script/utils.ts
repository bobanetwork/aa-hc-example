import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { ProcessEnvOptions, spawn } from "child_process";
import { Readable } from "stream";

export const getLocalIpAddress = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    for (const iface of networkInterfaces[interfaceName]!) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  throw new Error("No Local IP-Address found");
};

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
