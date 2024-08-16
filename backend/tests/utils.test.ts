import { ethers } from "ethers";
import "dotenv/config";
import {getSelector, OffchainParameter, parseRequest} from "../offchain/utils";

describe("Utils Functions", () => {
  it("should correctly calculate the selector", () => {
    const name = "getprice";
    const expected = ethers.id(name).slice(2, 10);
    expect(getSelector(name, ["string"])).toBe(expected);
  });

  it("should correctly parse offchain parameters", () => {
    const params: OffchainParameter = {
      oo_nonce: "0x1234",
      payload: "0x5678",
      sk: "0x9abc",
      src_addr: "0xdef0",
      src_nonce: "0x1111",
      ver: "0.2",
    };
    const parsed = parseRequest(params);
    expect(parsed).toEqual({
      ooNonce: "0x1234",
      payload: "0x5678",
      sk: "0x9abc",
      srcAddr: "0xdef0",
      srcNonce: "0x1111",
      ver: "0.2",
    });
  });

  it("should correctly parse request", () => {
    const parsedParams: OffchainParameter = {
      oo_nonce: "0x17a581d0f878b31216e82805f1f8c078fb5d4da0000000000000000",
      payload:
          "000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034554480000000000000000000000000000000000000000000000000000000000",
      sk: "76e2c074d436bac1cf246c55e408088fd19fb8c7034eeee8efb7215217f8e728",
      src_addr: "017a581d0f878b31216e82805f1f8c078fb5d4da",
      src_nonce:
          "0000000000000000000000000000000000000000000004b00000000000000000",
      ver: "0.2",
    };
    const request = parseRequest(parsedParams);
    expect(request).toEqual({
      skey: ethers.getBytes("0x76e2c074d436bac1cf246c55e408088fd19fb8c7034eeee8efb7215217f8e728"),
      srcAddr: ethers.getAddress("0x017a581d0f878b31216e82805f1f8c078fb5d4da"),
      srcNonce: ethers.getBigInt("0x0000000000000000000000000000000000000000000004b00000000000000000"),
      opNonce: ethers.getBigInt("0x17a581d0f878b31216e82805f1f8c078fb5d4da0000000000000000"),
      reqBytes:
          "000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034554480000000000000000000000000000000000000000000000000000000000",
    });
  });

  it("should correctly decode ABI", () => {
    const types = ["string"];
    const data = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test"]);
    const decoded = decodeAbi(types, data);
    expect(decoded).toEqual(["test"]);
  });
});

function decodeAbi(
    types: string[],
    data: string
): { [key: string]: unknown } {
  return ethers.AbiCoder.defaultAbiCoder().decode(types, data);
}