import Web3 from "web3";
import axios from "axios";
import "dotenv/config";
import {
    generateResponse,
    OffchainParameter,
    parseOffchainParameter,
    parseRequest,
    ServerActionResponse
} from "@bobanetwork/aa-hc-sdk-server";

/**
 * Custom Server Action
 * ---
 * A Custom Server Action is a callable function defined on the server side that allows for specific server-side operations to be executed on demand
 * within the AA HC environment. An Example is illustrated below
 *
 */

const web3 = new Web3();

export async function action(params: OffchainParameter): Promise<ServerActionResponse> {
    const parsedParams = parseOffchainParameter(params);
    const request = parseRequest(parsedParams);

    try {
        // Tokensymbol was encoded with a string in the smart-contract
        const tokenSymbol = web3.eth.abi.decodeParameter(
            "string",
            request["reqBytes"]
        ) as string;

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

        const tokenPrice = priceResponse.data.data.price;
        const encodedTokenPrice = web3.eth.abi.encodeParameter("string", tokenPrice);

        console.log("ENCODED TOKEN PRICE = ", encodedTokenPrice);
        return generateResponse(request, 0, encodedTokenPrice);
    } catch (error: any) {
        console.log("received error: ", error);
        return generateResponse(request, 1, web3.utils.asciiToHex(error.message));
    }
}