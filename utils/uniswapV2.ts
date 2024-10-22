import { ethers, providers } from 'ethers';
import UNISWAP_V2_ROUTER_ABI from '@/datasets/abi/uniswapV2Router.json'
import { UNISWAP_V2_ROUTER } from './constants';
import { getPairInfo } from './pool';
import { _sendTransaction, sendTransaction, TransactionState } from './providers';
import { Web3 } from 'web3'

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL || ''));  // Or your RPC URL

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const RPC_URL = process.env.RPC_URL || "";

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const router = new web3.eth.Contract(UNISWAP_V2_ROUTER_ABI, UNISWAP_V2_ROUTER);

export async function executeVolumeTrade(provider: providers.Provider, walletAddress: string, amountIn: BigInt, tokenIn: string, tokenOut: string): Promise<TransactionState> {
    try {
        const amountOutMin = BigInt(0); // Placeholder, adjust based on slippage
        const path = [tokenIn, tokenOut];
        const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // Deadline of 10 minutes
        console.log('Executing volume trade:', web3.utils.padLeft(web3.utils.toHex(amountIn), 64), web3.utils.padLeft(web3.utils.toHex(amountOutMin), 64));

        const tx = router.methods.swapExactTokensForTokens(
            web3.utils.padLeft(web3.utils.toHex(amountIn), 64),
            web3.utils.padLeft(web3.utils.toHex(amountOutMin), 64),
            path,
            wallet.address,
            deadline
        ).encodeABI();
        
        const status = await sendTransaction(tx); // Send the transaction
        return status;

    } catch (error) {
        console.error('Error executing volume trade:', error);
        return TransactionState.Failed;
    }
}

export async function getAmountOut(amountIn: ethers.BigNumber, tokenIn: string, tokenOut: string): Promise<ethers.BigNumber[]> {
    try {
        const amounts = router.methods.getAmountOut(amountIn, tokenIn, tokenOut);
        return [];
    } catch (error) {
        console.error('Error getting amounts out:', error);
        return [];
    }
}

async function getAmountFromUsd(amountInUsd: number, tokenIn: string, tokenOut: string): Promise<ethers.BigNumber> {
    try {
        const amountIn = ethers.utils.parseUnits(amountInUsd.toString(), 18);
        const amounts = await getAmountOut(amountIn, tokenIn, tokenOut);
        return amounts[1];
    } catch (error) {
        console.error('Error getting amount from USD:', error);
        return ethers.BigNumber.from(0);
    }
}
