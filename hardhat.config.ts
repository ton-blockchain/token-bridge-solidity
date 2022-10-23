import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 5000,
      },
    },
  },
  networks: {
    hardhat: {
      accounts: {
        count: 100,
      },
    },
    rinkeby: {
      url: process.env.RINKEBY || "",
      accounts:
        [process.env.PRIVATE_KEY || ''],
    },
    goerli: {
      url: process.env.GOERLI || "",
      accounts:
        [process.env.PRIVATE_KEY || ''],
    },
    testnet_bnb: {
      url: process.env.TESTNET_BNB || "",
      accounts: [process.env.PRIVATE_KEY || ''],
    },
    testnet_csc: {
      url: process.env.TESTNET_CSC || '',
      accounts: [process.env.PRIVATE_KEY || '']
    },
    testnet_avax: {
      url: process.env.TESTNET_AVAX || '',
      accounts: [process.env.PRIVATE_KEY || '']
    },
    local: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337,
    },
  },
};

export default config;
