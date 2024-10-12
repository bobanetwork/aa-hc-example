# Step by Step Guide

1. Clone Repo: `git@github.com:bobanetwork/aa-hc-example.git`
2. Install Submodules: `git submodule update —init —recursive`
3. Ensure these dependencies are installed on your host system: [docs.boba.network/#dependencies](https://docs.boba.network/#dependencies)
4. Install Root dependencies: `pnpm install`
5. Deploy: `pnpm start:local` 
6. `docker-compose -f docker-compose.local.yml up —build`
7. Access [localhost:8001](http://localhost:8001/)
    a. You might need to wait a couple of seconds, as package is still running
9. Once site is reachable click on „Connect To Boba Sepolia“
    a. This will connect to your local chain
10. Once Installation Complete was hit, click on „Create Account“ and enter
- Exemplary Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- Salt (optional): `123456789`
12. Your new account is created. In order to use it, it needs to have funds. Use the above private key and send funds into the account.
13. Once funded, in the „Transfer Funds“ container, select:
- Select Token: ETH
- Transfer To Account: `<< Your new account >>`
- Token Amount: 0.1
14. Click on Transfer & Accept the User Op. 
15. You can now test the Hybrid Compute functionality
- Access: [localhost:8000](http://localhost:8000/)
- Make sure your `<< Your new account >>` is selected
- Click: „Fetch price via HybridCompute“
16. The ETH price should now appear
