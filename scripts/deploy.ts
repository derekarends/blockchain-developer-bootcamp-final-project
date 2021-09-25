import { ethers } from 'hardhat';

/**
 * To Deploy
 * yarn dev
 * npx hardhat node
 * npx hardhat run scripts/deploy.js --network localhost
 */

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Marketplace = await ethers.getContractFactory('Marketplace');
  const market = await Marketplace.deploy();

  await market.deployed();
  console.log('Marketplace deployed to:', market.address);

  const NFT = await ethers.getContractFactory('NFT');
  const nft = await NFT.deploy(market.address);

  await nft.deployed();
  console.log('NFT deployed to:', nft.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
