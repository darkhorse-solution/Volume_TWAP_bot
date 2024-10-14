import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { timeInterval, startTime, endTime, pairAddress, pairVersion, tradeAmount } = await req.json();

  return NextResponse.json({ 
    message: 'Password reset successful', 
    data: { timeInterval, startTime, endTime, pairAddress, pairVersion, tradeAmount } 
  }, { status: 200 });
}
