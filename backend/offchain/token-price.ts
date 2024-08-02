import Web3 from "web3";

import axios from "axios";
import "dotenv/config";
import {
  OffchainParameter,
  parseOffchainParameter,
  parseRequest,
  selector,
} from "./utils";

const web3 = new Web3();

export async function offchainTokenPrice(params: OffchainParameter) {
  console.log("##############################################");
  console.log("offchain token price: ");
  const parsedParams = parseOffchainParameter(params);

  const { ooNonce, payload, sk, srcAddr, srcNonce, ver } = parsedParams;
  console.log(ooNonce, payload, sk, srcAddr, srcNonce, ver);

  const request = parseRequest(parsedParams);
  console.log('got request...', request);
  try {
    const decoded = web3.eth.abi.decodeParameter(
      "string",
      request["reqBytes"]
    ) as string;

    console.log('decoded: ', decoded)

    const tokenPrice = (await getTokenPrice(decoded)).toString();

    console.log('tokenPrice: ', tokenPrice)

    const encodedTokenPrice = web3.eth.abi.encodeParameter(
      "string",
      tokenPrice
    );

    console.log('Generating valid response...');
    return generateResponse(request, 0, encodedTokenPrice);
  } catch (error: any) {
    console.log("Error inside offchainTokenPrice", error);
    const errorResponse = Web3.utils.utf8ToBytes(error.message);
    return generateResponse(request, 1, errorResponse);
  }
}

export async function getTokenPrice(tokenSymbol: string): Promise<number> {
  const coinListUrl = "https://api.coinranking.com/v2/coins";
  const headers = {
    accept: "application/json",
    "x-access-token": process.env.COINRANKING_API_KEY,
  };

  let tokenUuid: string | undefined = undefined;
  let tokenName: string | undefined = undefined;

  try {
    const coinListResponse = await axios.get(coinListUrl, { headers });
    const coinListJson = coinListResponse.data;

    for (const c of coinListJson.data.coins) {
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
      return price;
    } else {
      throw new Error(
        `Error: ${priceResponse.status} ${priceResponse.statusText}`
      );
    }
  } catch (error) {
    throw error;
  }
}

export function generateResponse(
  req: any,
  errorCode: number,
  respPayload: any
) {
  try {
    const ethabi = web3.eth.abi;

    const resp2 = ethabi.encodeParameters(
      ["address", "uint256", "uint32", "bytes"],
      [req.srcAddr, req.srcNonce, errorCode, respPayload]
    );

    const enc1 = ethabi.encodeParameters(
      ["bytes32", "bytes"],
      [req.skey, resp2]
    );

    const pEnc1 = "0x" + selector("PutResponse(bytes32,bytes)") + enc1.slice(2);

    const enc2 = ethabi.encodeParameters(
      ["address", "uint256", "bytes"],
      [web3.utils.toChecksumAddress(process.env.HC_HELPER_ADDR ?? ""), 0, pEnc1]
    );

    const pEnc2 =
      "0x" + selector("execute(address,uint256,bytes)") + enc2.slice(2);

    const limits = {
      verificationGasLimit: "0x10000",
      preVerificationGas: "0x10000",
    };

    const callGas = 705 * respPayload.length + 170000;

    console.log('Using OC_HYBRID_ACCOUNT', process.env.OC_HYBRID_ACCOUNT);

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
        process.env.OC_HYBRID_ACCOUNT,
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
        [
          web3.utils.keccak256(p),
          process.env.ENTRY_POINTS,
          process.env.CHAIN_ID,
        ]
      )
    );

    const account = web3.eth.accounts.privateKeyToAccount(
      process.env.OC_PRIVKEY ?? ""
    );
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
  } catch (error) {
    console.log("error: ", error);
  }
}
