import request from "supertest";
import { getEnvVars, selector } from "../common/utils";
import Web3 from "web3";
import app from "../server";

const web3 = new Web3();

describe("RPC Server", () => {
  it("should respond with the token price", async () => {
    const params = {
      oo_nonce: "0x17a581d0f878b31216e82805f1f8c078fb5d4da0000000000000000",
      payload: web3.eth.abi.encodeParameter("string", "BTC"),
      sk: "76e2c074d436bac1cf246c55e408088fd19fb8c7034eeee8efb7215217f8e728",
      src_addr: "017a581d0f878b31216e82805f1f8c078fb5d4da",
      src_nonce: "0000000000000000000000000000000000000000000004b00000000000000000",
      ver: "0.2",
    };

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
      src_nonce: "0000000000000000000000000000000000000000000004b00000000000000000",
      ver: "0.2",
    };

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