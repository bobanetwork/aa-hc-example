import {ethers, getBigInt, getBytes, getAddress} from "ethers";
import axios from "axios";
import * as dotenv from "dotenv";
import {addHexPrefix, getSelector, OffchainParameter, OffchainParameterParsed, parseRequest} from "./utils";

dotenv.config();

// Environment variable checks
if (!process.env.CHAIN_ID || !process.env.ENTRY_POINTS || !process.env.HC_HELPER_ADDR ||
    !process.env.OC_HYBRID_ACCOUNT || !process.env.OC_PRIVKEY ||
    !process.env.COINRANKING_API_KEY) {
    console.error('Missing envs: ', process.env.CHAIN_ID, "/", process.env.ENTRY_POINTS, "/", process.env.HC_HELPER_ADDR, "/", process.env.OC_HYBRID_ACCOUNT,
        "/", process.env.OC_OWNER, "/", process.env.OC_PRIVKEY, "/", process.env.COINRANKING_API_KEY)
    throw new Error("Missing required environment variables");
}

const HC_CHAIN = parseInt(process.env.CHAIN_ID);
if (HC_CHAIN === 0) {
    throw new Error("CHAIN_ID cannot be 0");
}

const EP_ADDR = process.env.ENTRY_POINTS;
const HH_ADDR = process.env.HC_HELPER_ADDR;
const HA_ADDR = process.env.OC_HYBRID_ACCOUNT;

if (EP_ADDR.length !== 42 || HH_ADDR.length !== 42 || HA_ADDR.length !== 42) {
    throw new Error("Invalid address length");
}

const EntryPointAddr = getAddress(EP_ADDR);
const HelperAddr = getAddress(HH_ADDR);
const HybridAcctAddr = getAddress(HA_ADDR);
const hc1_key = process.env.OC_PRIVKEY;

if (hc1_key.length !== 66) {
    throw new Error("Invalid private key length");
}

export async function offchainTokenPrice(params: OffchainParameter) {
    const request = parseRequest(params);

    try {
        const tokenSymbol = ethers.AbiCoder.defaultAbiCoder().decode(["string"], request.payload)[0] as string;
        const tokenPrice = (await getTokenPrice(tokenSymbol)).toString();
        console.log("token price: ", tokenPrice);

        const encodedTokenPrice = ethers.AbiCoder.defaultAbiCoder().encode(["string"], [tokenPrice]);
        console.log("ENCODED TOKEN PRICE = ", encodedTokenPrice);
        return generateResponse(request, 0, encodedTokenPrice);
    } catch (error: any) {
        console.log("received error: ", error);
        return generateResponse(request, 1, hexEncode(error.message));
    }
}

const hexEncode = (str: string) => {
    let hex, i;

    let result = "";
    for (i = 0; i < str.length; i++) {
        hex = str.charCodeAt(i).toString(16);
        result += ("000" + hex).slice(-4);
    }

    return `0x${result}`
}

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

export function generateResponse(
    req: OffchainParameterParsed,
    errorCode: number,
    respPayload: string
) {
    respPayload = addHexPrefix(respPayload)

    const encodedResponse = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint32", "bytes"],
        [req.src_addr, req.src_nonce, errorCode, respPayload]
    );
    console.log("EncodedResponse: ", encodedResponse)
    const putResponseCallData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes"],
        [req.sk, encodedResponse]
    );
    console.log("putResponseCallData", putResponseCallData)
    const putResponseEncoded = getSelector("PutResponse", ['bytes32', 'bytes']) + putResponseCallData.slice(2);

    console.log("putResponseEncoded", putResponseEncoded)
    const executeCallData = addHexPrefix(ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bytes"],
        [HelperAddr, 0, addHexPrefix(putResponseEncoded)]
    ));
    const executeEncoded = getSelector("execute", ['address', 'uint256', 'bytes']) + executeCallData.slice(2);
    console.log("executeCallData", executeCallData, addHexPrefix(executeEncoded))

    console.log("RespPayload", respPayload)
    const callGas = BigInt(705) * BigInt(getBytes(respPayload).length) + BigInt(170000);
    console.log("callGas calculation", getBytes(respPayload).length, 4 + getBytes(executeCallData).length, callGas);

    console.log("FINAL VALUES: ", HybridAcctAddr,
        addHexPrefix(req.oo_nonce.toString()),
        ethers.keccak256('0x'), // initCode
        ethers.keccak256(addHexPrefix(executeEncoded)),
        addHexPrefix(callGas.toString(16)),
        '0x10000', // verificationGasLimit
        '0x10000', // preVerificationGas
        '0x0', // maxFeePerGas
        '0x0', // maxPriorityFeePerGas
        ethers.keccak256('0x'), // paymasterAndData
    )

    const finalEncodedParameters = ethers.AbiCoder.defaultAbiCoder().encode(
        [
            'address',
            'uint256',
            'bytes32',
            'bytes32',
            'uint256',
            'uint256',
            'uint256',
            'uint256',
            'uint256',
            'bytes32',
        ],
        [
            addHexPrefix(HybridAcctAddr),
            req.oo_nonce,
            ethers.keccak256('0x'), // initCode
            ethers.keccak256(executeEncoded),
            callGas,
            0x10000, // verificationGasLimit
            0x10000, // preVerificationGas
            0, // maxFeePerGas
            0, // maxPriorityFeePerGas
            ethers.keccak256('0x'), // paymasterAndData
        ]
    );

    console.log("Creating final hash: ", ethers.keccak256(finalEncodedParameters),
        EntryPointAddr,
        HC_CHAIN)

    const finalHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes32", "address", "uint256"],
            [
                ethers.keccak256(finalEncodedParameters),
                addHexPrefix(EntryPointAddr),
                HC_CHAIN,
            ]
        )
    );

    const wallet = new ethers.Wallet(hc1_key);
    const signature = wallet.signingKey.sign(ethers.getBytes(finalHash)).serialized;

    console.log(`Method returning success=${errorCode === 0} response=${respPayload} signature=${signature}`);

    return {
        success: errorCode === 0,
        response: respPayload,
        signature: signature,
    };
}