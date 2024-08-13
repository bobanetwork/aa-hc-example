import { expect } from "chai";
import { TokenPrice } from "../typechain-types";
import { Wallet, JsonRpcProvider } from "ethers";
import { setupTests, sendUserOperation } from "./setup";

describe("TokenPrice Contract", () => {
  let tokenPriceContract: TokenPrice;
  let owner: Wallet;
  let user: Wallet;
  let provider: JsonRpcProvider;
  let bundlerRpc: string;
  let chainId: string

  before(async () => {
    ({ tokenPriceContract, owner, user, provider, bundlerRpc } = await setupTests());
    chainId = (await provider.getNetwork()).chainId.toString()
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
  });
});