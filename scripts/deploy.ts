import { ethers } from 'hardhat';
import { AssetContract } from '../typechain/AssetContract';

async function main() {
  const assetContractFactory = await ethers.getContractFactory('AssetContract');
  const deployedAsset = await assetContractFactory.deploy();
  await deployedAsset.deployed();
  console.log('AssetContract deployed to:', deployedAsset.address);

  const loanContractFactory = await ethers.getContractFactory('LoanContract');
  const deployedLoan = await loanContractFactory.deploy(deployedAsset.address);
  await deployedLoan.deployed();
  console.log('LoanContract deployed to:', deployedLoan.address);

  const assetContract = assetContractFactory.attach(deployedAsset.address) as AssetContract;
  assetContract.setLoanContract(deployedLoan.address);

  const NftFactory = await ethers.getContractFactory('NFT');
  const nft = await NftFactory.deploy(deployedAsset.address);
  await nft.deployed();
  console.log('NFT deployed to:', nft.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
