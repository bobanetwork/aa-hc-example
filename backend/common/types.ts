export type Request = {
  skey: Uint8Array;
  srcAddr: string;
  srcNonce: number | bigint;
  opNonce: number | bigint;
  reqBytes: string;
};
