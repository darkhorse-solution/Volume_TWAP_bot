import { CurrentConfig } from "@/config";
import { Token } from "@uniswap/sdk-core";
import { ethers } from "ethers";
import { getCurrencyBalance } from "./wallet";
import { executeVolumeTrade } from "./uniswapV2";
import { TransactionState } from "./providers";
import { Web3 } from 'web3'

export async function runVolumeBot(volumeParams: any) {
	const { timeInterval, startTime, endTime, pairAddress, pairVersion, volumeAmountUSD, tradeAmountUSD, pairInfo } = volumeParams;
	// Function to handle splitting of total volume into smaller trades


	return { success: true, message: "Volume bot executed successfully" };

	// if (!provider) { return { success: false, message: "No provider" } }
	// if (typeof pairInfo === "boolean") { return { success: false, message: "Can't trade with this pair" }; }
	// try {
	// 	const {
	// 		token0,
	// 		decimal0,
	// 		token1,
	// 		decimal1,
	// 		priceInUsd,
	// 		priceQuote,
	// 		dexerName,
	// 		version
	// 	} = pairInfo;

	// 	const tradeAmount: string = (tradeAmountUSD / priceInUsd).toString();
	// 	const amountToken0In = ethers.utils.parseUnits(tradeAmount, decimal0);

	// 	const Token0 = new Token(
	// 		CurrentConfig.chainId,
	// 		token0,
	// 		decimal0
	// 	)
	// 	const Token1 = new Token(
	// 		CurrentConfig.chainId,
	// 		token1,
	// 		decimal1
	// 	)

	// 	let currentVolumeUSD = 0;

	// 	if (!provider || !walletAddress) {
	// 		console.error("No provider or wallet address");
	// 		return { success: false, message: "No provider or wallet address" };
	// 	}

	// 	if (await getCurrencyBalance(provider, walletAddress, Token0) < amountToken0In) {
	// 		console.error("Insufficient balance");
	// 		return { success: false, message: "Insufficient balance" };
	// 	}

	// 	const balanceBefore = await getCurrencyBalance(provider, walletAddress, Token1);

	// 	while (volumeAmountUSD > currentVolumeUSD) {
	// 		// Execute the first trade
	// 		let status = await executeVolumeTrade(provider, walletAddress, amountToken0In, token0, token1);
	// 		if (status === TransactionState.Sent) {
	// 			currentVolumeUSD += tradeAmountUSD;
	// 			const balanceAfter = await getCurrencyBalance(provider, walletAddress, Token1);

	// 			console.log(`Volume Bot: ${balanceBefore} -> ${balanceAfter}`);

	// 			// Calculate the amount of token1 received
	// 			const amountToken1In = balanceAfter.sub(balanceBefore);
	// 			// Execute the second trade
	// 			status = await executeVolumeTrade(provider, walletAddress, amountToken1In, token1, token0);

	// 			if (status === TransactionState.Sent) {
	// 				console.log("Volume Bot: Trade completed successfully");
	// 				currentVolumeUSD += tradeAmountUSD;
	// 			}
	// 		}
	// 		await new Promise(resolve => setTimeout(resolve, timeInterval)); // 1-minute delay
	// 		console.log("Volume: ", currentVolumeUSD);
	// 	}

	// 	return { success: true, message: "Volume bot executed successfully" };
	// } catch (error) {
	// 	console.log(error);
	// 	return { success: false, message: "Error executing volume bot" };
	// }
}
