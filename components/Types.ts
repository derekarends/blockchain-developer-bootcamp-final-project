export type BaseType = {
  id: number,
  name?: string,
  description?: string
}

export type Asset = BaseType & {
  price: string,
  seller: string,
  image: string,
  state: AssetState,
  owner: string
}

export type Loan = BaseType & {
  assetId?: number,
  loanAmount?: string,
  borrower?: string,
  lender?: string,
  state?: LoanState
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
  selling,
  error
}

export enum AssetState {
  ForSale,
  Pending,
  NotForSale
}

export enum LoanState {
  New,
  Pending,
  Approved
}