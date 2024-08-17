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
export const generateResponse = (
    req: {
        readonly srcAddr: string;
        readonly reqBytes: string;
        readonly srcNonce: bigint | number;
        readonly skey: Uint8Array;
        readonly opNonce: bigint | number
    },
    errorCode: number,
    respPayload: string
) => {
    if (!process.env.HC_HELPER_ADDR) {
        throw new Error("HC_HELPER_ADDR not defined!");
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
        "0x" +
        selector("PutResponse(bytes32,bytes)") +
        putResponseCallData.slice(2);

    const executeCallData = web3.eth.abi.encodeParameters(
        ["address", "uint256", "bytes"],
        [
            web3.utils.toChecksumAddress(process.env.HC_HELPER_ADDR),
            0,
            putResponseEncoded,
        ]
    );
    const executeEncoded =
        "0x" +
        selector("execute(address,uint256,bytes)") +
        executeCallData.slice(2);

    const callGasEstimate = 705 * web3.utils.hexToBytes(respPayload).length + 170000; // needs to be calculated this way for correct signature
    console.log("Final gas estimate: ", callGasEstimate)

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
            process.env.OC_HYBRID_ACCOUNT,
            req.opNonce,
            web3.utils.keccak256("0x"), // initcode
            web3.utils.keccak256(executeEncoded),
            callGasEstimate, // callGas
            0x10000, // verificationGasLimit
            0x10000, // preVerificationGas
            0, // maxFeePerGas
            0, // maxPriorityFeePerGas
            web3.utils.keccak256("0x"), // paymasterAndData
        ]
    );

    const finalHash = web3.utils.keccak256(
        web3.eth.abi.encodeParameters(
            ["bytes32", "address", "uint256"],
            [
                web3.utils.keccak256(finalEncodedParameters),
                process.env.ENTRY_POINTS,
                process.env.CHAIN_ID,
            ]
        )
    );

    // Retrieve account from private key
    const account = web3.eth.accounts.privateKeyToAccount(
        process.env.OC_PRIVKEY!
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
