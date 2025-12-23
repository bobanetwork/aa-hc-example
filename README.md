# What is this?
This is a easy to use example of how you can use [Hybrid Compute](https://docs.boba.network/developer/features/aa-basics/hybrid-compute) with [Account Abstraction](https://docs.boba.network/developer/features/aa-basics) to build powerful Web3 Apps!

This "Hello World" example allows you to fetch the current price of any cryptocurrency from an off-chain API such as CoinRanking into your smart contract within 1 single, atomic transaction! 

You can run this repo on our official testnet "Boba Sepolia"

# Examples in action
- https://pricefeed-frontend.onrender.com/
- https://presibot.onrender.com/
- https://codecaster.onrender.com/

# Get started
Clone this repo with `git clone --recurse-submodules -j8 git@github.com:bobanetwork/aa-hc-example.git`

# Core Components and Services

Every AA-HC example consists of
- `Backend`
  - must be deployed by yourself using the example in the `/backend` folder. This can happen before you start the `Installation` part. For the installation part it is necessary that you have a valid URL (https://) that will point to your backend. The URL must not work at deployment, so feel free to add your URL destination for now.
- `Custom Contract`
  - The custom contract (as in this example, the TokenContract) stores the data from the HC call. Your Contract will be created by following the Installation Guide.
- `Hybrid Account`
  - The Hybrid Account is responsible for communicating with the `HCHelper` and calling `TryCallOffchain`. In the Installation setup, a HybridAccount for this example will be created.
- `Simple Account`
  - The Simple Account is used to communicate with your AA-HC application. If your application should work in a browser, please create your Hybrid Account within the [Boba Hub](https://hub.boba.network/smartaccount) using the provided `Boba Snap`. If you intend to create a console-only application, you may use the SDK and its `UserOperationManager` to create your accounts, send Ops or test your application: [AA-HC-SDK](https://www.npmjs.com/package/@bobanetwork/aa-hc-sdk-server).

## Installation
1. Copy `/contracts/.env-example` and name it `.env`. Please add the URL of your where your backend server will live.
2. Add your own private key, that contains some ETH on Boba Sepolia in order to deploy the contracts on testnet. You can obtain some SepETH on Sepolia (L1) from any [faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) and bridge them to L2 through our [Gateway](https://gateway.boba.network/).
3. Run `pnpm start:sepolia` to spin up the reduced local stack to use the existing infrastructure on Boba Sepolia. 
4. Head over to the Hub [https://hub.boba.network/](https://hub.boba.network/) to create your Smart Wallet or make use of the SDK to create your smart wallet on the console [AA-HC-SDK](https://www.npmjs.com/package/@bobanetwork/aa-hc-sdk-server)
5. Once you created your account, try it out by using the "Transfer Funds" section. Make sure you funded your new "Snap Account" with some `ETH` on Boba Sepolia.
6. Congrats you sent your first `UserOp` on Boba Sepolia using Account Abstraction! If you navigate to the [Block-Explorer](https://testnet.bobascan.com/) you should see your contract wallet.
7. Navigate now to [localhost:8000](http://localhost:8000) to interact with your local DApp which utilizes Hybrid Compute via Account Abstraction to fetch off-chain data to your smart contract! In our example we fetch the current price of a cryptocurrency asset.

| Name             | Address                                          | Explainer                           |
|------------------|--------------------------------------------------|-------------------------------------|
| BACKEND          | https://aa-hc-example.onrender.com/hc       |                                     |
| FRONTEND         | https://aa-hc-example-fe.onrender.com     |                                     |
| HC_HELPER_ADDR   | 0x1c64EC0A5E2C58295c3208a63209A2A719dF68D8       | HC Helper is system-wide available  |
| TOKEN_PRICE_ADDR | 0xcad49c0381c1B0779A318c2326Db43A6073adC1e | 
| RPC_URL          | https://gateway.tenderly.co/public/boba-sepolia	 |                                     |
| -> More RPC URls | https://chainlist.org/chain/28882	               |                                     |

This is what a successful transaction will look like: [0x30056b3ff720f4d824422bd077b88c4333e86fbe5522bcdba96cfc8fa2a69b52](https://testnet.bobascan.com/tx/0x30056b3ff720f4d824422bd077b88c4333e86fbe5522bcdba96cfc8fa2a69b52?chainid=28882)