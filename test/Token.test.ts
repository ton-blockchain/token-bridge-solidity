import { expect } from "chai";
import { formatUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import {BigNumber} from "ethers";

describe("TestToken contract", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner] = await ethers.getSigners();

    const TestToken = await ethers.getContractFactory("TestToken");
    const hardhatToken = await TestToken.deploy(BigNumber.from('2000000').mul(BigNumber.from(10).pow(BigNumber.from(18))));

    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    const totalSupply = await hardhatToken.totalSupply();
    expect(formatUnits(totalSupply)).to.equal(formatUnits(ownerBalance));
  });
});
