import { ethers } from "hardhat";
import { TokenPrice, TokenPrice__factory, HybridAccount, HybridAccount__factory } from "../typechain-types";
import {Wallet, JsonRpcProvider, concat, hexlify, FunctionFragment, AbiCoder} from "ethers";
import axios from "axios";

const {BUNDLER_RPC, TOKEN_PRICE_ADDRESS, HYBRID_ACCOUNT_ADDRESS, ENTRY_POINT} = process.env
if (!BUNDLER_RPC || !TOKEN_PRICE_ADDRESS || !HYBRID_ACCOUNT_ADDRESS || !ENTRY_POINT) {
    throw new Error(`[setup.ts] Environment variables not properly setup! ${BUNDLER_RPC}, ${TOKEN_PRICE_ADDRESS}, ${HYBRID_ACCOUNT_ADDRESS}`)
}

export async function setupTests() {
    const [owner, user] = await ethers.getSigners() as unknown as Wallet[];
    const provider = owner.provider as JsonRpcProvider;

    // Create contract instances
    const tokenPriceContract = TokenPrice__factory.connect(TOKEN_PRICE_ADDRESS!, owner);
    const hybridAccountContract = HybridAccount__factory.connect(HYBRID_ACCOUNT_ADDRESS!, owner);

    return {
        tokenPriceContract,
        hybridAccountContract,
        owner,
        user,
        provider,
        bundlerRpc: BUNDLER_RPC!, // Update this if your bundler RPC is different, using local
    };
}

function encodeUserOperation(userOperation: any): string {
    return ethers.AbiCoder.defaultAbiCoder().encode(
        [
            'address',
            'uint256',
            'bytes32',
            'bytes32',
            'uint256',
            'uint256',
            'uint256',
            'uint256',
            'uint256',
            'bytes32',
        ],
        [
            userOperation.sender,
            userOperation.nonce,
            ethers.keccak256(userOperation.initCode),
            ethers.keccak256(userOperation.callData),
            userOperation.callGasLimit,
            userOperation.verificationGasLimit,
            userOperation.preVerificationGas,
            userOperation.maxFeePerGas,
            userOperation.maxPriorityFeePerGas,
            ethers.keccak256(userOperation.paymasterAndData),
        ],
    );
}

function getUserOperationHash(
    userOperation: any,
    entrypointAddress: string,
    chainId: string,
): string {
    const chainIdDecimal = parseInt(chainId, 10);
    const hash = ethers.keccak256(encodeUserOperation(userOperation));

    const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'address', 'uint256'],
        [hash, entrypointAddress, chainIdDecimal],
    );

    return ethers.keccak256(data);
}

export const DUMMY_SIGNATURE =
    '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c';

// eslint-disable-next-line jsdoc/require-jsdoc
export function packUserOp(op: any, forSignature = true): string {
    if (forSignature) {
        return ethers.AbiCoder.defaultAbiCoder().encode(
            // eslint-disable-next-line prettier/prettier
            ["address", "uint256", "bytes32", "bytes32",
                // eslint-disable-next-line prettier/prettier
                "uint256", "uint256", "uint256", "uint256", "uint256",
                'bytes32',
            ],
            [
                op.sender,
                op.nonce,
                ethers.keccak256(op.initCode),
                ethers.keccak256(op.callData),
                op.callGasLimit,
                op.verificationGasLimit,
                op.preVerificationGas,
                op.maxFeePerGas,
                op.maxPriorityFeePerGas,
                ethers.keccak256(op.paymasterAndData),
            ],
        );

        // eslint-disable-next-line no-else-return
    } else {
        // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
        return ethers.AbiCoder.defaultAbiCoder().encode(
            // eslint-disable-next-line prettier/prettier
            ["address", "uint256", "bytes", "bytes",
                // eslint-disable-next-line prettier/prettier
                "uint256", "uint256", "uint256", "uint256", "uint256",
                'bytes',
                'bytes',
            ],
            [
                op.sender,
                op.nonce,
                op.initCode,
                op.callData,
                op.callGasLimit,
                op.verificationGasLimit,
                op.preVerificationGas,
                op.maxFeePerGas,
                op.maxPriorityFeePerGas,
                op.paymasterAndData,
                op.signature,
            ],
        );
    }
}

