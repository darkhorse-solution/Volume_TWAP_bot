import {
    AlphaRouter,
    
    SwapOptionsSwapRouter02,
    SwapRoute,
    SwapType,
} from '@uniswap/smart-order-router'
import { TradeType, CurrencyAmount, Percent, Token, SupportedChainId } from '@uniswap/sdk-core'
import { CurrentConfig } from '../config'
import {
    getMainnetProvider,
    getWalletAddress,
    _sendTransaction,
    TransactionState,
    getProvider,
} from './providers'
import {
    MAX_FEE_PER_GAS,
    MAX_PRIORITY_FEE_PER_GAS,
    ERC20_ABI,
    TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
    V3_SWAP_ROUTER_ADDRESS,
} from './constants'
import { fromReadableAmount } from './conversion'
import { ethers } from 'ethers'
import { getPoolInfo } from './pool'

export interface ExecutableRoute {
    route: SwapRoute | null,
    zeroToOne: boolean,
    tokenIn: Token,
    tokenOut: Token,
    tokenInAmount: number
}

export async function generateRoute(pairAddress: string, zeroToOne: boolean, tokenInAmount: number): Promise<ExecutableRoute | null> {
    const {
        fee,
        liquidity,
        sqrtPriceX96,
        tick,
        tickSpacing,
        token0,
        token1
    } = await getPoolInfo(pairAddress)

    console.log('Pool Info:', {
        fee,
        liquidity,
        sqrtPriceX96,
        tick,
        tickSpacing,
        token0,
        token1
    });
    

    const tokenInAddress = zeroToOne === true ? token0 : token1
    const tokenOutAddress = zeroToOne === true ? token1 : token0

    const tokenIn = new Token(
        SupportedChainId.POLYGON,
        tokenInAddress,
        CurrentConfig.tokens.in.decimals,
        '',
        ''
    )
    const tokenOut = new Token(
        SupportedChainId.POLYGON,
        tokenOutAddress,
        CurrentConfig.tokens.in.decimals,
        '',
        ''
    )

    const router = new AlphaRouter({
        chainId: Number(SupportedChainId.POLYGON),
        provider: getMainnetProvider(),
    })

    const options: SwapOptionsSwapRouter02 = {
        recipient: CurrentConfig.wallet.address,
        slippageTolerance: new Percent(50, 10_000),
        deadline: Math.floor(Date.now() / 1000 + 1800),
        type: SwapType.SWAP_ROUTER_02,
    }

    const route = await router.route(
        CurrencyAmount.fromRawAmount(
            tokenIn,
            fromReadableAmount(
                tokenInAmount,
                CurrentConfig.tokens.in.decimals
            ).toString()
        ),
        tokenOut,
        TradeType.EXACT_INPUT,
        options
    )

    return {
        route,
        zeroToOne,
        tokenIn,
        tokenOut,
        tokenInAmount,
    }
}

export async function executeRoute(
    Route: ExecutableRoute
): Promise<TransactionState> {
    const { 
        route,
        tokenIn,
        tokenOut,
        zeroToOne
    } = Route
    const walletAddress = getWalletAddress()
    const provider = getProvider()

    if (!walletAddress || !provider) {
        throw new Error('Cannot execute a trade without a connected wallet')
    }
    if (route === null) {
        throw new Error('Route is null')
    }

    const tokenApproval = await getTokenTransferApproval(tokenIn)

    // Fail if transfer approvals do not go through
    if (tokenApproval !== TransactionState.Sent) {
        return TransactionState.Failed
    }

    const res = await _sendTransaction({
        data: route.methodParameters?.calldata,
        to: V3_SWAP_ROUTER_ADDRESS,
        value: route?.methodParameters?.value,
        from: walletAddress,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    })

    return res
}

export async function getTokenTransferApproval(
    token: Token
): Promise<TransactionState> {
    const provider = getProvider()
    const address = getWalletAddress()
    if (!provider || !address) {
        console.log('No Provider Found')
        return TransactionState.Failed
    }

    try {
        const tokenContract = new ethers.Contract(
            token.address,
            ERC20_ABI,
            provider
        )

        const transaction = await tokenContract.populateTransaction.approve(
            V3_SWAP_ROUTER_ADDRESS,
            fromReadableAmount(
                TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
                token.decimals
            ).toString()
        )

        return _sendTransaction({
            ...transaction,
            from: address,
        })
    } catch (e) {
        console.error(e)
        return TransactionState.Failed
    }
}
