/// <reference types="vite/client" />
import { Eip1193Provider, BrowserProvider } from "ethers";

declare global {
  interface Window {
    ethereum: any;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  interface ImportMetaEnv {
    readonly VITE_SMART_CONTRACT: string;
    readonly VITE_RPC_PROVIDER: string;
    readonly VITE_SNAP_ORIGIN: string;
    readonly VITE_SNAP_VERSION: string;
  }
}
