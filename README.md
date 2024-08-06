
# Get started
## Sepolia

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