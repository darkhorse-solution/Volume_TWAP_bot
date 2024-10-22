import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import IUniswapV2PairABI from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import ITokenABI from '@uniswap/v2-core/build/IUniswapV2ERC20.json'
import { ethers } from 'ethers'

import { getProvider } from './providers'

interface PoolInfo {
  token0: string
  token1: string
  fee: number
  tickSpacing: number
  sqrtPriceX96: ethers.BigNumber
  liquidity: ethers.BigNumber
  tick: number
}

export interface PairInfo {
  token0: string
  token1: string
  priceInUsd: number
  priceQuote: number
  dexerName: string
  version: number
  decimal0: number
  decimal1: number
  symbol0: string
  symbol1: string
  name0: string
  name1: string
}
import axios from 'axios';
export async function getPairInfo(pairAddress: string, platformName: string = "bsc"): Promise<PairInfo | boolean> {
  const url = "/api/pair/info";

  try {
    const response = await axios.post(url, {
      pairAddress,
      platformName
    });
    if (!response.data["success"]) {
      return false;
    }

    console.log("util response =>", response.data["data"]);

    const result = response.data["data"];
    return result;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getPoolInfo(currentPoolAddress: string): Promise<PoolInfo> {
  const provider = getProvider()
  console.log('Provider:', provider);

  if (!provider) {
    throw new Error('No provider')
  }

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    provider
  )

  const [token0, token1, fee, tickSpacing, liquidity, slot0] =
    await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.liquidity(),
      poolContract.slot0(),
    ])

  return {
    token0,
    token1,
    fee,
    tickSpacing,
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  }
}

// export async function getPairInfo(pairAddress: string): Promise<{ token0: string, token1: string }> {
//   const provider = getProvider()
//   if (!provider) {
//     throw new Error('No provider')
//   }

//   const pairContract = new ethers.Contract(
//     pairAddress,
//     IUniswapV2PairABI.abi,
//     provider
//   )

//   const [token0, token1] = await Promise.all([
//     pairContract.token0(),
//     pairContract.token1(),
//   ])

//   return { token0, token1 }
// }
