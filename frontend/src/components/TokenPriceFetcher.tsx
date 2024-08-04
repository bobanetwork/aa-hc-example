import React, { useState } from "react";
import { AbiCoder, ethers, JsonRpcProvider, Wallet } from "ethers";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useContractAbi } from "@/hooks/useContractAbi";
import Web3 from "web3";
import axios from "axios";
import { hasMetaMask } from "@/lib/metamask";
import * as process from "process";

interface OpParams {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

interface EstimationResult {
  preVerificationGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
}

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const TokenPriceFetcher: React.FC = () => {
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenPrice, setTokenPrice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    abi: tokenAbi,
    loading,
    error: abiError,
  } = useContractAbi("TokenPrice");
  const { abi: epAbi, loading: _, error: epError } = useContractAbi("EP");
  const bundlerRpc = import.meta.env.VITE_BUNDLER_RPC;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenSymbol(event.target.value);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      if (!window.ethereum) {
        setError("MetaMask is not installed");
        return;
      }

      const provider = new ethers.JsonRpcProvider("https://sepolia.boba.network");
      // simpleaccount: 0x9f5af42b870AA67D70D8146CFE375B873115C257
      const wallet = new Wallet(
        import.meta.env.VITE_PRIVATE_KEY ?? "",
        provider
      );
      console.log("wallet: ", wallet);

      const tokenPriceAddress = import.meta.env.VITE_TOKEN_PRICE_CONTRACT!;
      const contract = new ethers.Contract(tokenPriceAddress, tokenAbi, wallet);

      const price = await contract.tokenPrices("ETH");
      const price2 = price[0] || price['0'];  // Assuming the first property is the price string

      console.log('fetched price: ', price)

      if (price2 === '' || price2 === 0) {
        setTokenPrice('0')
      } else {
        setTokenPrice(price);
      }

    } catch (error) {
      console.error(error);
      // setError(error as string);
    }
  };


  return (
    <div className="flex flex-col items-center space-y-2">
      <Label>Please enter a token symbol:</Label>
      <div className="flex items-center space-x-2">
        <Input
          style={{ width: "200px" }}
          placeholder="Token symbol"
          value={tokenSymbol}
          onChange={handleInputChange}
        />
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Submit
        </button>
      </div>
      {tokenPrice && (
        <div className="mt-4">
          <Label>Token Price: {tokenPrice}</Label>
        </div>
      )}
      {error && (
        <div className="mt-4 text-red-500">
          <Label>Error: {error}</Label>
        </div>
      )}
    </div>
  );
};

export default TokenPriceFetcher;
