declare global {
  namespace NodeJS {
    interface ProcessEnv {
      HC_SYS_OWNER: string;
      HC_SYS_PRIVKEY: string;
      OC_OWNER: string;
      OC_PRIVKEY: string;
      CLIENT_OWNER: string;
      CLIENT_PRIVKEY: string;
      ENTRY_POINTS: string;
      HC_HELPER_ADDR: string;
      HC_SYS_ACCOUNT: string;
      OC_HYBRID_ACCOUNT: string;
      CLIENT_ADDR: string;
      SA_FACTORY_ADDR: string;
      HA_FACTORY_ADDR: string;
      COINRANKING_API_KEY: string;
      NODE_HTTP: string;
      CHAIN_ID: string;
      OC_LISTEN_PORT: string; 
      BUNDLER_RPC: string;
    }
  }
}

export {};
