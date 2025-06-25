import { HybridComputeSDK } from '@bobanetwork/aa-hc-sdk-server';
import { offchainTokenPrice } from "./token-price";

const port = process.env.OC_LISTEN_PORT || 1234;
const sdk = new HybridComputeSDK();

sdk.createJsonRpcServerInstance()
   .addServerAction("getprice(string)", async (params) => {
     console.log("Received params:", params);
     const result = await offchainTokenPrice(params);
     console.log("Price result:", result);
     return result;
   })
   .listenAt(Number(port));


if (!process.env.JEST_WORKER_ID) {
  console.log(`Hybrid Compute RPC server listening at http://localhost:${port}`);
}

export default sdk;
