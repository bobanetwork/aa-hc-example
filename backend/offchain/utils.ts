import Web3, { HexString } from "web3";

const web3 = new Web3();

/**
 * Generates a selector for a given function name.
 *
 * This function takes a function name as input and returns the first 8
 * characters of the keccak256 hash of the function name. This selector
 * is used by the calling smart-contract to identify the targeting function.
 *
 * @param {string} name - The name of the function for which to generate the selector.
 * @returns {HexString} - The first 8 characters of the keccak256 hash of the function name, representing the function selector.
 */
export const selector = (name: string): HexString => {
  const hex = web3.utils.toHex(web3.utils.keccak256(name));
  return hex.slice(2, 10);
};

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
 * nonces from hexadecimal to number format.
 *
 */
export function parseRequest(params: OffchainParameterParsed) {
  return {
    skey: web3.utils.hexToBytes(params.sk),
    srcAddr: web3.utils.toChecksumAddress(params.srcAddr),
    srcNonce: web3.utils.hexToNumber("0x" + params.srcNonce),
    opNonce: web3.utils.hexToNumber(params.ooNonce),
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
