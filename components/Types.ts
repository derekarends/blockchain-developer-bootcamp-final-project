export type Asset = {
  id: number,
  name: string,
  description: string,
  price: string,
  seller: string,
  image: string
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
