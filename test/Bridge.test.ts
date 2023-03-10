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
  signSwapData, signUpdateLockStatus,
  signUpdateOracleData,
} from "./utils/utils";
import type { Bridge, TestToken, TestWrappedJetton } from "../typechain-types";
import {BigNumber} from "ethers";

const web3 = new Web3();

describe("Bridge contract", () => {
  let owner: SignerWithAddress;
  let bridge: Bridge;
  let token: TestToken;
  let wrappedJetton: TestWrappedJetton;

  const signer: Account = web3.eth.accounts.create() as unknown as Account;
  const user: Account = web3.eth.accounts.create() as unknown as Account;
  const signer1: Account = web3.eth.accounts.create() as unknown as Account;
  const signer2: Account = web3.eth.accounts.create() as unknown as Account;
  const unauthorized: Account = web3.eth.accounts.create() as unknown as Account;
  const tonAddressHash = TON_ADDRESS_HASH;

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

    const TestToken = await ethers.getContractFactory("TestToken");
    token = await TestToken.deploy(BigNumber.from('2000000').mul(BigNumber.from(10).pow(BigNumber.from(18)))) as TestToken;
    await token.deployed();

    const TestWrappedJetton = await ethers.getContractFactory("TestWrappedJetton");
    wrappedJetton = await TestWrappedJetton.deploy() as TestWrappedJetton;
    await wrappedJetton.deployed();

    const ownerBalance = await token.balanceOf(owner.address);
    expect(formatUnits(ownerBalance)).to.equal("2000000.0");

    const signatures = signUpdateLockStatus(
        true,
        1,
        oracleSet,
        bridge.address
    );

    await bridge.voteForSwitchLock(true, 1, signatures);

  });

  // LOCK

  it("Should lock token", async () => {
    const bridgeAllowance = parseUnits("5");
    await token.approve(bridge.address, bridgeAllowance);

    await expect(bridge.lock(token.address, bridgeAllowance, tonAddressHash))
        .to.emit(bridge, 'Lock')
        .withArgs(owner.address, token.address, tonAddressHash.toLowerCase(), bridgeAllowance, bridgeAllowance, 18);

    const ownerBalanceNew = await token.balanceOf(owner.address);
    const bridgeBalance = await token.balanceOf(bridge.address);

    expect(formatUnits(ownerBalanceNew)).to.equal("1999995.0");
    expect(formatUnits(bridgeBalance)).to.equal("5.0");
  });

  it("Cant lock if no allowLock ", async () => {
    const signatures = signUpdateLockStatus(
        false,
        2,
        oracleSet,
        bridge.address
    );

    await bridge.voteForSwitchLock(false, 2, signatures);

    try {
      const bridgeAllowance = parseUnits("5");
      await token.approve(bridge.address, bridgeAllowance);

      await bridge.lock(token.address, bridgeAllowance, tonAddressHash);

      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Lock is currently disabled");
    }
  });

  it("Cant lock zero address", async () => {
    const bridgeAllowance = parseUnits("5");
    await token.approve(bridge.address, bridgeAllowance);
    try {
      await bridge.lock(
          ethers.constants.AddressZero,
          bridgeAllowance,
          tonAddressHash
      );
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("lock: disabled token");
    }
  });

  it("Cant lock eth wrapped toncoin", async () => {
    const bridgeAllowance = parseUnits("5");
    await token.approve(bridge.address, bridgeAllowance);
    try {
      await bridge.lock(
          '0x582d872a1b094fc48f5de31d3b73f2d9be47def1',
          bridgeAllowance,
          tonAddressHash
      );
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("lock: disabled token");
    }
  });

  it("Cant lock bsc wrapped toncoin", async () => {
    const bridgeAllowance = parseUnits("5");
    await token.approve(bridge.address, bridgeAllowance);
    try {
      await bridge.lock(
          '0x76A797A59Ba2C17726896976B7B3747BfD1d220f',
          bridgeAllowance,
          tonAddressHash
      );
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("lock: disabled token");
    }
  });

  it("Cant lock wrapped jetton", async () => {
    const bridgeAllowance = parseUnits("5");
    await wrappedJetton.approve(bridge.address, bridgeAllowance);

    try {
      await bridge.lock(wrappedJetton.address, bridgeAllowance, tonAddressHash);
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("lock wrapped jetton");
    }
  });

  it("Cant lock big supply", async () => {
    const TestToken = await ethers.getContractFactory("TestToken");
    const tokenBigSupply = await TestToken.deploy(BigNumber.from(2).pow(BigNumber.from(255))) as TestToken;
    await tokenBigSupply.deployed();

    const bridgeAllowance = parseUnits("5");
    await tokenBigSupply.approve(bridge.address, bridgeAllowance);
    try {
      await bridge.lock(
          tokenBigSupply.address,
          bridgeAllowance,
          tonAddressHash
      );
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Max totalSupply 2 ** 120 - 1");
    }
  });

  it("Cant lock big supply 2**120", async () => {
    const TestToken = await ethers.getContractFactory("TestToken");
    const tokenBigSupply = await TestToken.deploy(BigNumber.from(2).pow(BigNumber.from(120))) as TestToken;
    await tokenBigSupply.deployed();

    const bridgeAllowance = parseUnits("5");
    await tokenBigSupply.approve(bridge.address, bridgeAllowance);
    try {
      await bridge.lock(
          tokenBigSupply.address,
          bridgeAllowance,
          tonAddressHash
      );
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Max totalSupply 2 ** 120 - 1");
    }
  });

  it("lock big supply 2**120 - 1", async () => {
    const TestToken = await ethers.getContractFactory("TestToken");
    const tokenBigSupply = await TestToken.deploy(BigNumber.from(2).pow(BigNumber.from(120)).sub(1)) as TestToken;
    await tokenBigSupply.deployed();

    const bridgeAllowance = parseUnits("5");
    await tokenBigSupply.approve(bridge.address, bridgeAllowance);
    const ownerBalanceOld = await tokenBigSupply.balanceOf(owner.address);

    await bridge.lock(tokenBigSupply.address, bridgeAllowance, tonAddressHash);

    const ownerBalanceNew = ownerBalanceOld.sub(bridgeAllowance);
    const bridgeBalance = await tokenBigSupply.balanceOf(bridge.address);

    expect(await tokenBigSupply.balanceOf(owner.address)).to.equal(ownerBalanceNew);
    expect(formatUnits(bridgeBalance)).to.equal("5.0");
  });

  it("Cant lock big amount 2**100 + 1", async () => {
    const TestToken = await ethers.getContractFactory("TestToken");
    const totalSupply = BigNumber.from(2).pow(BigNumber.from(100)).add(1);
    const tokenBigSupply = await TestToken.deploy(totalSupply) as TestToken;
    await tokenBigSupply.deployed();

    const bridgeAllowance = totalSupply;
    await tokenBigSupply.approve(bridge.address, bridgeAllowance);
    try {
      await bridge.lock(
          tokenBigSupply.address,
          totalSupply,
          tonAddressHash
      );
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Max amount 2 ** 100");
    }
  });

  it("lock big amount 2**100", async () => {
    const TestToken = await ethers.getContractFactory("TestToken");
    const totalSupply = BigNumber.from(2).pow(BigNumber.from(100));
    const tokenBigSupply = await TestToken.deploy(totalSupply) as TestToken;
    await tokenBigSupply.deployed();

    const bridgeAllowance = totalSupply;
    await tokenBigSupply.approve(bridge.address, bridgeAllowance);

    await bridge.lock(tokenBigSupply.address, bridgeAllowance, tonAddressHash);

    const ownerBalanceNew = await tokenBigSupply.balanceOf(owner.address);
    const bridgeBalance = await tokenBigSupply.balanceOf(bridge.address);

    expect(ownerBalanceNew).to.equal("0");
    expect(bridgeBalance).to.equal(totalSupply);
  });

  it("Cant lock zero amount", async () => {
    try {
      await bridge.lock(
          token.address,
          parseUnits("0"),
          tonAddressHash
      );
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("newBalance must be greater than oldBalance");
    }
  });

  // UNLOCK

  it("Should throw 'Unauthorized signer' exception", async () => {
    const amount = parseUnits("2").toString();
    const data = prepareSwapData(
        owner.address,
        token.address,
        amount,
        tonAddressHash,
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
      expect.fail()
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
        tonAddressHash,
        TON_TX_HASH,
        TON_TX_LT
    );

    const signatures = signSwapData(data, [signer], bridge.address);
    try {
      await bridge.unlock(data, signatures);
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Not enough signatures");
    }
  });

  it("Should throw 'Vote is already finished' exception", async () => {
    const bridgeAllowance = parseUnits("5");
    await token.approve(bridge.address, bridgeAllowance);

    await bridge.lock(token.address, bridgeAllowance, tonAddressHash);
    const amount = parseUnits("2");
    const data = prepareSwapData(
        owner.address,
        token.address,
        amount,
        tonAddressHash,
        TON_TX_HASH,
        TON_TX_LT
    );

    const signatures = signSwapData(data, oracleSet, bridge.address);

    await bridge.unlock(data, signatures);
    try {
      await bridge.unlock(data, signatures);
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Vote is already finished");
    }
  });

  it("Should unlock token", async () => {
    const bridgeAllowance = parseUnits("5");
    await token.approve(bridge.address, bridgeAllowance);

    await bridge.lock(token.address, bridgeAllowance, tonAddressHash);
    const amount = parseUnits("2");
    const data = prepareSwapData(
        owner.address,
        token.address,
        amount,
        tonAddressHash,
        TON_TX_HASH,
        TON_TX_LT
    );

    const signatures = signSwapData(data, oracleSet, bridge.address);

    await expect(bridge.unlock(data, signatures))
        .to.emit(bridge, 'Unlock')
        .withArgs(token.address, tonAddressHash.toLowerCase(), TON_TX_HASH.toLowerCase(), TON_TX_LT, owner.address, amount);

    const ownerBalanceUnlocked = await token.balanceOf(owner.address);
    const bridgeBalanceUnlocked = await token.balanceOf(bridge.address);
    expect(formatUnits(bridgeBalanceUnlocked)).to.equal("3.0");
    expect(formatUnits(ownerBalanceUnlocked)).to.equal("1999997.0");
  });

  it("Unlock - wrong signature", async () => {
    const bridgeAllowance = parseUnits("5");
    await token.approve(bridge.address, bridgeAllowance);

    await bridge.lock(token.address, bridgeAllowance, tonAddressHash);
    const amount = parseUnits("2");
    const data = prepareSwapData(
        owner.address,
        token.address,
        amount,
        tonAddressHash,
        TON_TX_HASH,
        TON_TX_LT
    );

    const signatures = signSwapData(data, oracleSet, bridge.address);

    try {
      await bridge.unlock(prepareSwapData(
          owner.address,
          token.address,
          parseUnits('5'),
          tonAddressHash,
          TON_TX_HASH,
          TON_TX_LT
      ), signatures);
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Wrong signature");
    }
  });

  it("Should unlock token 2 ** 100", async () => {
    const TestToken = await ethers.getContractFactory("TestToken");
    const totalSupply = BigNumber.from(2).pow(BigNumber.from(100));
    const tokenBigSupply = await TestToken.deploy(totalSupply) as TestToken;
    await tokenBigSupply.deployed();

    const bridgeAllowance = totalSupply;
    await tokenBigSupply.approve(bridge.address, bridgeAllowance);

    await bridge.lock(tokenBigSupply.address, bridgeAllowance, tonAddressHash);
    const amount = totalSupply;
    const data = prepareSwapData(
        owner.address,
        tokenBigSupply.address,
        amount,
        tonAddressHash,
        TON_TX_HASH,
        TON_TX_LT
    );

    const signatures = signSwapData(data, oracleSet, bridge.address);

    await bridge.unlock(data, signatures);

    const ownerBalanceUnlocked = await tokenBigSupply.balanceOf(owner.address);
    const bridgeBalanceUnlocked = await tokenBigSupply.balanceOf(bridge.address);
    expect(bridgeBalanceUnlocked).to.equal("0");
    expect(ownerBalanceUnlocked).to.equal(totalSupply);
  });

  // voteForSwitchLock

  it("voteForSwitchLock Vote is already finished", async () => {
    const signatures = signUpdateLockStatus(
        true,
        666,
        oracleSet,
        bridge.address
    );

    await bridge.voteForSwitchLock(true, 666, signatures);

    try {
      await bridge.voteForSwitchLock(true, 666, signatures);
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Vote is already finished");
    }
  })

  it("voteForSwitchLock Unauthorized signer", async () => {
    const signatures = signUpdateLockStatus(
        true,
        666,
        oracleSet.slice(2).concat([unauthorized]),
        bridge.address
    );

    try {
      await bridge.voteForSwitchLock(true, 666, signatures);
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Unauthorized signer");
    }
  })

  it("voteForSwitchLock Not enough signatures", async () => {
    const signatures = signUpdateLockStatus(
        true,
        666,
        oracleSet.slice(2),
        bridge.address
    );

    try {
      await bridge.voteForSwitchLock(true, 666, signatures);
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Not enough signatures");
    }
  })

  it("voteForSwitchLock invalid singature", async () => {
    const signatures = signUpdateLockStatus(
        true,
        666,
        oracleSet,
        bridge.address
    );

    try {
      await bridge.voteForSwitchLock(true, 555, signatures);
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Wrong signature");
    }
  })

  // voteForNewOracleSet

  it("Should update oracle set", async () => {
    const newSigner = web3.eth.accounts.create();
    const newUser = web3.eth.accounts.create();
    const newSigner1 = web3.eth.accounts.create();

    const oldOracles = await bridge.getFullOracleSet();
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

    const actualOracleSet = await bridge.getFullOracleSet();

    expect(actualOracleSet).to.eql(newOracleSet);

    try {
      await bridge.voteForNewOracleSet(oracleSetHash, newOracleSet, signatures);
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Vote is already finished");
    }
  });

  it("update oracle set - invalid signature", async () => {
    const newSigner = web3.eth.accounts.create();
    const newUser = web3.eth.accounts.create();
    const newSigner1 = web3.eth.accounts.create();

    const oldOracles = await bridge.getFullOracleSet();
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

    try {
      await bridge.voteForNewOracleSet(oracleSetHash, oldOracles, signatures);
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Wrong signature");
    }
  });

  it("Unauthorized update oracle set", async () => {
    const newSigner = web3.eth.accounts.create();
    const newUser = web3.eth.accounts.create();
    const newSigner1 = web3.eth.accounts.create();

    const oldOracles = await bridge.getFullOracleSet();
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
        oracleSet.slice(2).concat([unauthorized]),
        bridge.address
    );

    try {
      await bridge.voteForNewOracleSet(oracleSetHash, newOracleSet, signatures);
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Unauthorized signer");
    }
  });

  it("Not enough signatures update oracle set", async () => {
    const newSigner = web3.eth.accounts.create();
    const newUser = web3.eth.accounts.create();
    const newSigner1 = web3.eth.accounts.create();

    const oldOracles = await bridge.getFullOracleSet();
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
        oracleSet.slice(2),
        bridge.address
    );

    try {
      await bridge.voteForNewOracleSet(oracleSetHash, newOracleSet, signatures);
      expect.fail()
    } catch (err: any) {
      expect(err.toString()).to.have.string("Not enough signatures");
    }
  });

  it("Should throw 'New set is too short' exception", async () => {
    const newSigner = web3.eth.accounts.create();

    const oldOracles = await bridge.getFullOracleSet();
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
      expect.fail()
    } catch (error: any) {
      expect(error.toString()).to.have.string("New set is too short");
    }

  });

  it("Should throw 'Duplicate oracle in Set' exception", async () => {
    const newSigner = web3.eth.accounts.create();

    const oldOracles = await bridge.getFullOracleSet();
    expect(oldOracles).to.eql(oracleSetAddresses);

    const oracleSetHash = keccak256(encodeOracleSet(oracleSetAddresses));

    const newOracleSet = [
      newSigner.address,
      newSigner.address,
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
      expect.fail()
    } catch (error: any) {
      expect(error.toString()).to.have.string("Duplicate oracle in Set");
    }

  });

});
