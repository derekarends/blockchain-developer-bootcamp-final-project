import { ethers } from 'hardhat';

async function main() {
  const assetContractFactory = await ethers.getContractFactory('AssetContract');
  const deployedAsset = await assetContractFactory.deploy();
  await deployedAsset.deployed();
  console.log('AssetContract deployed to:', deployedAsset.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
