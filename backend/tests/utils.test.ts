import Web3 from "web3";
import {
  decodeAbi,
  getEnvVars,
  parseOffchainParameter,
  parseRequest,
  selector,
} from "../common/utils";
import "dotenv/config";
import {OffchainParameter} from "../offchain/utils";

const web3 = new Web3();

describe("Utils Functions", () => {
  it("should correctly calculate the selector", () => {
    const name = "getprice";
    const expected = web3.utils.toHex(web3.utils.keccak256(name)).slice(2, 10);
    expect(selector(name)).toBe(expected);
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
    const parsed = parseOffchainParameter(params);
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
    const parsedParams = {
      ooNonce: "0x17a581d0f878b31216e82805f1f8c078fb5d4da0000000000000000",
      payload:
        "000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034554480000000000000000000000000000000000000000000000000000000000",
      sk: "76e2c074d436bac1cf246c55e408088fd19fb8c7034eeee8efb7215217f8e728",
      srcAddr: "017a581d0f878b31216e82805f1f8c078fb5d4da",
      srcNonce:
        "0000000000000000000000000000000000000000000004b00000000000000000",
      ver: "0.2",
    };
    const request = parseRequest(parsedParams);
    expect(request).toEqual({
      skey: web3.utils.hexToBytes(
        "76e2c074d436bac1cf246c55e408088fd19fb8c7034eeee8efb7215217f8e728"
      ),
      srcAddr: web3.utils.toChecksumAddress(
        "017a581d0f878b31216e82805f1f8c078fb5d4da"
      ),
      srcNonce: web3.utils.hexToNumber(
        "0x0000000000000000000000000000000000000000000004b00000000000000000"
      ),
      opNonce: web3.utils.hexToNumber(
        "0x17a581d0f878b31216e82805f1f8c078fb5d4da0000000000000000"
      ),
      reqBytes:
        "000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034554480000000000000000000000000000000000000000000000000000000000",
    });
  });

  it("should correctly decode ABI", () => {
    const types = ["string"];
    const data = web3.eth.abi.encodeParameter("string", "test");
    const decoded = decodeAbi(types, data);
    expect(decoded).toEqual({
      0: "test",
      __length__: 1,
    });
  });

  it("should return environment variables", () => {
    const envVars = getEnvVars();
    expect(envVars).toEqual({
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
    });
  });
});
