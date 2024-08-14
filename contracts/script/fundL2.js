const {ethers} = require('ethers');
require("dotenv").config();

const RPC_URL_L1 = 'http://localhost:8545';
const RPC_URL_L2 = 'http://localhost:9545';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const L1StandardBridge = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

const l1provider = new ethers.JsonRpcProvider(RPC_URL_L1);
const l2provider = new ethers.JsonRpcProvider(RPC_URL_L2);

const walletL2 = new ethers.Wallet(PRIVATE_KEY, l2provider);
const walletL1 = new ethers.Wallet(PRIVATE_KEY, l1provider);

async function main() {
    if ((await l2provider.getBalance(walletL2)) > 1) {
        console.log("Deployer already has funds on L2, continue");
    } else {
        console.log('Funding L2...')
        try {
            const tx = {
                to: L1StandardBridge,
                value: ethers.parseEther('100')
            };
            const response = await walletL1.sendTransaction(tx);
            await response.wait();
            console.log("Funding L2 done...");
        } catch (e) {
            console.error("Error: ", e);
        }
    }
}

main().catch(console.error);