import { BigNumber, ethers } from 'ethers';
import axios from 'axios';
import { AssetContract } from '../typechain/AssetContract';
import AssetContractJson from '../artifacts/contracts/AssetContract.sol/AssetContract.json';
import { AssetContractAddress, NftAddress, LoanContractAddress, Env } from '../utils/EnvVars';
import { NFT } from '../typechain/NFT';
import NFTContractJson from '../artifacts/contracts/NFT.sol/NFT.json';
import { Asset, Loan } from '../components/Types';
import { LoanContract } from '../typechain/LoanContract';
import LoanContractJson from '../artifacts/contracts/LoanContract.sol/LoanContract.json';
import { JsonRpcSigner } from '@ethersproject/providers';

// If ropsten use the infura provider else use localhost
let provider: ethers.providers.JsonRpcProvider;
if (Env === 'ropsten') {
  provider = new ethers.providers.InfuraProvider('ropsten');
} else {
  provider = new ethers.providers.JsonRpcProvider();
}

const tokenContract = new ethers.Contract(NftAddress, NFTContractJson.abi, provider) as NFT;

/**
 * Get an asset contract given a signer or provider
 * @param signerOrProvider
 * @returns AssetContract
 */
function getAssetContract(
  signerOrProvider?: ethers.Signer | ethers.providers.Provider
): AssetContract {
  return new ethers.Contract(
    AssetContractAddress,
    AssetContractJson.abi,
    signerOrProvider
  ) as AssetContract;
}

/**
 * Gets a loan contract given a signer or provider
 * @param signerOrProvider
 * @returns LoanContract
 */
function getLoanContract(
  signerOrProvider?: ethers.Signer | ethers.providers.Provider
): LoanContract {
  return new ethers.Contract(
    LoanContractAddress,
    LoanContractJson.abi,
    signerOrProvider
  ) as LoanContract;
}

/**
 * Get asset by id
 */
async function getAsset(id: number): Promise<Asset> {
  const data = await getAssetContract(provider).getAsset(BigNumber.from(id));
  const assets = await mapAssets([data]);
  return assets[0];
}

/**
 * Get all assets for the marketplace
 */
async function getAssetsForSale(): Promise<Asset[]> {
  const data = await getAssetContract(provider).getAssetsForSale();
  return await mapAssets(data);
}

/**
 * Get all assets for the marketplace
 */
async function getOwnerAssets(signer: JsonRpcSigner): Promise<Asset[]> {
  const data = await getAssetContract(signer).getOwnerAssets();
  return await mapAssets(data);
}

/**
 * Get all loans for the marketplace
 */
async function getLoan(id: number): Promise<Loan> {
  const data = await getLoanContract(provider).getLoan(id);
  const l = mapLoans([data], null);
  return l[0];
}

/**
 * Get all loans for the marketplace
 */
async function getLoansForAsset(asset: Asset): Promise<Loan[]> {
  const data = await getLoanContract(provider).getAllLoansForAsset(asset.id);
  return mapLoans(data, [asset]);
}

/**
 * Get all loans for the marketplace
 */
 async function getOwnerLoans(signer: JsonRpcSigner, assets: Asset[]): Promise<Loan[]> {
  const data = await getLoanContract(signer).getOwnerLoans();
  return mapLoans(data, assets);
}

/**
 * Allow cancelling the sale of an asset
 * @param id Id of asset
 * @param signer signer of this transaction
 */
async function cancelAssetSale(id: number, signer: ethers.Signer): Promise<void> {
  const assetContractWithSigner = new ethers.Contract(
    AssetContractAddress,
    AssetContractJson.abi,
    signer
  ) as AssetContract;

  await assetContractWithSigner.cancelListingAsset(id);
}

/**
 * Allow cancelling of the open loan
 * @param id Id of loan
 * @param signer signer of this transaction
 */
async function cancelLending(id: number, signer: ethers.Signer): Promise<void> {
  const loanContractWithSigner = new ethers.Contract(
    LoanContractAddress,
    LoanContractJson.abi,
    signer
  ) as LoanContract;

  await loanContractWithSigner.cancelLoan(id);
}

/**
 * Map asset response from contract to asset model
 * @param data
 * @returns Promise<Asset[]>
 */
async function mapAssets(data: any): Promise<Asset[]> {
  const items: Asset[] = await Promise.all(
    data.map(async (i) => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId);
      let meta: any;
      try {
        meta = await axios.get(tokenUri);
      } catch (e: unknown) {
        console.log(`Error getting from ipfs: ${e}`);
      }

      const price = ethers.utils.formatUnits(i.price.toString(), 'ether');
      const item: Asset = {
        id: i.tokenId.toNumber(),
        name: `${i.tokenId.toNumber()}: ${meta?.data?.name ?? ''}`,
        description: meta?.data?.description,
        price,
        seller: i.seller,
        image: meta?.data?.image,
        state: i.state,
        owner: i.owner,
      };
      return item;
    })
  );

  return items;
}

/**
 * Map the loan contract to loan model
 * @param data
 * @returns
 */
function mapLoans(data: any, assets?: Asset[]): Loan[] {
  const items: Loan[] = data.map((l: any) => {
    return {
      id: l.id.toNumber(),
      name: `${ethers.utils.formatUnits(l.loanAmount.toString(), 'ether')} ETH`,
      assetId: l.assetId.toNumber(),
      lender: l.lender,
      borrower: l.borrower,
      state: l.state,
    };
  });

  items.forEach((loan: Loan) => {
    const asset = assets?.find((f) => f.id === loan.assetId);
    if (!asset) {
      return;
    }
    loan.description = `For asset ${asset.name}`;
  });

  return items;
}

export {
  provider,
  getAsset,
  getAssetsForSale,
  getOwnerAssets,
  getLoan,
  getOwnerLoans,
  getLoansForAsset,
  cancelAssetSale,
  cancelLending,
  getLoanContract,
  getAssetContract,
};
