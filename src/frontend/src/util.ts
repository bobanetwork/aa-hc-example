import axios from 'axios';
import Web3 from 'web3';

const JSON_RPC_URL = 'https://bobahackers-rpc.hackathon.sepolia.boba.network/';

const headers = {
  'Access-Control-Allow-Origin': '*',
};

const jsonRpcCall = async (method: any, params: any) => {
  try {
    const response = await axios.post(
      JSON_RPC_URL,
      {
        jsonrpc: '2.0',
        method,
        params,
        id: 1,
      }
      // { headers: headers }
    );
    return response.data.result;
  } catch (error) {
    console.error('JSON-RPC call failed', error);
    throw error;
  }
};

export const getStory = async () => {
  return jsonRpcCall('getStory', []);
};

export const submitAction = async (gameId: any, action: any) => {
  const method = Web3.utils
    .keccak256('submitAction(string,uint32)')
    .substring(0, 10);
  return jsonRpcCall(method, [gameId, action]);
};
