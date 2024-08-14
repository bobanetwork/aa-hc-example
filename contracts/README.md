# Contracts
Make sure you have setup your machine as outlined in the main [README](../README.md).

## Scripts
Depending on whether you want to test out the example on Boba Sepolia or on a completely local stack either `script/deploy-sepolia.ts` or `script/deploy-local.ts` are run by the commands in the root `package.json`. 

Run `pnpm start:local` or `pnpm start:sepolia` in the root folder, to setup the complete example as outlined in the [README](../README.md).

The deploy scripts will automatically update **all environment variables** in all projects to make sure everything runs smoothly.

### registerUrl
This is the only script not used by the default deployment procedure on Boba Sepolia, since this smart contract call requires you to be the **contract owner**.


So, feel free to ignore it - but it may be useful under certain circumstances if you want to rerun this on your local machine or if you actually have the private key to the owner account.


### depositHybridAccount
This script can be used to further add funds to your HybridAccount in order to call HybridCompute. This doesn't need to be explicitly called through the script, as the `deploy-{network}.ts` files do that for you.