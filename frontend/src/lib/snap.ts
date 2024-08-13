import { defaultSnapOrigin, snapPackageVersion } from "../config";
import type { GetSnapsResponse, Snap } from "../types/snap";

/**
 * Get the installed snaps in MetaMask.
 *
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (): Promise<GetSnapsResponse> => {
  return (await window.ethereum.request({
    method: "wallet_getSnaps",
  })) as unknown as GetSnapsResponse;
};

/**
 * Switch to boba sepolia..
 *

 */

export const switchToBobaSepolia = async () => {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: "0x70d2",
        },
      ],
    });
  } catch (error) {
    console.log(`switch ethereum error`, error);
  }
};

/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (
  snapId: string = defaultSnapOrigin,
  params: Record<"version" | string, unknown> = {
    version: snapPackageVersion,
  }
) => {
  // check for current connected chain and force user to switch to boba sepolia.
  // const currentChain = window.ethereum.networkVersion;
  // if (currentChain !== "28882") {
  //   await window.ethereum.request({
  //     method: "wallet_switchEthereumChain",
  //     params: [
  //       {
  //         chainId: "0x70d2",
  //       },
  //     ],
  //   });
  // }
  await window.ethereum.request({
    method: "wallet_requestSnaps",
    params: {
      [snapId]: params,
    },
  });
};

export const loadAccountConnected = async () => {
  const accounts: any = await window.ethereum.request({
    method: "eth_requestAccounts",
    params: [],
  });
  return accounts[0];
};

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export const getSnap = async (version?: string): Promise<Snap | undefined> => {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version)
    );
  } catch (error) {
    console.log("Failed to obtain installed snap", error);
    return undefined;
  }
};
