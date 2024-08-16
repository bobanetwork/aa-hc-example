import { ethers } from "ethers";

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
  const addHexPrefix = (value: string) => value.startsWith('0x') ? value : `0x${value}`;

  return {
    skey: ethers.getBytes(addHexPrefix(params.sk)),
    srcAddr: ethers.getAddress(addHexPrefix(params.srcAddr)),
    srcNonce: ethers.getBigInt(addHexPrefix(params.srcNonce)),
    opNonce: ethers.getBigInt(addHexPrefix(params.ooNonce)),
    reqBytes: ethers.getBytes(addHexPrefix(params.payload)),
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