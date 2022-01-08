export const AssetContractAddress: string = process.env.NEXT_PUBLIC_ASSET_ADDRESS || '';
export const LoanContractAddress: string = process.env.NEXT_PUBLIC_LOAN_ADDRESS || '';
export const NftAddress: string = process.env.NEXT_PUBLIC_NFT_ADDRESS || '';
export const Env: string = process.env.NEXT_PUBLIC_ENV || '';
export const NetworkName: string = process.env.NEXT_PUBLIC_NETWORK_NAME || '';
export const ChainId: number = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) || -1;