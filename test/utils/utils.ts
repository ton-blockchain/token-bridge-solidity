import { ethers, utils } from "ethers";
import { Account } from "web3/eth/accounts";
import { SwapData, Signature } from "../types/TonTypes";
import {CHAIN_ID} from "./constants";

export let prepareSwapData = (
  receiver: string,
  token: string,
  amount: any,
  address_hash: string,
  tx_hash: any,
  lt: any
) => {
  let swapData: SwapData = {
    receiver: receiver,
    token: token,
    amount: amount,
    tx: {
      address_hash: address_hash,
      tx_hash: tx_hash,
      lt: lt,
    },
  };
  return swapData;
};

export let signHash = (hash: any, account: Account) => {
  let signature = account.sign(hash).signature;
  let result: Signature = {
    signer: account.address,
    signature: signature,
  };
  return result;
};

let compareSignatures = (a: Signature, b: Signature): number => {
  if (parseInt(a.signer) > parseInt(b.signer)) return 1;
  if (parseInt(a.signer) == parseInt(b.signer)) {
    return 0;
  } else return -1;
}

export let signSwapData = (swapData: SwapData, accounts: Account[], target: any) => {
  let signatures: Signature[] = new Array();
  for (const account in accounts) {
    if (Object.prototype.hasOwnProperty.call(accounts, account)) {
      const element = accounts[account];
      signatures.push(signHash(hashData(encodeSwapData(swapData, target)), element));
    }
  }
  signatures.sort(compareSignatures);
  return signatures;
};

export let signUpdateLockStatus = (newLockStatus: boolean, nonce: number, accounts: Account[], target: any) => {
  let signatures: Signature[] = new Array();
  for (const account in accounts) {
    if (Object.prototype.hasOwnProperty.call(accounts, account)) {
      const element = accounts[account];
      signatures.push(signHash(hashData(encodeNewLockStatus(newLockStatus, nonce, target)), element));
    }
  }
  signatures.sort(compareSignatures);
  return signatures;
};

export let signDisableToken = (isDisable: boolean, tokenAddress: string, nonce: number, accounts: Account[], target: any) => {
  let signatures: Signature[] = new Array();
  for (const account in accounts) {
    if (Object.prototype.hasOwnProperty.call(accounts, account)) {
      const element = accounts[account];
      signatures.push(signHash(hashData(encodeNewDisableToken(isDisable, tokenAddress, nonce, target)), element));
    }
  }
  signatures.sort(compareSignatures);
  return signatures;
};

export let signUpdateOracleData = (
  oracleSetHash: string,
  newOracleSet: string[],
  accounts: Account[],
  target: any
) => {
  let signatures: Signature[] = new Array();
  for (const account in accounts) {
    if (Object.prototype.hasOwnProperty.call(accounts, account)) {
      const signer = accounts[account];
      signatures.push(signHash(
        hashData(encodeUpdateOracleData(oracleSetHash, newOracleSet, target)),
        signer
      ));
    }
  }
  signatures.sort(compareSignatures);
  return signatures;
};

export let encodeUpdateOracleData = (
  oracleSetHash: string,
  newOracleSet: string[],
  target: any
) => {
  return ethers.utils.defaultAbiCoder.encode(
    ["int", "address", "uint256", "uint256", "address[]"],
    [0x5e7, target, CHAIN_ID, oracleSetHash, newOracleSet]
  );
};

export let encodeNewLockStatus = (
  newLockStatus: boolean,
  nonce: number,
  target: any
) => {
  return ethers.utils.defaultAbiCoder.encode(
    ["int", "address", "uint256", "bool", "uint256"],
    [0xB012, target, CHAIN_ID, newLockStatus, nonce]
  );
};

export let encodeNewDisableToken = (
    isDisable: boolean,
    tokenAddress: string,
    nonce: number,
    target: any
) => {
  return ethers.utils.defaultAbiCoder.encode(
      ["int", "address", "uint256", "bool", "address", "uint256"],
      [0xD15A, target, CHAIN_ID, isDisable, tokenAddress, nonce]
  );
};

export let encodeSwapData = (d: SwapData, target: any) => {
  return ethers.utils.defaultAbiCoder.encode(
    [
      "int",
      "address",
      "uint256",
      "address",
      "address",
      "uint256",
      "bytes32",
      "bytes32",
      "uint64",
    ],
    [
      0xda7a,
      target,
      CHAIN_ID,
      d.receiver,
      d.token,
      d.amount,
      d.tx.address_hash,
      d.tx.tx_hash,
      d.tx.lt,
    ]
  );
};

export let hashData = (encoded: any) => {
  return ethers.utils.keccak256(encoded);
};

export let encodeOracleSet = (oracleSet: string[]) => {
  return ethers.utils.defaultAbiCoder.encode(["address[]"], [oracleSet]);
};