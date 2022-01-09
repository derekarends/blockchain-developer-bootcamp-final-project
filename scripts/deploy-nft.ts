import { ethers } from 'hardhat';

async function main() {
  const deployedAssetAddress = '';

  const NftFactory = await ethers.getContractFactory('NFT');
  const nft = await NftFactory.deploy(deployedAssetAddress);
  await nft.deployed();
  console.log('NFT deployed to:', nft.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
