import Web3 from "web3";
import axios from "axios";
import "dotenv/config";
import {HybridComputeSDK, OffchainParameter, getParsedRequest} from "@bobanetwork/aa-hc-sdk-server";

const web3 = new Web3();

function selector(name: string): string {
    const hex = web3.utils.toHex(web3.utils.keccak256(name));
    return hex.slice(2, 10);
}

export const generateResponseV7_hc = (
    req: {
      readonly srcAddr: string;
      readonly reqBytes: string;
      readonly srcNonce: bigint | number;
      readonly skey: Uint8Array;
      readonly opNonce: bigint | number;
    },
    errorCode: number,
    respPayload: any
  ) => {
    if (
      !process.env.HC_HELPER_ADDR ||
      !process.env.OC_HYBRID_ACCOUNT ||
      !process.env.CHAIN_ID ||
      !process.env.OC_PRIVKEY ||
      !process.env.ENTRY_POINTS
    ) {
      throw new Error("Missing required env vars");
    }
  
    const encodedResponse = web3.eth.abi.encodeParameters(
      ["address", "uint256", "uint32", "bytes"],
      [req.srcAddr, req.srcNonce, errorCode, respPayload]
    );
  
    const putResponseCallData = web3.eth.abi.encodeParameters(
      ["bytes32", "bytes"],
      [req.skey, encodedResponse]
    );
  
    const putResponseEncoded =
      "0x" + selector("PutResponse(bytes32,bytes)") + putResponseCallData.slice(2);
  
    const callDataEncoded = web3.eth.abi.encodeParameters(
      ["address", "uint256", "bytes"],
      [
        web3.utils.toChecksumAddress(process.env.HC_HELPER_ADDR),
        0,
        putResponseEncoded,
      ]
    );
  
    const executeEncoded =
      "0x" + selector("execute(address,uint256,bytes)") + callDataEncoded.slice(2);
  
    const callGasLimit = 705 * web3.utils.hexToBytes(respPayload).length + 170000;
    const verificationGasLimit = 0x10000;
    const preVerificationGas = 0x10000;
  
    // v0.7-specific fields
    const userOp = {
      sender: web3.utils.toChecksumAddress(process.env.OC_HYBRID_ACCOUNT),
      nonce: req.opNonce.toString(),
      call_data: executeEncoded,
      call_gas_limit: callGasLimit.toString(),
      verification_gas_limit: verificationGasLimit.toString(),
      pre_verification_gas: preVerificationGas.toString(),
      max_fee_per_gas: "0",
      max_priority_fee_per_gas: "0",
      paymaster_data: "0x",
      signature: "", // placeholder
      paymaster: "0x0000000000000000000000000000000000000000", // required for v0.7 variant
      factory: "0x0000000000000000000000000000000000000000",
      factory_data: "0x",
      paymaster_verification_gas_limit: "0",
      paymaster_post_op_gas_limit: "0",
      valid_until: "0xffffffffffff", // max uint48
      valid_after: "0x0",
    };
  
    // === ABI ENCODE ORDER as in `UserOperationVariant::hash` in hc.rs
    const hashStruct = web3.eth.abi.encodeParameters(
      [
        "address",   // sender
        "uint256",   // nonce
        "bytes",     // callData
        "uint256",   // callGasLimit
        "uint256",   // verificationGasLimit
        "uint256",   // preVerificationGas
        "uint256",   // maxFeePerGas
        "uint256",   // maxPriorityFeePerGas
        "bytes",     // paymasterData
        "address",   // paymaster
        "address",   // factory
        "bytes",     // factoryData
        "uint256",   // paymasterVerificationGasLimit
        "uint256",   // paymasterPostOpGasLimit
        "uint48",    // validUntil
        "uint48"     // validAfter
      ],
      [
        userOp.sender,
        userOp.nonce,
        userOp.call_data,
        userOp.call_gas_limit,
        userOp.verification_gas_limit,
        userOp.pre_verification_gas,
        userOp.max_fee_per_gas,
        userOp.max_priority_fee_per_gas,
        userOp.paymaster_data,
        userOp.paymaster,
        userOp.factory,
        userOp.factory_data,
        userOp.paymaster_verification_gas_limit,
        userOp.paymaster_post_op_gas_limit,
        userOp.valid_until,
        userOp.valid_after,
      ]
    );
  
    const userOpHashInner = web3.utils.keccak256(hashStruct);
  
    const userOpHash = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(
        ["bytes32", "address", "uint256"],
        [
          userOpHashInner,
          web3.utils.toChecksumAddress(process.env.ENTRY_POINTS),
          process.env.CHAIN_ID,
        ]
      )
    );
  
    // === SIGN LIKE RUST: Ethereum Signed Message prefix
    const prefixedHash = web3.eth.accounts.hashMessage(userOpHash); // adds "\x19Ethereum Signed Message:\n32"
    const signer = web3.eth.accounts.privateKeyToAccount(process.env.OC_PRIVKEY!);
    const signature = signer.sign(prefixedHash);
  
    userOp.signature = signature.signature;
  
    return {
      success: errorCode === 0,
      response: respPayload,
      signature: signature.signature,
      userOperation: userOp,
    };
  };


export async function offchainTokenPrice(sdk: HybridComputeSDK, params: OffchainParameter) {
    const request = getParsedRequest(params)

    try {
        // Tokensymbol was encoded with a string in the smart-contract
        const tokenSymbol = web3.eth.abi.decodeParameter(
            "string",
            request["reqBytes"]
        ) as string;
        const tokenPrice = (await getTokenPrice(tokenSymbol)).toString();
        console.log("token price: ", tokenPrice);

        // Encode fetched token price as a string.
        const encodedTokenPrice = web3.eth.abi.encodeParameter(
            "string",
            tokenPrice
        );
        console.log("ENCODED TOKEN PRICE = ", encodedTokenPrice);
        
        // Use our CORRECT v0.7 generateResponse method
        console.log("Using CORRECT v0.7 generateResponse...");
        return generateResponseV7_hc(request, 0, encodedTokenPrice);
    } catch (error: any) {
        console.log("received error: ", error);
        return generateResponseV7_hc(request, 1, web3.utils.asciiToHex(error.message));
    }
}

/**
 * Retrieves the current price of a specified cryptocurrency token.
 *
 * This asynchronous function fetches the price of a cryptocurrency token
 * by its symbol from the CoinRanking API. It first retrieves the list of
 * coins and searches for the token by its symbol. If found, it fetches
 * the price of the token using its unique identifier.
 *
 * @param {string} tokenSymbol - The symbol of the cryptocurrency token (e.g., 'BTC', 'ETH').
 * @returns {Promise<number>} - A promise that resolves to the current price of the token.
 * @throws {Error} - If the token is not found or if there is an issue with the API requests.
 */
export async function getTokenPrice(tokenSymbol: string): Promise<number> {
    const headers = {
        accept: "application/json",
        "x-access-token": process.env.COINRANKING_API_KEY,
    };

    const coinListResponse = await axios.get(
        "https://api.coinranking.com/v2/coins",
        {headers}
    );
    const token = coinListResponse.data.data.coins.find(
        (c: any) => c.symbol === tokenSymbol
    );

    if (!token) {
        throw new Error(`Token ${tokenSymbol} not found`);
    }

    const priceResponse = await axios.get(
        `https://api.coinranking.com/v2/coin/${token.uuid}/price`,
        {headers}
    );
    return priceResponse.data.data.price;
}