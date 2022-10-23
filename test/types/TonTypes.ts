export type TonAddress = {
  workchain: number;
  address_hash: string;
};

export type SwapData = {
  receiver: string;
  token: string;
  amount: string;
  tx: TonTxId;
};

export type TonTxId = {
  address_: TonAddress;
  tx_hash: string;
  lt: number;
};

export type Signature = {
  signer: string;
  signature: string;
};
