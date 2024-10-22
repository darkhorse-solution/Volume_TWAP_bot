// This file contains code to easily connect to and get information from a wallet on chain

import { Currency } from '@uniswap/sdk-core'
import { BigNumber, ethers, Wallet } from 'ethers'
import { providers } from 'ethers'
import ITokenABI from '@uniswap/v2-core/build/IUniswapV2ERC20.json'

import {
  WETH_ABI,
  WETH_CONTRACT_ADDRESS,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
} from './constants'
import { toReadableAmount } from './conversion'
import JSBI from 'jsbi'
import { createWallet, getProvider, getWalletAddress, _sendTransaction } from './providers'
import Web3 from 'web3'
import { RegisteredSubscription } from 'web3-eth'

export async function getCurrencyBalance(
  web3: Web3<RegisteredSubscription>,
  address: string,
  currency: Currency
): Promise<string> {  
  // Handle ETH directly
  if (currency.isNative) {
    return (await web3.eth.getBalance(address)).toString() 
  }

  const wallet = createWallet()
  
  // Get currency otherwise
  const walletContract = new web3.eth.Contract(ITokenABI.abi, currency.address)

  const balance: bigint = await walletContract.methods.balanceOf(address).call()
  
  console.log('Balance:', balance, currency.symbol);
  
  const decimals: number = await walletContract.methods.decimals().call()

  // Format with proper units (approximate)
  return balance.toString()
  // return toReadableAmount(balance, decimals).toString()
}

// wraps ETH (rounding up to the nearest ETH for decimal places)
export async function wrapETH(eth: number) {
  const provider = getProvider()
  const address = getWalletAddress()
  if (!provider || !address) {
    throw new Error('Cannot wrap ETH without a provider and wallet address')
  }

  const wethContract = new ethers.Contract(
    WETH_CONTRACT_ADDRESS,
    WETH_ABI,
    provider
  )

  const transaction = {
    data: wethContract.interface.encodeFunctionData('deposit'),
    value: BigNumber.from(Math.ceil(eth))
      .mul(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)).toString())
      .toString(),
    from: address,
    to: WETH_CONTRACT_ADDRESS,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }

  await _sendTransaction(transaction)
}

// unwraps ETH (rounding up to the nearest ETH for decimal places)
export async function unwrapETH(eth: number) {
  const provider = getProvider()
  const address = getWalletAddress()
  if (!provider || !address) {
    throw new Error('Cannot unwrap ETH without a provider and wallet address')
  }

  const wethContract = new ethers.Contract(
    WETH_CONTRACT_ADDRESS,
    WETH_ABI,
    provider
  )

  const transaction = {
    data: wethContract.interface.encodeFunctionData('withdraw', [
      BigNumber.from(Math.ceil(eth))
        .mul(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)).toString())
        .toString(),
    ]),
    from: address,
    to: WETH_CONTRACT_ADDRESS,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }

  await _sendTransaction(transaction)
}
const tokenABI = [
  // balanceOf function to get balance of a specific wallet
  "function balanceOf(address owner) view returns (uint256)",

  // decimals function to get the token decimals (helps convert from smallest unit to human-readable format)
  "function decimals() view returns (uint8)"
];

export async function getTokenBalance(tokenAddress: string, wallet: Wallet) : Promise<BigNumber> {
  const provider = wallet.provider;
  const walletAddress = wallet.address;
  const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
  const balance = await tokenContract.balanceOf(walletAddress);

  // Fetch token decimals to format the balance correctly
  const decimals = await tokenContract.decimals();

  // Convert balance from the smallest unit (like wei for ETH) to human-readable format
  const formattedBalance = ethers.utils.parseUnits(balance, decimals);

  return formattedBalance;
}