const DefaultGasOverheads = {
    fixed: 21000,
    perUserOp: 18300,
    perUserOpWord: 4,
    zeroByte: 4,
    nonZeroByte: 16,
    bundleSize: 1,
    sigSize: 65,
};
function calcPreVerificationGas(userOp: any, overheads?: any): number {
    const ov = { ...DefaultGasOverheads, ...(overheads ?? {}) };
    // eslint-disable-next-line id-length, @typescript-eslint/no-unnecessary-type-assertion
    const p = {
        // dummy values, in case the UserOp is incomplete.
        preVerificationGas: 21000, // dummy value, just for calldata cost
        signature: ethers.hexlify(Buffer.alloc(ov.sigSize, 1)), // dummy signature
        ...userOp,
    } as any;
    if (p.signature === '') {
        p.signature = ethers.hexlify(Buffer.alloc(ov.sigSize, 1));
    }
    const packed = ethers.getBytes(packUserOp(p, false));
    const lengthInWord = (packed.length + 31) / 32;
    const callDataCost = packed
        // eslint-disable-next-line id-length
        .map((x) => (x === 0 ? ov.zeroByte : ov.nonZeroByte))
        // eslint-disable-next-line id-length
        .reduce((sum, x) => sum + x);
    const ret = Math.round(
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        callDataCost +
        ov.fixed / ov.bundleSize +
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        ov.perUserOp +
        ov.perUserOpWord * lengthInWord,
    );
    return ret;
}

const abiCoder = new AbiCoder();
export async function sendUserOperation(
    chainId: string,
    bundlerRpc: string,
    tokenPriceContract: TokenPrice,
    user: Wallet,
    method: string,
    params: any[]
) {
    if (!params.length) {
        throw new Error('[sendUserOperation:setup.ts] No token symbol provided!');
    }
    const tokenSymbol: string = params[0];
    const funcSelector = FunctionFragment.getSelector("fetchPrice", ["string"]);

    // Encode the tokenSymbol as a string
    const encodedParams = abiCoder.encode(["string"], [tokenSymbol]);

    // Concatenate function selector and encoded params
    const callData = hexlify(concat([funcSelector, encodedParams]));

    const nonce = (await user.getNonce()).toString();

    let userOp = {
        sender: user.address,
        nonce: hexlify(nonce),
        initCode: "0x",
        callData,
        callGasLimit: "0x100000",
        verificationGasLimit: "0x100000",
        preVerificationGas: "0x100000",
        maxFeePerGas: "0x3b9aca00",
        maxPriorityFeePerGas: "0x3b9aca00",
        paymasterAndData: "0x",
        signature: "0x"
    };

    const preVerificationGasReq = calcPreVerificationGas(userOp)
    userOp = {
        ...userOp,
        preVerificationGas: `0x${preVerificationGasReq.toString(16)}`,
        signature: DUMMY_SIGNATURE,
    };

    // Estimate gas
    const gasEstimation = await axios.post(bundlerRpc, {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_estimateUserOperationGas",
        params: [userOp, ENTRY_POINT!]
    });

    // Update gas values based on estimation
    if (gasEstimation.data.result) {
        userOp.callGasLimit = gasEstimation.data.result.callGasLimit;
        userOp.verificationGasLimit = gasEstimation.data.result.verificationGasLimit;

        const preVerificationGasFromBundler =
            gasEstimation.data.result.preVerificationGas;
        if (
            preVerificationGasFromBundler &&
            preVerificationGasFromBundler > preVerificationGasReq
        ) {
            userOp.preVerificationGas = gasEstimation.data.result.preVerificationGas;
        }
    }

    // Sign the userOp
    const userOpHash = getUserOperationHash(userOp, ENTRY_POINT!, chainId);
    userOp.signature = await user.signMessage(ethers.getBytes(userOpHash));

    // Send the userOp
    const response = await axios.post(bundlerRpc, {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_sendUserOperation", // that's the correct rpc method
        params: [userOp, ENTRY_POINT!]
    });

    if (response.data.error) {
        throw new Error(`UserOp Failed: ${response.data.error.message}`);
    }

    return response.data.result;
}