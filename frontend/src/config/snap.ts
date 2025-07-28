import 'dotenv'

/**
 * The snap origin to use.
 * Will default to the local hosted snap if no value is provided in environment.
 */

export const defaultSnapOrigin = import.meta.env.VITE_SNAP_ORIGIN ?? 'npm:@bobanetwork/snap-account-abstraction-keyring-hc'

/* Contract address that you want to invoke. */
export const YOUR_CONTRACT = import.meta.env.VITE_SMART_CONTRACT;

console.log('Config', {
    orig: defaultSnapOrigin,
    contr: YOUR_CONTRACT
})
