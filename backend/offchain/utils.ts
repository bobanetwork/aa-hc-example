import { ethers } from "ethers";

/**
 * Parse arguments to object.
 */
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

/**
 * Parses offchain parameters and returns a structured request object.
 *
 * This function takes an object containing offchain parameters, parses them,
 * and returns an object with properly formatted values. It converts the secret
 * key to bytes, ensures the source address is in checksum format, and converts
 * nonces from hexadecimal to bigint format.
 *
 */
export function parseRequest(params: OffchainParameterParsed) {
  return {
    skey: ethers.getBytes(params.sk),
    srcAddr: ethers.getAddress(params.srcAddr),
    srcNonce: ethers.getBigInt("0x" + params.srcNonce),
    opNonce: ethers.getBigInt(params.ooNonce),
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
};

export type OffchainParameter = {
  ver: string;
  sk: string;
  src_addr: string;
  src_nonce: string;
  oo_nonce: string;
  payload: string;
};