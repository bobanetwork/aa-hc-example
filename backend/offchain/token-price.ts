import Web3 from "web3";
import axios from "axios";
import "dotenv/config";
import {HybridComputeSDK, OffchainParameter, getParsedRequest} from "@bobanetwork/aa-hc-sdk-server";

const web3 = new Web3();

function selector(name: string): string {
    const hex = web3.utils.toHex(web3.utils.keccak256(name));
    return hex.slice(2, 10);
}

function selectorHex(name: string): string {
    const hex = web3.utils.toHex(web3.utils.keccak256(name));
    return hex.slice(0, 10); // Keep 0x prefix
}

// TEMPORARY v0.7 generateResponse function matching Python SDK exactly
export function generateResponseV7(req: any, errorCode: number, respPayload: any) {
    console.log('\n=== V0.7 RESPONSE GENERATION (Python SDK Match) ===');
    
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

    // Step 1: Generate initial response encoding (same as Python)
    console.log('\n📦 Step 1: Encoding response parameters...');
    const resp2 = web3.eth.abi.encodeParameters(
        ['address', 'uint256', 'uint32', 'bytes'],
        [req.srcAddr, req.srcNonce, errorCode, respPayload]
    );
    console.log('  - resp2:', resp2);

    // Step 2: Create PutResponse call data (same as Python)
    console.log('\n📋 Step 2: Creating PutResponse call data...');
    const putResponseCallData = web3.eth.abi.encodeParameters(
        ['bytes32', 'bytes'], 
        [req.skey, resp2]
    );
    const p_enc1 = selectorHex("PutResponse(bytes32,bytes)") + putResponseCallData.slice(2);
    console.log('  - p_enc1:', p_enc1);

    // Step 3: Create execute call data (same as Python)
    console.log('\n⚡ Step 3: Creating execute call data...');
    const executeCallData = web3.eth.abi.encodeParameters(
        ['address', 'uint256', 'bytes'],
        [web3.utils.toChecksumAddress(process.env.HC_HELPER_ADDR), 0, p_enc1]
    );
    const p_enc2 = selectorHex("execute(address,uint256,bytes)") + executeCallData.slice(2);
    console.log('  - p_enc2 length:', p_enc2.length);

    // Step 4: Gas limits (same as Python)
    console.log('\n⛽ Step 4: Calculating gas limits...');
    const limits = {
        verificationGasLimit: "0x10000",
        preVerificationGas: "0x10000",
    };
    
    // CRITICAL: Python uses len(resp_payload) where resp_payload is bytes
    const respPayloadBytes = web3.utils.hexToBytes(respPayload);
    const callGas = 705 * respPayloadBytes.length + 170000;
    
    console.log('  - verificationGasLimit:', limits.verificationGasLimit);
    console.log('  - preVerificationGas:', limits.preVerificationGas);
    console.log('  - respPayload:', respPayload);
    console.log('  - respPayloadBytes.length:', respPayloadBytes.length);
    console.log('  - callGas:', callGas);

    // Step 5: Gas packing (EXACT Python method)
    console.log('\n🔗 Step 5: Gas packing (Python method)...');
    
    // Python: ethabi.encode(['uint128'], [value])[16:32]
    const verificationGasEncoded = web3.eth.abi.encodeParameter('uint128', web3.utils.hexToNumber(limits.verificationGasLimit));
    const callGasEncoded = web3.eth.abi.encodeParameter('uint128', callGas);
    
    // Take bytes [16:32] - that's 32 hex chars starting at position 34 (0x + 32 chars)
    const verificationGasPart = verificationGasEncoded.slice(34, 66); // 32 chars
    const callGasPart = callGasEncoded.slice(34, 66); // 32 chars
    
    const accountGasLimits = '0x' + verificationGasPart + callGasPart;
    
    console.log('  - verificationGasEncoded:', verificationGasEncoded);
    console.log('  - callGasEncoded:', callGasEncoded);
    console.log('  - verificationGasPart:', verificationGasPart);
    console.log('  - callGasPart:', callGasPart);
    console.log('  - accountGasLimits:', accountGasLimits);
    console.log('  - accountGasLimits length:', accountGasLimits.length);

    // Step 6: Pack everything (EXACT Python structure)
    console.log('\n📊 Step 6: Creating packed structure...');
    
    const initCodeHash = web3.utils.keccak256('0x');
    const callDataHash = web3.utils.keccak256(p_enc2);
    const paymasterAndDataHash = web3.utils.keccak256('0x');
    
    console.log('  - initCodeHash:', initCodeHash);
    console.log('  - callDataHash:', callDataHash);
    console.log('  - paymasterAndDataHash:', paymasterAndDataHash);
    
    const packed = web3.eth.abi.encodeParameters([
        'address', 'uint256', 'bytes32', 'bytes32', 'bytes32',
        'uint256', 'bytes32', 'bytes32'
    ], [
        process.env.OC_HYBRID_ACCOUNT,
        req.opNonce,
        initCodeHash,
        callDataHash,
        accountGasLimits,
        web3.utils.hexToNumber(limits.preVerificationGas),
        '0x' + '0'.repeat(64), // Python: "0x" + "0"*64
        paymasterAndDataHash
    ]);
    
    console.log('  - packed:', packed);
    console.log('  - packed length:', packed.length);

    // Step 7: Calculate operation hash (same as Python)
    console.log('\n🔐 Step 7: Calculating operation hash...');
    const packedHash = web3.utils.keccak256(packed);
    console.log('  - packedHash:', packedHash);
    
    const ooHash = web3.utils.keccak256(web3.eth.abi.encodeParameters(
        ['bytes32', 'address', 'uint256'],
        [packedHash, process.env.ENTRY_POINTS, process.env.CHAIN_ID]
    ));
    console.log('  - ooHash:', ooHash);

    // Step 8: Sign with Ethereum message prefix (Python: encode_defunct)
    console.log('\n✍️  Step 8: Signing with encode_defunct equivalent...');
    const account = web3.eth.accounts.privateKeyToAccount(process.env.OC_PRIVKEY!);
    console.log('  - Signer address:', account.address);
    console.log('  - Signer address (last 6):', account.address.slice(-6));
    
    // Python: eth_account.messages.encode_defunct(oo_hash)
    // This is equivalent to web3.eth.accounts.hashMessage
    const messageHash = web3.eth.accounts.hashMessage(ooHash);
    console.log('  - messageHash (with prefix):', messageHash);
    
    const signature = account.sign(messageHash);
    console.log('  - signature:', signature.signature);
    console.log('  - signature length:', signature.signature.length);

    const result = {
        success: errorCode === 0,
        response: web3.utils.toHex(respPayload), // Python: Web3.to_hex(resp_payload)
        signature: signature.signature, // Python: Web3.to_hex(sig.signature)
    };

    console.log('\n✅ Final v0.7 Result (Python match):');
    console.log('  - success:', result.success);
    console.log('  - response:', result.response);
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
        
        // Use our v0.7 generateResponse method that matches Python SDK
        console.log("Using v0.7 generateResponse (Python SDK match)...");
        return generateResponseV7(request, 0, encodedTokenPrice);
    } catch (error: any) {
        console.log("received error: ", error);
        return generateResponseV7(request, 1, web3.utils.asciiToHex(error.message));
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