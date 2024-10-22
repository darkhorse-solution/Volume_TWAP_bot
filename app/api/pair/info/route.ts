import { PairInfo } from "@/utils/pool";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    const { platformName, pairAddress } = await request.json();
    const timestamp = Date.now();
    const url = `https://api.coinmarketcap.com/dexer/v3/dexer/pair-info?dexer-platform-name=${platformName}&address=${pairAddress}&t=${timestamp}`;

    try {
        const response = await axios.get(url);

        const result = response.data["data"];
        const token0 = result["baseToken"]["address"];
        const decimal0 = result["baseToken"]["decimals"];
        const symbol0 = result["baseToken"]["symbol"];
        const name0 = result["baseToken"]["name"];
        const token1 = result["quoteToken"]["address"];
        const decimal1 = result["quoteToken"]["decimals"];
        const symbol1 = result["quoteToken"]["symbol"];
        const name1 = result["quoteToken"]["name"];
        const priceInUsd = result["priceUsd"];
        const dexerName = result["dexerInfo"]["name"];
        const priceQuote = result["priceQuote"];
        const version = (dexerName === "PancakeSwap v3 (BSC)") ? 3 : 2;

        return NextResponse.json({
            success: true,
            data: {
                token0: token0,
                decimal0: parseInt(decimal0),
                symbol0: symbol0,
                name0: name0,
                token1: token1,
                decimal1: parseInt(decimal1),
                symbol1: symbol1,
                name1: name1,
                priceInUsd: parseFloat(priceInUsd),
                priceQuote: parseFloat(priceQuote),
                dexerName: dexerName,
                version: version
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, data: {} });
    }
}
