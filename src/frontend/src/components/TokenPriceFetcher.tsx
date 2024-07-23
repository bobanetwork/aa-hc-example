import React, { useState } from "react";
import { ethers } from "ethers";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { useContractAbi } from "@/hooks/useContractAbi";

const TokenPriceFetcher: React.FC = () => {
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenPrice, setTokenPrice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { abi, loading, error: abiError } = useContractAbi();

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

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log("signer: ", signer);

      const contractAddress = "0xe9222E9Fa9bCc6b3c71aA524e8C799D1e8383959";

      const contract = new ethers.Contract(contractAddress, abi, signer);

      // Call the smart contract method to get the token price
      //const price = await contract.getTokenPrice(tokenSymbol);
      const x = await contract.withdraw();
      //setTokenPrice(price.toString());
      console.log("XXXX: ", x)
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
