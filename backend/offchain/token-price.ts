import Web3 from "web3";
import axios from "axios";
import "dotenv/config";
import {HybridComputeSDK, OffchainParameter, getParsedRequest} from "@bobanetwork/aa-hc-sdk-server";

const web3 = new Web3();

// v0.7 Response Generator using correct UserOperation format
function generateV7Response(request: any, errorCode: number, respPayload: string) {
    // Environment variables
    const entryPointAddr = process.env.ENTRY_POINTS!;
    const chainId = parseInt(process.env.CHAIN_ID!);
    const privateKey = process.env.OC_PRIVKEY!;
    const hybridAccountAddr = process.env.OC_HYBRID_ACCOUNT!;
    const helperAddr = process.env.HC_HELPER_ADDR!;
    
    console.log('\n=== V0.7 RESPONSE GENERATION (Correct UserOp Format) ===');
    console.log('🔧 Environment Config:');
    console.log('  - entryPointAddr:', entryPointAddr);
    console.log('  - chainId:', chainId);
    console.log('  - hybridAccountAddr:', hybridAccountAddr);
    console.log('  - helperAddr:', helperAddr);
    console.log('  - privateKey ends with:', privateKey.slice(-6));
    
    // Step 1: Generate merged response (same as before)
    console.log('\n📦 Step 1: Encoding response...');
    const mergedResponse = web3.eth.abi.encodeParameters(
        ['address', 'uint256', 'uint32', 'bytes'],
        [request.srcAddr, request.srcNonce, errorCode, respPayload]
    );
    console.log('  - merged response:', mergedResponse);
    
    // Step 2: Create PutResponse call data (same as before)
    console.log('\n📋 Step 2: Creating PutResponse call data...');
    const putResponseSelector = web3.utils.keccak256("PutResponse(bytes32,bytes)").slice(0, 10);
    const putResponseParams = web3.eth.abi.encodeParameters(
        ['bytes32', 'bytes'],
        [request.skey, mergedResponse]
    );
    const putResponseCallData = putResponseSelector + putResponseParams.slice(2);
    console.log('  - PutResponse call data:', putResponseCallData);
    
    // Step 3: Create execute call data (same as before)
    console.log('\n⚡ Step 3: Creating execute call data...');
    const executeSelector = web3.utils.keccak256("execute(address,uint256,bytes)").slice(0, 10);
    const executeParams = web3.eth.abi.encodeParameters(
        ['address', 'uint256', 'bytes'],
        [web3.utils.toChecksumAddress(helperAddr), 0, putResponseCallData]
    );
    const executeCallData = executeSelector + executeParams.slice(2);
    console.log('  - Execute call data:', executeCallData);
    
    // Step 4: Calculate gas limits (same as before)
    console.log('\n⛽ Step 4: Calculating gas limits...');
    const callGas = 705 * respPayload.length + 170000;
    const verificationGasLimit = 0x10000;
    const preVerificationGas = 0x10000;
    const maxFeePerGas = 0;
    const maxPriorityFeePerGas = 0;
    
    console.log('  - callGas:', callGas);
    console.log('  - verificationGasLimit:', verificationGasLimit);
    console.log('  - preVerificationGas:', preVerificationGas);
    
    // Step 5: Create packed v0.7 UserOperation fields
    console.log('\n🔗 Step 5: Creating v0.7 UserOperation fields...');
    
    // Pack accountGasLimits (verificationGasLimit high 128 bits, callGasLimit low 128 bits)
    const accountGasLimits = web3.eth.abi.encodeParameters(
        ['uint128', 'uint128'],
        [verificationGasLimit, callGas]
    );
    console.log('  - accountGasLimits:', accountGasLimits);
    
    // Pack gasFees (maxPriorityFeePerGas high 128 bits, maxFeePerGas low 128 bits)
    const gasFees = web3.eth.abi.encodeParameters(
        ['uint128', 'uint128'],
        [maxPriorityFeePerGas, maxFeePerGas]
    );
    console.log('  - gasFees:', gasFees);
    
    // Step 6: Create v0.7 UserOperation structure
    console.log('\n📊 Step 6: Creating UserOperation structure...');
    const userOp = {
        sender: web3.utils.toChecksumAddress(hybridAccountAddr),
        nonce: request.opNonce,
        initCode: "0x",
        callData: executeCallData,
        accountGasLimits: accountGasLimits,
        preVerificationGas: preVerificationGas,
        gasFees: gasFees,
        paymasterAndData: "0x",
        signature: "0x"
    };
    
    console.log('  - UserOperation created:');
    console.log('    - sender:', userOp.sender);
    console.log('    - nonce:', userOp.nonce);
    console.log('    - initCode:', userOp.initCode);
    console.log('    - callData length:', userOp.callData.length);
    console.log('    - accountGasLimits:', userOp.accountGasLimits);
    console.log('    - preVerificationGas:', userOp.preVerificationGas);
    console.log('    - gasFees:', userOp.gasFees);
    console.log('    - paymasterAndData:', userOp.paymasterAndData);
    
    // Step 7: Calculate UserOperation hash using EntryPoint specification
    console.log('\n🔐 Step 7: Calculating UserOperation hash...');
    
    // Hash components as per UserOperationLib.sol encode function
    const initCodeHash = web3.utils.keccak256(userOp.initCode);
    const callDataHash = web3.utils.keccak256(userOp.callData);
    const paymasterAndDataHash = web3.utils.keccak256(userOp.paymasterAndData);
    
    console.log('  - initCodeHash:', initCodeHash);
    console.log('  - callDataHash:', callDataHash);
    console.log('  - paymasterAndDataHash:', paymasterAndDataHash);
    
    // Encode as per UserOperationLib.sol specification
    const userOpEncoded = web3.eth.abi.encodeParameters(
        ['address', 'uint256', 'bytes32', 'bytes32', 'bytes32', 'uint256', 'bytes32', 'bytes32'],
        [
            userOp.sender,
            userOp.nonce,
            initCodeHash,
            callDataHash,
            userOp.accountGasLimits,
            userOp.preVerificationGas,
            userOp.gasFees,
            paymasterAndDataHash
        ]
    );
    
    console.log('  - userOpEncoded:', userOpEncoded);
    
    // Hash the encoded UserOperation
    const userOpHash = web3.utils.keccak256(userOpEncoded);
    console.log('  - userOpHash:', userOpHash);
    
    // Final hash as per EntryPoint.getUserOpHash()
    const finalHashInput = web3.eth.abi.encodeParameters(
        ['bytes32', 'address', 'uint256'],
        [userOpHash, entryPointAddr, chainId]
    );
    
    console.log('  - finalHashInput:', finalHashInput);
    
    const operationHash = web3.utils.keccak256(finalHashInput);
    console.log('  - operationHash (final):', operationHash);
    
    // Step 8: Sign the operation hash
    console.log('\n✍️  Step 8: Signing operation hash...');
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    console.log('  - Signer address:', account.address);
    console.log('  - Signer address (last 6):', account.address.slice(-6));
    
    // Sign with Ethereum message prefix
    const signature = account.sign(operationHash);
    console.log('  - Signature:', signature.signature);
    console.log('  - Signature length:', signature.signature.length);
    
    const result = {
        success: errorCode === 0,
        response: respPayload,
        signature: signature.signature
    };
    
    console.log('\n✅ Final Result:');
    console.log('  - success:', result.success);
    console.log('  - response length:', result.response.length);
    console.log('  - signature:', result.signature);
    console.log('=== END V0.7 GENERATION ===\n');
    
    return result;
}

