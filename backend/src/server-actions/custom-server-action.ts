import axios from "axios";
import "dotenv/config";
import { decodeAbiParameters, encodeAbiParameters, stringToHex } from "viem";
import {
    generateResponseV7,
    getParsedRequest,
    OffchainParameter,
    ServerActionResponse
} from "@bobanetwork/aa-hc-sdk-server";

/**
 * Custom Server Action
 * A Custom Server Action is a callable function defined on the server side that allows for specific server-side operations to be executed on demand
 * within the AA HC environment. An Example is illustrated below
 */

export async function action(params: OffchainParameter): Promise<ServerActionResponse> {
    const request = getParsedRequest(params)

    try {
        const tokenSymbol = decodeAbiParameters(
            [{ type: "string" }],
            request["reqBytes"] as `0x${string}`
        )[0];

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
        const encodedTokenPrice = encodeAbiParameters(
            [{ type: "string" }],
            [tokenPrice]
        );

        console.log("ENCODED TOKEN PRICE = ", encodedTokenPrice);
        return generateResponseV7(request, 0, encodedTokenPrice);
    } catch (error: any) {
        console.log("received error: ", error);
        return generateResponseV7(request, 1, stringToHex(error.message));
    }
}