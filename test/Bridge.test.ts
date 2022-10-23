import { expect } from "chai";
import { ethers } from "hardhat";
import { formatUnits, keccak256, parseUnits } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import Web3 from "web3";
import { Account } from "web3/eth/accounts";
import {
  TON_TX_LT,
  TON_WORKCHAIN,
  TON_ADDRESS_HASH,
  TON_TX_HASH
} from "./utils/constants";
import {
  encodeOracleSet,
  prepareSwapData,
  signSwapData,
  signUpdateOracleData,
} from "./utils/utils";
import type { Bridge, Token } from "../typechain-types";

const web3 = new Web3();

describe("Bridge contract", () => {
  let owner: SignerWithAddress;
  let bridge: Bridge;
  let token: Token;

  const signer: Account = web3.eth.accounts.create() as unknown as Account;
  const user: Account = web3.eth.accounts.create() as unknown as Account;
  const signer1: Account = web3.eth.accounts.create() as unknown as Account;
  const signer2: Account = web3.eth.accounts.create() as unknown as Account;
  const unauthorized: Account = web3.eth.accounts.create() as unknown as Account;
  const tonAddress = {
    workchain: TON_WORKCHAIN,
    address_hash: TON_ADDRESS_HASH,
  };

  const oracleSet = [
    signer,
    user,
    signer1,
    signer2,
  ];

  let oracleSetAddresses: string[] = new Array();
  oracleSet.map((account) => { oracleSetAddresses.push(account.address) });

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const Bridge = await ethers.getContractFactory("Bridge");
    bridge = await Bridge.deploy(oracleSetAddresses) as Bridge;
    await bridge.deployed();

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy() as Token;
    await token.deployed();

    const ownerBalance = await token.balanceOf(owner.address);
    expect(formatUnits(ownerBalance)).to.equal("2000000.0");
  });

  it("Should lock token", async () => {
    const bridgeAllowance = parseUnits("5");
    await token.approve(bridge.address, bridgeAllowance);

    await bridge.lock(token.address, bridgeAllowance, tonAddress);

    const ownerBalanceNew = await token.balanceOf(owner.address);
    const bridgeBalance = await token.balanceOf(bridge.address);

    expect(formatUnits(ownerBalanceNew)).to.equal("1999995.0");
    expect(formatUnits(bridgeBalance)).to.equal("5.0");
  });

  it("Should throw 'Wrong token' exception", async () => {
    const bridgeAllowance = parseUnits("5");
    await token.approve(bridge.address, bridgeAllowance);
    try {
      await bridge.lock(
        ethers.constants.AddressZero,
        bridgeAllowance,
        tonAddress
      );
    } catch (err: any) {
      expect(err.toString()).to.have.string("lock: wrong token address");
    }
  });

  it("Should throw 'Wrong receiver' exception", async () => {
    const amount = parseUnits("2").toString();
    const data = prepareSwapData(
      user.address,
      token.address,
      amount,
      tonAddress,
      TON_TX_HASH,
      TON_TX_LT
    );

    const signatures = signSwapData(data, [signer], bridge.address);

    try {
      await bridge.unlock(data, signatures);
    } catch (err: any) {
      expect(err.toString()).to.have.string("unlock: wrong receiver address");
    }
  });

  it("Should throw 'Unauthorized signer' exception", async () => {
    const amount = parseUnits("2").toString();
    const data = prepareSwapData(
      owner.address,
      token.address,
      amount,
      tonAddress,
      TON_TX_HASH,
      TON_TX_LT
    );

    const oracleSetUnauthorized = [
      unauthorized,
      user,
      signer1,
      signer2,
    ];

    const signatures = signSwapData(data, oracleSetUnauthorized, bridge.address);

    try {
      await bridge.unlock(data, signatures);
    } catch (err: any) {
      expect(err.toString()).to.have.string("Unauthorized signer");
    }
  });

  it("Should throw 'Not enough signatures' exception", async () => {
    const amount = parseUnits("2");
    const data = prepareSwapData(
      owner.address,
      token.address,
      amount,
      tonAddress,
      TON_TX_HASH,
      TON_TX_LT
    );

    const signatures = signSwapData(data, [signer], bridge.address);
    try {
      await bridge.unlock(data, signatures);
    } catch (err: any) {
      expect(err.toString()).to.have.string("Not enough signatures");
    }
  });

  it("Should update oracle set", async () => {
    const newSigner = web3.eth.accounts.create();
    const newUser = web3.eth.accounts.create();
    const newSigner1 = web3.eth.accounts.create();

    const oldOracles = await bridge.getOracleSet();
    expect(oldOracles).to.eql(oracleSetAddresses);

    const oracleSetHash = keccak256(encodeOracleSet(oracleSetAddresses));

    const newOracleSet = [
      newSigner.address,
      newUser.address,
      newSigner1.address,
    ];

    const signatures = signUpdateOracleData(
      oracleSetHash,
      newOracleSet,
      oracleSet,
      bridge.address
    );

    await bridge.voteForNewOracleSet(oracleSetHash, newOracleSet, signatures);

    const actualOracleSet = await bridge.getOracleSet();

    expect(actualOracleSet).to.eql(newOracleSet);
  });

  it("Should throw 'New set is too short' exception", async () => {
    const newSigner = web3.eth.accounts.create();

    const oldOracles = await bridge.getOracleSet();
    expect(oldOracles).to.eql(oracleSetAddresses);

    const oracleSetHash = keccak256(encodeOracleSet(oracleSetAddresses));

    const newOracleSet = [
      newSigner.address,
    ];

    const signatures = signUpdateOracleData(
      oracleSetHash,
      newOracleSet,
      oracleSet,
      bridge.address
    );

    try {
      await bridge.voteForNewOracleSet(oracleSetHash, newOracleSet, signatures);
    } catch (error: any) {
      expect(error.toString()).to.have.string("New set is too short");
    }

  });

  it("Should throw 'Vote is already finished' exception", async () => {
    const bridgeAllowance = parseUnits("5");
    await token.approve(bridge.address, bridgeAllowance);

    await bridge.lock(token.address, bridgeAllowance, tonAddress);
    const amount = parseUnits("2");
    const data = prepareSwapData(
      owner.address,
      token.address,
      amount,
      tonAddress,
      TON_TX_HASH,
      TON_TX_LT
    );

    const signatures = signSwapData(data, oracleSet, bridge.address);

    await bridge.unlock(data, signatures);
    try {
      await bridge.unlock(data, signatures);
    } catch (err: any) {
      expect(err.toString()).to.have.string("Vote is already finished");
    }
  });

  it("Should unlock token", async () => {
    const bridgeAllowance = parseUnits("5");
    await token.approve(bridge.address, bridgeAllowance);

    await bridge.lock(token.address, bridgeAllowance, tonAddress);
    const amount = parseUnits("2");
    const data = prepareSwapData(
      owner.address,
      token.address,
      amount,
      tonAddress,
      TON_TX_HASH,
      TON_TX_LT
    );

    const signatures = signSwapData(data, oracleSet, bridge.address);

    await bridge.unlock(data, signatures);

    const ownerBalanceUnlocked = await token.balanceOf(owner.address);
    const bridgeBalanceUnlocked = await token.balanceOf(bridge.address);
    expect(formatUnits(bridgeBalanceUnlocked)).to.equal("3.0");
    expect(formatUnits(ownerBalanceUnlocked)).to.equal("1999997.0");
  });
});
