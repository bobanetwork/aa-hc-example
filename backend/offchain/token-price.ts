import Web3 from "web3";
import axios from "axios";
import "dotenv/config";
import {HybridComputeSDK, OffchainParameter, generateResponse, getParsedRequest} from "@bobanetwork/aa-hc-sdk-server";

const web3 = new Web3();

function selector(name: string): string {
    const hex = web3.utils.toHex(web3.utils.keccak256(name));
    return hex.slice(2, 10);
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
        
        // Use our CORRECT v0.7 generateResponse method
        console.log("Using CORRECT v0.7 generateResponse...");
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