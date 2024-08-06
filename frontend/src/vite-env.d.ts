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
    readonly VITE_PRIVATE_KEY: string;
    readonly VITE_CLIENT_ADDR: string;
    readonly VITE_SMART_CONTRACT: string;
    readonly VITE_ENTRY_POINT: string;
    readonly VITE_RPC_PROVIDER: string;
  }
}
