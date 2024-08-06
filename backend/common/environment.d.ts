declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OC_PRIVKEY: string;
      ENTRY_POINTS: string;
      HC_HELPER_ADDR: string;
      OC_HYBRID_ACCOUNT: string;
      COINRANKING_API_KEY: string;
      CHAIN_ID: string;
      OC_LISTEN_PORT: string;
    }
  }
}

export {};
