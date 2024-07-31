const { ethers } = require('ethers');
require("dotenv").config();

const RPC_URL = 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const L1StandardBridge = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
async function main() {
    const tx = {
        to: L1StandardBridge,
        value: ethers.parseEther('100.0')
    };
    const response = await wallet.sendTransaction(tx);
    await response.wait();
}
main().catch(console.error);