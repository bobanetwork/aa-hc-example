const {ethers} = require('ethers');
require("dotenv").config();

const RPC_URL = 'https://sepolia.boba.network/';
const signer = new ethers.Wallet(process.env.PRIVATE_KEY_BOBA_SEPOLIA, new ethers.JsonRpcProvider(RPC_URL));

// CONTRACTS
const HC_HELPER_ADDR = '0x587a06089ed54101dd6d9A8ecDe1d146f97Af6B8';
const HYBRID_ACCOUNT = '0x7fcd41c67f2cf2ebbd9efcf1481d1dd9fc979aca';
const TOKEN_PRICE_ACCOUNT_ADDR = '0xA9EbF7c613294fc2a52d730A0FFe1d517265412b';

// OTHER CONSTS
const BACKEND_URL = "https://aa-hc-example.onrender.com/hc";

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

    /** @DEV Needs to be called by maintainers/owners */
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