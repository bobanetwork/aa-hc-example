import {action} from "./server-actions/custom-server-action";
import { HybridComputeSDK } from '@bobanetwork/aa-hc-sdk-server';

/**  use the HC SDK to create a server, add a rpc method and start the server */
const hybridCompute = new HybridComputeSDK()
    .createJsonRpcServerInstance()
    .addServerAction('getprice(string)', action)
    .listenAt(1234);

console.log(`Started successfully: ${hybridCompute.isServerHealthy()}`)



