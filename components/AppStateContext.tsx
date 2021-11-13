import * as React from 'react';
import { ethers } from 'ethers';
import { AssetContract } from '../typechain/AssetContract';
import AssetContractJson from '../artifacts/contracts/AssetContract.sol/AssetContract.json';
import { AssetContractAddress, NftAddress, LoanContractAddress} from '../utils/EnvVars';
import { NFT } from '../typechain/NFT';
import NFTContractJson from '../artifacts/contracts/NFT.sol/NFT.json';
import { Asset, FetchState, Loan } from './Types';
import { LoanContract } from '../typechain/LoanContract';
import LoanContractJson from '../artifacts/contracts/LoanContract.sol/LoanContract.json';

type AppStateType = {
  assets: Asset[];
  loans: Loan[];
  state: FetchState;
};

async function getAssets(): Promise<Asset[]> {
  const provider = new ethers.providers.JsonRpcProvider();
  const tokenContract = new ethers.Contract(NftAddress, NFTContractJson.abi, provider) as NFT;
  const assetContract = new ethers.Contract(AssetContractAddress, AssetContractJson.abi, provider) as AssetContract;
  const data = await assetContract.getAllAssets();
  // assetContract.on("AssetListed", () => { console.log('created') });
  
  const items: Asset[] = await Promise.all(data.map(async i => {
    const tokenUri = await tokenContract.tokenURI(i.tokenId);
    const meta = JSON.parse(tokenUri);
    const price = ethers.utils.formatUnits(i.price.toString(), 'ether');
    const item: Asset = {
      id: i.tokenId.toNumber(),
      name: meta.name,
      description: meta.description,
      price,
      seller: i.seller,
      image: meta.image,
      state: i.state,
      owner: i.owner
    };
    return item;
  }));

  return items;
}

async function getLoans(assets: Asset[]): Promise<Loan[]> {
  const provider = new ethers.providers.JsonRpcProvider();
  const loanContract = new ethers.Contract(LoanContractAddress, LoanContractJson.abi, provider) as LoanContract;
  const data = await loanContract.getAllLoans();
  // assetContract.on("LoanListed", () => { console.log('created') });
  
  const items: Loan[] = data.map((l: any) => {
    return {
      id: l.id.toNumber(),
      name: `${ethers.utils.formatUnits(l.loanAmount.toString(), 'ether')} ETH`,
      assetId: l.assetId.toNumber(),
      lender: l.lender,
      borrower: l.borrower,
      state: l.state
    };
  });

  items.forEach((loan: Loan) => {
    const asset = assets.find(f => f.id === loan.assetId);
    if (!asset) {
      return;
    }
    loan.description = `For asset ${asset.name}`;
  })
  return items;
}

/**
 * Create an AppState context to be used throughout the application
 */
const AppStateContext = React.createContext<AppStateType | undefined>(undefined);
AppStateContext.displayName = 'AppStateContext';

function AppStateProvider(props: any) {
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [loans, setLoans] = React.useState<Loan[]>([]);
  const [state, setState] = React.useState<FetchState>(FetchState.idle);

  React.useLayoutEffect(() => {
    setState(FetchState.loading);
    getAssets().then((assets: Asset[]) => {
      setAssets(assets);
      getLoans(assets).then((loans: Loan[]) => {
        setLoans(loans);
        setState(FetchState.idle);
      });
    });
  }, []);

  const value = React.useMemo(
    () => ({
      assets,
      loans,
      state
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
