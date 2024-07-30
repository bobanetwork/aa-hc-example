import Web3, {HexString} from "web3";

const web3 = new Web3();

export const selector = (name: string): HexString => {
    const hex = web3.utils.toHex(web3.utils.keccak256(name));
    return hex.slice(2, 10);
}


export function parseOffchainParameter(
    params: OffchainParameter
): OffchainParameterParsed {
    return {
        ooNonce: params.oo_nonce,
        payload: params.payload,
        sk: params.sk,
        srcAddr: params.src_addr,
        srcNonce: params.src_nonce,
        ver: params.ver,
    };
}


export function parseRequest(params: OffchainParameterParsed) {
    console.log("params", params);
    return {
        skey: web3.utils.hexToBytes(params.sk),
        srcAddr: web3.utils.toChecksumAddress(params.srcAddr),
        //srcNonce: web3.utils.toBigInt(params.srcNonce),
        //opNonce: web3.utils.toBigInt(params.ooNonce),
        srcNonce: web3.utils.hexToNumber("0x" + params.srcNonce),
        opNonce: web3.utils.hexToNumber(params.ooNonce),
        //reqBytes: web3.utils.utf8ToBytes(params.payload),
        reqBytes: params.payload,
    } as const;
}

export type OffchainParameterParsed = {
    ver: string;
    sk: string;
    srcAddr: string;
    srcNonce: string;
    ooNonce: string;
    payload: string;
}


export type OffchainParameter = {
    ver: string;
    sk: string;
    src_addr: string;
    src_nonce: string;
    oo_nonce: string;
    payload: string;
}