import { useContext, useState } from "react";
import { Button } from "./ui/button";
import { defaultSnapOrigin } from "@/config";
import { MetaMaskContext } from "@/hooks/MetamaskContext";
import { concat, FunctionFragment } from "ethers";
import { AbiCoder } from "ethers";
import { hexlify } from "ethers";
import { CopyIcon } from "./CopyIcon";
import { YOUR_CONTRACT } from "@/config/snap";

const FormComponent = () => {
  const [state] = useContext(MetaMaskContext);
  const [inputA, setinputA] = useState<any>(0);
  const [inputB, setinputB] = useState<any>(0);
  const [testContract, setTestContract] = useState(YOUR_CONTRACT);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const abiCoder = new AbiCoder();

  const onReset = () => {
    setinputA(0);
    setinputB(0);
  };

  const onSubmit = async () => {
    try {
      // check for selected account
      // check for balance.

      // if snap account not selected
      if (!state.selectedAcount || Number(state.chain) !== 28882) {
        return;
      }


      const funcSelector = FunctionFragment.getSelector("fetchPrice", [
        "string",
      ]);

      const encodedParams = abiCoder.encode(["string"], ["ETH"]);

      const txData = hexlify(concat([funcSelector, encodedParams]));

      const transactionDetails = {
        payload: {
          to: testContract,
          value: "0",
          data: txData,
        },
        account: state.selectedAcount.id,
        scope: `eip155:${state.chain}`,
      };

      const txResponse = await window.ethereum?.request({
        method: "wallet_invokeSnap",
        params: {
          snapId: defaultSnapOrigin,
          request: {
            method: "eth_sendUserOpBoba", // operation to send the data to bundler
            params: [transactionDetails],
            id: state.selectedAcount?.id,
          },
        },
      });

      setResponse(txResponse);
    } catch (error: any) {
      console.log(`error`, error);
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col w-6/12 rounded-md shadow-sm border m-auto my-2 p-5">
      <div className="flex gap-1 items-stretch justify-around w-full mb-4">
        <div className="flex flex-col justify-start items-start w-10/12">
          <label className="block text-sm font-medium leading-6 text-teal-900">
            Test Contract Address
          </label>
          <div className="relative mt-2 rounded-md shadow-sm w-full">
            <input
              type="text"
              value={testContract}
              onChange={(e) => setTestContract(e.target.value)}
              name="input A"
              id="input A"
              className="block w-full bg-teal-200 rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="0x"
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
          >
            Submit
          </Button>
          <Button
            onClick={onReset}
            className="py-2 px-7 mx-4 rounded-md text-sm"
            variant="secondary"
          >
            Reset
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
              <CopyIcon />
            </div>
          </div>
        </div>
      )}
      {response && (
        <div className="flex w-full flex-col my-2">
          <div className="w-full p-2 bg-green-200 rounded-md mb-2 flex ">
            <p className="text-md text-blue-500"> Success!</p>
          </div>
          <div
            className="flex flex-1 justify-between rounded-md bg-teal-100 p-4 w-full cursor-pointer"
            onClick={async () => {
              await navigator.clipboard.writeText(response);
            }}
          >
            <div className="text-roboto-mono text-left text-xs text-blue-800 break-all whitespace-pre-wrap">
              {JSON.stringify(response, null, 2)}
            </div>
            <div className="w-4 h-4 justify-end items-end">
              <CopyIcon />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormComponent;
