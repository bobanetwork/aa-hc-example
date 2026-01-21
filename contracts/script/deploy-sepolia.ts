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
        try {
            await execPromise(
                `cast call --rpc-url=${configuration.RPC_URL} ${hybridAccountAddress} "getDeposit()"`
            );
        } catch (e) {
            console.log("Verification failed. Please retry.")
        }

        updateEnvVariable("HYBRID_ACCOUNT", hybridAccountAddress);
        updateEnvVariable("CUSTOM_CONTRACT", implementationContract);
        updateEnvVariable("BACKEND_URL", configuration.BACKEND_URL)

        console.log(`Verifying Hybrid Account ${hybridAccountAddress}`);
        await execPromise(
            `npx hardhat verify --network boba_sepolia ${implementationContract} ${hybridAccountAddress}`
        );
        console.log('\n Please reach out to the BOBA Foundation to call REGISTER_URL on your Backend URL and Hybrid Account:')
        console.table({
            YOUR_BACKEND_URL: configuration.BACKEND_URL,
            YOUR_HYBRID_ACCOUNT: hybridAccountAddress,
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