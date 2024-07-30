import React, { useState } from "react";
import { AbiCoder, BytesLike, ethers, JsonRpcProvider, Wallet } from "ethers";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { useContractAbi } from "@/hooks/useContractAbi";
import Web3 from "web3";
import axios from "axios";

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

      const provider = new ethers.JsonRpcProvider("http://192.168.178.37:9545");
      // simpleaccount: 0x9f5af42b870AA67D70D8146CFE375B873115C257
      const wallet = new Wallet(
        import.meta.env.VITE_PRIVATE_KEY ?? "",
        provider
      );
      console.log("wallet: ", wallet);
      //const signer = await provider.getSigner();
      //console.log("signer: ", signer);

      const contractAddress = "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c";
      const abiCoder = new AbiCoder();
      console.log("ABI", tokenAbi);
      const contract = new ethers.Contract(contractAddress, tokenAbi, wallet);
      console.log("contract: ", contract);
      const tokenSymbol = "ETH";
      const gameCall = ethers.hexlify(
        ethers.concat([
          "0x" + selector("fetchPrice(string)"),
          abiCoder.encode(["string"], [tokenSymbol]),
        ])
      );

      const TokenPriceContract = { address: contractAddress };
      const exCall = ethers.hexlify(
        ethers.concat([
          "0x" + selector("execute(address,uint256,bytes)"),
          abiCoder.encode(
            ["address", "uint256", "bytes"],
            [TokenPriceContract.address, 0, gameCall]
          ),
        ])
      );
      const EP = new ethers.Contract(
        "0x4667F5C81e302Cb770944F4aEd2d6BCbf98097fB",
        epAbi,
        provider
      );
      const uAddr = Web3.utils.toChecksumAddress(
        "0x77Fe14A710E33De68855b0eA93Ed8128025328a9"
      );
      const transactionCount = await provider.getTransactionCount(uAddr);

      // Calculate nKey
      const nKey = 1200 + (transactionCount % 7);

      let p = await buildOp(
        import.meta.env.VITE_CLIENT_ADDR,
        nKey,
        exCall,
        provider
      );
      const opHash = await EP.getFunction("getUserOpHash")(packOp(p));
      const messageHash = ethers.getBytes(opHash);
      const encodedMessage = ethers.hashMessage(messageHash);
      const signature = wallet.signMessage(ethers.getBytes(encodedMessage));
      const hexSignature = await signature;
      p = {
        ...p,
        signature: hexSignature,
      };
      const epAddress = await EP.getAddress();
      const estOp = await estimateOp(p, epAddress);

      // Call the smart contract method to get the token price
      //const price = await contract.getTokenPrice(tokenSymbol);
      // const tx = await contract.fetchPrice("ETH");
      // const receipt = await tx.wait();
      // console.log("tx mined: ", tx);
      // console.log("receipt: ", receipt);
      const price = await contract.tokenPrices("ETH");
      console.log("Price: ", price);
      setTokenPrice(price);
    } catch (error) {
      console.error(error);
      // setError(error as string);
    }
  };

  async function buildOp(
    senderAddr: string,
    nKey: number,
    payload: string,
    provider: JsonRpcProvider
  ) {
    const EP = new ethers.Contract(
      "0x4667F5C81e302Cb770944F4aEd2d6BCbf98097fB",
      epAbi,
      provider
    );
    const w3 = new Web3(Web3.givenProvider);

    const senderNonce = await EP.getFunction("getNonce")(senderAddr, nKey);
    console.log("sendernonce: ", senderNonce);

    const maxPriorityFeePerGas = await w3.eth.getMaxPriorityFeePerGas();
    const gasPrice = await w3.eth.getGasPrice();
    const baseFee = gasPrice - maxPriorityFeePerGas;
    if (baseFee <= 0) throw new Error("Base fee must be greater than 0");

    const fee = BigInt(
      Math.max(
        Number(gasPrice),
        Number(baseFee) + Math.max(Number(maxPriorityFeePerGas), 2500000)
      )
    );

    console.log(
      "Using gas prices",
      fee,
      Math.max(Number(maxPriorityFeePerGas), 2500000),
      "detected",
      gasPrice,
      maxPriorityFeePerGas
    );

    //console.log("nonce: :", ethers.hexlify(senderNonce));

    const p = {
      sender: senderAddr,
      //nonce: ethers.hexlify(senderNonce),
      nonce: Web3.utils.toHex(senderNonce),
      initCode: "0x",
      callData: Web3.utils.toHex(payload),
      callGasLimit: "0x0",
      //verificationGasLimit: ethers.hexlify(uintArr),
      verificationGasLimit: "0x0",
      preVerificationGas: "0x0",
      maxFeePerGas: ethers.hexlify(ethers.toUtf8Bytes(fee.toString())),
      maxPriorityFeePerGas: w3.utils.toHex(
        BigInt(Math.max(Number(maxPriorityFeePerGas), 2500000))
      ),
      paymasterAndData: "0x",
      signature:
        "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
    };

    return p;
  }

  function packOp(op: {
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
  }): [
    string,
    BigInt,
    string,
    Uint8Array,
    BigInt,
    BigInt,
    BigInt,
    BigInt,
    BigInt,
    string,
    Uint8Array
  ] {
    return [
      op.sender,
      BigInt(op.nonce),
      op.initCode,
      ethers.getBytes(op.callData),
      BigInt(op.callGasLimit),
      BigInt(op.verificationGasLimit),
      BigInt(op.preVerificationGas),
      BigInt(op.maxFeePerGas),
      BigInt(op.maxPriorityFeePerGas),
      op.paymasterAndData,
      ethers.getBytes(op.signature),
    ];
  }

  async function estimateOp(
    p: OpParams,
    epAddress: any
  ): Promise<[OpParams, BigInt]> {
    // p.signature =
    //   "0xb49d2d5abcfbe61fecb4f14ae24c62a20a5a28105fefe6cecf36e60f6166392b23f7dcc6a30ae591d3d9a791e34ea66ba92776d447537be3e44ce2d0ac60ab091c";
    // p.preVerificationGas = "0x1E8480";
    // p.verificationGasLimit = "0x1E8480";
    // p.callGasLimit = "0x1E8480";
    // p.maxFeePerGas = "0x1E8480";
    // p.maxPriorityFeePerGas = "0x1E8480";
    p.preVerificationGas = "0xffffff";
    p.verificationGasLimit = "0xffffff"
    p.callGasLimit = "0x0";
    const estParams = [p, epAddress];
    //console.log(`Estimation params ${JSON.stringify(estParams)}`);
    let gasFees = {
      estGas: BigInt(0),
    };
    try {
      const test = [
        {
          sender: "0x632e348E9dE85C51EC6bd68eC9E9a4a24a918129",
          nonce: "0x4b00000000000000000",
          initCode: "0x",
          callData:
            "0xb61d27f60000000000000000000000003aa5ebb10dc797cac828524e59a333d0a371443c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000649782dd2a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003455448000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          callGasLimit: "0x0",
          verificationGasLimit: "0x0",
          preVerificationGas: "0x0",
          maxFeePerGas: "0x28dba0",
          maxPriorityFeePerGas: "0x2625a0",
          paymasterAndData: "0x",
          signature:
            "0xb49d2d5abcfbe61fecb4f14ae24c62a20a5a28105fefe6cecf36e60f6166392b23f7dcc6a30ae591d3d9a791e34ea66ba92776d447537be3e44ce2d0ac60ab091c",
        },
        "0x4667F5C81e302Cb770944F4aEd2d6BCbf98097fB",
      ];
      console.log("estParams: ", JSON.stringify(estParams));
      console.log("copied:", test);

      const response = await axios.post(bundlerRpc, {
        jsonrpc: "2.0",
        method: "eth_estimateUserOperationGas",
        params: estParams,
        // params: test,
        id: 1,
      });

      console.log("estimateGas response", response.data);

      if (response.data.error) {
        console.log("*** eth_estimateUserOperationGas failed");
        // Use default gas limits in case of failure
        p.preVerificationGas = "0xffff";
        p.verificationGasLimit = "0xffff";
        p.callGasLimit = "0x40000";
      } else {
        const estResult: EstimationResult = response.data.result;

        p.preVerificationGas = ethers.hexlify(
          Web3.utils.toHex(BigInt(estResult.preVerificationGas))
        );
        p.verificationGasLimit = ethers.hexlify(
          Web3.utils.toHex(BigInt(estResult.verificationGasLimit))
        );
        p.callGasLimit = ethers.hexlify(
          Web3.utils.toHex(BigInt(estResult.callGasLimit))
        );

        gasFees.estGas =
          BigInt(estResult.preVerificationGas) +
          BigInt(estResult.verificationGasLimit) +
          BigInt(estResult.callGasLimit);

        console.log("estimateGas total =", gasFees.estGas);
      }
    } catch (error) {
      console.error("Error estimating gas:", error);
      p.preVerificationGas = "0xffff";
      p.verificationGasLimit = "0xffff";
      p.callGasLimit = "0x40000";
    }

    return [p, gasFees.estGas || BigInt(0)];
  }

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
