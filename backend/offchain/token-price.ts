import Web3 from "web3";
import axios from "axios";
import "dotenv/config";
import { OffchainParameter, parseOffchainParameter, parseRequest, selector } from "./utils";

const web3 = new Web3();

export async function offchainTokenPrice(params: OffchainParameter) {
    const parsedParams = parseOffchainParameter(params);
    const request = parseRequest(parsedParams);

    try {
        const tokenSymbol = web3.eth.abi.decodeParameter("string", request["reqBytes"]) as string;
        const tokenPrice = (await getTokenPrice(tokenSymbol)).toString();
        console.log('token price: ', tokenPrice);
        const encodedTokenPrice = web3.eth.abi.encodeParameter("string", tokenPrice);
        console.log('ENCODED TOKEN PRICE = ', encodedTokenPrice);
        return generateResponse(request, 0, encodedTokenPrice);
    } catch (error: any) {
        console.log('received error: ', error);
        return generateResponse(request, 1, web3.utils.asciiToHex(error.message));
    }
}

async function getTokenPrice(tokenSymbol: string): Promise<number> {
    const headers = {
        accept: "application/json",
        "x-access-token": process.env.COINRANKING_API_KEY,
    };

    const coinListResponse = await axios.get("https://api.coinranking.com/v2/coins", { headers });
    const token = coinListResponse.data.data.coins.find((c: any) => c.symbol === tokenSymbol);

    if (!token) {
        throw new Error(`Token ${tokenSymbol} not found`);
    }

    const priceResponse = await axios.get(`https://api.coinranking.com/v2/coin/${token.uuid}/price`, { headers });
    return priceResponse.data.data.price;
}

function generateResponse(req: any, errorCode: number, respPayload: string) {
    if (!process.env.HC_HELPER_ADDR) {
        throw new Error("HC_HELPER_ADDR not defined!")
    }

    const resp2 = web3.eth.abi.encodeParameters(
        ["address", "uint256", "uint32", "bytes"],
        [req.srcAddr, req.srcNonce, errorCode, respPayload]
    );

    const enc1 = web3.eth.abi.encodeParameters(["bytes32", "bytes"], [req.skey, resp2]);
    const pEnc1 = "0x" + selector("PutResponse(bytes32,bytes)") + enc1.slice(2);

    const enc2 = web3.eth.abi.encodeParameters(
        ["address", "uint256", "bytes"],
        [web3.utils.toChecksumAddress(process.env.HC_HELPER_ADDR), 0, pEnc1]
    );

    const pEnc2 = "0x" + selector("execute(address,uint256,bytes)") + enc2.slice(2);

    const callGas = 705 * web3.utils.hexToBytes(respPayload).length + 170000;

    const p = web3.eth.abi.encodeParameters(
        ["address", "uint256", "bytes32", "bytes32", "uint256", "uint256", "uint256", "uint256", "uint256", "bytes32"],
        [
            process.env.OC_HYBRID_ACCOUNT,
            req.opNonce,
            web3.utils.keccak256("0x"),
            web3.utils.keccak256(pEnc2),
            callGas,
            0x10000,
            0x10000,
            0,
            0,
            web3.utils.keccak256("0x"),
        ]
    );

    const ooHash = web3.utils.keccak256(
        web3.eth.abi.encodeParameters(
            ["bytes32", "address", "uint256"],
            [web3.utils.keccak256(p), process.env.ENTRY_POINTS, process.env.CHAIN_ID]
        )
    );

    const account = web3.eth.accounts.privateKeyToAccount(process.env.OC_PRIVKEY ?? "");
    const signature = account.sign(ooHash);

    console.log('returning resppayload: ', respPayload)

    return {
        success: errorCode === 0,
        response: respPayload,
        signature: signature.signature,
    };
}