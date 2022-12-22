import TonWeb from "tonweb";
import { ethers } from "hardhat";
import { Signature, SwapData } from "./types/TonTypes";

const decToHex = (dec: string): string =>
  "0x" + new TonWeb.utils.BN(dec).toString(16);
export interface EthSignature {
  publicKey: string; // secp_key in hex
  r: string; // 256bit in hex
  s: string; // 256bit in hex
  v: number; // 8bit
}

export const tonweb = new TonWeb(
  new TonWeb.HttpProvider(process.env.HTTP_PROVIDER_API_ROOT, {
    apiKey: process.env.HTTP_PROVIDER_API_KEY,
  })
);

export const parseEthSignature = (data: any): EthSignature => {
  const tuple: any[] = data.tuple.elements;
  const publicKey: string = decToHex(tuple[0].number.number);

  const rsv: any[] = tuple[1].tuple.elements;
  const r: string = decToHex(rsv[0].number.number);
  const s: string = decToHex(rsv[1].number.number);
  const v: number = Number(rsv[2].number.number);
  return {
    publicKey,
    r,
    s,
    v,
  };
};

export let prepareSwapData = (
  receiver: string,
  token: string,
  amount: string,
  address_hash: string,
  tx_hash: any,
  lt: any
) => {
  // if (lt == TON_TX_LT) {
  //     lt = lt + Math.ceil(Date.now() / 1000) + Math.ceil(10000 * Math.random());
  // }
  let swapData: SwapData = {
    receiver,
    token,
    amount,
    tx: {
      address_hash,
      tx_hash,
      lt,
    },
  };
  return swapData;
};

(async () => {
  const [owner] = await ethers.getSigners();
  const addressBnb = "0x7644d43c5b479dAF2b471B83cF2DF29A1DFA2D37";
  const addressLocal = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const bridgeEth = await ethers.getContractAt("Bridge", addressBnb);

  // const config = fs.readFileSync(`./artifacts/hr/system.json`, {encoding: 'utf8'});
  const votesCollectorAddress =
    "UQCuzvIOXLjH2tv35gY4tzhIvXCqZWDuK9kUhFGXKLImg0k8";
  const burnId =
    "1495c43d81ecba7fd7b49d3ec529d60d9080a1e9f8c74ded81a4e20068665160";
  const intBurnId = new TonWeb.utils.BN(burnId, 16);

  const signatures: Signature[] = [
    {
      signer: "0x89D12eBB0cDcb3Fe00045c9D97D8AbFC5F6c497e",
      signature:
        "0xdb917f026163f2f328a6aec7fa00c023f5c1397f71593956a95d9cf7f3e8b2ad29629aae531a62be620fb65e56ea0d454840f27860688b821e3849087c7afa231c",
    },
  ];

  const reciever = "0xa846bc19e8ab8bb0e0bf386853d8c5e199f0af9b";
  const token = "0xc954f9239950ef7d278c91e9fb8416469d7c104f";
  const amount = "1000000000000000000";
  const ton_address_hash = "0x8ebd203c0030e59d5f1bca8006cbb0c73a7627d047b6d5fb3322124f96a36c8e";
  const tx_hash =
    "0x6375001987b4813d0284a2d42580c98557bc6d3085977dbc0b5f278e957404ba";
  const lt = "3444241000001";

  const swapData = prepareSwapData(
    reciever,
    token,
    amount,
    ton_address_hash,
    tx_hash,
    lt
  );

  // const address = ethers.utils.recoverAddress(burnId, '0x547d9b7f3c95bcd376e53a06a41d140e2792758aa835fc7e8c67162fb4a6d82548023e670d2bc07415be52f3ba9802b63704c33412ab6c34d1aaece0bbe151451c')
  // console.log({address});

  const tx = await bridgeEth.unlock(swapData, signatures);
  await tx.wait();

  console.log("burn done");
})();
