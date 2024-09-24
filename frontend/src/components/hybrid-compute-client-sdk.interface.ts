import {ParamType} from "ethers";

/**
 * Interface for creating an invoke transaction
 */
export interface CreateInvokeTransaction {
    transaction: {
        contractAddress: string;
        parameters: {
            types: ReadonlyArray<string | ParamType>;
            values: ReadonlyArray<any>;
        };
        value: string;
    };
    selector: {
        name: string;
        params?: Array<any>;
    };
}

/**
 * Interface for an invoke transaction
 */
export interface InvokeTransaction {
    payload: {
        to: string;
        value: string;
        data: any;
    };
    scope: string;
}

/**
 * Interface for invoke transaction options
 */
export interface InvokeTransactionOptions {
    defaultSnapOrigin?: string;
    transactionDetails: InvokeTransaction;
    usePaymaster?: boolean;
}
