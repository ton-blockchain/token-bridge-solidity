# token-bridge-solidity

TON-EVM token bridge - Solidity smart contracts

Developed by [RSquad](https://rsquad.io/) by order of TON Foundation.

## Run tests

```bash
npm run test
```

## Deploy

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