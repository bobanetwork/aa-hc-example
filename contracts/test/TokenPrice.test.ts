import { expect } from "chai";
import { AbiCoder, Wallet } from "ethers";
const { ethers } = require("ethers");
require("dotenv").config();

/** Integration tests */
describe("Integration tests", () => {
  it.skip("should call fetchPrice function", async function () {
    const provider = new ethers.JsonRpcProvider("https://sepolia.boba.network");
    expect(process.env.PRIVATE_KEY).to.be.not.empty;
    const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

    const tokenPriceAddress = process.env.TOKEN_PRICE_CONTRACT;
    if (!tokenPriceAddress) throw new Error("Must define TOKEN_PRICE_CONTRACT");
    const tokenAbi = [
      {
        inputs: [
          {
            internalType: "string",
            name: "token",
            type: "string",
          },
        ],
        name: "fetchPrice",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        name: "tokenPrices",
        outputs: [
          {
            components: [
              {
                internalType: "string",
                name: "price",
                type: "string",
              },
              {
                internalType: "uint256",
                name: "timestamp",
                type: "uint256",
              },
            ],
            internalType: "struct TokenPrice.TokenPriceStruct",
            name: "",
            type: "tuple",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ];

    const contract = new ethers.Contract(tokenPriceAddress, tokenAbi, wallet);
    console.log("Contract exists == ", !!contract);
    const tokenPriceIs = await contract.tokenPrices("ETH");
    console.log("Decoded: ", tokenPriceIs);
    await tokenPriceIs.wait();

    //       // Verify the price was stored correctly
    //       const storedPrice = await tokenPrice.tokenPrices("ETH");
    //       expect(storedPrice.price).to.equal("1234");
  });

  describe("Token Price Encoding and Decoding", () => {
    it("should encode and decode the token price correctly", () => {
      const tokenPrice = "3029.4923923";
      const encoder = new AbiCoder();
      const encodedTokenPrice = encoder.encode(["string"], [tokenPrice]);
      const decodedTokenPrice = encoder.decode(["string"], encodedTokenPrice);

      expect(decodedTokenPrice[0]).to.equal(tokenPrice);
    });

    it("should decode an test payload", function () {
      const encoder = new AbiCoder();
      const tt =
        "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000012323939302e393339323532343736373831330000000000000000000000000000";
      const decodedTokenPrice = encoder.decode(["string"], tt);
      expect(decodedTokenPrice[0]).to.eq("2990.9392524767813");
    });
  });
});
