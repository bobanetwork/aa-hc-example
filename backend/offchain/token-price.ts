import Web3 from "web3";
import axios from "axios";
import "dotenv/config";
import {HybridComputeSDK, OffchainParameter, getParsedRequest} from "@bobanetwork/aa-hc-sdk-server";

const web3 = new Web3();

// v0.7 Response Generator (based on working Python implementation)
function generateV7Response(request: any, errorCode: number, respPayload: string) {
    // Environment variables
    const entryPointAddr = process.env.ENTRY_POINTS!;
    const chainId = parseInt(process.env.CHAIN_ID!);
    const privateKey = process.env.OC_PRIVKEY!;
    const hybridAccountAddr = process.env.OC_HYBRID_ACCOUNT!;
    const helperAddr = process.env.HC_HELPER_ADDR!;
    
    console.log('\n=== V0.7 RESPONSE GENERATION ===');
    console.log('🔧 Environment Config:');
    console.log('  - entryPointAddr:', entryPointAddr);
    console.log('  - chainId:', chainId);
    console.log('  - hybridAccountAddr:', hybridAccountAddr);
    console.log('  - helperAddr:', helperAddr);
    console.log('  - privateKey ends with:', privateKey.slice(-6));
    
    console.log('📝 Request details:');
    console.log('  - srcAddr:', request.srcAddr);
    console.log('  - srcNonce:', request.srcNonce, typeof request.srcNonce);
    console.log('  - opNonce:', request.opNonce, typeof request.opNonce);
    console.log('  - skey:', web3.utils.bytesToHex(request.skey));
    console.log('  - skey length:', request.skey.length);
    console.log('  - errorCode:', errorCode);
    console.log('  - respPayload length:', respPayload.length);
    
    // Step 1: Generate initial response encoding (EXACTLY like Python)
    console.log('\n📦 Step 1: Encoding response...');
    const resp2 = web3.eth.abi.encodeParameters(
        ['address', 'uint256', 'uint32', 'bytes'],
        [request.srcAddr, request.srcNonce, errorCode, respPayload]
    );
    console.log('  - resp2:', resp2);
    console.log('  - resp2 length:', resp2.length);
    
    // Step 2: Create PutResponse call data (EXACTLY like Python)
    console.log('\n📋 Step 2: Creating PutResponse call data...');
    const putResponseSelector = web3.utils.keccak256("PutResponse(bytes32,bytes)").slice(0, 10);
    console.log('  - PutResponse selector:', putResponseSelector);
    
    const putResponseParams = web3.eth.abi.encodeParameters(
        ['bytes32', 'bytes'],
        [request.skey, resp2]
    );
    console.log('  - PutResponse params:', putResponseParams);
    
    const putResponseCallData = putResponseSelector + putResponseParams.slice(2);
    console.log('  - PutResponse call data:', putResponseCallData);
    console.log('  - PutResponse call data length:', putResponseCallData.length);
    
    // Step 3: Create execute call data (EXACTLY like Python)
    console.log('\n⚡ Step 3: Creating execute call data...');
    const executeSelector = web3.utils.keccak256("execute(address,uint256,bytes)").slice(0, 10);
    console.log('  - Execute selector:', executeSelector);
    
    const executeParams = web3.eth.abi.encodeParameters(
        ['address', 'uint256', 'bytes'],
        [web3.utils.toChecksumAddress(helperAddr), 0, putResponseCallData]
    );
    console.log('  - Execute params:', executeParams);
    
    const executeCallData = executeSelector + executeParams.slice(2);
    console.log('  - Execute call data:', executeCallData);
    console.log('  - Execute call data length:', executeCallData.length);
    
    // Step 4: Calculate gas limits (EXACTLY like Python)
    console.log('\n⛽ Step 4: Calculating gas limits...');
    const limits = {
        verificationGasLimit: "0x10000",
        preVerificationGas: "0x10000",
    };
    // Python: call_gas = 705*len(resp_payload) + 170000
    // respPayload is hex string, so we need string length, not bytes length
    const callGas = 705 * respPayload.length + 170000;
    console.log('  - respPayload length (string):', respPayload.length);
    console.log('  - callGas calculation: 705 *', respPayload.length, '+ 170000 =', callGas);
    console.log('  - verificationGasLimit:', limits.verificationGasLimit, '=', web3.utils.hexToNumber(limits.verificationGasLimit));
    console.log('  - preVerificationGas:', limits.preVerificationGas, '=', web3.utils.hexToNumber(limits.preVerificationGas));
    
    // Step 5: Create account gas limits (EXACTLY like Python)
    console.log('\n🔗 Step 5: Creating account gas limits...');
    // Python: ethabi.encode(['uint128'], [Web3.to_int(hexstr=limits['verificationGasLimit'])])[16:32]
    const verificationGasEncoded = web3.eth.abi.encodeParameter('uint128', web3.utils.hexToNumber(limits.verificationGasLimit));
    const verificationGasBytes = verificationGasEncoded.slice(-32, -16);
    console.log('  - verificationGasEncoded:', verificationGasEncoded);
    console.log('  - verificationGasBytes:', verificationGasBytes);
    
    const callGasEncoded = web3.eth.abi.encodeParameter('uint128', callGas);
    const callGasBytes = callGasEncoded.slice(-32, -16);
    console.log('  - callGasEncoded:', callGasEncoded);
    console.log('  - callGasBytes:', callGasBytes);
    
    const accountGasLimits = verificationGasBytes + callGasBytes;
    console.log('  - accountGasLimits:', accountGasLimits);
    console.log('  - accountGasLimits length:', accountGasLimits.length);
    
    // Step 6: Create gas fees (EXACTLY like Python)
    console.log('\n💰 Step 6: Creating gas fees...');
    // Python: Web3.to_bytes(hexstr="0x" + "0"*64)
    const gasFeesHex = "0x" + "0".repeat(64);
    console.log('  - gasFeesHex:', gasFeesHex);
    console.log('  - gasFeesHex length:', gasFeesHex.length);
    
    // Step 7: Pack UserOperation (EXACTLY like Python)
    console.log('\n📊 Step 7: Packing UserOperation...');
    const initCodeHash = web3.utils.keccak256("0x");
    const executeCallDataHash = web3.utils.keccak256(executeCallData);
    const paymasterAndDataHash = web3.utils.keccak256("0x");
    
    console.log('  - sender:', web3.utils.toChecksumAddress(hybridAccountAddr));
    console.log('  - nonce:', request.opNonce);
    console.log('  - initCodeHash:', initCodeHash);
    console.log('  - executeCallDataHash:', executeCallDataHash);
    console.log('  - accountGasLimits:', accountGasLimits);
    console.log('  - preVerificationGas:', web3.utils.hexToNumber(limits.preVerificationGas));
    console.log('  - gasFeesHex:', gasFeesHex);
    console.log('  - paymasterAndDataHash:', paymasterAndDataHash);
    
    const packed = web3.eth.abi.encodeParameters([
        'address', 'uint256', 'bytes32', 'bytes32', 'bytes32',
        'uint256', 'bytes32', 'bytes32'
    ], [
        web3.utils.toChecksumAddress(hybridAccountAddr),
        request.opNonce,
        initCodeHash, // initCode
        executeCallDataHash,
        accountGasLimits, // Pass as raw bytes, not hex string with 0x
        web3.utils.hexToNumber(limits.preVerificationGas),
        gasFeesHex, // Pass as hex string
        paymasterAndDataHash // paymasterAndData
    ]);
    
    console.log('  - packed UserOperation:', packed);
    console.log('  - packed length:', packed.length);
    
    // Step 8: Calculate operation hash (EXACTLY like Python)
    console.log('\n🔐 Step 8: Calculating operation hash...');
    const packedHash = web3.utils.keccak256(packed);
    console.log('  - packedHash:', packedHash);
    
    const hashInput = web3.eth.abi.encodeParameters(
        ['bytes32', 'address', 'uint256'],
        [packedHash, entryPointAddr, chainId]
    );
    console.log('  - hashInput:', hashInput);
    
    const operationHash = web3.utils.keccak256(hashInput);
    console.log('  - operationHash (final):', operationHash);
    
    // Step 9: Sign with Ethereum message prefix (EXACTLY like Python)
    console.log('\n✍️  Step 9: Signing operation hash...');
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    console.log('  - Signer address:', account.address);
    console.log('  - Signer address (last 6):', account.address.slice(-6));
    
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