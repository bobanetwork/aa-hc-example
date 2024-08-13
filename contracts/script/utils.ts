import * as os from "os";
import {execSync, ProcessEnvOptions, spawn} from "child_process";
import { Readable } from "stream";
import * as fs from "fs";
import * as dotenv from "dotenv";
import * as path from "path";

export const DEFAULT_SNAP_VERSION = '1.1.3'

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


export const updateEnvVariable = (key: string, value: string, customEnvPath?: string) => {
  const envPath = path.resolve(__dirname, customEnvPath ?? "../.env")
  if (!fs.existsSync(envPath)) {
    // create empty .env file if not yet created
    fs.closeSync(fs.openSync(envPath, 'w'));
  }
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

export const isPortInUse = (port: number) => {
  try {
    execSync(`nc -z localhost ${port}`);
    return true;
  } catch (error) {
    console.warn("[Warn] Could not check if port in use.")
    return false;
  }
}

export const execPromise = (
    command: string,
    inputs: string[] = [],
    cwd: ProcessEnvOptions["cwd"] = undefined,
    env?: NodeJS.ProcessEnv
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(" ");
    const child = spawn(cmd, args, {
      shell: true,
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
        console.log(stdout)
        reject(new Error(`${command} Command failed with exit code ${code}`));
      } else {
        resolve(stdout);
      }
    });
  });
};
