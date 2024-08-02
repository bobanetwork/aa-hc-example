const {ethers} = require('ethers');
require("dotenv").config();

const RPC_URL = 'https://sepolia.boba.network/';
const signer = new ethers.Wallet(process.env.PRIVATE_KEY_BOBA_SEPOLIA, new ethers.JsonRpcProvider(RPC_URL));

// CONTRACTS
const HC_HELPER_ADDR = process.env.HC_HELPER_ADDR;
const HYBRID_ACCOUNT = process.env.HYBRID_ACCOUNT;
const TOKEN_PRICE_ACCOUNT_ADDR = process.env.TOKEN_PRICE_CONTRACT;
// OTHER CONSTS
const BACKEND_URL = process.env.BACKEND_URL;

console.log('HCH = ', HC_HELPER_ADDR)
console.log('HA = ', HYBRID_ACCOUNT);
console.log('TTP = ', TOKEN_PRICE_ACCOUNT_ADDR);
console.log('BE = ', BACKEND_URL)

if (!HC_HELPER_ADDR || !HYBRID_ACCOUNT || !TOKEN_PRICE_ACCOUNT_ADDR || !BACKEND_URL) {
    throw Error("Configuration missing")
}

async function main() {
    const hybridAccountABI = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "caller",
                    "type": "address"
                },
                {
                    "internalType": "bool",
                    "name": "allowed",
                    "type": "bool"
                }
            ],
            "name": "PermitCaller",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
    const hcHelperABI = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "contract_addr",
                    "type": "address"
                },
                {
                    "internalType": "string",
                    "name": "url",
                    "type": "string"
                }
            ],
            "name": "RegisterUrl",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "contract_addr",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "numCredits",
                    "type": "uint256"
                }
            ],
            "name": "AddCredit",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]
    const ttPABI=[{"type":"constructor","inputs":[{"name":"_helperAddr","type":"address","internalType":"address payable"}],"stateMutability":"nonpayable"},{"type":"function","name":"fetchPrice","inputs":[{"name":"token","type":"string","internalType":"string"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"tokenPrices","inputs":[{"name":"","type":"string","internalType":"string"}],"outputs":[{"name":"price","type":"string","internalType":"string"},{"name":"timestamp","type":"uint256","internalType":"uint256"}],"stateMutability":"view"}]

    const hybridAccountContract = new ethers.Contract(HYBRID_ACCOUNT, hybridAccountABI, signer);
    const hcHelperContract = new ethers.Contract(HC_HELPER_ADDR, hcHelperABI, signer);

    /** @DEV can be called */
    async function registerUrl(contractAddr, backendURL) {
        const tx = await hcHelperContract.RegisterUrl(contractAddr, backendURL);
        await tx.wait();
        console.log('URL registered successfully.');
    }

    /** @DEV No restrictions */
    async function addCredit(contractAddr, numCredits) {
        const tx = await hcHelperContract.AddCredit(contractAddr, numCredits);
        await tx.wait();
        console.log('Credits added successfully.');
    }

    /** @DEV No restrictions */
    async function permitCaller(caller) {
        let tx = await hybridAccountContract.PermitCaller(caller, true);
        await tx.wait();
        console.log('Caller permission updated successfully.');
    }

    try {
        console.log('Registering permitCaller...')
        await permitCaller(TOKEN_PRICE_ACCOUNT_ADDR);
        console.log('DONE')
    } catch (e) {
        console.log('failed registerURL: ', e);
    }

    try {
        console.log('Registering URL...')
        await registerUrl(HYBRID_ACCOUNT, BACKEND_URL);
        console.log('DONE')
    } catch (e) {
        console.log('failed registerURL: ', e);
    }

    try {
        console.log('Adding Credits...')
        await addCredit(HYBRID_ACCOUNT, 100);
        console.log('DONE')
    } catch (e) {
        console.log('failed addCredit: ', e);
    }
}

// go
main().catch(console.error);