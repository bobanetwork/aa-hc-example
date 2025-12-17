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
        return hex.slice(0, 10);
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

    const err_code = errorCode;

    const enc_merged_response = encodeAbiParameters(
        parseAbiParameters("address, uint256, uint32, bytes"),
        [req.srcAddr.toLowerCase() as `0x${string}`, BigInt(req.srcNonce), err_code, respPayload as `0x${string}`],
    );

    const p1_enc = encodeAbiParameters(
        parseAbiParameters("bytes32, bytes"),
        [toHex(req.skey), enc_merged_response as `0x${string}`],
    );
    const putResponseCallData = selectorHex("PutResponse(bytes32,bytes)") + p1_enc.slice(2);

    const p2_enc = encodeAbiParameters(
        parseAbiParameters("address, uint256, bytes"),
        [process.env.HC_HELPER_ADDR.toLowerCase() as `0x${string}`, BigInt(0), putResponseCallData as `0x${string}`],
    );
    const executeCallData = selectorHex("execute(address,uint256,bytes)") + p2_enc.slice(2);

    const respPayloadBytes = hexToBytes(respPayload as `0x${string}`);
    const call_gas_limit = 705 * respPayloadBytes.length + 170000;
    const verification_gas_limit = 0x10000;
    const pre_verification_gas = 0x10000;
    const max_fee_per_gas = 0;
    const max_priority_fee_per_gas = 0;

    const verificationGasEncoded = encodeAbiParameters(
        parseAbiParameters("uint128"),
        [BigInt(verification_gas_limit)],
    );
    const callGasEncoded = encodeAbiParameters(
        parseAbiParameters("uint128"),
        [BigInt(call_gas_limit)],
    );

    const verificationGasPart = verificationGasEncoded.slice(34, 66);
    const callGasPart = callGasEncoded.slice(34, 66);
    const accountGasLimits = ("0x" + verificationGasPart + callGasPart) as `0x${string}`;

    const initCodeHash = keccak256("0x");
    const callDataHash = keccak256(executeCallData as `0x${string}`);
    const paymasterAndDataHash = keccak256("0x");

    const packed = encodeAbiParameters(
        parseAbiParameters("address, uint256, bytes32, bytes32, bytes32, uint256, bytes32, bytes32"),
        [
            process.env.OC_HYBRID_ACCOUNT!.toLowerCase() as `0x${string}`,
            BigInt(req.opNonce),
            initCodeHash,
            callDataHash,
            accountGasLimits,
            BigInt(pre_verification_gas),
            ("0x" + "0".repeat(64)) as `0x${string}`,
            paymasterAndDataHash,
        ],
    );

    const packedHash = keccak256(packed);
    const ooHash = keccak256(
        encodeAbiParameters(
            parseAbiParameters("bytes32, address, uint256"),
            [packedHash, process.env.ENTRY_POINTS!.toLowerCase() as `0x${string}`, BigInt(process.env.CHAIN_ID!)],
        ),
    );

    const account = privateKeyToAccount(process.env.OC_PRIVKEY! as `0x${string}`);
    console.log('ooHash:', ooHash);
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
        const res = await generateResponseV7(request, 0, encodedTokenPrice);
        console.log("generated response: ", res);
        return res;
    } catch (error: any) {
        console.log("Error in custom server action:", error.message);
        return generateResponseV7(request, 1, stringToHex(error.message));
    }
}