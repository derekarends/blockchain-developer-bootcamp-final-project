import { ethers } from 'hardhat';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { NFT } from '../typechain/NFT';
import { LoanContract } from '../typechain/LoanContract';
import { AssetContract } from '../typechain/AssetContract';
import { BigNumber } from 'ethers';

chai.use(solidity);

const { expect } = chai;
const ContractName = 'LoanContract';
const assetPrice = ethers.utils.parseUnits('10', 'ether');
const tokenId = 1;

describe(`${ContractName}`, () => {
  let loanContract: LoanContract;
  let assetContract: AssetContract;
  let nft: NFT;

  async function createNewListing(id: number) {
    const listingFee = await assetContract.listingFee();
    await nft.createToken(`https://www.mytokenlocation${id}.com`);
    await assetContract.listNewAsset(nft.address, id, assetPrice, { value: listingFee });
  }

  async function createListingAndLoan(id: number) {
    await createNewListing(id);
    return await loanContract.createNewLoan(id, { value: assetPrice });
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
    it('should require asset being for sale', async () => {
      await createNewListing(tokenId);
      const signers = await ethers.getSigners();
      await assetContract.connect(signers[1]).buyAsset(tokenId, { value: assetPrice });

      try {
        await loanContract.createNewLoan(1, { value: assetPrice });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Asset must be for sale');
      }
    });

    it('should require full amount of asset to be sent', async () => {
      await createNewListing(1);

      try {
        await loanContract.createNewLoan(tokenId, { value: 0 });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Loan must be at least the amount of the asset');
      }
    });

    it('should emit a loan was created', async () => {
      const tx = await createListingAndLoan(tokenId);
      expect(tx).to.emit(loanContract, 'LoanCreated');
    });
  });

   /**
   * getOwnerLoans Tests
   */
    describe('getOwnerLoans', async () => {
      it('should return an empty list', async () => {
        const items = await loanContract.getOwnerLoans();
        expect(items).to.be.empty;
      });
  
      it('should return two results', async () => {
        const signers = await ethers.getSigners();
        const lender = signers[1];
      
        await createListingAndLoan(tokenId);
        await loanContract.connect(lender).createNewLoan(tokenId, { value: assetPrice });
  
        const items = await loanContract.getOwnerLoans();
        expect(items.length).to.be.eq(1);
        for (let i = 0; i < items.length; i++) {
          expect(BigNumber.from(items[i].id).toNumber()).to.be.eq(i + 1);
        }
      });
    });
  
  /**
   * getAllLoansForAsset Tests
   */
  describe('getAllLoansForAsset', async () => {
    it('should return an empty list', async () => {
      const items = await loanContract.getAllLoansForAsset(1);
      expect(items).to.be.empty;
    });

    it('should return two results', async () => {
      const signers = await ethers.getSigners();
      const lender = signers[1];
    
      await createListingAndLoan(tokenId);
      await loanContract.connect(lender).createNewLoan(tokenId, { value: assetPrice });

      const items = await loanContract.getAllLoansForAsset(tokenId);
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
      await createListingAndLoan(1);
      try {
        const signers = await ethers.getSigners();
        await loanContract.connect(signers[1]).cancelLoan(1);
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Only the lender can canel the loan');
      }
    });

    it('should emit a loan was cancelled', async () => {
      await createListingAndLoan(1);
      const tx = await loanContract.cancelLoan(1);
      expect(tx).to.emit(loanContract, 'LoanCancelled');
    });
  });

  /**
   * withdrawRefunds tests
   */
  describe('withdrawRefunds', async () => {
    it('should require sender to have a refund', async () => {
      try {
        await loanContract.withdrawRefund();
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('You have no refunds');
      }
    });

    it('should refund lender loan amount', async () => {
      const signers = await ethers.getSigners();
      const lender = signers[1];
      await createNewListing(1);
      await loanContract.connect(lender).createNewLoan(1, { value: assetPrice });
      const loan = await loanContract.getLoan(1);
      const negLoanAmount = BigNumber.from(loan.loanAmount).mul(-1);
      await loanContract.connect(lender).cancelLoan(1);

      const tx = await loanContract.connect(lender).withdrawRefund();
      expect(tx, 'contract balance should have decreased by loan amount').to.changeEtherBalance(
        loanContract,
        negLoanAmount
      );
      expect(tx, 'lender balance should have increased by loan amount').to.changeEtherBalance(
        lender,
        loan.loanAmount
      );
    });
  });

  /**
   * applyForLoan Tests
   */
  describe('applyForLoan', async () => {
    it('should require loan to be new', async () => {
      await createListingAndLoan(tokenId);
      const signers = await ethers.getSigners();
      try {
        await loanContract.connect(signers[1]).applyForLoan(tokenId);
        await loanContract.connect(signers[1]).applyForLoan(tokenId);
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('This loan is not available');
      }
    });

    it('should emit a loan was requested', async () => {
      await createListingAndLoan(tokenId);
      const signers = await ethers.getSigners();
      const tx = await loanContract.connect(signers[1]).applyForLoan(tokenId);
      expect(tx).to.emit(loanContract, 'LoanRequest');
    });
  });

  /**
   * approveLoan Tests
   */
  describe('approveLoan', async () => {
    it('should require only lender to approve', async () => {
      await createListingAndLoan(tokenId);
      try {
        const signers = await ethers.getSigners();
        await loanContract.connect(signers[1]).approveLoan(tokenId);
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Only lender can approve loan');
      }
    });

    it('should require only pending loans to be approved', async () => {
      await createListingAndLoan(tokenId);
      try {
        await loanContract.approveLoan(tokenId);
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Only pending loans can be approved');
      }
    });

    it('should emit a loan was approved', async () => {
      await assetContract.setLoanContract(loanContract.address);
      await createListingAndLoan(tokenId);
      const signers = await ethers.getSigners();
      await loanContract.connect(signers[1]).applyForLoan(tokenId);

      const tx = await loanContract.approveLoan(tokenId);
      expect(tx).to.emit(loanContract, 'LoanApproved');
      expect(tx).to.emit(assetContract, 'AssetSold');
    });
  });

  /**
   * declineLoan Tests
   */
  describe('declineLoan', async () => {
    it('should require only lender to decline', async () => {
      await createListingAndLoan(tokenId);
      try {
        const signers = await ethers.getSigners();
        await loanContract.connect(signers[1]).declineLoan(tokenId);
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Only lender can decline loan');
      }
    });

    it('should require only pending loans can be declined', async () => {
      await createListingAndLoan(tokenId);
      try {
        await loanContract.declineLoan(tokenId);
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Only pending loans can be declined');
      }
    });

    it('should emit a loan was declined', async () => {
      await createListingAndLoan(tokenId);
      const signers = await ethers.getSigners();
      await loanContract.connect(signers[1]).applyForLoan(tokenId);

      const tx = await loanContract.declineLoan(tokenId);
      expect(tx).to.emit(loanContract, 'LoanDeclined');
    });
  });
});
