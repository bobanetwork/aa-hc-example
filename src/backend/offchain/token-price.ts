import assert from "assert";
import Web3 from "web3";
import {
  decodeAbi,
  getEnvVars,
  parseOffchainParameter,
  parseRequest,
  selector,
} from "../common/utils";
import { OffchainParameter } from "../common/types";
import axios from "axios";

const web3 = new Web3();

const ENV_VARS = getEnvVars();

export async function offchainTokenPrice(params: OffchainParameter) {
  console.log("##############################################");
  console.log("offchain token price: ");
  const parsedParams = parseOffchainParameter(params);

  const { ooNonce, payload, sk, srcAddr, srcNonce, ver } = parsedParams;
  console.log(ooNonce, payload, sk, srcAddr, srcNonce, ver);

  assert(ver === "0.2", `Version ${ver} is not 0.2`);

  const request = parseRequest(parsedParams);
  try {
    const decoded = web3.eth.abi.decodeParameter(
      "string",
      request["reqBytes"]
    ) as string;

    const tokenPrice = (await getTokenPrice(decoded)).toString();
    const encodedTokenPrice = web3.eth.abi.encodeParameter(
      "string",
      tokenPrice
    );

    console.log("passing request: ", request);
    return generateResponse(request, 0, encodedTokenPrice);
  } catch (error) {
    console.log("error: ", error);
    const errorResponse = Web3.utils.utf8ToBytes("unknown error");
    return generateResponse(request, 1, errorResponse);
  }
}

async function getTokenPrice(tokenSymbol: string): Promise<number> {
  const coinListUrl = "https://api.coinranking.com/v2/coins";
  const headers = {
    accept: "application/json",
    // "x-access-token": COINRANKING_API_KEY,
  };

  let tokenUuid: string | undefined = undefined;
  let tokenName: string | undefined = undefined;

  try {
    const coinListResponse = await axios.get(coinListUrl, { headers });
    const coinListJson = coinListResponse.data;

    for (const c of coinListJson.data.coins) {
      console.log("c", c.symbol);
      if (c.symbol === tokenSymbol) {
        tokenUuid = c.uuid;
        tokenName = c.name;
        break;
      }
    }

    if (!tokenUuid) {
      throw new Error(`Token ${tokenSymbol} not found`);
    }

    const priceUrl = `https://api.coinranking.com/v2/coin/${tokenUuid}/price`;
    const priceResponse = await axios.get(priceUrl, { headers });

    if (priceResponse.status === 200) {
      const price: number = priceResponse.data.data.price;
      console.log(`Price for ${tokenName}: ${price}`);
      return price;
    } else {
      throw new Error(
        `Error: ${priceResponse.status} ${priceResponse.statusText}`
      );
    }
  } catch (error) {
    console.error("Request failed", error);
    throw error;
  }
}

function generateResponse(req: any, errorCode: number, respPayload: any) {
  const ethabi = web3.eth.abi;

  const resp2 = ethabi.encodeParameters(
    ["address", "uint256", "uint32", "bytes"],
    [req.srcAddr, req.srcNonce, errorCode, respPayload]
  );

  console.log("reqkey", req.skey);

  const enc1 = ethabi.encodeParameters(["bytes32", "bytes"], [req.skey, resp2]);

  const pEnc1 = "0x" + selector("PutResponse(bytes32,bytes)") + enc1.slice(2);

  const enc2 = ethabi.encodeParameters(
    ["address", "uint256", "bytes"],
    [web3.utils.toChecksumAddress(ENV_VARS.hcHelperAddr), 0, pEnc1]
  );

  const pEnc2 =
    "0x" + selector("execute(address,uint256,bytes)") + enc2.slice(2);

  const limits = {
    verificationGasLimit: "0x10000",
    preVerificationGas: "0x10000",
  };

  const callGas = 705 * respPayload.length + 170000;
  console.log(
    "callGas calculation",
    respPayload.length,
    4 + enc2.length,
    callGas
  );

  console.log("opNonce:", req.opNonce);
  const p = ethabi.encodeParameters(
    [
      "address",
      "uint256",
      "bytes32",
      "bytes32",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "bytes32",
    ],
    [
      ENV_VARS.ocHybridAccount,
      req.opNonce,
      web3.utils.keccak256(web3.utils.hexToBytes("0x")), // initCode
      web3.utils.keccak256(web3.utils.hexToBytes(pEnc2)), // p_enc2
      callGas,
      parseInt(limits.verificationGasLimit, 16),
      parseInt(limits.preVerificationGas, 16),
      0, // maxFeePerGas
      0, // maxPriorityFeePerGas
      web3.utils.keccak256(web3.utils.hexToBytes("0x")), // paymasterAndData
    ]
  );

  const ooHash = web3.utils.keccak256(
    ethabi.encodeParameters(
      ["bytes32", "address", "uint256"],
      [web3.utils.keccak256(p), ENV_VARS.entryPointAddr, ENV_VARS.chainId]
    )
  );

  const account = web3.eth.accounts.privateKeyToAccount(ENV_VARS.ocPrivateKey);
  const signature = account.sign(ooHash);

  const success = errorCode === 0;
  console.log(
    `Method returning success=${success} response=${respPayload} signature=${signature.signature}`
  );

  return {
    success,
    response: respPayload,
    signature: signature.signature,
  };
}
