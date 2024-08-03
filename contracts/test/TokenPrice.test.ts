import {expect} from "chai";
import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {AbiCoder, Contract, Wallet} from "ethers";

/** Integration tests */
describe("Integration tests", () => {
  describe("TokenPrice", () => {

    // before(async () => {
    //   const [owner] = await ethers.getSigners();
    //
    //   // Deploy the HybridAccount contract
    //   const HybridAccount = await ethers.getContractFactory("HybridAccount");
    //   const hybridAccount = await HybridAccount.deploy();
    //   await hybridAccount.deployed();
    //
    //   // Deploy the TokenPrice contract
    //   const TokenPrice = await ethers.getContractFactory("TokenPrice");
    //   tokenPrice = await TokenPrice.deploy(hybridAccount.address);
    //   await tokenPrice.deployed();
    //
    // })

    it("should call fetchPrice function", async function () {
      const provider = new ethers.JsonRpcProvider("https://sepolia.boba.network");
      const wallet = new Wallet(
          "0x76311f390a17908fe1f07a11d5dc4b4e3bc326d3011d2c4c547e71648ed06511",
          provider
      );

      const tokenPriceAddress = '0x32Ee07b46196423822BD74C532d3d55686D2FA33';
      const tokenAbi = [
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "token",
              "type": "string"
            }
          ],
          "name": "fetchPrice",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "name": "tokenPrices",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "string",
                  "name": "price",
                  "type": "string"
                },
                {
                  "internalType": "uint256",
                  "name": "timestamp",
                  "type": "uint256"
                }
              ],
              "internalType": "struct TokenPrice.TokenPriceStruct",
              "name": "",
              "type": "tuple"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ]

      const contract = new ethers.Contract(tokenPriceAddress, tokenAbi, wallet);
      console.log('Contract exists == ', !!contract)
      const tokenPriceIs = await contract.tokenPrices("ETH");
      console.log('Decoded: ', tokenPriceIs)
      await tokenPriceIs.wait();

//       // Verify the price was stored correctly
//       const storedPrice = await tokenPrice.tokenPrices("ETH");
//       expect(storedPrice.price).to.equal("1234");
    });

    const { ethers } = require('ethers');
    const { expect } = require('chai');

    describe('Token Price Encoding and Decoding', () => {
      it('should encode and decode the token price correctly', () => {
        const tokenPrice = '3029.4923923';
        const encoder = new AbiCoder();
        const encodedTokenPrice = encoder.encode(['string'], [tokenPrice]);
        const decodedTokenPrice = encoder.decode(['string'], encodedTokenPrice);

        expect(decodedTokenPrice[0]).to.equal(tokenPrice);
      });

      it('should decode an test payload', function () {
        const encoder = new AbiCoder();
        const tt = '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000012323939302e393339323532343736373831330000000000000000000000000000';
        const decodedTokenPrice = encoder.decode(['string'], tt);
        console.log('decoded: ', decodedTokenPrice);
        expect(decodedTokenPrice[0]).to.eq('2990.9392524767813')

      });
    });

  });
})
