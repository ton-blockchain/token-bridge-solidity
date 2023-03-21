import "@nomiclabs/hardhat-ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const TestToken = await ethers.getContractFactory("TestToken");
  const token = await TestToken.deploy("1000000000000000000000000000000");
  await token.deployed();

  console.log("token deployed to ", token.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
