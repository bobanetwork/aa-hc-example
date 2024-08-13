import {useContext, useState} from "react";
import {Button} from "./ui/button";
import {defaultSnapOrigin} from "@/config";
import {MetaMaskContext} from "@/context/MetamaskContext";
import {concat, ethers, FunctionFragment, Wallet} from "ethers";
import {AbiCoder} from "ethers";
import {hexlify} from "ethers";
import {CopyIcon} from "./CopyIcon";
import {YOUR_CONTRACT} from "@/config/snap";
import {useContractAbi} from "@/hooks/useContractAbi";
import {Loader2} from "lucide-react";

const FormComponent = () => {
    const [state] = useContext(MetaMaskContext);
    const [contractAddress, setContractAddress] = useState(YOUR_CONTRACT);
    const [tokenSymbol, setTokenSymbol] = useState("ETH");
    const [tokenPrice, setTokenPrice] = useState("");
    const {abi: contractAbi} = useContractAbi("TokenPrice");
    const [txResponse, setTxResponse] = useState<any>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const abiCoder = new AbiCoder();

    const onSubmit = async () => {
        try {
            if (!state.selectedAcount || !state.selectedAcount.id) {
                console.error("Account not connected or invalid snap")
                return;
            }
            setIsLoading(true);
            setTokenPrice("");
            setTxResponse("");
            setError("");

            // Prepare the function selector and encoded parameters for the smart contract interaction.
            // This specifies which function to call on the contract and with what arguments
            const funcSelector = FunctionFragment.getSelector("fetchPrice", ["string"]);
            const encodedParams = abiCoder.encode(["string"], [tokenSymbol]);
            const txData = hexlify(concat([funcSelector, encodedParams]));

            const transactionDetails = {
                payload: {
                    to: import.meta.env.VITE_SMART_CONTRACT,
                    value: "0",
                    data: txData,
                },
                account: state.selectedAcount.id,
                scope: `eip155:${state.chain}`,
            };

            // Send request to RPC via our wallet.
            const txResponse = await window.ethereum?.request({
                method: "wallet_invokeSnap",
                params: {
                    snapId: defaultSnapOrigin,
                    request: {
                        method: "eth_sendUserOpBoba",
                        params: [transactionDetails],
                        id: state.selectedAcount?.id,
                    },
                },
            });

            console.log("txResponse:", txResponse);
            setTxResponse(txResponse);

            const provider = new ethers.JsonRpcProvider(
                import.meta.env.VITE_RPC_PROVIDER
            );

            const contract = new ethers.Contract(
                contractAddress,
                contractAbi,
                provider,
            );

            // Fetch token-price from the struct inside the smart-contract.
            const price = await contract.tokenPrices(tokenSymbol);
            const price2 = price[0] || price["0"]; // Assuming the first property is the price string

            console.log("fetched price: ", price);
            setTokenPrice(price2);
        } catch (error: any) {
            console.log(`error`, error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-6/12 rounded-md shadow-sm border m-auto my-2 p-5">
            <div className="flex gap-1 items-stretch justify-around w-full mb-4">
                <div className="flex flex-col justify-start items-start w-10/12">
                    <label className="block text-sm font-medium leading-6 text-teal-900">
                        Contract Address
                    </label>
                    <div className="relative mt-2 rounded-md shadow-sm w-full">
                        <input
                            type="text"
                            value={contractAddress}
                            onChange={(e) => setContractAddress(e.target.value)}
                            name="input contract"
                            className="block w-full bg-teal-200 rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="0x"
                        />
                    </div>
                    <label className="block text-sm font-medium leading-6 text-teal-900">
                        Token Symbol
                    </label>
                    <div className="relative mt-2 rounded-md shadow-sm w-full">
                        <input
                            type="text"
                            value={tokenSymbol}
                            onChange={(e) => setTokenSymbol(e.target.value)}
                            name="input token symbol"
                            className="block w-full bg-teal-200 rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="ETH"
                        />
                    </div>
                </div>
            </div>
            <div className="flex gap-1 items-stretch justify-around w-full">
                <div className="flex items-end">
                    <Button
                        onClick={onSubmit}
                        className="py-2 px-7 mx-4 rounded-md text-sm"
                        variant="destructive"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                Processing...
                            </>
                        ) : (
                            "Submit 12"
                        )}
                    </Button>
                </div>
            </div>
            {error && (
                <div className="flex w-full flex-col my-2">
                    <div className="w-full p-2 bg-red-600 rounded-md mb-2 flex ">
                        <p className="text-md text-white"> Opps, something went wrong!</p>
                    </div>
                    <div
                        className="flex flex-1 justify-between rounded-md bg-teal-100 p-4 w-full cursor-pointer"
                        onClick={async () => {
                            await navigator.clipboard.writeText(error);
                        }}
                    >
                        <div className="text-roboto-mono text-left text-xs text-blue-800 break-all whitespace-pre-wrap">
                            {JSON.stringify(error, null, 2)}
                        </div>
                        <div className="w-4 h-4 justify-end items-end">
                            <CopyIcon/>
                        </div>
                    </div>
                </div>
            )}
            {tokenPrice && !error && (
                <div className="flex w-full flex-col my-2">
                    <div
                        className="flex flex-1 justify-between items-center rounded-md bg-gradient-to-r from-teal-400 to-blue-500 p-6 w-full shadow-lg">
                        <p className="text-xl font-semibold text-white">
                            Price for{" "}
                            <span
                                className="text-yellow-300 text-2xl font-bold px-2 py-1 bg-opacity-50 bg-black rounded">
                {tokenSymbol}
              </span>{" "}
                            is:{" "}
                            <span className="text-3xl font-bold text-green-200 ml-2">
                ${parseFloat(tokenPrice).toLocaleString()}
              </span>
                        </p>
                    </div>
                    <div
                        className="flex flex-1 justify-between rounded-md bg-teal-100 p-4 mt-2 w-full cursor-pointer"
                        onClick={async () => {
                            await navigator.clipboard.writeText(txResponse);
                        }}
                    >
                        <div className="text-roboto-mono text-left text-xs text-blue-800 break-all whitespace-pre-wrap">
                            {JSON.stringify(txResponse, null, 2)}
                        </div>
                        <div className="w-4 h-4 justify-end items-end">
                            <CopyIcon/>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormComponent;
