export type BaseType = {
  id: number,
  name?: string,
  description?: string
}

export type Asset = BaseType & {
  price: string,
  seller: string,
  image: string,
  state: AssetState
}

export type Loan = BaseType & {
  assetId?: number,
  loanAmount?: string,
  interest?: string,
  paymentAmount?: string
  //   uint256 expires;
  //   address payable borrower;
  //   address payable lender;
}

export type EthError = {
  code: number,
  message: string,
  data: {
    code: number,
    message: string,
  }
}

export enum FetchState {
  loading,
  idle,
  buying,
  selling
}

export enum AssetState {
  ForSale,
  Pending,
  NotForSale
}
