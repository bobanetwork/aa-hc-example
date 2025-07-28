import { defaultSnapOrigin } from "../config";
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
 * Connects a Snap to MetaMask without specifying a version.
 * This will always attempt to install the latest available version.
 *
 * @param snapId - The ID or origin of the Snap (e.g., 'npm:my-snap' or 'https://your-host.com').
 * @param params - Optional additional parameters to pass to the Snap during connection.
 */
export const connectSnap = async (
    snapId: string = defaultSnapOrigin,
    params: Record<string, unknown> = {}
): Promise<void> => {
  await window.ethereum.request({
    method: 'wallet_requestSnaps',
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
