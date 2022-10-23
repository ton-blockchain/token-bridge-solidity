import "@nomiclabs/hardhat-ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.deployed();

  console.log("token deployed to ", token.address); //0xc16729819F509eEe797181D7Ab158881c1538999
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
