import 'dotenv'

/**
 * The snap origin to use.
 * Will default to the local hosted snap if no value is provided in environment.
 */

export const defaultSnapOrigin = import.meta.env.VITE_SNAP_ORIGIN ?? 'npm:@bobanetwork/snap-account-abstraction-keyring-hc'

/**
 * Version of snap installed so have to give release on each new version.
 * - can use to show the button to user to update snaps.
 */
export const snapPackageVersion = import.meta.env.VITE_SNAP_VERSION ?? "1.1.22";

/* Contract address that you want to invoke. */
export const YOUR_CONTRACT = import.meta.env.VITE_SMART_CONTRACT;

console.log('Config', {
    orig: defaultSnapOrigin,
    snapVersion: snapPackageVersion,
    contr: YOUR_CONTRACT
})
