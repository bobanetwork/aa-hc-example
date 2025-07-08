import * as dotenv from "dotenv";
import * as path from "path";
import {
    DEFAULT_SNAP_VERSION,
    execPromise, getContractFromDeployAddresses,
    parseDeployAddresses,
    readHybridAccountAddress,
    updateEnvVariable
} from './utils'

dotenv.config();

const DEFAULT_BOBA_SEPOLIA = {
    RPC_URL: 'https://gateway.tenderly.co/public/boba-sepolia',
    HC_HELPER_ADDR: '0x11c4DbbaC4A0A47a7c76b5603bc219c5dAe752D6',
    ENTRYPOINT_ADDR: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
}

async function main() {
    try {
        const {HC_HELPER_ADDR, RPC_URL, ENTRYPOINT_ADDR} = DEFAULT_BOBA_SEPOLIA

        // Step 1: Compile Hardhat project
        console.log("Compiling Hardhat project...");
        await execPromise("npx hardhat compile");

        // Step 2: Deploy Hybrid Account
        console.log("Deploying Hybrid Account...");
        const forgeOutput = await execPromise(
            `forge script script/deploy-sepolia.s.sol:DeployExample --rpc-url ${RPC_URL} --broadcast`,
            [],
            undefined,
            process.env
        );
        console.log("forgeoutput: ", forgeOutput);

        const latestBroadcast = "../broadcast/deploy-sepolia.s.sol/28882/run-latest.json"
        const hybridAccountAddress = readHybridAccountAddress(latestBroadcast);
        const contracts = parseDeployAddresses(latestBroadcast)

        const tokenPriceContract = getContractFromDeployAddresses(contracts, "TokenPrice")

        console.log("Verifying HybridAccount contract...");
        await execPromise(
            `cast call --rpc-url=${RPC_URL} ${hybridAccountAddress} "getDeposit()"`
        );

        // Update HYBRID_ACCOUNT in .env
        updateEnvVariable("HYBRID_ACCOUNT", hybridAccountAddress);
        console.log(`Updated HYBRID_ACCOUNT in .env: ${hybridAccountAddress}`);

        // Update TOKEN_PRICE_ADDR in .env
        updateEnvVariable("CUSTOM_CONTRACT", tokenPriceContract);
        console.log(`Updated CUSTOM_CONTRACT in .env: ${tokenPriceContract}`);

        await new Promise((resolve) => setTimeout(resolve, 3000));


        const {OC_PRIVATE_KEY, BACKEND_URL} = process.env
        // Step 4: Verify contract
        console.log("Verifying TokenPrice contract...");
        await execPromise(
            `npx hardhat verify --network boba_sepolia ${tokenPriceContract} ${hybridAccountAddress}`
        );


        // Step 5: Run production push script
        console.log("Running production push script...");
        console.log('HCH = ', HC_HELPER_ADDR)
        console.log('HA = ', hybridAccountAddress);
        console.log('TC = ', tokenPriceContract);
        console.log('BE = ', BACKEND_URL)
        console.log('RPC_URL = ', RPC_URL)
        console.log('-------------------')

        const finalBackendUrl = BACKEND_URL
        updateEnvVariable("BACKEND_URL", finalBackendUrl!)
        updateEnvVariable("ENTRY_POINT", ENTRYPOINT_ADDR)

        if (!BACKEND_URL) {
            console.warn('BACKEND_URL not defined. Using default public endpoint')
        }

        if(!OC_PRIVATE_KEY) {
            throw Error("OC_PRIVATE_KEY not defined")
        }

        if (!HC_HELPER_ADDR || !hybridAccountAddress || !tokenPriceContract || !RPC_URL || !OC_PRIVATE_KEY) {
            throw Error("Configuration missing")
        }

        await execPromise(
            `node script/create-contract-configuration.js ${RPC_URL} ${OC_PRIVATE_KEY} ${HC_HELPER_ADDR} ${hybridAccountAddress} ${tokenPriceContract} ${finalBackendUrl}`
        );

        console.log("Deployment process completed successfully!");

        // save relevant envs to frontend
        console.log('Saving relevant env variables to frontend. The Boba sepolia config will be used if some variables are missing.')
        const frontendEnvPath = '../../frontend/.env-boba-sepolia'
        updateEnvVariable("VITE_SMART_CONTRACT", tokenPriceContract, frontendEnvPath);
        updateEnvVariable("VITE_SNAP_ORIGIN", 'npm:@bobanetwork/snap-account-abstraction-keyring-hc', frontendEnvPath);
        updateEnvVariable("VITE_SNAP_VERSION", DEFAULT_SNAP_VERSION, frontendEnvPath);
        updateEnvVariable("VITE_RPC_PROVIDER", RPC_URL ?? 'https://sepolia.boba.network', frontendEnvPath);

        const frontendEnvPathSnapLocal = '../../frontend/.env-local-boba-sepolia-snaplocal'
        updateEnvVariable("VITE_SMART_CONTRACT", tokenPriceContract, frontendEnvPathSnapLocal);
        updateEnvVariable("VITE_SNAP_ORIGIN", 'local:http://localhost:8080', frontendEnvPathSnapLocal);
        updateEnvVariable("VITE_SNAP_VERSION", DEFAULT_SNAP_VERSION, frontendEnvPathSnapLocal);
        updateEnvVariable("VITE_RPC_PROVIDER", RPC_URL ?? 'https://sepolia.boba.network', frontendEnvPathSnapLocal);

        // const snapSiteEnvFolder = '../../snap-account-abstraction-keyring/packages/site/'
        // updateEnvVariable('USE_LOCAL_NETWORK', "false", `${snapSiteEnvFolder}/.env`)
        // updateEnvVariable('USE_LOCAL_NETWORK', "false", `${snapSiteEnvFolder}/.env.development`)
        // updateEnvVariable('USE_LOCAL_NETWORK', "false", `${snapSiteEnvFolder}/.env.development.hc`)

        // Backend env vars
        const backendEnvPath = path.resolve(__dirname, "../../backend/.env-local");
        updateEnvVariable(
            "OC_HYBRID_ACCOUNT",
            hybridAccountAddress,
            backendEnvPath
        );

        updateEnvVariable(
            "ENTRY_POINTS",
            DEFAULT_BOBA_SEPOLIA.ENTRYPOINT_ADDR, // @dev Official Boba Sepolia Entrypoint: https://docs.boba.network/developer/features/aa-basics/contract-addresses
            backendEnvPath
        );
        updateEnvVariable("CHAIN_ID", "2882", backendEnvPath);
        updateEnvVariable("OC_PRIVKEY", OC_PRIVATE_KEY!, backendEnvPath);
        updateEnvVariable(
            "HC_HELPER_ADDR",
            HC_HELPER_ADDR,
            backendEnvPath
        );

        console.log("Backend ENV vars set...");

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