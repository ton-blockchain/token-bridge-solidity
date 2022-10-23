import "@nomiclabs/hardhat-ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = await Bridge.deploy([owner.address]);
  // const bridge = Bridge.attach('0xF113b76E11c738C1De215115B24f5aBe2aE104D9');
  await bridge.deployed();
  // console.log('oracles ', await bridge.getOracleSet());

  console.log("bridge deployed to ", bridge.address); // 0xF113b76E11c738C1De215115B24f5aBe2aE104D9
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
