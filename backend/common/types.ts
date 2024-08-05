export type Request = {
  skey: Uint8Array;
  srcAddr: string;
  srcNonce: number | bigint;
  opNonce: number | bigint;
  reqBytes: string;
};

export type OffchainParameterParsed = {
  ver: string;
  sk: string;
  srcAddr: string;
  srcNonce: string;
  ooNonce: string;
  payload: string;
};

export type OffchainParameter = {
  ver: string;
  sk: string;
  src_addr: string;
  src_nonce: string;
  oo_nonce: string;
  payload: string;
};
