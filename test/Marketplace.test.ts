import { ethers } from 'hardhat';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { NFT } from '../typechain/NFT';
import { Marketplace } from '../typechain/Marketplace';
import { BigNumber } from 'ethers';

chai.use(solidity);

const { expect } = chai;
const ContractName = 'Marketplace';

describe(`${ContractName}`, () => {
  let marketplace: Marketplace;
  let nft: NFT;
  let listingPrice: BigNumber;

  // async function createNft(id: number) {
  //   await nft.createToken(`https://www.mytokenlocation${id}.com`);
  //   await marketplace.listAsset(nft.address, id, auctionPrice, { value: listingPrice });
  // }
  
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
      expect(BigNumber.from(listingPrice)).to.eq(ethers.utils.parseUnits("0.025", "ether"));
    });
  });

  describe('setListingPrice', async () => {
    it('should set the listing price to the new price', async () => {
      await marketplace.setListingPrice(1);
      const newListingPrice = await marketplace.getListingPrice();
      expect(BigNumber.from(newListingPrice)).to.eq(ethers.utils.parseUnits("1", "ether"));
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
      expect(BigNumber.from(minAssetPrice)).to.eq(ethers.utils.parseUnits("0.5", "ether"));
    });
  });

  describe('setMinAssetPrice', async () => {
    it('should set the min asset price to the new price', async () => {
      await marketplace.setMinimumAssetPrice(1);
      const newMinPrice = await marketplace.getMinAssetPrice();
      expect(BigNumber.from(newMinPrice)).to.eq(ethers.utils.parseUnits("1", "ether"));
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
});