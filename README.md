# token-bridge-solidity

TON-EVM token bridge - Solidity smart contracts

Developed by [RSquad](https://rsquad.io/) by order of TON Foundation.

## Run tests

```bash
npm run test
```

## Deploy

> ⚠️ NOTE: It is preferable that the number of oracles will be divisible by 3.
> Note that in other cases minimum consensus is `floor((2 * oracleSet.length + 2) / 3)`. For example, 4 oracles required 3 signatures. It's different from the Toncoin bridge.

change `PRIVATE_KEY`, `GOERLI_ENDPOINT`, `BSC_TESTNET_ENDPOINT` in `.env`.

Ethereum Goerli Testnet:

```bash
npm run deploy-test-token-goerli
npm run deploy-bridge-goerli
```

BSC Testnet:

```bash
npm run deploy-test-token-bsc-testnet
npm run deploy-bridge-bsc-testnet
```

## Code

Based on [Toncoin Bridge](https://github.com/ton-blockchain/bridge-solidity/tree/58bf778e984f2a6c17bc2b24f4647fb66705e705).

* `TonUtils` - `token` address added to `SwapData`. `TonAddress` replaced by `address_hash` because all tokens and token owners in workchain = 0.

* `SignatureChecker` - `getSwapDataId`: `token` address and `chainId` added to signing data, `workchain` removed from signing data; 'uint64 amount' -> 'uint256 amount'; cosmetic changes;

        `checkSignature`
        
        `getNewSetId` - `chainId` added to signing data
        
        `getNewBurnStatusId` renamed to `getNewLockStatusId`, `chainId` added to signing data

* `Bridge`
       
        `SwapEthToTon` renamed to `Lock`, some fields removed and added
       
        `SwapTonToEth` renamed to `Unlock`, some fields removed and added
       
        `burn` -> `lock`, new functionality
       
        `voteForMinting` -> `unlock`, new functionality
       
        `voteForNewOracleSet` same
       
        `allowBurn` renamed to `allowLock`
       
        `voteForSwitchBurn` renamed to `voteForSwitchLock`
       
        cosmetic changes and optimizations

# Etherscan code verification

Add to the end of `hardhat.config.ts` you api key of etherscan or bscscan

```
  etherscan: {
    apiKey: "123ABC",
  },
```

Use `etherscan` field for bscscan too.

Make `arguments.js` file with init oracle addresses array:

```js
module.exports = [
    [
        '0xeb05E1B6AC0d574eF2CF29FDf01cC0bA3D8F9Bf1',
        '0xe54CD631C97bE0767172AD16904688962d09d2FE',
        '0xF636f40Ebe17Fb2A1343e5EEee9D13AA90888b51'
    ]
];
```

Run command

```basb
npx hardhat verify --network bsc_testnet --constructor-args arguments.js 0xADDRESS_OF_BRIDGE_CONTRACT
```