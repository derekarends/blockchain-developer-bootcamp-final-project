import { ethers } from 'hardhat';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { NFT } from '../typechain/NFT';
import { BigNumber, utils } from 'ethers';

chai.use(solidity);

const { expect } = chai;
const wei = 10 ** 18;

describe('NFT', () => {
  let nft: NFT
  
  beforeEach(async () => {
    const signers = await ethers.getSigners();

    const nftFactory = await ethers.getContractFactory('NFT',signers[0]);
    nft = (await nftFactory.deploy(signers[1].address)) as NFT;
    await nft.deployed();
    expect(nft.address).to.properAddress;
  });

  describe('CreateToken', async () => {
    it('should return a token id', async () => {
      let token = await nft.createToken('https://www.tokenUri.com');
      expect(BigNumber.isBigNumber(BigNumber.from(token.data))).to.be.true;
    });
  });
});