import { ethers } from 'hardhat';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { NFT } from '../typechain/NFT';
import { Marketplace } from '../typechain/Marketplace';
import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(solidity);

const { expect } = chai;
const ContractName = 'Marketplace';
const auctionPrice = ethers.utils.parseUnits('10', 'ether');

describe(`${ContractName}`, () => {
  let marketplace: Marketplace;
  let nft: NFT;
  let listingPrice: BigNumber;

  async function createNft(id: number) {
    await nft.createToken(`https://www.mytokenlocation${id}.com`);
    await marketplace.listAsset(nft.address, id, auctionPrice, { value: listingPrice });
  }

  beforeEach(async () => {
    const nftMarketFactory = await ethers.getContractFactory(`${ContractName}`);
    marketplace = (await nftMarketFactory.deploy()) as Marketplace;
    await marketplace.deployed();
    expect(marketplace.address).to.properAddress;

    const nftFactory = await ethers.getContractFactory('NFT');
    nft = (await nftFactory.deploy(marketplace.address)) as NFT;
    await nft.deployed();
    expect(nft.address).to.properAddress;
  });

  describe('getListingPrice', async () => {
    it('should return the listing price', async () => {
      listingPrice = await marketplace.getListingPrice();
      expect(BigNumber.from(listingPrice)).to.eq(ethers.utils.parseUnits('0.025', 'ether'));
    });
  });

  describe('setListingPrice', async () => {
    it('should set the listing price to the new price', async () => {
      await marketplace.setListingPrice(1);
      const newListingPrice = await marketplace.getListingPrice();
      expect(BigNumber.from(newListingPrice)).to.eq(ethers.utils.parseUnits('1', 'ether'));
    });

    it('should throw an error for non-owners', async () => {
      const signers = await ethers.getSigners();
      try {
        await marketplace.connect(signers[1]).setListingPrice(1);
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Only an owner can do this');
      }
    });
  });

  describe('getMinAssetPrice', async () => {
    it('should return the minimum asset price', async () => {
      const minAssetPrice = await marketplace.getMinAssetPrice();
      expect(BigNumber.from(minAssetPrice)).to.eq(ethers.utils.parseUnits('0.5', 'ether'));
    });
  });

  describe('setMinAssetPrice', async () => {
    it('should set the min asset price to the new price', async () => {
      await marketplace.setMinimumAssetPrice(1);
      const newMinPrice = await marketplace.getMinAssetPrice();
      expect(BigNumber.from(newMinPrice)).to.eq(ethers.utils.parseUnits('1', 'ether'));
    });

    it('should throw an error for non-owners', async () => {
      const signers = await ethers.getSigners();
      try {
        await marketplace.connect(signers[1]).setMinimumAssetPrice(1);
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Only an owner can do this');
      }
    });
  });

  describe('listAsset', async () => {
    it('should require price to be > 0', async () => {
      try {
        await marketplace.listAsset(nft.address, 1, 0, { value: listingPrice });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Price must be at least the minimum listing price');
      }
    });

    it('should require msg.value to be listing price', async () => {
      try {
        await marketplace.listAsset(nft.address, 1, ethers.utils.parseUnits('1', 'ether'), {
          value: 0,
        });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Must send in listing price');
      }
    });

    it('should emit a asset was listed', async () => {
      await nft.createToken('https://www.mytokenlocation.com');

      const tx = await marketplace.listAsset(
        nft.address,
        1,
        ethers.utils.parseUnits('1', 'ether'),
        { value: listingPrice }
      );
      expect(tx).to.emit(marketplace, 'AssetListed');

      const balance = await marketplace.provider.getBalance(marketplace.address);
      expect(balance).to.be.eq(listingPrice);
    });
  });

  describe('getListings', async () => {
    let buyer: SignerWithAddress;
    beforeEach(async () => {
      const signers = await ethers.getSigners();
      buyer = signers[1];
    });

    it('should return and empty list', async () => {
      const items = await marketplace.getListings();
      expect(items).to.be.empty;
    });

    it('should return two results', async () => {
      await createNft(1);
      await createNft(2);

      const items = await marketplace.getListings();
      expect(items.length).to.be.eq(2);
      for (let i = 0; i < items.length; i++) {
        expect(BigNumber.from(items[i].id).toNumber()).to.be.eq(i + 1);
      }
    });

    it('should return one results because there was one sale', async () => {
      await createNft(1);
      await createNft(2);

      await marketplace.connect(buyer).buyAsset(1, { value: auctionPrice });

      const items = await marketplace.getListings();
      expect(items.length).to.be.eq(1);
      expect(BigNumber.from(items[0].id).toNumber()).to.be.eq(2);
    });
  });
});
