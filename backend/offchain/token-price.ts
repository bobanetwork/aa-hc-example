import Web3 from "web3";
import axios from "axios";
import "dotenv/config";
import {HybridComputeSDK, generateResponse, OffchainParameter, getParsedRequest} from "@bobanetwork/aa-hc-sdk-server";

const web3 = new Web3();

// Create a wrapper around generateResponse to add detailed logging
function generateResponseWithLogging(request: any, errorCode: number, respPayload: any) {
    console.log('\n=== GENERATE RESPONSE DEBUG ===');
    console.log('Request details:');
    console.log('- srcAddr:', request.srcAddr);
    console.log('- srcNonce:', request.srcNonce, typeof request.srcNonce);
    console.log('- opNonce:', request.opNonce, typeof request.opNonce);
    console.log('- reqBytes length:', request.reqBytes.length);
    
    console.log('Environment variables:');
    console.log('- OC_HYBRID_ACCOUNT:', process.env.OC_HYBRID_ACCOUNT);
    console.log('- ENTRY_POINTS:', process.env.ENTRY_POINTS);
    console.log('- CHAIN_ID:', process.env.CHAIN_ID);
    console.log('- HC_HELPER_ADDR:', process.env.HC_HELPER_ADDR);
    
    // Check private key matches (only show last 6 digits for security)
    const account = web3.eth.accounts.privateKeyToAccount(process.env.OC_PRIVKEY!);
    const addressLastSix = account.address.slice(-6);
    console.log('- Private key address (last 6):', addressLastSix);
    
    console.log('Response payload length:', respPayload.length);
    console.log('Error code:', errorCode);
    
    // Call the original generateResponse
    const result = generateResponse(request, errorCode, respPayload);
    
    console.log('Generated response:');
    console.log('- success:', result.success);
    console.log('- response length:', result.response.length);
    console.log('- signature:', result.signature);
    console.log('=== END DEBUG ===\n');
    
    return result;
}

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
        
        return generateResponseWithLogging(request, 0, encodedTokenPrice);
    } catch (error: any) {
        console.log("received error: ", error);
        return generateResponseWithLogging(request, 1, web3.utils.asciiToHex(error.message));
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