import { expect } from "chai";
import { TokenPrice, TokenPrice__factory } from "../typechain-types";
import { Wallet, JsonRpcProvider, ZeroAddress } from "ethers";
import { setupTests, sendUserOperation } from "./setup";
import { ethers } from "hardhat";

describe("TokenPrice Contract", () => {
  let tokenPriceContract: TokenPrice;
  let owner: Wallet;
  let user: Wallet;
  let provider: JsonRpcProvider;
  let bundlerRpc: string;
  let chainId: string;

  before(async () => {
    ({ tokenPriceContract, owner, user, provider, bundlerRpc } = await setupTests());
    chainId = (await provider.getNetwork()).chainId.toString();
  });

  describe("Constructor", () => {
    it("should set the correct name and symbol", async () => {
      expect(await tokenPriceContract.name()).to.equal("TokenPrice Token");
      expect(await tokenPriceContract.symbol()).to.equal("TPT");
    });

    it("should set the correct owner", async () => {
      expect(await tokenPriceContract.owner()).to.equal(owner.address);
    });

    it("should set the correct HybridAccount address", async () => {
      const haAddress = await tokenPriceContract.HA();
      expect(haAddress).to.not.equal(ZeroAddress);
    });
  });

  describe("Ownership", () => {
    it("should allow the owner to transfer ownership", async () => {
      await tokenPriceContract.transferOwnership(user.address);
      expect(await tokenPriceContract.owner()).to.equal(user.address);

      // Transfer ownership back to the original owner
      await tokenPriceContract.connect(user).transferOwnership(owner.address);
    });

    it("should not allow non-owners to transfer ownership", async () => {
      await expect(tokenPriceContract.connect(user).transferOwnership(user.address))
          .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("fetchPrice function", () => {
    it("should fetch price for ETH", async function () {
      const txHash = await sendUserOperation(chainId, bundlerRpc, tokenPriceContract, user, "fetchPrice", ["ETH"]);
      await provider.waitForTransaction(txHash);

      const tokenPriceStruct = await tokenPriceContract.tokenPrices("ETH");
      expect(tokenPriceStruct.price).to.be.a("string");
      expect(Number(tokenPriceStruct.timestamp)).to.be.greaterThan(0);
    });

    it("should fetch price for BTC", async function () {
      const txHash = await sendUserOperation(chainId, bundlerRpc, tokenPriceContract, user, "fetchPrice", ["BTC"]);
      await provider.waitForTransaction(txHash);

      const tokenPriceStruct = await tokenPriceContract.tokenPrices("BTC");
      expect(tokenPriceStruct.price).to.be.a("string");
      expect(Number(tokenPriceStruct.timestamp)).to.be.greaterThan(0);
    });

    it("should revert for unsupported token", async function () {
      await expect(sendUserOperation(chainId, bundlerRpc, tokenPriceContract, user, "fetchPrice", ["UNSUPPORTED"]))
          .to.be.revertedWith("Price not available");
    });

    it("should emit FetchPriceError and FetchPriceRet events on error", async function () {
      // Mock the HybridAccount contract to always return an error
      const MockHybridAccount = await ethers.getContractFactory("MockHybridAccount");
      const mockHA = await MockHybridAccount.deploy();
      await mockHA.deployed();

      const TokenPrice = await ethers.getContractFactory("TokenPrice");
      const mockTokenPrice = await TokenPrice.deploy(mockHA.address);
      await mockTokenPrice.deployed();

      await expect(mockTokenPrice.fetchPrice("ETH"))
          .to.emit(mockTokenPrice, "FetchPriceError").withArgs(1)
          .and.to.emit(mockTokenPrice, "FetchPriceRet").withArgs("0x");
    });
  });
});