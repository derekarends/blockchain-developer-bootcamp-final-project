import { ethers } from 'hardhat';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { NFT } from '../typechain/NFT';
import { LoanContract } from '../typechain/LoanContract';
import { AssetContract } from '../typechain/AssetContract';
import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(solidity);

const { expect } = chai;
const ContractName = 'LoanContract';
const oneEth = ethers.utils.parseUnits('1', 'ether');
const auctionPrice = ethers.utils.parseUnits('10', 'ether');

describe(`${ContractName}`, () => {
  let loanContract: LoanContract;
  let assetContract: AssetContract;
  let nft: NFT;

  async function createNft(id: number) {
    const listingFee = await assetContract.listingFee();
    await nft.createToken(`https://www.mytokenlocation${id}.com`);
    await assetContract.listNewAsset(nft.address, id, auctionPrice, { value: listingFee });
  }

  beforeEach(async () => {
    const assetContractFactory = await ethers.getContractFactory(`AssetContract`);
    assetContract = (await assetContractFactory.deploy()) as AssetContract;
    await assetContract.deployed();
    expect(assetContract.address).to.properAddress;

    const nftLoanFactory = await ethers.getContractFactory(`${ContractName}`);
    loanContract = (await nftLoanFactory.deploy(assetContract.address)) as LoanContract;
    await loanContract.deployed();
    expect(loanContract.address).to.properAddress;

    const nftFactory = await ethers.getContractFactory('NFT');
    nft = (await nftFactory.deploy(assetContract.address)) as NFT;
    await nft.deployed();
    expect(nft.address).to.properAddress;
  });

  /**
   * createNewLoan Tests
   */
  describe('createNewLoan', async () => {
    const tokenId = 1;
    it('should require asset being for sale', async () => {
      await createNft(tokenId);
      const signers = await ethers.getSigners();
      await assetContract.connect(signers[1]).buyAsset(tokenId, { value: auctionPrice });

      try {
        await loanContract.createNewLoan(1, { value: auctionPrice });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Asset must be for sale');
      }
    });

    it('should require full amount of asset to be sent', async () => {
      await createNft(1);

      try {
        await loanContract.createNewLoan(tokenId, { value: 0 });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Loan must be at least the amount of the asset');
      }
    });

    it('should emit a loan was created', async () => {
      await createNft(tokenId);

      const tx = await loanContract.createNewLoan(tokenId, { value: auctionPrice });
      expect(tx).to.emit(loanContract, 'LoanCreated');
    });
  });

  /**
   * getAllLoans Tests
   */
  describe('getAllLoans', async () => {
    it('should return an empty list', async () => {
      const items = await loanContract.getAllLoans();
      expect(items).to.be.empty;
    });

    it('should return two results', async () => {
      const tokenId = 1;
      await createNft(tokenId);
      await loanContract.createNewLoan(tokenId, { value: auctionPrice });
      await loanContract.createNewLoan(tokenId, { value: auctionPrice });

      const items = await loanContract.getAllLoans();
      expect(items.length).to.be.eq(2);
      for (let i = 0; i < items.length; i++) {
        expect(BigNumber.from(items[i].id).toNumber()).to.be.eq(i + 1);
      }
    });
  });

  /**
   * cancelLoan Tests
   */
  describe('cancelLoan', async () => {
    it('should require only lender to cancel', async () => {
      await createNft(1);
      await loanContract.createNewLoan(1, { value: auctionPrice });
      try {
        const signers = await ethers.getSigners();
        await loanContract.connect(signers[1]).cancelLoan(1);
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Only the lender can canel the loan');
      }
    });

    // it('should require loan to not have a borrower', async () => {
    //   await createNft(1);
    //   await marketplace.createNewLoan(1, 1, 1, { value: auctionPrice });
    //   try {
    //     const signers = await ethers.getSigners();
    //     await marketplace.connect(signers[1]).cancelLoan(1);
    //     expect.fail('The transaction should have thrown an error');
    //   } catch (ex) {
    //     const err = ex as Error;
    //     expect(err.message).to.contain('Only the lender can canel the loan');
    //   }
    // });

    it('should emit a loan was created', async () => {
      await createNft(1);
      await loanContract.createNewLoan(1, { value: auctionPrice });
      const tx = await loanContract.cancelLoan(1);
      expect(tx).to.emit(loanContract, 'LoanCancelled');
    });
  });

  /**
   * getMyLendings Tests
   */
  // describe('getMyLendings', async () => {
  //   it('should return an empty list', async () => {
  //     const items = await marketplace.getMyLendings();
  //     expect(items).to.be.empty;
  //   });

  //   it('should return one results because there is one loan', async () => {
  //     await createNft(1);
  //     await marketplace.createNewLoan(1, 1, 1, { value: auctionPrice });
  //     const items = await marketplace.getMyLendings();
  //     expect(items.length).to.be.eq(1);
  //     expect(BigNumber.from(items[0].id).toNumber()).to.be.eq(1);
  //   });
  // });

  /**
   * getAvailableAssetLoans Tests
   */
  // describe('getAvailableAssetLoans', async () => {
  //   it('should return an empty list', async () => {
  //     await createNft(1);
  //     const items = await marketplace.getAvailableAssetLoans(1);
  //     expect(items).to.be.empty;
  //   });

  //   it('should require the loan to be new', async () => {
  //     const signers = await ethers.getSigners();
  //     await createNft(1);

  //     await marketplace.createNewLoan(1, 1, 1, { value: auctionPrice });
  //     await marketplace.connect(signers[1]).applyForLoan(1);

  //     try {
  //       await marketplace.connect(signers[2]).applyForLoan(1);
  //       expect.fail('The transaction should have thrown an error');
  //     } catch (ex) {
  //       const err = ex as Error;
  //       expect(err.message).to.contain('This loan is not available');
  //     }
  //   });

  //   it('should return one results because there is one loan', async () => {
  //     await createNft(1);
  //     await marketplace.createNewLoan(1, 1, 1, { value: auctionPrice });
  //     const items = await marketplace.getAvailableAssetLoans(1);
  //     expect(items.length).to.be.eq(1);
  //     expect(BigNumber.from(items[0].id).toNumber()).to.be.eq(1);
  //   });
  // });

  // describe('getMyLoans', async () => {
  //   it('should return an empty list', async () => {
  //     const items = await marketplace.getMyLoans();
  //     expect(items).to.be.empty;
  //   });

  //   it('should return one results because there is one loan', async () => {
  //     await createNft(1);
  //     await marketplace.createNewLoan(1, 1, 1, { value: auctionPrice });
  //     const items = await marketplace.getMyLendings();
  //     expect(items.length).to.be.eq(1);
  //     expect(BigNumber.from(items[0].id).toNumber()).to.be.eq(1);
  //   });
  // });
});
