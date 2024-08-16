import {ethers} from "ethers";

export const getSelector = (name: string, params: string[]) => ethers.FunctionFragment.getSelector("getprice", ["string"]).slice(2)

export type OffchainParameter = {
  ver: string;
  sk: string;
  src_addr: string;
  src_nonce: string;
  oo_nonce: string;
  payload: string;
};

export type OffchainParameterParsed = {
  ver: string;
  sk: Uint8Array;
  src_addr: string;
  src_nonce: bigint;
  oo_nonce: bigint;
  payload: Uint8Array;
};

export const parseRequest = (params: OffchainParameter): OffchainParameterParsed => {
  const addHexPrefix = (value: string) => value.startsWith('0x') ? value : `0x${value}`;
  return {
    ver: params.ver,
    sk: ethers.getBytes(addHexPrefix(params.sk)),
    src_addr: ethers.getAddress(addHexPrefix(params.src_addr)),
    src_nonce: ethers.getBigInt(addHexPrefix(params.src_nonce)),
    oo_nonce: ethers.getBigInt(addHexPrefix(params.oo_nonce)),
    payload: ethers.getBytes(addHexPrefix(params.payload)),
  };
}