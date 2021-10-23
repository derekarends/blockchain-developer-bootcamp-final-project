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
const oneEth = ethers.utils.parseUnits('1', 'ether');
const auctionPrice = ethers.utils.parseUnits('10', 'ether');

describe(`${ContractName}`, () => {
  let marketplace: Marketplace;
  let nft: NFT;
  let listingPrice: BigNumber;

  async function createNft(id: number) {
    await nft.createToken(`https://www.mytokenlocation${id}.com`);
    await marketplace.listNewAsset(nft.address, id, auctionPrice, { value: listingPrice });
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

  describe('listNewAsset', async () => {
    it('should require price to be > 0', async () => {
      try {
        await marketplace.listNewAsset(nft.address, 1, 0, { value: listingPrice });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Price must be at least the minimum listing price');
      }
    });

    it('should require msg.value to be listing price', async () => {
      try {
        await marketplace.listNewAsset(nft.address, 1, oneEth, { value: 0 });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Must send in listing price');
      }
    });

    it('should emit a asset was listed', async () => {
      await nft.createToken('https://www.mytokenlocation.com');

      const tx = await marketplace.listNewAsset(nft.address, 1, oneEth, { value: listingPrice });
      expect(tx).to.emit(marketplace, 'AssetListed');

      const balance = await marketplace.provider.getBalance(marketplace.address);
      expect(balance).to.be.eq(listingPrice);
    });
  });

  describe('buyAsset', async () => {
    const tokenId = 1;
    let owner: SignerWithAddress;
    let seller: SignerWithAddress;
    let buyer: SignerWithAddress;
    beforeEach(async () => {
      const signers = await ethers.getSigners();
      owner = signers[0]
      seller = signers[1]
      buyer = signers[2];

      await nft.connect(seller).createToken('https://www.mytokenlocation.com');
      await marketplace.connect(seller).listNewAsset(nft.address, tokenId, auctionPrice, { value: listingPrice });
    });

    it('should require price to be match item price', async () => {
      try {
        await marketplace.connect(buyer).buyAsset(tokenId, { value: 0 });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Invalid amount sent');
      }
    });

    it('should require buyer to not be owner', async () => {
      try {
        await marketplace.connect(seller).buyAsset(tokenId, { value: auctionPrice });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('No need to buy your own asset');
      }
    });

    it('should transfer funds', async () => {
      const tx = await marketplace.connect(buyer).buyAsset(tokenId, { value: auctionPrice });
      const negListingPrice = BigNumber.from(listingPrice).mul(-1);
      const negAuctionPrice = BigNumber.from(auctionPrice).mul(-1);
      expect(tx, 'contract balance should have decreased by listing price').to.changeEtherBalance(marketplace, negListingPrice);
      expect(tx, 'owner balance should have increased by listing price').to.changeEtherBalance(owner, listingPrice);
      expect(tx, 'buyer balance should have decreased by auction price').to.changeEtherBalance(buyer, negAuctionPrice);
      expect(tx, 'seller balance should have increased by seller profit').to.changeEtherBalance(seller, auctionPrice);
    });

    it('should require asset be listed for sale', async () => {
      try {
        await marketplace.connect(buyer).buyAsset(tokenId, { value: auctionPrice });
        await marketplace.connect(seller).buyAsset(tokenId, { value: auctionPrice });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Asset is not for sale');
      }
    });

    it('should emit an asset sold event', async () => {
      const tx = await marketplace.connect(buyer).buyAsset(tokenId, { value: auctionPrice });
      expect(tx).to.emit(marketplace, 'AssetSold');
    });
  });

  describe('getListings', async () => {
    let buyer: SignerWithAddress;
    beforeEach(async () => {
      const signers = await ethers.getSigners();
      buyer = signers[1];
    });

    it('should return an empty list', async () => {
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

  describe('getMyAssets', async () => {
    let buyer: SignerWithAddress;
    beforeEach(async () => {
      const signers = await ethers.getSigners();
      buyer = signers[1];
    });

    it('should return an empty list', async () => {
      const items = await marketplace.getMyAssets();
      expect(items).to.be.empty;
    });

    it('should return one results because there was one sale', async () => {
      await createNft(1);
      await createNft(2);

      await marketplace.connect(buyer).buyAsset(1, { value: auctionPrice });

      const items = await marketplace.connect(buyer).getMyAssets();
      expect(items.length).to.be.eq(1);
      expect(BigNumber.from(items[0].id).toNumber()).to.be.eq(1);
    });
  });

  describe('listExistingAsset', async () => {
    it('should require price to be > 0', async () => {
      try {
        await marketplace.listExistingAsset(1, 0, { value: listingPrice });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Price must be at least the minimum listing price');
      }
    });

    it('should require msg.value to be listing price', async () => {
      try {
        await marketplace.listExistingAsset(1, oneEth, { value: 0 });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Must send in listing price');
      }
    });

    it('should require msg.sender to be owner', async () => {
      try {
        await marketplace.listExistingAsset(1, oneEth, { value: listingPrice });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('You must own the asset');
      }
    });

    // it('should require asset to currently be not for sale', async () => {
    //   try {
    //     const signers = await ethers.getSigners();
    //     await marketplace.connect(signers[1]).listExistingAsset(1, oneEth, { value: listingPrice });
    //     expect.fail('The transaction should have thrown an error');
    //   } catch (ex) {
    //     const err = ex as Error;
    //     expect(err.message).to.contain('Asset is pending or already listed');
    //   }
    // });

    it('should emit a asset was listed', async () => {
      await createNft(1);
      
      const signers = await ethers.getSigners();
      const buyer = signers[1];
      await marketplace.connect(buyer).buyAsset(1, { value: auctionPrice });

      await nft.connect(buyer).approve(marketplace.address, 1);
      const tx = await marketplace.connect(buyer).listExistingAsset(1, oneEth, { value: listingPrice });
      expect(tx).to.emit(marketplace, 'AssetListed');

      const balance = await marketplace.provider.getBalance(marketplace.address);
      expect(balance).to.be.eq(listingPrice);
    });
  });
});
