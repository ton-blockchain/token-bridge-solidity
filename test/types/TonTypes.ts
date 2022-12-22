export type TonTxId = {
  address_hash: string;
  tx_hash: string;
  lt: number;
};

export type SwapData = {
  receiver: string;
  token: string;
  amount: string;
  tx: TonTxId;
};

export type Signature = {
  signer: string;
  signature: string;
};
