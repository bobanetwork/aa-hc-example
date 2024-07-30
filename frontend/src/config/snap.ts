import 'dotenv'

/**
 * The snap origin to use.
 * Will default to the local hosted snap if no value is provided in environment.
 */

export const defaultSnapOrigin = 'npm:@bobanetwork/snap-account-abstraction-keyring-hc'

/**
 * Version of snap installed so have to give release on each new version.
 * - can use to show the button to user to update snaps.
 */
export const snapPackageVersion = "1.1.3";

/* Contract address that you want to invoke. */
export const YOUR_CONTRACT = process.env.SMART_CONTRACT;
