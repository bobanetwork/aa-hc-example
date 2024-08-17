import Web3 from "web3";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import "dotenv/config";
import { getTokenPrice, generateResponse } from "../offchain/token-price";
import { parseRequest } from "../common/utils";
import { OffchainParameterParsed } from "../offchain/utils";

jest.mock("../common/utils", () => ({
  ...jest.requireActual("../common/utils"),
  getEnvVars: jest.fn(),
  selector: jest.fn(),
}));

const web3 = new Web3();
const mockAxios = new MockAdapter(axios);

describe("getTokenPrice", () => {
  beforeAll(() => {
    process.env.OC_LISTEN_PORT = "1234";
    process.env.COINRANKING_API_KEY = "fake-api-key";
    process.env.OC_HYBRID_ACCOUNT =
      "0x734ab78da8f5ad3290b6abf784d0bea6bd480be1";
    process.env.ENTRY_POINTS = "0x43536f912f87490fa70d0AB6D58f8B9CD250394A";
    process.env.CHAIN_ID = "901";
    process.env.OC_PRIVKEY =
      "0x7c0c629efc797f8c5f658919b7efbae01275470d59d03fdeb0fca1e6bd11d7fa";
    process.env.HC_HELPER_ADDR = "0x351B40044aa4D5A3Eb69Cb36d6895897EA8Aa844";
  });

  beforeEach(() => {
    mockAxios.reset();
  });

  it("should return token price for valid token symbol", async () => {
    const coinListResponse = {
      data: {
        coins: [{ symbol: "BTC", uuid: "bitcoin-uuid", name: "Bitcoin" }],
      },
    };

    const priceResponse = {
      data: {
        price: 30000,
      },
    };

    mockAxios
      .onGet("https://api.coinranking.com/v2/coins")
      .reply(200, coinListResponse);
    mockAxios
      .onGet("https://api.coinranking.com/v2/coin/bitcoin-uuid/price")
      .reply(200, priceResponse);

    const price = await getTokenPrice("BTC");
    expect(price).toBe(30000);
  });

  it("should throw an error for invalid token symbol", async () => {
    const coinListResponse = {
      data: {
        coins: [{ symbol: "BTC", uuid: "bitcoin-uuid", name: "Bitcoin" }],
      },
    };

    mockAxios
      .onGet("https://api.coinranking.com/v2/coins")
      .reply(200, coinListResponse);

    await expect(getTokenPrice("invalidSymbol")).rejects.toThrow(
      "Token invalidSymbol not found"
    );
  });

  it("should handle API call failures", async () => {
    mockAxios.onGet("https://api.coinranking.com/v2/coins").reply(500);

    await expect(getTokenPrice("BTC")).rejects.toThrow();
  });
});

describe("generateResponse", () => {
  beforeAll(() => {
    process.env.OC_LISTEN_PORT = "1234";
    process.env.COINRANKING_API_KEY = "fake-api-key";
    process.env.OC_HYBRID_ACCOUNT =
      "0x734ab78da8f5ad3290b6abf784d0bea6bd480be1";
    process.env.ENTRY_POINTS = "0x43536f912f87490fa70d0AB6D58f8B9CD250394A";
    process.env.CHAIN_ID = "901";
    process.env.OC_PRIVKEY =
      "0x7c0c629efc797f8c5f658919b7efbae01275470d59d03fdeb0fca1e6bd11d7fa";
    process.env.HC_HELPER_ADDR = "0x351B40044aa4D5A3Eb69Cb36d6895897EA8Aa844";
  });

  const req = {
    ooNonce: "0x632e348e9de85c51ec6bd68ec9e9a4a24a9181290000000000000000",
    payload:
      "000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034554480000000000000000000000000000000000000000000000000000000000",
    sk: "1afe5cc1cca7a55302e789218daf82b4555b50a42cb41a8476c124a8d05f2eb7",
    srcAddr: "632e348e9de85c51ec6bd68ec9e9a4a24a918129",
    srcNonce:
      "0000000000000000000000000000000000000000000004b00000000000000000",
    ver: "0.2",
  };

  it("should generate a successful response", () => {
    const respPayload = web3.eth.abi.encodeParameter("string", "30000");
    const parsedReq = parseRequest(req as OffchainParameterParsed);
    const response = generateResponse(parsedReq, 0, respPayload);

    expect(response?.success).toBe(true);
    expect(response?.response).toBe(respPayload);
    expect(response?.signature).toBeDefined();
  });

  it("should generate an error response", () => {
    const errorRespPayload = web3.eth.abi.encodeParameter(
      "string",
      "Error occured"
    );
    const parsedReq = parseRequest(req as OffchainParameterParsed);
    const response = generateResponse(parsedReq, 1, errorRespPayload);

    expect(response?.success).toBe(false);
    expect(response?.response).toBe(errorRespPayload);
    expect(response?.signature).toBeDefined();
  });

  it("should decode token price correctly", function () {
    // Remove the '0x' prefix and decode
    const encodedData =
      "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000012323931362e383533383835323736303531360000000000000000000000000000";

    const decodedData = web3.eth.abi.decodeParameter(
        "string",
        encodedData
    ) as string;

    expect(decodedData).toEqual("2916.8538852760516");
  });
});
