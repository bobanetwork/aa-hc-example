import React, { useState } from "react";
import { AbiCoder, ethers, Wallet } from "ethers";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { useContractAbi } from "@/hooks/useContractAbi";
import Web3 from "web3";

const TokenPriceFetcher: React.FC = () => {
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenPrice, setTokenPrice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { abi, loading, error: abiError } = useContractAbi();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenSymbol(event.target.value);
  };

  const selector = (name: string) => {
    const web3 = new Web3();
    const hex = web3.utils.toHex(web3.utils.keccak256(name));
    return hex.slice(2, 10);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      if (!window.ethereum) {
        setError("MetaMask is not installed");
        return;
      }

      const provider = new ethers.JsonRpcProvider("http://192.168.178.59:9545");
      console.log("provder", provider);
      // simpleaccount: 0x9f5af42b870AA67D70D8146CFE375B873115C257
      const wallet = new Wallet(
        import.meta.env.VITE_PRIVATE_KEY ?? "",
        provider
      );
      console.log("wallet: ", wallet);
      //const signer = await provider.getSigner();
      //console.log("signer: ", signer);

      const contractAddress = "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c";

      console.log("ABI", abi);
      const contract = new ethers.Contract(contractAddress, abi, wallet);
      console.log("contract: ", contract);

      // Call the smart contract method to get the token price
      //const price = await contract.getTokenPrice(tokenSymbol);
      const tx = await contract.fetchPrice("ETH");
      const receipt = await tx.wait();
      console.log("tx mined: ", tx);
      console.log("receipt: ", receipt);
      const price = await contract.tokenPrices("ETH");
      console.log("Price: ", price);
      setTokenPrice(price);
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
