
# Get started
## Sepolia

| Name             | Address                                          | Explainer                           |
|------------------|--------------------------------------------------|-------------------------------------|
| BACKEND          | https://aa-hc-example.onrender.com       |                                     |
| FRONTEND         | https://aa-hc-example-fe.onrender.com     |                                     |
| HC_HELPER_ADDR   | 0x587a06089ed54101dd6d9A8ecDe1d146f97Af6B8       | HC Helper is system-wide available  |
| TOKEN_PRICE_ADDR | 0xA9EbF7c613294fc2a52d730A0FFe1d517265412b | 
| RPC_URL          | https://gateway.tenderly.co/public/boba-sepolia	 |                                     |
| -> More RPC URls | https://chainlist.org/chain/28882	               |                                     |

##### Setting-up HybridAccount and Token Price Contract
To deploy the HybridAccount, you need to set the environment variable "PRIVATE_KEY_BOBA_SEPOLIA" inside the .env file. Then you can run the provided forge script via following command:
```bash
forge script script/deploy-hybrid-account.s.sol:DeployExample --rpc-url https://sepolia.boba.network/ --broadcast
```

1. You need to call `PermitCaller()` on the HybridAccount to allow it to accept calls from your Token Price Contract
2. You need to call `Registerurl()` and `AddCredit()` on the HCHelper to register credits for your HybridAccount
