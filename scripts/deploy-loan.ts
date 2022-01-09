import { ethers } from 'hardhat';
import { AssetContract } from '../typechain/AssetContract';

async function main() {
  const deployedAssetAddress = '';
  const assetContractFactory = await ethers.getContractFactory('AssetContract');

  const loanContractFactory = await ethers.getContractFactory('LoanContract');
  const deployedLoan = await loanContractFactory.deploy(deployedAssetAddress);
  await deployedLoan.deployed();
  console.log('LoanContract deployed to:', deployedLoan.address);

  const assetContract = assetContractFactory.attach(deployedAssetAddress) as AssetContract;
  assetContract.setLoanContract(deployedLoan.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
