import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const request = await req.json();
  
  return NextResponse.json({ message: 'Password reset successful', data: request }, { status: 200 });
}
