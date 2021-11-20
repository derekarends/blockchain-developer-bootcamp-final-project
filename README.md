# Final Project - Eth-Bay

The idea behind this application is to allow a seller to list assets for sale backed by an NFT.  The seller could then allow the asset to be bought directly, they could assign a loan to it, or other users who may want to hedge can create loans for the asset as well.

A buyer could then come an either buy the asset out directly or apply for a loan.  If the lender approves the loan the buyer would receive the asset and have to pay back the original loan amount.

If the buyer is unable to pay the loan the lender would have the ability to take back the asset and keep it or resell it.

## Live Site

[Eth-Bay](https://www.example.com)

## Walkthrough Video

[Walkthrough of Eth-Bay](https://www.example.com)

## To Run Locally

### Prerequisites

- Node.js >= v16
- Yarn
- `git checkout master`

### Backend

Run `yarn install` to download project dependencies
In one console window run `npx hardhat node` to start the hardhat server
In another console window run `npx hardhat run scripts/deploy.js --network localhost` to deploy the contracts
Finally run `yarn dev` to start the server

### Browser

Go to `http://localhost:3000` to experience eth-bay

## To Run Tests

`yarn test`

## Directory structure

- `components` and `pages`: Project's React frontend
- `contracts`: Solidity Smart Contracts
- `scripts`: Contains deploy script for deploying contracts
- `styles`: Basic global styling
- `test`: Tests for smart contracts
- `utils`: Utility functions used throughout project

## Public Ethereum wallet for certification

`0x71BCF28D4A5CEa37f097a7785CaF690ceAa6bD69`

## TODO

- [ ] As a borrower be able to repay loan
- [ ] As a lender check loan status
- [ ] As a lender be able to take over asset if loan has go delinquent