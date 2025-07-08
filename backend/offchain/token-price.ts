import Web3 from "web3";
import axios from "axios";
import "dotenv/config";
import {HybridComputeSDK, OffchainParameter, getParsedRequest} from "@bobanetwork/aa-hc-sdk-server";

const web3 = new Web3();

function selector(name: string): string {
    const hex = web3.utils.toHex(web3.utils.keccak256(name));
    return hex.slice(2, 10);
}

// CORRECT v0.7 generateResponse function
export function generateV7Response(req: any, errorCode: number, respPayload: string) {
    console.log('\n=== CORRECT V0.7 RESPONSE GENERATION ===');
    
    if (!process.env.HC_HELPER_ADDR || !process.env.OC_HYBRID_ACCOUNT ||
        !process.env.CHAIN_ID || !process.env.OC_PRIVKEY || !process.env.ENTRY_POINTS) {
        throw new Error("One or more required environment variables are not defined");
    }

    console.log('🔧 Environment Variables:');
    console.log('  - HC_HELPER_ADDR:', process.env.HC_HELPER_ADDR);
    console.log('  - OC_HYBRID_ACCOUNT:', process.env.OC_HYBRID_ACCOUNT);
    console.log('  - ENTRY_POINTS:', process.env.ENTRY_POINTS);
    console.log('  - CHAIN_ID:', process.env.CHAIN_ID);
    console.log('  - OC_PRIVKEY ends with:', process.env.OC_PRIVKEY!.slice(-6));

    // Step 1: Encode response parameters
    console.log('\n📦 Step 1: Encoding response parameters...');
    const encodedResponse = web3.eth.abi.encodeParameters(
        ["address", "uint256", "uint32", "bytes"], 
        [req.srcAddr, req.srcNonce, errorCode, respPayload]
    );
    console.log('  - encodedResponse:', encodedResponse);

    // Step 2: Create PutResponse call data
    console.log('\n📋 Step 2: Creating PutResponse call data...');
    const putResponseCallData = web3.eth.abi.encodeParameters(
        ["bytes32", "bytes"], 
        [req.skey, encodedResponse]
    );
    const putResponseEncoded = "0x" + selector("PutResponse(bytes32,bytes)") + putResponseCallData.slice(2);
    console.log('  - putResponseEncoded:', putResponseEncoded);

    // Step 3: Create execute call data
    console.log('\n⚡ Step 3: Creating execute call data...');
    const callDataEncoded = web3.eth.abi.encodeParameters(
        ["address", "uint256", "bytes"], 
        [web3.utils.toChecksumAddress(process.env.HC_HELPER_ADDR), 0, putResponseEncoded]
    );
    const executeEncoded = "0x" + selector("execute(address,uint256,bytes)") + callDataEncoded.slice(2);
    console.log('  - executeEncoded length:', executeEncoded.length);

    // Step 4: v0.7 GAS CALCULATION (FIXED)
    console.log('\n⛽ Step 4: Calculating gas limits (v0.7 FIXED)...');
    const verificationGasLimit = 0x10000;
    const preVerificationGas = 0x10000;
    const callGasEstimate = 705 * respPayload.length + 170000;  // FIXED: string length, not bytes
    
    console.log('  - verificationGasLimit:', verificationGasLimit);
    console.log('  - preVerificationGas:', preVerificationGas);
    console.log('  - respPayload.length (string):', respPayload.length);
    console.log('  - callGasEstimate:', callGasEstimate);

    // Step 5: v0.7 GAS PACKING (FIXED - Python method)
    console.log('\n🔗 Step 5: Creating v0.7 gas packing (PYTHON METHOD)...');
    
    // Python method: encode each as uint128 and take bytes 16:32, then concatenate
    const verificationGasEncoded = web3.eth.abi.encodeParameter('uint128', verificationGasLimit);
    const callGasEncoded = web3.eth.abi.encodeParameter('uint128', callGasEstimate);
    
    // Take bytes 16:32 (skip the first 16 bytes of padding)
    const verificationGasPacked = verificationGasEncoded.slice(34);  // 0x + 32 chars = 34
    const callGasPacked = callGasEncoded.slice(34);
    
    const accountGasLimits = '0x' + verificationGasPacked + callGasPacked;
    
    console.log('  - verificationGasEncoded:', verificationGasEncoded);
    console.log('  - callGasEncoded:', callGasEncoded);
    console.log('  - verificationGasPacked:', verificationGasPacked);
    console.log('  - callGasPacked:', callGasPacked);
    console.log('  - accountGasLimits:', accountGasLimits);
    console.log('  - accountGasLimits length:', accountGasLimits.length);

    // Step 6: v0.7 USER OPERATION ENCODING (FIXED)
    console.log('\n📊 Step 6: Creating v0.7 UserOperation encoding (FIXED)...');
    const initCodeHash = web3.utils.keccak256("0x");
    const callDataHash = web3.utils.keccak256(executeEncoded);
    const paymasterAndDataHash = web3.utils.keccak256("0x");
    
    console.log('  - initCodeHash:', initCodeHash);
    console.log('  - callDataHash:', callDataHash);
    console.log('  - paymasterAndDataHash:', paymasterAndDataHash);
    
    const packed = web3.eth.abi.encodeParameters([
        'address', 'uint256', 'bytes32', 'bytes32', 'bytes32',
        'uint256', 'bytes32', 'bytes32'
    ], [
        process.env.OC_HYBRID_ACCOUNT,
        req.opNonce,
        initCodeHash,           // initCode hash
        callDataHash,           // callData hash
        accountGasLimits,       // FIXED: Python method packed value
        preVerificationGas,
        '0x' + '0'.repeat(64),  // FIXED: 64 zeros like Python
        paymasterAndDataHash    // paymasterAndData hash
    ]);
    
    console.log('  - packed UserOperation:', packed);
    console.log('  - packed length:', packed.length);

    // Step 7: Calculate final hash (same as before)
    console.log('\n🔐 Step 7: Calculating final hash...');
    const packedHash = web3.utils.keccak256(packed);
    console.log('  - packedHash:', packedHash);
    
    const finalHash = web3.utils.keccak256(web3.eth.abi.encodeParameters(
        ["bytes32", "address", "uint256"], 
        [packedHash, process.env.ENTRY_POINTS, process.env.CHAIN_ID]
    ));
    console.log('  - finalHash:', finalHash);

    // Step 8: Sign with Ethereum message prefix (CRITICAL FIX)
    console.log('\n✍️  Step 8: Signing with Ethereum message prefix (CRITICAL FIX)...');
    const account = web3.eth.accounts.privateKeyToAccount(process.env.OC_PRIVKEY!);
    console.log('  - Signer address:', account.address);
    console.log('  - Signer address (last 6):', account.address.slice(-6));
    
    // CRITICAL: Use Ethereum message prefix like Python SDK does
    const prefixedMessage = `\x19Ethereum Signed Message:\n32${finalHash.slice(2)}`;
    const prefixedHash = web3.utils.keccak256(prefixedMessage);
    console.log('  - prefixedMessage (hex):', web3.utils.toHex(prefixedMessage));
    console.log('  - prefixedHash:', prefixedHash);
    
    const signature = account.sign(prefixedHash);
    console.log('  - Signature:', signature.signature);
    console.log('  - Signature length:', signature.signature.length);

    const result = {
        success: errorCode === 0,
        response: respPayload,
        signature: signature.signature,
    };

    console.log('\n✅ Final v0.7 Result:');
    console.log('  - success:', result.success);
    console.log('  - response length:', result.response.length);
    console.log('  - signature:', result.signature);
    console.log('=== END CORRECT V0.7 GENERATION ===\n');

    return result;
}

// Keep the old function for comparison
export function generateResponse(request: any, errorCode: number, respPayload: string) {
    console.log("Using simple generateResponse method...");
    console.log("Request:", request);
    console.log("ErrorCode:", errorCode);
    console.log("Response payload:", respPayload);
    
    // Return a simple response structure
    return {
        success: errorCode === 0,
        response: respPayload,
        signature: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b"
    };
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
        
        // Use our CORRECT v0.7 generateResponse method
        console.log("Using CORRECT v0.7 generateResponse...");
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