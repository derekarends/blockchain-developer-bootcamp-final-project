import * as React from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { AssetContract } from '../typechain/AssetContract';
import AssetContractJson from '../artifacts/contracts/AssetContract.sol/AssetContract.json';
import { AssetContractAddress, NftAddress, LoanContractAddress } from '../utils/EnvVars';
import { NFT } from '../typechain/NFT';
import NFTContractJson from '../artifacts/contracts/NFT.sol/NFT.json';
import { Asset, FetchState, Loan } from './Types';
import { LoanContract } from '../typechain/LoanContract';
import LoanContractJson from '../artifacts/contracts/LoanContract.sol/LoanContract.json';

type AppStateType = {
  assets: Asset[];
  loans: Loan[];
  state: FetchState;
  cancelAssetSale: (id: number, signer: ethers.Signer) => Promise<void>;
  cancelLending: (id: number, signer: ethers.Signer) => Promise<void>;
};

const provider = new ethers.providers.InfuraProvider("ropsten");
// const provider = new ethers.providers.JsonRpcProvider();
const tokenContract = new ethers.Contract(NftAddress, NFTContractJson.abi, provider) as NFT;
const assetContract = new ethers.Contract(
  AssetContractAddress,
  AssetContractJson.abi,
  provider
) as AssetContract;
const loanContract = new ethers.Contract(
  LoanContractAddress,
  LoanContractJson.abi,
  provider
) as LoanContract;

/**
 * Create an AppState context to be used throughout the application
 */
const AppStateContext = React.createContext<AppStateType | undefined>(undefined);
AppStateContext.displayName = 'AppStateContext';

function AppStateProvider(props: any) {
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [loans, setLoans] = React.useState<Loan[]>([]);
  const [state, setState] = React.useState<FetchState>(FetchState.idle);

  React.useEffect(() => {
    setState(FetchState.loading);
    getAssets().then(() => {
      setState(FetchState.idle);
    });
  }, []);

  React.useEffect(() => {
    setState(FetchState.loading);
    getLoans().then(() => {
      setState(FetchState.idle);
    });
  }, [assets]);

  /**
   * This will get noisey but wanted to learn to play with events
   * and how they could be used
   */
  React.useCallback(() => {
    assetContract.on('AssetListed', getAssets);
    assetContract.on('AssetCancelled', getAssets);
    assetContract.on('AssetPending', getAssets);
    assetContract.on('AssetSold', getAssets);
    loanContract.on('LoanCreated', getLoans);
    loanContract.on('LoanCancelled', getLoans);
    loanContract.on('LoanRequest', getLoans);
    loanContract.on('LoanApproved', getLoans);
    loanContract.on('LoanDeclined', getLoans);
  }, [assetContract, loanContract])();

  async function getAssets(): Promise<void> {
    const data = await assetContract.getAllAssets();

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

    setAssets(items);
  }

  async function getLoans(): Promise<void> {
    const data = await loanContract.getAllLoans();
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

    setLoans(items);
  }

  async function cancelAssetSale(id: number, signer: ethers.Signer) {
    const assetContractWithSigner = new ethers.Contract(
      AssetContractAddress,
      AssetContractJson.abi,
      signer
    ) as AssetContract;

    await assetContractWithSigner.cancelListingAsset(id);
    const filteredAssets = assets.filter((f: Asset) => f.id !== id);
    setAssets(filteredAssets);
    // const origAssets = assets;
    // try {
    //   const filteredAssets = assets.filter((f: Asset) => f.id !== id);
    //   setAssets(filteredAssets);
    //   await assetContractWithSigner.cancelListingAsset(id);
    // } catch (e: unknown) {
    //   setAssets(origAssets);
    //   throw e;
    // }
  }

  async function cancelLending(id: number, signer: ethers.Signer) {
    const loanContractWithSigner = new ethers.Contract(
      LoanContractAddress,
      LoanContractJson.abi,
      signer
    ) as LoanContract;

    await loanContractWithSigner.cancelLoan(id);
    const filteredLoans = loans.filter((f: Loan) => f.id !== id);
    setLoans(filteredLoans);
    // const origLoans = loans;
    // try {
    //   const filteredLoans = loans.filter((f: Loan) => f.id !== id);
    //   setLoans(filteredLoans);
    //   await loanContractWithSigner.cancelLoan(id);
    // } catch (e: unknown) {
    //   setLoans(origLoans);
    //   throw e;
    // }
  }

  const value = React.useMemo(
    () => ({
      assets,
      loans,
      state,
      cancelAssetSale,
      cancelLending,
    }),
    [assets, loans, state]
  );

  return <AppStateContext.Provider value={value} {...props} />;
}

/**
 * Used for getting the asset context
 */
function useAppState(): AppStateType {
  const context = React.useContext(AppStateContext);
  if (context === undefined) {
    throw new Error(`useAppState must be used within a AssetProvider`);
  }
  return context;
}

export { AppStateProvider, useAppState };
