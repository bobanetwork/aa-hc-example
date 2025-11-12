/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_RPC_PROVIDER: string
    readonly VITE_API_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare global {
    interface Window {
        ethereum?: MetaMaskInpageProvider;
    }
}

export {};
