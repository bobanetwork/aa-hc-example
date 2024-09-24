import { AbiCoder, concat, ethers, FunctionFragment, hexlify } from "ethers";
import {CreateInvokeTransaction, InvokeTransactionOptions} from "@/components/hybrid-compute-client-sdk.interface.ts";

/**
 * HybridComputeClientSDK class for building and invoking transactions
 */
export class HybridComputeClientSDK {
    private chain: string;
    private accountIdConnected: string;
    private abiCoder: ethers.AbiCoder;

    /**
     * Constructor for HybridComputeClientSDK
     * @param chain - The blockchain network
     * @param accountIdConnected - The connected account ID
     */
    constructor(chain: string, accountIdConnected: string) {
        this.chain = chain;
        this.accountIdConnected = accountIdConnected;
        this.abiCoder = new AbiCoder();
    }

    /**
     * Builds an invoke transaction
     * @param params - Parameters for creating the invoke transaction
     * @returns The built invoke transaction
     */
    async buildInvokeTransaction(params: CreateInvokeTransaction) {
        const funcSelector = FunctionFragment.getSelector(
            params.selector.name,
            params.selector.params
        );
        const encodedParams = this.abiCoder.encode(
            params.transaction.parameters.types,
            params.transaction.parameters.values
        );
        const txData = hexlify(concat([funcSelector, encodedParams]));

        return {
            payload: {
                to: params.transaction.contractAddress,
                value: "0",
                data: txData,
            },
            account: this.accountIdConnected,
            scope: `eip155:${this.chain}`,
        };
    }

    /**
     * Invokes a snap
     * @param invokeOptions - Options for invoking the snap
     * @returns The result of the snap invocation
     */
    async invokeSnap(invokeOptions: InvokeTransactionOptions) {
        return await window.ethereum!.request({
            method: "wallet_invokeSnap",
            params: {
                snapId: invokeOptions.defaultSnapOrigin,
                request: {
                    method: `eth_sendUserOpBoba${invokeOptions.usePaymaster ? 'PM' : ''}`,
                    params: [invokeOptions.transactionDetails],
                    id: this.accountIdConnected,
                },
            },
        });
    }

    /**
     * Sets the connected account
     * @param accountId - The account ID to set
     */
    setConnectedAccount(accountId: string) {
        this.accountIdConnected = accountId;
    }

    /**
     * Sets the blockchain network
     * @param chain - The chain to set
     */
    setChain(chain: string) {
        this.chain = chain;
    }
}