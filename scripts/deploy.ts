import { ethers } from 'hardhat';

async function main() {
  const AssetContract = await ethers.getContractFactory('AssetContract');
  const deployedAsset = await AssetContract.deploy();
  await deployedAsset.deployed();
  console.log('AssetContract deployed to:', deployedAsset.address);

  const LoanContract = await ethers.getContractFactory('LoanContract');
  const deployedLoan = await LoanContract.deploy();
  await deployedLoan.deployed();
  console.log('LoanContract deployed to:', deployedLoan.address);

  const NFT = await ethers.getContractFactory('NFT');
  const nft = await NFT.deploy(deployedAsset.address);
  await nft.deployed();
  console.log('NFT deployed to:', nft.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
