import { HybridComputeSDK } from '@bobanetwork/aa-hc-sdk-server';
import { offchainTokenPrice } from "./token-price";

const port = process.env.OC_LISTEN_PORT || 1234;
const sdk = new HybridComputeSDK();

// Log configuration values
console.log('Config', {
    'OC_LISTEN_PORT': process.env.OC_LISTEN_PORT || 1234,
    'COINRANKING_API_KEY': process.env.COINRANKING_API_KEY || '',
    'OC_HYBRID_ACCOUNT': process.env.OC_HYBRID_ACCOUNT || '',
    'ENTRY_POINTS': process.env.ENTRY_POINTS || '',
    'CHAIN_ID': process.env.CHAIN_ID || '',
    'HC_HELPER_ADDR': process.env.HC_HELPER_ADDR || ''
});

sdk.createJsonRpcServerInstance()
   .addServerAction("getprice(string)", async (params) => {
     console.log("Received params:", params);
     const result = await offchainTokenPrice(sdk, params);
     console.log("Price result:", result);
     return result;
   })
   .listenAt(Number(port));


if (!process.env.JEST_WORKER_ID) {
  console.log(`Hybrid Compute RPC server listening at http://localhost:${port}`);
}

export default sdk;
