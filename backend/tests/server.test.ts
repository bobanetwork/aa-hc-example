import request from "supertest";
import { selector } from "../common/utils";
import Web3 from "web3";
import "dotenv/config";
import app from "../offchain/server";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

const web3 = new Web3();
const mockAxios = new MockAdapter(axios);

describe("RPC Server", () => {
  beforeAll(() => {
    process.env.OC_LISTEN_PORT = "1234";
    process.env.COINRANKING_API_KEY = "fake-api-key";
    process.env.OC_HYBRID_ACCOUNT =
      "0xd0ca3C1ECa49635259f6c577A09634053Ab79577";
    process.env.ENTRY_POINTS = "0x43536f912f87490fa70d0AB6D58f8B9CD250394A";
    process.env.CHAIN_ID = "901";
    process.env.OC_PRIVKEY =
      "0x7c0c629efc797f8c5f658919b7efbae01275470d59d03fdeb0fca1e6bd11d7fa";
    process.env.HC_HELPER_ADDR = "0x351B40044aa4D5A3Eb69Cb36d6895897EA8Aa844";
  });

  beforeEach(() => {
    mockAxios.reset();
  });

  it("should respond with the token price", async () => {
    const params = {
      oo_nonce: "0x17a581d0f878b31216e82805f1f8c078fb5d4da0000000000000000",
      payload: web3.eth.abi.encodeParameter("string", "BTC"),
      sk: "76e2c074d436bac1cf246c55e408088fd19fb8c7034eeee8efb7215217f8e728",
      src_addr: "017a581d0f878b31216e82805f1f8c078fb5d4da",
      src_nonce:
        "0000000000000000000000000000000000000000000004b00000000000000000",
      ver: "0.2",
    };

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

    const response = await request(app)
      .post("/hc")
      .send({ method: selector("getprice(string)"), params });

    expect(response.status).toBe(200);
    expect(response.body.result).toBeDefined();
    expect(response.body.result.success).toBe(true);
    expect(response.body.result.response).toBeDefined();
    expect(response.body.result.signature).toBeDefined();
  });

  it("should respond with error for invalid token symbol", async () => {
    const params = {
      oo_nonce: "0x17a581d0f878b31216e82805f1f8c078fb5d4da0000000000000000",
      payload: web3.eth.abi.encodeParameter("string", "invalidSymbol"),
      sk: "76e2c074d436bac1cf246c55e408088fd19fb8c7034eeee8efb7215217f8e728",
      src_addr: "017a581d0f878b31216e82805f1f8c078fb5d4da",
      src_nonce:
        "0000000000000000000000000000000000000000000004b00000000000000000",
      ver: "0.2",
    };

    const coinListResponse = {
      data: {
        coins: [{ symbol: "BTC", uuid: "bitcoin-uuid", name: "Bitcoin" }],
      },
    };

    mockAxios
      .onGet("https://api.coinranking.com/v2/coins")
      .reply(200, coinListResponse);

    const response = await request(app)
      .post("/hc")
      .send({ method: selector("getprice(string)"), params });

    expect(response.status).toBe(200);
    expect(response.body.result.success).toBe(false);
    expect(response.body.result.response).toBeDefined();
    expect(response.body.result.signature).toBeDefined();
  });

  it("should return error for invalid method", async () => {
    const response = await request(app)
      .post("/hc")
      .send({ method: "invalidMethod", params: {} });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});
