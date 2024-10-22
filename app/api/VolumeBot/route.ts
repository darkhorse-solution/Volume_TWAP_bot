import { generateRoute, ExecutableRoute, executeRoute } from '@/utils/routing';
import { NextRequest, NextResponse } from 'next/server';
import schedule from 'node-schedule'
import { abi as uniswapV2ABI } from '@/datasets/abi/uniswapV2.json'
import uniswapV3RouterABI from '@/datasets/abi/uniswapV3Router.json'
import { ethers, Wallet } from 'ethers';
import { getProvider, getWalletAddress, TransactionState } from '@/utils/providers';
import { getPairInfo } from '@/utils/pool';
import {
  UNISWAP_V3_ROUTER
} from '@/utils/constants';
import { Web3 } from 'web3'
import { executeVolumeTrade } from '@/utils/uniswapV2';
import { getCurrencyBalance, getTokenBalance } from '@/utils/wallet';
import { CurrentConfig } from '@/config';
import { Token } from '@uniswap/sdk-core';

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL || ''));  // Or your RPC URL

export function swap(a: any, b: any) {
  let c = a;
  a = b;
  b = c;
}

export async function POST(req: NextRequest) {
  const { provider, walletAddress, timeInterval, startTime, endTime, pairAddress, pairVersion, volumeAmountUSD, tradeAmountUSD, pairInfo } = await req.json();
  // Function to handle splitting of total volume into smaller trades

  if (!await web3.eth.net.isListening()) { return NextResponse.json({ success: false, message: "No provider" }); }
  if (typeof pairInfo === "boolean") { return NextResponse.json({ success: false, message: "Can't trade with this pair" }); }
  if (!walletAddress) { return NextResponse.json({ success: false, message: "No provider or wallet address" }); }

  try {
    const {
      token0,
      decimal0,
      token1,
      decimal1,
      priceInUsd,
      priceQuote,
      dexerName,
      version,
      symbol0,
      symbol1,
      name0,
      name1
    } = pairInfo;

    const tradeAmount0: string = (tradeAmountUSD / priceInUsd).toString();
    const tradeAmount1: string = (Number(tradeAmount0) * priceQuote).toString();
    let amountToken0In = BigInt(web3.utils.toWei(tradeAmount0, decimal0));
    let amountToken1In = BigInt(web3.utils.toWei(tradeAmount1, decimal1));

    let Token0 = new Token(
      CurrentConfig.chainId,
      token0,
      decimal0,
      symbol0,
      name0
    )
    let Token1 = new Token(
      CurrentConfig.chainId,
      token1,
      decimal1,
      symbol1,
      name1
    )

    let currentVolumeUSD = 0;
    const balance0 = BigInt(await getCurrencyBalance(web3, walletAddress, Token0));
    const balance1 = BigInt(await getCurrencyBalance(web3, walletAddress, Token1));

    if (balance0 < amountToken0In) {
      if (balance1 < amountToken1In) {
        console.error("Insufficient balance");
        return NextResponse.json({ success: false, message: "Insufficient balance" });
      } else {
        swap(amountToken0In, amountToken1In);
        swap(Token0, Token1);
      }
    }
    
    const balanceBefore = BigInt(await getCurrencyBalance(web3, walletAddress, Token1));

    while (volumeAmountUSD > currentVolumeUSD) {
      // Execute the first trade
      let status = await executeVolumeTrade(provider, walletAddress, amountToken0In, token0, token1);

      if (status === TransactionState.Sent) {
        currentVolumeUSD += tradeAmountUSD;
        const balanceAfter = BigInt(await getCurrencyBalance(provider, walletAddress, Token1));

        console.log(`Volume Bot: ${balanceBefore} -> ${balanceAfter}`);

        // Calculate the amount of token1 received
        const amountToken1In = balanceAfter - balanceBefore;
        // Execute the second trade
        status = await executeVolumeTrade(provider, walletAddress, amountToken1In, token1, token0);

        for (let i = 0; i < 3; i++) {
          status = await executeVolumeTrade(provider, walletAddress, amountToken1In, token1, token0);
          if (status === TransactionState.Sent) {
            console.log("Volume Bot: Trade completed successfully");
            currentVolumeUSD += tradeAmountUSD;
            break;
          }
        }
      }
      await new Promise(resolve => setTimeout(resolve, Number(timeInterval))); // 1-minute delay
      console.log("Volume: ", currentVolumeUSD);
    }

    return NextResponse.json({ success: true, message: "Volume bot executed successfully" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: "Error executing volume bot" });
  }


  // let remainingVolume = totalVolume;

  // while (remainingVolume.gt(ethers.BigNumber.from(0))) {
  //   const currentChunk = remainingVolume.lt(chunkSize) ? remainingVolume : chunkSize;
  //   await executeVolumeTrade(currentChunk, tokenIn, tokenOut);

  //   remainingVolume = remainingVolume.sub(currentChunk); // Subtract the chunk traded
  //   console.log(`Remaining Volume: ${ethers.utils.formatUnits(remainingVolume, 18)} units`);

  //   // Wait between trades to avoid slippage (e.g., 1 minute)
  //   await new Promise(resolve => setTimeout(resolve, timeInterval)); // 1-minute delay
  // }

  // console.log("Volume Bot Execution Completed!");


  // const router = new web3.eth.Contract(uniswapV3RouterABI, UNISWAP_V3_ROUTER);
  // return NextResponse.json({ message: 'success' });
}
