import Web3 from 'web3';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { getTokenPrice, generateResponse } from '../offchain/token-price';
import { getEnvVars, parseRequest, selector } from '../common/utils';
import {OffchainParameterParsed} from "../offchain/utils";

jest.mock('../common/utils', () => ({
  ...jest.requireActual('../common/utils'),
  getEnvVars: jest.fn(),
  selector: jest.fn(),
}));

const web3 = new Web3();
const mockAxios = new MockAdapter(axios);

describe('getTokenPrice', () => {
  const ENV_VARS = {
    hcHelperAddr: "0x1234567890abcdef1234567890abcdef12345678",
    ocHybridAccount: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
    entryPointAddr: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
    chainId: 1,
    ocPrivateKey: "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae9d1a70c060d56a2",
  };

  beforeAll(() => {
    (getEnvVars as jest.Mock).mockReturnValue(ENV_VARS);
  });

  beforeEach(() => {
    mockAxios.reset();
  });

  it('should return token price for valid token symbol', async () => {
    const coinListResponse = {
      data: {
        coins: [
          { symbol: 'BTC', uuid: 'bitcoin-uuid', name: 'Bitcoin' },
        ],
      },
    };

    const priceResponse = {
      data: {
        price: 30000,
      },
    };

    mockAxios.onGet('https://api.coinranking.com/v2/coins').reply(200, coinListResponse);
    mockAxios.onGet('https://api.coinranking.com/v2/coin/bitcoin-uuid/price').reply(200, priceResponse);

    const price = await getTokenPrice('BTC');
    expect(price).toBe(30000);
  });

  it('should throw an error for invalid token symbol', async () => {
    const coinListResponse = {
      data: {
        coins: [
          { symbol: 'BTC', uuid: 'bitcoin-uuid', name: 'Bitcoin' },
        ],
      },
    };

    mockAxios.onGet('https://api.coinranking.com/v2/coins').reply(200, coinListResponse);

    await expect(getTokenPrice('invalidSymbol')).rejects.toThrow('Token invalidSymbol not found');
  });

  it('should handle API call failures', async () => {
    mockAxios.onGet('https://api.coinranking.com/v2/coins').reply(500);

    await expect(getTokenPrice('BTC')).rejects.toThrow();
  });
});

// TODO: Fix tests in this describe block
describe('generateResponse', () => {
  const ENV_VARS = {
    hcHelperAddr: "0x1234567890abcdef1234567890abcdef12345678",
    ocHybridAccount: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
    entryPointAddr: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
    chainId: 1,
    ocPrivateKey: "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae9d1a70c060d56a2",
  };

  beforeAll(() => {
    (getEnvVars as jest.Mock).mockReturnValue({
      hcHelperAddr: "0x351B40044aa4D5A3Eb69Cb36d6895897EA8Aa844",
      ocHybridAccount: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
      entryPointAddr: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
      chainId: 1,
      ocPrivateKey: "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae9d1a70c060d56a2",
    });
  });
  

  const req = {
    ooNonce: '0x17a581d0f878b31216e82805f1f8c078fb5d4da0000000000000000',
    payload: '000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000064554484141410000000000000000000000000000000000000000000000000000',
    sk: '39290536449ed230865f57f20a1fafada18faa58d3395cbb1cad26d796b8ca25',
    srcAddr: '017a581d0f878b31216e82805f1f8c078fb5d4da',
    srcNonce: '0000000000000000000000000000000000000000000004b00000000000000000',
    ver: '0.2'
  };

  it('should generate a successful response', () => {
    const respPayload = web3.eth.abi.encodeParameter('string', '30000');
    const parsedReq = parseRequest(req as OffchainParameterParsed);
    const response = generateResponse(parsedReq, 0, respPayload);

    expect(response.success).toBe(true);
    expect(response.response).toBe(respPayload);
    expect(response.signature).toBeDefined();
  });

  it('should generate an error response', () => {
    const errorRespPayload = Web3.utils.utf8ToBytes('Error occurred');
    const response = generateResponse(req, 1, errorRespPayload);

    expect(response.success).toBe(false);
    expect(response.response).toBe(errorRespPayload);
    expect(response.signature).toBeDefined();
  });
});

