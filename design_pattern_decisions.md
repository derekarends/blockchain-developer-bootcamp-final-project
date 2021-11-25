# Design Pattern Decisions

I have used a few design patters to help build the market places I envisioned when starting to build Eth-Bay.

## Inter-Contract Execution

I used multiple contracts to allow for smaller funcationality to be spread among the contracts.  The contracts do need to communicate with eachother and I tried to make sure the addresses were either set at construction or allow the owner to change as needed.

## Inheritance and Interfaces

I used Openzeppelin's contracts and Interfaces to create an NFT, protect against reentry, and to help manage owner of the contract.

## Guard Check

I added many guard checks to each function to prevent unintented uses of the functions and to make sure the state was managed as expected.

## Access Restriction

I used access restriction to prevent users from being able to update contract addresses, approve loans they are not lenders for, and to prevent buyers from aquiring assets they didn't previously own.
