import * as dotenv from "dotenv";
import * as path from "path";
import {
    execPromise, getContractFromDeployAddresses,
    parseDeployAddresses,
    readHybridAccountAddress,
    updateEnvVariable
} from './utils'
dotenv.config();

const configuration = {
    version: '0.7',
    DEFAULT_SNAP_VERSION: '1.1.26',
    RPC_URL: 'https://gateway.tenderly.co/public/boba-sepolia',
    HC_HELPER_ADDR: process.env.HC_HELPER_ADDR!,
    ENTRYPOINT_ADDR: process.env.ENTRY_POINTS!,
    PRIVATE_KEY: process.env.PRIVATE_KEY!,
    BACKEND_URL: process.env.BACKEND_URL!,
    NAME_OF_CUSTOM_CONTRACT: process.env.CUSTOM_CONTRACT_NAME!
}

async function main() {
    try {
        // Compile Contracts
        await execPromise("npx hardhat compile");
        // Deploy necessary Contracts
        await execPromise(
            `forge script script/deploy-sepolia.s.sol:DeployExample --rpc-url ${configuration.RPC_URL} --broadcast`,
            [],
            undefined,
            process.env
        );

        const latestBroadcast = "../broadcast/deploy-sepolia.s.sol/28882/run-latest.json"
        const hybridAccountAddress = readHybridAccountAddress(latestBroadcast);
        const contracts = parseDeployAddresses(latestBroadcast)
        const implementationContract = getContractFromDeployAddresses(contracts, configuration.NAME_OF_CUSTOM_CONTRACT)

        // Verify Contracts
        await execPromise(
            `cast call --rpc-url=${configuration.RPC_URL} ${hybridAccountAddress} "getDeposit()"`
        );

        updateEnvVariable("HYBRID_ACCOUNT", hybridAccountAddress);
        updateEnvVariable("CUSTOM_CONTRACT", implementationContract);

        console.log(`Verifying Hybrid Account ${hybridAccountAddress}`);

        await execPromise(
            `npx hardhat verify --network boba_sepolia ${implementationContract} ${hybridAccountAddress}`
        );

        updateEnvVariable("BACKEND_URL", configuration.BACKEND_URL)

        const frontendEnvPath = '../../frontend/.env-boba-sepolia'
        updateEnvVariable("VITE_SMART_CONTRACT", implementationContract, frontendEnvPath);
        updateEnvVariable("VITE_SNAP_ORIGIN", 'npm:@bobanetwork/snap-account-abstraction-keyring-hc', frontendEnvPath);
        updateEnvVariable("VITE_SNAP_VERSION", configuration.DEFAULT_SNAP_VERSION, frontendEnvPath);
        updateEnvVariable("VITE_RPC_PROVIDER", configuration.RPC_URL ?? 'https://sepolia.boba.network', frontendEnvPath);

        const frontendEnvPathSnapLocal = '../../frontend/.env-local-boba-sepolia-snaplocal'
        updateEnvVariable("VITE_SMART_CONTRACT", implementationContract, frontendEnvPathSnapLocal);
        updateEnvVariable("VITE_SNAP_ORIGIN", 'local:http://localhost:8080', frontendEnvPathSnapLocal);
        updateEnvVariable("VITE_SNAP_VERSION", configuration.DEFAULT_SNAP_VERSION, frontendEnvPathSnapLocal);
        updateEnvVariable("VITE_RPC_PROVIDER", configuration.RPC_URL ?? 'https://sepolia.boba.network', frontendEnvPathSnapLocal);

        const backendEnvPath = path.resolve(__dirname, "../../backend/.env-local");
        updateEnvVariable("OC_HYBRID_ACCOUNT", hybridAccountAddress, backendEnvPath);
        updateEnvVariable("ENTRY_POINTS", configuration.ENTRYPOINT_ADDR, backendEnvPath);
        updateEnvVariable("CHAIN_ID", "2882", backendEnvPath);
        updateEnvVariable("PRIVATE_KEY", configuration.PRIVATE_KEY!, backendEnvPath);
        updateEnvVariable(
            "HC_HELPER_ADDR",
            configuration.HC_HELPER_ADDR,
            backendEnvPath
        );

        console.log('\n 1. Reach out to the BOBA Foundation to call REGISTER_URL and to ADD_CREDITS to your Hybrid Account.')
        console.table({
            YOUR_BACKEND_URL: configuration.BACKEND_URL,
            YOUR_HYBRID_ACCOUNT: hybridAccountAddress
        });

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
};