export type EnvironmentVars = {
    hcSysOwner: string;
    hcSysPrivateKey: string;
    ocOwner: string;
    ocPrivateKey: string;
    clientOwner: string;
    clientPrivateKey: string;
    entryPointAddr: string;
    hcHelperAddr: string;
    hcSysAccount: string;
    ocHybridAccount: string;
    clientAddr: string;
    saFactoryAddr: string;
    haFactoryAddr: string;
    coinRankingApiKey: string;
    nodeHttp: string;
    chainId: number;
    ocListenPort: number;
    bundlerRpc: string;
}

export type Request = {
    skey: Uint8Array;
    srcAddr: string;
    srcNonce: number | bigint;
    opNonce: number | bigint
    reqBytes: string;
}