import axios from "axios";
import "dotenv/config";
import { decodeAbiParameters, encodeAbiParameters, hexToString, stringToHex } from "viem";
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
        let tokenSymbol: string;
        
        try {
            tokenSymbol = decodeAbiParameters(
                [{ type: "string" }],
                request["reqBytes"] as `0x${string}`
            )[0];
        } catch (abiError: any) {
            try {
                tokenSymbol = hexToString(request["reqBytes"] as `0x${string}`, { size: 32 });
            } catch (hexError: any) {
                tokenSymbol = hexToString(request["reqBytes"] as `0x${string}`).replace(/\0/g, '').trim();
            }
        }
        
        tokenSymbol = tokenSymbol.replace(/\0/g, '').trim();
        
        if (tokenSymbol.length > 0 && tokenSymbol.charCodeAt(0) < 32) {
            console.log(`Removing leading control character (code: ${tokenSymbol.charCodeAt(0)})`);
            tokenSymbol = tokenSymbol.substring(1);
        }

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
            console.log(`All available symbols:`, coinListResponse.data.data.coins.map((c: any) => c.symbol).join(", "));
            throw new Error(`Token ${tokenSymbol} not found`);
        }
        
        console.log(`Found token: ${token.symbol} (${token.name})`);

        const priceResponse = await axios.get(
            `https://api.coinranking.com/v2/coin/${token.uuid}/price`,
            {headers}
        );

        const tokenPrice = priceResponse.data.data.price;
        const encodedTokenPrice = encodeAbiParameters(
            [{ type: "string" }],
            [tokenPrice]
        );

        console.log("Calling generateResponseV7 with", request, encodedTokenPrice)
        return generateResponseV7(request, 0, encodedTokenPrice);
    } catch (error: any) {
        console.log("Error in custom server action:", error.message);
        return generateResponseV7(request, 1, stringToHex(error.message));
    }
}