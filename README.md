
# Get started

Clone this repo with `git clone --recurse-submodules -j8 git@github.com:bobanetwork/aa-hc-example.git`

## Installation
You will need a handful of tools to run the full stack (local): 
- `cargo` [[Download]](https://doc.rust-lang.org/cargo/getting-started/installation.html)
- `forge` [[Download]](https://book.getfoundry.sh/getting-started/installation)
- `npm` | `yarn` or `pnpm` [[Download]](https://nodejs.org/en/download/package-manager)
- `golang` [[Download]](https://go.dev/doc/install)

To run the stack on Boba Sepolia you can skip `cargo` and `golang` which is only required to run the local stack.

## Local
All contracts and services are deployed and environment variables are substituted across all services automatically to ensure a convenient developer experience. 

1. Copy `/contracts/.env-example` and name it `.env`. All necessary variables are pre-filled except of `PRIVATE_KEY`. 
2. Add your own private key, that contains some ETH on Boba Sepolia in order to deploy the contracts on testnet. You can obtain some SepETH on Sepolia (L1) from any [faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) and bridge them to L2 through our [Gateway](https://gateway.boba.network/).
3. Run `pnpm start:local` to spin the local stack up. Make sure you have [Docker](https://www.docker.com/products/docker-desktop/) running.

Please note, that the local stack actually spins up the Boba L2 locally, the Bundler ("Rundler") along with other local services. This might take a while to startup. 

## Sepolia

Run `pnpm start:sepolia` to spin up the reduced local stack to use the existing infrastructure on Boba Sepolia. 

| Name             | Address                                          | Explainer                           |
|------------------|--------------------------------------------------|-------------------------------------|
| BACKEND          | https://aa-hc-example.onrender.com       |                                     |
| FRONTEND         | https://aa-hc-example-fe.onrender.com     |                                     |
| HC_HELPER_ADDR   | 0x587a06089ed54101dd6d9A8ecDe1d146f97Af6B8       | HC Helper is system-wide available  |
| TOKEN_PRICE_ADDR | 0xcad49c0381c1B0779A318c2326Db43A6073adC1e | 
| RPC_URL          | https://gateway.tenderly.co/public/boba-sepolia	 |                                     |
| -> More RPC URls | https://chainlist.org/chain/28882	               |                                     |

### Setup and Deployment
> **Important:** Ensure you are inside the `contracts` folder before proceeding. Edit the `.env` file located in the `contracts` folder and execute the command from within this directory.

To setup everything we need to deploy the `Hybrid Account` and the `TokenPrice` contract. Then we need to call `PermitCaller()` on the `Hybrid Account` and `RegisterUrl()`+`AddCredit()` on the `HCHelper`. To do so, you just need to set the environment variable `PRIVATE_KEY` inside the .env file and execute following command:
``` bash
yarn run deploy
```

For more documentation about Hybrid Account please visit the [docs](https://docs.boba.network/developer/features/aa-basics/hybrid-compute).