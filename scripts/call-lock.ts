import "@nomiclabs/hardhat-ethers";
import { formatEther, parseEther, parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";

const TON_ADDRESS_HASH =
  "0x68a32603bc376542ac01fc6266cd1bea8a6bab324c84ea337b7c00833a48dc7a";

async function main() {
  console.log("starting lock script");
  const [owner] = await ethers.getSigners();

  const bridge = await ethers.getContractAt(
    "Bridge",
    "0x896B65f1f1078104F0d0d4723bc371bCF173B60F"
  );
  const token = await ethers.getContractAt(
    "TestToken",
    "0x6cB26573dacd1994BADfDa4CBcC7553AcafFf8d6"
  );

  const bridgeAllowance = parseUnits("12");

  // await token.transfer();
  console.log(await token.balanceOf(owner.address));

  console.log(`approve ${formatEther(bridgeAllowance)} tokens to bridge`);
  let tx = await token.approve(bridge.address, bridgeAllowance);
  await tx.wait();
  console.log("approval successfull");
  console.log(`lock ${formatEther(bridgeAllowance)} tokens in bridge by owner`);
  tx = await bridge.lock(token.address, bridgeAllowance, TON_ADDRESS_HASH);
  await tx.wait();
  console.log("successfully locked");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
