import {ethers, getBigInt, getBytes, getAddress} from "ethers";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

// Environment variable checks
if (!process.env.CHAIN_ID || !process.env.ENTRY_POINTS || !process.env.HC_HELPER_ADDR ||
    !process.env.OC_HYBRID_ACCOUNT || !process.env.OC_OWNER || !process.env.OC_PRIVKEY ||
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
const HA_OWNER = process.env.OC_OWNER;

if (EP_ADDR.length !== 42 || HH_ADDR.length !== 42 || HA_ADDR.length !== 42 || HA_OWNER.length !== 42) {
  throw new Error("Invalid address length");
}

const EntryPointAddr = getAddress(EP_ADDR);
const HelperAddr = getAddress(HH_ADDR);
const HybridAcctAddr = getAddress(HA_ADDR);
const hc1_addr = getAddress(HA_OWNER);
const hc1_key = process.env.OC_PRIVKEY;

if (hc1_key.length !== 66) {
  throw new Error("Invalid private key length");
}

interface OffchainParameter {
  sk: string;
  src_addr: string;
  src_nonce: string;
  oo_nonce: string;
  payload: string;
}

function selector(name: string): string {
  return ethers.id(name).slice(0, 10);
}

function parseOffchainParameter(params: OffchainParameter): OffchainParameter {
  return {
    sk: params.sk,
    src_addr: params.src_addr,
    src_nonce: params.src_nonce,
    oo_nonce: params.oo_nonce,
    payload: params.payload,
  };
}

function parseRequest(req: OffchainParameter) {
  return {
    skey: getBytes(req.sk),
    srcAddr: getAddress(req.src_addr),
    srcNonce: getBigInt(req.src_nonce),
    opNonce: getBigInt(req.oo_nonce),
    reqBytes: getBytes(req.payload)
  };
}

export async function offchainTokenPrice(params: OffchainParameter) {
  const parsedParams = parseOffchainParameter(params);
  const request = parseRequest(parsedParams);

  try {
    const tokenSymbol = ethers.AbiCoder.defaultAbiCoder().decode(["string"], request.reqBytes)[0] as string;
    const tokenPrice = (await getTokenPrice(tokenSymbol)).toString();
    console.log("token price: ", tokenPrice);

    const encodedTokenPrice = ethers.AbiCoder.defaultAbiCoder().encode(["string"], [tokenPrice]);
    console.log("ENCODED TOKEN PRICE = ", encodedTokenPrice);
    return generateResponse(request, 0, encodedTokenPrice);
  } catch (error: any) {
    console.log("received error: ", error);
    return generateResponse(request, 1, error.message); //ethers.toUtf8Bytes(error.message));
  }
}

export async function getTokenPrice(tokenSymbol: string): Promise<number> {
  const headers = {
    accept: "application/json",
    "x-access-token": process.env.COINRANKING_API_KEY,
  };

  const coinListResponse = await axios.get(
      "https://api.coinranking.com/v2/coins",
      { headers }
  );
  const token = coinListResponse.data.data.coins.find(
      (c: any) => c.symbol === tokenSymbol
  );

  if (!token) {
    throw new Error(`Token ${tokenSymbol} not found`);
  }

  const priceResponse = await axios.get(
      `https://api.coinranking.com/v2/coin/${token.uuid}/price`,
      { headers }
  );
  return priceResponse.data.data.price;
}

export function generateResponse(
    req: any,
    errorCode: number,
    respPayload: string
) {
  const encodedResponse = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "uint32", "bytes"],
      [req.srcAddr, req.srcNonce, errorCode, respPayload]
  );
  const putResponseCallData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "bytes"],
      [req.skey, encodedResponse]
  );
  const putResponseEncoded = selector("PutResponse(bytes32,bytes)") + putResponseCallData.slice(2);

  const executeCallData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "bytes"],
      [HelperAddr, 0, putResponseEncoded]
  );
  const executeEncoded = selector("execute(address,uint256,bytes)") + executeCallData.slice(2);

  const callGas = BigInt(705) * BigInt(getBytes(respPayload).length) + BigInt(170000);
  console.log("callGas calculation", getBytes(respPayload).length, 4 + getBytes(executeCallData).length, callGas);

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
        HybridAcctAddr,
        req.opNonce,
        ethers.keccak256('0x'),
        ethers.keccak256(executeEncoded),
        callGas,
        0x10000,
        0x10000,
        0,
        0,
        ethers.keccak256('0x'),
      ]
  );

  const finalHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
          ["bytes32", "address", "uint256"],
          [
            ethers.keccak256(finalEncodedParameters),
            EntryPointAddr,
            HC_CHAIN,
          ]
      )
  );

  const wallet = new ethers.Wallet(hc1_key);
  const signature = wallet.signMessageSync(getBytes(finalHash));

  console.log(`Method returning success=${errorCode === 0} response=${respPayload} signature=${signature}`);

  return {
    success: errorCode === 0,
    response: respPayload,
    signature: signature,
  };
}