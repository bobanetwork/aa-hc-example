import Web3, { HexString, Web3Eth } from "web3";
import {
  EnvironmentVars,
  Request,
} from "./types";
import "dotenv/config";
import {OffchainParameter, OffchainParameterParsed} from "../offchain/utils";

const web3 = new Web3();

export function selector(name: string): HexString {
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

export function parseRequest(params: OffchainParameterParsed): Request {
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

export function decodeAbi(
  types: string[],
  data: string
): { [key: string]: unknown; __length__: number } {
  return web3.eth.abi.decodeParameters(types, data);
}

export function getEnvVars(): EnvironmentVars {
  return {
    hcSysOwner: process.env.HC_SYS_OWNER ?? "",
    hcSysPrivateKey: process.env.HC_SYS_PRIVKEY ?? "",
    ocOwner: process.env.OC_OWNER ?? "",
    ocPrivateKey: process.env.OC_PRIVKEY ?? "",
    clientOwner: process.env.CLIENT_OWNER ?? "",
    clientPrivateKey: process.env.CLIENT_PRIVKEY ?? "",
    entryPointAddr: process.env.ENTRY_POINTS ?? "",
    hcHelperAddr: process.env.HC_HELPER_ADDR ?? "",
    hcSysAccount: process.env.HC_SYS_ACCOUNT ?? "",
    ocHybridAccount: process.env.OC_HYBRID_ACCOUNT ?? "",
    clientAddr: process.env.CLIENT_ADDR ?? "",
    saFactoryAddr: process.env.SA_FACTORY_ADDR ?? "",
    haFactoryAddr: process.env.HA_FACTORY_ADDR ?? "",
    coinRankingApiKey: process.env.COINRANKING_API_KEY ?? "",
    nodeHttp: process.env.NODE_HTTP ?? "",
    chainId: Number(process.env.CHAIN_ID),
    ocListenPort: Number(process.env.OC_LISTEN_PORT),
    bundlerRpc: process.env.BUNDLER_RPC ?? "",
  };
}
