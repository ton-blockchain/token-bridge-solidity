import "@nomiclabs/hardhat-ethers";
import {ethers} from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const Bridge = await ethers.getContractFactory("Bridge");
  const oracles = [
    '0x3154E640c56D023a98890426A24D1A772f5A38B2', // 0
    '0x8B06A5D37625F41eE9D9F543482b6562C657EA6F', // 1
    '0x6D5E361F7E15ebA73e41904F4fB2A7d2ca045162', // 2
    '0x43931B8c29e34a8C16695408CD56327F511Cf086', // 3
    '0x7a0d3C42f795BA2dB707D421Add31deda9F1fEc1', // 4
    '0x88352632350690EF22F9a580e6B413c747c01FB2', // 5
    '0xeB8975966dAF0C86721C14b8Bb7DFb89FCBB99cA', // 6
    '0x48Bf4a783ECFb7f9AACab68d28B06fDafF37ac43', // 7
    '0x954AE64BB0268b06ffEFbb6f454867a5F2CB3177'  // 8
  ];
  const bridge = await Bridge.deploy(oracles);
  await bridge.deployed();

  console.log("bridge deployed to ", bridge.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
