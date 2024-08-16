const {ethers, parseEther} = require('ethers');
require("dotenv").config();

(async () => {
    const RPC_URL_L2 = 'http://localhost:9545';
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const l2provider = new ethers.JsonRpcProvider(RPC_URL_L2);
    const walletL2 = new ethers.Wallet(PRIVATE_KEY, l2provider);

    const bobaPaymaster = "0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6";
    if (!bobaPaymaster) {
        throw Error("Error: LOCAL_BOBAPAYMASTER= must be defined and passed. ")
    }

    const bobaPaymasterContract = new ethers.Contract(
        bobaPaymaster,
        ['function mintTokens(address recipient, uint256 amount)',
             'function addStake(uint32 unstakeDelaySec) payable',
             'function deposit() payable'
        ],
        walletL2
    )

    console.log('Minting Paymaster Tokens');

    /** @DEV Mint Paymaster Tokens for [HA, TokenContract, what?] */
    // 0x19dE105C7Bb25798BDF07212B2FB82A1Ef1De3fC - Wallet
    // 0x5fc8d32690cc91d4c39d9d3abcbd16989f875707 - token contract token was used and now hybrid account
    // HA = 0x071fd326577b1a9098c971af5f61a954594b67dd
    // const addCredit2 = await bobaPaymasterContract.mintTokens('0x5fc8d32690cc91d4c39d9d3abcbd16989f875707', parseEther('1'), {
    //     gasPrice: 100_000_000
    // })


    /** @DEV Deposit into the BobaPaymentContract */
    const depositTx = await bobaPaymasterContract.deposit({
        value: ethers.parseEther("0.1"),
        gasPrice: 100_000_000
    });
    console.log('Deposit transaction sent. Waiting for confirmation...');
    const r2 = await depositTx.wait();
    console.log('Success =', r2.status === 1);


    /** @DEV Add Stake to the PaymasterContract*/
    const unstakeDelaySecBN = BigInt("5");
    const stakeAmountWei = ethers.parseEther("1");
    const addStakeTx = await bobaPaymasterContract.addStake(unstakeDelaySecBN, {
        value: stakeAmountWei,
        gasPrice: 100_000_000
    });

    console.log('Add Stake Transaction sent. Waiting for confirmation...');
    const receipt = await addStakeTx.wait();
    console.log('Success =', receipt.status === 1);

    // console.log('done: ', await addCredit3.wait());
})();