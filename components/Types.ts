export type Asset = {
  id: number,
  name: string,
  description: string,
  price: string,
  seller: string,
  image: string,
  state: AssetState
}

export type Loan = {
  id: number,
  name: string,
  description: string
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
