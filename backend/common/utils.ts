import { ethers } from "ethers";
import { Request } from "./types";
import "dotenv/config";
import { OffchainParameter, OffchainParameterParsed } from "../offchain/utils";

export function selector(name: string): string {
  return ethers.id(name).slice(0, 10);
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

export function parseRequest(params: OffchainParameterParsed): Request {
  console.log("params", params);
  return {
    skey: ethers.getBytes(params.sk),
    srcAddr: ethers.getAddress(params.srcAddr),
    srcNonce: ethers.getBigInt("0x" + params.srcNonce),
    opNonce: ethers.getBigInt(params.ooNonce),
    reqBytes: params.payload,
  } as const;
}

export function decodeAbi(
    types: string[],
    data: string
): { [key: string]: unknown } {
  return ethers.AbiCoder.defaultAbiCoder().decode(types, data);
}