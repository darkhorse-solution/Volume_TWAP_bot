import { Token } from '@uniswap/sdk-core'
import { WETH_TOKEN, USDC_TOKEN } from './utils/constants'

// Sets if the example should run locally or on chain
export enum Environment {
  LOCAL,
  WALLET_EXTENSION,
  MAINNET,
}

// Inputs that configure this example to run
export interface ExampleConfig {
  env: Environment
  rpc: {
    local: string
    mainnet: string
  }
  wallet: {
    address: string
    privateKey: string
  },
  chainId: number
  tokens: {
    in: Token
    amountIn: number
    out: Token
  }
}

export const CurrentConfig: ExampleConfig = {
  env: Environment.MAINNET,
  rpc: {
    local: process.env.LOCAL_RPC_URL || '',
    mainnet: process.env.RPC_URL || '',
  },
  wallet: {
    address: process.env.WALLET_ADDRESS || "",
    privateKey:
      process.env.PRIVATE_KEY || "",
  },
  chainId: 137,
  tokens: {
    in: WETH_TOKEN,
    amountIn: 1,
    out: USDC_TOKEN,
  },
}
