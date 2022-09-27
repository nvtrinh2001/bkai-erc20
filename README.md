# An ERC20 Token Project

This project creates an ERC20 token without using a third-party implementation.

# Overview

This implementation based on the [EIP-20: Token Standard](https://eips.ethereum.org/EIPS/eip-20) with additional ownership functions.

# Getting Started

## Requirements

- git
- node.js
- yarn

## Quick Start

```
git clone git@github.com:nvtrinh2001/bkai-erc20.git
cd bkai-erc20
yarn
```

# Deploy

## On the Hardhat Network

`yarn hardhat deploy`

## On the Rinkeby Testnet

Set up the environment variables as in the `.env.example` file.

THen, run:

`yarn hardhat deploy --network rinkeby`

# Verify on Etherscan

Get the etherscan API key and put it in the `.env` file. The token will be automatically verified by running the deployment scripts.

# Testing

To test the smart contract, run:

`yarn hardhat test`

The gas price report will be automatically generated and saved in `gas-report.txt`.

# Coverage

This will show how many codes have been covered by the tests. Run:

`yarn hardhat coverage`
