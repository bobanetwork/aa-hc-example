# Contracts
Make sure you have setup your machine as outlined in the main [README](../README.md).

## Scripts
Run `pnpm start:sepolia` in the root folder, to setup the complete example as outlined in the [README](../README.md).

The deploy scripts will automatically update **all environment variables** in all projects to make sure everything runs smoothly.

### Requirements

Required calls to be made on the HC Helper [Link](https://sepolia.testnet.bobascan.com/address/0x11c4DbbaC4A0A47a7c76b5603bc219c5dAe752D6)

#### 1. registerUrl()
Must be called by the Boba Team with the deployed Hybrid Compute and the deployed Backend URL.

#### 2. AddCredits()
Your Hybrid Account must hold credits.  