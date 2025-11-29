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
    console.log("========== START: Custom Server Action ==========");
    console.log("Raw params received:", JSON.stringify(params, null, 2));
    
    const request = getParsedRequest(params)
    console.log("Parsed request:", JSON.stringify(request, null, 2));
    console.log("Request reqBytes type:", typeof request["reqBytes"]);
    console.log("Request reqBytes value:", request["reqBytes"]);
    console.log("Request reqBytes length:", (request["reqBytes"] as string)?.length);
    console.log("Request reqBytes hex length (bytes):", ((request["reqBytes"] as string)?.length - 2) / 2);

    try {
        console.log("Attempting to decode reqBytes");
        let tokenSymbol: string;
        
        try {
            console.log("Trying full ABI decoding...");
            tokenSymbol = decodeAbiParameters(
                [{ type: "string" }],
                request["reqBytes"] as `0x${string}`
            )[0];
            console.log("Successfully decoded with ABI parameters:", tokenSymbol);
        } catch (abiError: any) {
            console.log("ABI decoding failed:", abiError.message);
            console.log("Trying direct hex to string conversion...");
            try {
                tokenSymbol = hexToString(request["reqBytes"] as `0x${string}`, { size: 32 });
                console.log("Successfully decoded with hexToString (size 32):", tokenSymbol);
            } catch (hexError: any) {
                console.log("hexToString with size 32 failed:", hexError.message);
                console.log("Trying hexToString without size...");
                tokenSymbol = hexToString(request["reqBytes"] as `0x${string}`).replace(/\0/g, '').trim();
                console.log("Successfully decoded with hexToString (no size):", tokenSymbol);
            }
        }
        console.log("Final tokenSymbol:", tokenSymbol);

        const headers = {
            accept: "application/json",
            "x-access-token": process.env.COINRANKING_API_KEY,
        };
        console.log("API Key configured:", !!process.env.COINRANKING_API_KEY);

        console.log("Fetching coin list from Coinranking API...");
        const coinListResponse = await axios.get(
            "https://api.coinranking.com/v2/coins",
            {headers}
        );
        console.log("Coin list response received. Total coins:", coinListResponse.data.data.coins.length);
        
        const token = coinListResponse.data.data.coins.find(
            (c: any) => c.symbol === tokenSymbol
        );

        if (!token) {
            console.log("Token not found. Available symbols:", coinListResponse.data.data.coins.slice(0, 10).map((c: any) => c.symbol).join(", "));
            throw new Error(`Token ${tokenSymbol} not found`);
        }
        console.log("Token found:", { uuid: token.uuid, name: token.name, symbol: token.symbol });

        console.log(`Fetching price for token ${token.symbol} (uuid: ${token.uuid})...`);
        const priceResponse = await axios.get(
            `https://api.coinranking.com/v2/coin/${token.uuid}/price`,
            {headers}
        );

        const tokenPrice = priceResponse.data.data.price;
        console.log("Token price received:", tokenPrice);
        
        const encodedTokenPrice = encodeAbiParameters(
            [{ type: "string" }],
            [tokenPrice]
        );
        console.log("Encoded token price:", encodedTokenPrice);
        console.log("Encoded token price length:", encodedTokenPrice.length);

        console.log("Generating success response...");
        const response = generateResponseV7(request, 0, encodedTokenPrice);
        console.log("Response generated:", JSON.stringify(response, null, 2));
        console.log("========== END: Custom Server Action (SUCCESS) ==========");
        return response;
    } catch (error: any) {
        console.log("========== ERROR CAUGHT ==========");
        console.log("Error name:", error.name);
        console.log("Error message:", error.message);
        console.log("Error stack:", error.stack);
        console.log("Full error object:", error);
        console.log("Generating error response...");
        const errorResponse = generateResponseV7(request, 1, stringToHex(error.message));
        console.log("Error response generated:", JSON.stringify(errorResponse, null, 2));
        console.log("========== END: Custom Server Action (ERROR) ==========");
        return errorResponse;
    }
}