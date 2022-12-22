import "@nomiclabs/hardhat-ethers";
import {ethers} from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const Bridge = await ethers.getContractFactory("Bridge");
  const oracles = [
    '0xeb05E1B6AC0d574eF2CF29FDf01cC0bA3D8F9Bf1',
    '0xe54CD631C97bE0767172AD16904688962d09d2FE',
    '0xF636f40Ebe17Fb2A1343e5EEee9D13AA90888b51'
  ];
  const bridge = await Bridge.deploy(oracles);
  // const bridge = Bridge.attach('0xF113b76E11c738C1De215115B24f5aBe2aE104D9');
  await bridge.deployed();
  // console.log('oracles ', await bridge.getOracleSet());

  console.log("bridge deployed to ", bridge.address); // 0xF113b76E11c738C1De215115B24f5aBe2aE104D9
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
