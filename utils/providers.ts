import { ethers, providers, BigNumber, Bytes } from 'ethers'
import Tx from 'ethereumjs-tx'
import { TransactionBuilder } from 'web3-core'

declare global {
  interface Window {
    ethereum?: any
  }
}
import { Environment, CurrentConfig } from '../config'
import { BaseProvider } from '@ethersproject/providers'
import { RegisteredSubscription } from 'web3-eth'
import Web3, {Transaction} from 'web3'

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL || ''));  // Or your RPC URL
// Single copies of provider and wallet
const mainnetProvider = new ethers.providers.JsonRpcProvider(
  CurrentConfig.rpc.mainnet,
  CurrentConfig.chainId
)
const wallet = createWallet()

const browserExtensionProvider = createBrowserExtensionProvider()
let walletExtensionAddress: string | null = null

// Interfaces

export enum TransactionState {
  Failed = 'Failed',
  New = 'New',
  Rejected = 'Rejected',
  Sending = 'Sending',
  Sent = 'Sent',
}

// Provider and Wallet Functions

export function getMainnetProvider(): BaseProvider {
  return mainnetProvider
}

export function getProvider(): providers.Provider | null {
  return CurrentConfig.env === Environment.WALLET_EXTENSION
    ? browserExtensionProvider
    : wallet.provider
}

export function getWalletAddress(): string | null {
  console.log(wallet.provider === getProvider());
  
  return CurrentConfig.env === Environment.WALLET_EXTENSION
    ? walletExtensionAddress
    : wallet.address
}

// export async function signTransaction(web3: Web3<RegisteredSubscription>, tx: string): Promise<string> {
//   const nonce = await web3.eth.getTransactionCount(wallet.address || '')
//   const txObject = {
//     nonce:    web3.utils.toHex(nonce),
//     to:       wallet.address,  // recipient's address
//     value:    web3.utils.toHex(web3.utils.toWei('0.1', 'ether')),  // 0.1 ETH
//     gasLimit: web3.utils.toHex(21000),  // 21000 gas units
//     gasPrice: web3.utils.toHex(web3.utils.toWei('50', 'gwei')),  // 50 gwei gas price,
//     data: tx
//   };
//   const txData = new Tx.Transaction(txObject, { chain: 137 });  // Specify chain or use testnet like 'ropsten'

//   // Sign the transaction
//   const privateKeyBuffer = Buffer.from(wallet.privateKey, 'hex');  // Remove the '0x' prefix
//   txData.sign(privateKeyBuffer);

//   // Serialize the transaction and prepare it for sending
//   const serializedTx = txData.serialize();
//   const raw = '0x' + serializedTx.toString('hex');

//   return raw;
// }

export async function sendTransaction(
  tx: any
): Promise<TransactionState> {
  try {
    console.log('Sending transaction:', tx);
    
    const nonce = await web3.eth.getTransactionCount(wallet.address || '')
    const gasLimit = await web3.eth.estimateGas(tx)
    const gasPrice = await web3.eth.getGasPrice()
    const transaction = {
      from: wallet.address,
      nonce: web3.utils.toHex(nonce), // Ensure to convert nonce to hex
      gas: web3.utils.toHex(300000), // Set gas limit
      gasPrice: gasPrice, // Set gas price (in Gwei)
      data: tx || undefined
    };

  // Sign the transaction
    const signedTxn = await web3.eth.accounts.signTransaction(transaction, wallet.privateKey);

    if (signedTxn.rawTransaction) {
      const txnHash = signedTxn.rawTransaction;
      console.log('Signed transaction:', web3.utils.hexToBytes(txnHash), signedTxn);
      
      const status = await web3.eth.sendSignedTransaction(web3.utils.hexToBytes(txnHash))
      // Send the signed transaction to the network
      // const receipt = await web3.eth.sendSignedTransaction(signedTxn.rawTransaction);

      // Return the transaction hash (formatted)
      if (status.status === '0x1') {
        return TransactionState.Sent
      } else {
        throw new Error('Failed to sign the transaction');
      } 
  } else {
    throw new Error('Failed to sign the transaction');
  }
  } catch (e) {
    console.log(e)
    return TransactionState.Rejected
  }
}

export async function _sendTransaction(
  transaction: ethers.providers.TransactionRequest
): Promise<TransactionState> {
  if (CurrentConfig.env === Environment.WALLET_EXTENSION) {
    return sendTransactionViaExtension(transaction)
  } else {
    return sendTransactionViaWallet(transaction)
  }
}

export async function connectBrowserExtensionWallet() {
  if (!window.ethereum) {
    return null
  }

  const { ethereum } = window
  const provider = new ethers.providers.Web3Provider(ethereum)
  const accounts = await provider.send('eth_requestAccounts', [])

  if (accounts.length !== 1) {
    return
  }

  walletExtensionAddress = accounts[0]
  return walletExtensionAddress
}

// Internal Functionality

export function createWallet(): ethers.Wallet {
  let provider = mainnetProvider
  if (CurrentConfig.env == Environment.LOCAL) {
    provider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.local)
  }
  
  return new ethers.Wallet(CurrentConfig.wallet.privateKey, provider)
}

function createBrowserExtensionProvider(): ethers.providers.Web3Provider | null {
  try {
    return new ethers.providers.Web3Provider(window?.ethereum, 'any')
  } catch (e) {
    console.log('No Wallet Extension Found')
    return null
  }
}

// Transacting with a wallet extension via a Web3 Provider
async function sendTransactionViaExtension(
  transaction: ethers.providers.TransactionRequest
): Promise<TransactionState> {
  try {
    const receipt = await browserExtensionProvider?.send(
      'eth_sendTransaction',
      [transaction]
    )
    if (receipt) {
      return TransactionState.Sent
    } else {
      return TransactionState.Failed
    }
  } catch (e) {
    console.log(e)
    return TransactionState.Rejected
  }
}

async function sendTransactionViaWallet(
  transaction: ethers.providers.TransactionRequest
): Promise<TransactionState> {
  const provider = getProvider()
  if (!provider) {
    return TransactionState.Failed
  }

  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value)
  }

  const txRes = await wallet.sendTransaction(transaction)
  let receipt = null

  while (receipt === null) {
    try {
      receipt = await provider.getTransactionReceipt(txRes.hash)

      if (receipt === null) {
        continue
      }
    } catch (e) {
      console.log(`Receipt error:`, e)
      break
    }
  }

  if (receipt) {
    return TransactionState.Sent
  } else {
    return TransactionState.Failed
  }
}