export async function offchainTokenPrice(sdk: HybridComputeSDK, params: OffchainParameter) {
    const request = getParsedRequest(params)

    try {
        // Tokensymbol was encoded with a string in the smart-contract
        const tokenSymbol = web3.eth.abi.decodeParameter(
            "string",
            request["reqBytes"]
        ) as string;
        const tokenPrice = (await getTokenPrice(tokenSymbol)).toString();
        console.log("token price: ", tokenPrice);

        // Encode fetched token price as a string.
        const encodedTokenPrice = web3.eth.abi.encodeParameter(
            "string",
            tokenPrice
        );
        console.log("ENCODED TOKEN PRICE = ", encodedTokenPrice);
        
        // Use v0.7 response generation instead of SDK's v0.6 generateResponse
        return generateV7Response(request, 0, encodedTokenPrice);
    } catch (error: any) {
        console.log("received error: ", error);
        return generateV7Response(request, 1, web3.utils.asciiToHex(error.message));
    }
}

/**
 * Retrieves the current price of a specified cryptocurrency token.
 *
 * This asynchronous function fetches the price of a cryptocurrency token
 * by its symbol from the CoinRanking API. It first retrieves the list of
 * coins and searches for the token by its symbol. If found, it fetches
 * the price of the token using its unique identifier.
 *
 * @param {string} tokenSymbol - The symbol of the cryptocurrency token (e.g., 'BTC', 'ETH').
 * @returns {Promise<number>} - A promise that resolves to the current price of the token.
 * @throws {Error} - If the token is not found or if there is an issue with the API requests.
 */
export async function getTokenPrice(tokenSymbol: string): Promise<number> {
    const headers = {
        accept: "application/json",
        "x-access-token": process.env.COINRANKING_API_KEY,
    };

    const coinListResponse = await axios.get(
        "https://api.coinranking.com/v2/coins",
        {headers}
    );
    const token = coinListResponse.data.data.coins.find(
        (c: any) => c.symbol === tokenSymbol
    );

    if (!token) {
        throw new Error(`Token ${tokenSymbol} not found`);
    }

    const priceResponse = await axios.get(
        `https://api.coinranking.com/v2/coin/${token.uuid}/price`,
        {headers}
    );
    return priceResponse.data.data.price;
}