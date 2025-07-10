import {ethers} from "ethers";
import {hcHelperABI, hybridAccountABI} from "./utils";

const args = process.argv.slice(2);

const contractConfiguration = {
    RPC_URL: args[0],
    PRIVATE_KEY: args[1],
    HC_HELPER_ADDR: args[2],
    HYBRID_ACCOUNT: args[3],
    TOKEN_PRICE_CONTRACT: args[4],
    BACKEND_URL: args[5]
}

const signer = new ethers.Wallet(
    contractConfiguration.PRIVATE_KEY, 
    new ethers.JsonRpcProvider(contractConfiguration.RPC_URL)
);

if (!contractConfiguration.HC_HELPER_ADDR || 
    !contractConfiguration.HYBRID_ACCOUNT || 
    !contractConfiguration.TOKEN_PRICE_CONTRACT ||
    !contractConfiguration.BACKEND_URL) {
    throw new Error("Configuration missing")
}

async function main() {
    const hybridAccountContract = new ethers.Contract(
        contractConfiguration.HYBRID_ACCOUNT,
        hybridAccountABI,
        signer
    );

    const hcHelperContract = new ethers.Contract(
        contractConfiguration.HC_HELPER_ADDR, 
        hcHelperABI, 
        signer
    );

    /** @DEV cannot be called, reach out to the BOBA Team */
    async function registerUrl(contractAddr, backendURL) {
        const tx = await hcHelperContract.RegisterUrl(contractAddr, backendURL);
        await tx.wait();
        console.log('URL registered successfully.');
    }

    /** @DEV add credits to the hybrid account */
    async function addCredit(contractAddr, numCredits) {
        const tx = await hcHelperContract.AddCredit(contractAddr, numCredits);
        await tx.wait();
        console.log('Credits added successfully.');
    }

    /** @DEV permit to call the account */
    async function permitCaller(caller) {
        let tx = await hybridAccountContract.PermitCaller(caller, true);
        // await tx.wait();
        console.log('Caller permission updated successfully.');
    }

    if (contractConfiguration.RPC_URL.includes('localhost')) {
        try {
            console.log('Registering URL... (is expected to fail on testnet since you are not owner)')
            await registerUrl(contractConfiguration.HYBRID_ACCOUNT, contractConfiguration.BACKEND_URL);
            console.log('DONE')
        } catch (e) {
            console.log('[Ignore on testnet] failed registerURL: ', e);
        }
    }

    console.log('Final Steps to do:')
    console.log('\n 1. Reach out to the BOBA Foundation to REGISTER_URL and to ADD_CREDITS')
    console.table({
        BACKEND_URL: contractConfiguration.BACKEND_URL,
        YOUR_HYBRID_ACCOUNT: contractConfiguration.HYBRID_ACCOUNT
    });
    console.log('Here is a summary of the complete contracts, please store them: ')
    console.table(contractConfiguration)

}

// go
main().catch(console.error);