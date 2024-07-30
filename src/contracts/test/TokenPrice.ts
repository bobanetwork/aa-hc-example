import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

describe("TokenPrice", function () {

  it("should call fetchPrice function", async function () {
    const [owner] = await ethers.getSigners();

    // Deploy the HybridAccount contract
    const HybridAccount = await ethers.getContractFactory("HybridAccount");
    const hybridAccount = await HybridAccount.deploy();
    await hybridAccount.deployed();

    // Deploy the TokenPrice contract
    const TokenPrice = await ethers.getContractFactory("TokenPrice");
    const tokenPrice = await TokenPrice.deploy(hybridAccount.address);
    await tokenPrice.deployed();

    // Call the fetchPrice function
    const tx = await tokenPrice.fetchPrice("ETH");
    await tx.wait();

    // Verify the price was stored correctly
    const storedPrice = await tokenPrice.tokenPrices("ETH");
    expect(storedPrice.price).to.equal("1234");
  });
});
