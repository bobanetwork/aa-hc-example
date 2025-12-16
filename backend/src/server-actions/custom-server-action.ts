import axios from "axios";
import "dotenv/config";
import {
    checksumAddress,
    decodeAbiParameters,
    encodeAbiParameters, hexToBytes, hexToNumber,
    hexToString, keccak256,
    parseAbiParameters,
    stringToHex,
    toHex
} from "viem";
import {
    // generateResponseV7,
    getParsedRequest,
    OffchainParameter,
    ServerActionResponse
} from "@bobanetwork/aa-hc-sdk-server";
import {privateKeyToAccount} from "viem/accounts";

/**
 * Custom Server Action
 * A Custom Server Action is a callable function defined on the server side that allows for specific server-side operations to be executed on demand
 * within the AA HC environment. An Example is illustrated below
 */
const generateResponseV7 = async (
    req: {
        readonly srcAddr: string;
        readonly reqBytes: string;
        readonly srcNonce: bigint | number;
        readonly skey: Uint8Array;
        readonly opNonce: bigint | number;
    },
    errorCode: number,
    respPayload: any,
): Promise<ServerActionResponse> => {
    function selectorHex(name: string): string {
        const hex = toHex(keccak256(name as `0x${string}`));
        return hex.slice(0, 10); // Keep 0x prefix
    }
    if (
        !process.env.HC_HELPER_ADDR ||
        !process.env.OC_HYBRID_ACCOUNT ||
        !process.env.CHAIN_ID ||
        !process.env.OC_PRIVKEY ||
        !process.env.ENTRY_POINTS
    ) {
        throw new Error(
            "One or more required environment variables are not defined",
        );
    }

    const resp2 = encodeAbiParameters(
        parseAbiParameters("address, uint256, uint32, bytes"),
        [req.srcAddr as `0x${string}`, BigInt(req.srcNonce), errorCode, respPayload as `0x${string}`],
    );

    const putResponseCallData = encodeAbiParameters(
        parseAbiParameters("bytes32, bytes"),
        [toHex(req.skey), resp2],
    );
    const p_enc1 =
        selectorHex("PutResponse(bytes32,bytes)") + putResponseCallData.slice(2);

    const executeCallData = encodeAbiParameters(
        parseAbiParameters("address, uint256, bytes"),
        [checksumAddress(process.env.HC_HELPER_ADDR as `0x${string}`), BigInt(0), p_enc1 as `0x${string}`],
    );
    const p_enc2 =
        selectorHex("execute(address,uint256,bytes)") + executeCallData.slice(2);

    const limits = {
        verificationGasLimit: "0x10000",
        preVerificationGas: "0x10000",
    };

    const respPayloadBytes = hexToBytes(respPayload as `0x${string}`);
    const callGas = 705 * respPayloadBytes.length + 170000;

    const verificationGasEncoded = encodeAbiParameters(
        parseAbiParameters("uint128"),
        [BigInt(hexToNumber(limits.verificationGasLimit as `0x${string}`))],
    );
    const callGasEncoded = encodeAbiParameters(
        parseAbiParameters("uint128"),
        [BigInt(callGas)],
    );

    const verificationGasPart = verificationGasEncoded.slice(34, 66); // 32 chars
    const callGasPart = callGasEncoded.slice(34, 66); // 32 chars
    const accountGasLimits = "0x" + verificationGasPart + callGasPart;

    const initCodeHash = keccak256("0x");
    const callDataHash = keccak256(p_enc2 as `0x${string}`);
    const paymasterAndDataHash = keccak256("0x");

    const packed = encodeAbiParameters(
        parseAbiParameters("address, uint256, bytes32, bytes32, bytes32, uint256, bytes32, bytes32"),
        [
            process.env.OC_HYBRID_ACCOUNT as `0x${string}`,
            BigInt(req.opNonce),
            initCodeHash,
            callDataHash,
            accountGasLimits as `0x${string}`,
            BigInt(hexToNumber(limits.preVerificationGas as `0x${string}`)),
            ("0x" + "0".repeat(64)) as `0x${string}`,
            paymasterAndDataHash,
        ],
    );

    const packedHash = keccak256(packed);
    const ooHash = keccak256(
        encodeAbiParameters(
            parseAbiParameters("bytes32, address, uint256"),
            [packedHash, process.env.ENTRY_POINTS as `0x${string}`, BigInt(process.env.CHAIN_ID)],
        ),
    );

    const account = privateKeyToAccount(process.env.OC_PRIVKEY! as `0x${string}`);
    console.log("signing...");
    const signature = await account.signMessage({
        message: { raw: ooHash },
    });
    console.log("Message signed:", signature);
    console.log("returning", {success: errorCode === 0, response: respPayload, signature: signature});

    return {
        success: errorCode === 0,
        response: respPayload,
        signature: signature,
    };
};

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
        const res = generateResponseV7(request, 0, encodedTokenPrice);
        console.log("generated response: ", res);
        return res;
    } catch (error: any) {
        console.log("Error in custom server action:", error.message);
        return generateResponseV7(request, 1, stringToHex(error.message));
    }
}