import Web3 from "web3";
import axios from "axios";
import "dotenv/config";
import {
  OffchainParameter,
  parseOffchainParameter,
  parseRequest,
  selector,
} from "./utils";

const web3 = new Web3();
const {COINRANKING_API_KEY, OC_HYBRID_ACCOUNT, HC_HELPER_ADDR, ENTRYPOINTS, OC_PRIVKEY, CHAIN_ID} = process.env
if (!COINRANKING_API_KEY || !OC_HYBRID_ACCOUNT || !HC_HELPER_ADDR || !ENTRYPOINTS || !CHAIN_ID || !OC_PRIVKEY) {
  throw new Error('[Offchain API] Environment variables not properly setup!')
}

export async function offchainTokenPrice(params: OffchainParameter) {
  const parsedParams = parseOffchainParameter(params);
  const request = parseRequest(parsedParams);

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
    return generateResponse(request, 0, encodedTokenPrice);
  } catch (error: any) {
    console.log("received error: ", error);
    return generateResponse(request, 1, web3.utils.asciiToHex(error.message));
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
    "x-access-token": COINRANKING_API_KEY,
  };

  const coinListResponse = await axios.get(
    "https://api.coinranking.com/v2/coins",
    { headers }
  );
  const token = coinListResponse.data.data.coins.find(
    (c: any) => c.symbol === tokenSymbol
  );

  if (!token) {
    throw new Error(`Token ${tokenSymbol} not found`);
  }

  const priceResponse = await axios.get(
    `https://api.coinranking.com/v2/coin/${token.uuid}/price`,
    { headers }
  );
  return priceResponse.data.data.price;
}

/**
 * Generates and returns a response object with a signed payload.
 *
 * This function takes a request object, an error code, and a response payload,
 * encodes the necessary parameters, estimates gas, and signs the final encoded
 * parameters before returning the result. It ensures the integrity and
 * authenticity of the response by using the account's private key to sign the
 * hash of the final encoded parameters.
 *
 * @param {object} req - The request object containing source address, nonce, and other details.
 * @param {number} errorCode - The error code to include in the response.
 * @param {string} respPayload - The response payload to include.
 * @returns {object} - An object containing the success status, response payload, and signature.
 * @throws {Error}
 */
export function generateResponse(
  req: any,
  errorCode: number,
  respPayload: string
) {
  const encodedResponse = web3.eth.abi.encodeParameters(
    ["address", "uint256", "uint32", "bytes"],
    [req.srcAddr, req.srcNonce, errorCode, respPayload]
  );
  const putResponseCallData = web3.eth.abi.encodeParameters(
    ["bytes32", "bytes"],
    [req.skey, encodedResponse]
  );
  const putResponseEncoded =
    "0x" +
    selector("PutResponse(bytes32,bytes)") +
    putResponseCallData.slice(2);

  const executeCallData = web3.eth.abi.encodeParameters(
    ["address", "uint256", "bytes"],
    [
      web3.utils.toChecksumAddress(HC_HELPER_ADDR),
      0,
      putResponseEncoded,
    ]
  );
  const executeEncoded =
    "0x" +
    selector("execute(address,uint256,bytes)") +
    executeCallData.slice(2);

  const gasEstimate = 705 * web3.utils.hexToBytes(respPayload).length + 170000;

  const finalEncodedParameters = web3.eth.abi.encodeParameters(
    [
      "address",
      "uint256",
      "bytes32",
      "bytes32",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "bytes32",
    ],
    [
      OC_HYBRID_ACCOUNT,
      req.opNonce,
      web3.utils.keccak256("0x"),
      web3.utils.keccak256(executeEncoded),
      gasEstimate,
      0x10000,
      0x10000,
      0,
      0,
      web3.utils.keccak256("0x"),
    ]
  );

  const finalHash = web3.utils.keccak256(
    web3.eth.abi.encodeParameters(
      ["bytes32", "address", "uint256"],
      [
        web3.utils.keccak256(finalEncodedParameters),
        ENTRYPOINTS,
        CHAIN_ID,
      ]
    )
  );

  // Retrieve account from private key
  const account = web3.eth.accounts.privateKeyToAccount(
    OC_PRIVKEY ?? ""
  );

  // Sign the final hash
  const signature = account.sign(finalHash);

  console.log("Returning response payload:", respPayload);

  return {
    success: errorCode === 0,
    response: respPayload,
    signature: signature.signature,
  };
}
