import { ethers, providers } from "ethers";
import UNISWAP_V2_ROUTER_ABI from "@/datasets/abi/uniswapV2Router.json";
import ERC20_ABI from "@/datasets/abi/token.json"
import { UNISWAP_V2_ROUTER } from "./constants";
import { getPairInfo } from "./pool";
import {
  _sendTransaction,
  sendTransaction,
  TransactionState,
} from "./providers";
import { Web3 } from "web3";

const web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.RPC_URL || "")
); // Or your RPC URL

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const RPC_URL = process.env.RPC_URL || "";

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const router = new web3.eth.Contract(UNISWAP_V2_ROUTER_ABI, UNISWAP_V2_ROUTER);

export async function executeVolumeTrade(
  pairAddress: string,
  amountIn: BigInt,
  tokenOut: string,
  tokenIn: string
): Promise<TransactionState> {
  try {
    const amountOutMin = BigInt(0); // Placeholder, adjust based on slippage
    const path = [tokenIn, tokenOut];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // Deadline of 10 minutes
    console.log(
      tokenIn, amountIn, amountOutMin, pairAddress
    );
    
    const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenIn);

    const allowance = await tokenContract.methods
        .allowance(wallet.address, UNISWAP_V2_ROUTER)
        .call();
    console.log(`Current Allowance: ${allowance}`);

    const approveTx = tokenContract.methods
      .approve(web3.utils.toChecksumAddress(UNISWAP_V2_ROUTER), amountIn)
      .encodeABI();

    const approvalTx = {
      to: web3.utils.toChecksumAddress(tokenIn),
      data: approveTx,
      gas: "300000",
      gasPrice: web3.utils.toWei("30", "gwei"),
      nonce: await web3.eth.getTransactionCount(wallet.address, "pending"),
    };

    const signedApprovalTx = await web3.eth.accounts.signTransaction(
      approvalTx,
      wallet.privateKey
    );
    const _receipt = await web3.eth.sendSignedTransaction(
      signedApprovalTx.rawTransaction
    );
    console.log(_receipt.status, _receipt.transactionHash);

    const approveTx1 = tokenContract.methods
      .approve(web3.utils.toChecksumAddress(pairAddress), amountIn)
      .encodeABI();

    const approvalTx1 = {
      from: web3.utils.toChecksumAddress(wallet.address),
      to: web3.utils.toChecksumAddress(tokenIn),
      data: approveTx1,
      gas: "300000",
      gasPrice: web3.utils.toWei("30", "gwei"),
      nonce: await web3.eth.getTransactionCount(wallet.address, "pending"),
    };

    const signedApprovalTx1 = await web3.eth.accounts.signTransaction(
      approvalTx1,
      wallet.privateKey
    );
    const _receipt1 = await web3.eth.sendSignedTransaction(
      signedApprovalTx1.rawTransaction
    );
    console.log(_receipt1.status, _receipt1.transactionHash);

    const tx = router.methods
      .swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        // web3.utils.padLeft(web3.utils.toHex(amountIn), 64),
        // web3.utils.padLeft(web3.utils.toHex(amountOutMin), 64),
        path,
        web3.utils.toChecksumAddress(wallet.address),
        deadline
      )
      .encodeABI();

    const nonce = await web3.eth.getTransactionCount(wallet.address, "pending");

    const txEntity = {
        to: web3.utils.toChecksumAddress(UNISWAP_V2_ROUTER),
        data: tx,
        gas: "300000",
        gasPrice: web3.utils.toWei("30", "gwei"),
        nonce: await web3.eth.getTransactionCount(wallet.address, "pending"),
    };

    const signedTx = await web3.eth.accounts.signTransaction(
      txEntity,
      wallet.privateKey
    );
    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    console.log(receipt);

    // const signedTransaction = await web3.eth.accounts.signTransaction({
    //     data: tx,
    //     // from: web3.eth.accounts.privateKeyToAddress(wallet.privateKey),
    //     gasPrice: (await web3.eth.getGasPrice()).toString(),
    //     gas: '500000',
    //     nonce: (await web3.eth.getTransactionCount(wallet.address)).toString()
    // }, wallet.privateKey)

    // const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction)
    // console.log(receipt.status, receipt.transactionHash);

    return TransactionState.Sent;
    // const status = await sendTransaction(tx); // Send the transaction
    // tx.on("receipt", function({transactionHash, status}) {
    //     console.log('Transaction hash:', transactionHash);
    //     console.log('Transaction status:', status);
    // });

    // if ((await tx).status) {
    //     return TransactionState.Sent
    // }
  } catch (error) {
    console.error("Error executing volume trade:", error);
    return TransactionState.Failed;
  }
}

export async function getAmountOut(
  amountIn: ethers.BigNumber,
  tokenIn: string,
  tokenOut: string
): Promise<ethers.BigNumber[]> {
  try {
    const amounts = router.methods.getAmountOut(amountIn, tokenIn, tokenOut);
    return [];
  } catch (error) {
    console.error("Error getting amounts out:", error);
    return [];
  }
}

async function getAmountFromUsd(
  amountInUsd: number,
  tokenIn: string,
  tokenOut: string
): Promise<ethers.BigNumber> {
  try {
    const amountIn = ethers.utils.parseUnits(amountInUsd.toString(), 18);
    const amounts = await getAmountOut(amountIn, tokenIn, tokenOut);
    return amounts[1];
  } catch (error) {
    console.error("Error getting amount from USD:", error);
    return ethers.BigNumber.from(0);
  }
}
