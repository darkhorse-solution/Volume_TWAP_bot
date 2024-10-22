import { ethers } from 'ethers';
import * as fs from 'fs';

// Load Uniswap V2 Router ABI from JSON file
const uniswapV2RouterABI = JSON.parse(fs.readFileSync('./uniswapV2RouterABI.json', 'utf8'));
const routerAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Uniswap V2 Router Address

// Connect to Ethereum Mainnet via Infura
const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_INFURA_KEY");
const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);
const router = new ethers.Contract(routerAddress, uniswapV2RouterABI, wallet);

// Function to execute a TWAP trade
async function executeTWAPTrade(amountIn: ethers.BigNumber, tokenIn: string, tokenOut: string): Promise<void> {
  try {
    const amountOutMin = ethers.BigNumber.from(0); // Placeholder, adjust based on slippage
    const path = [tokenIn, tokenOut];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // Deadline of 10 minutes

    const tx = await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      wallet.address,
      deadline
    );

    console.log(`TWAP Trade Transaction Hash: ${tx.hash}`);
  } catch (error) {
    console.error('Error executing TWAP trade:', error);
  }
}

// TWAP Bot Logic
async function runTWAPBot(
  totalAmount: ethers.BigNumber,
  numTrades: number,
  tokenIn: string,
  tokenOut: string,
  intervalInSeconds: number
): Promise<void> {
  const tradeAmount = totalAmount.div(numTrades); // Split the total amount equally
  let tradesExecuted = 0;

  const interval = setInterval(async () => {
    if (tradesExecuted >= numTrades) {
      clearInterval(interval);
      console.log("TWAP Bot Execution Completed!");
      return;
    }

    await executeTWAPTrade(tradeAmount, tokenIn, tokenOut);
    tradesExecuted++;
    console.log(`Trades Executed: ${tradesExecuted}/${numTrades}`);
  }, intervalInSeconds * 1000); // Execute at the specified interval
}

// Example usage: Split 10 ETH into 5 trades, each executed every 5 minutes
runTWAPBot(
  ethers.utils.parseEther("10"),  // Total of 10 ETH
  5,  // Split into 5 trades
  "0xC02aaa39b223FE8D0A0E5C4F27eAD9083C756Cc2", // WETH Address (ETH on Uniswap)
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC Address
  300  // Execute every 5 minutes (300 seconds)
);
