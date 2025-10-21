import { NextResponse } from "next/server";

export async function GET() {
  try {
    const envCheck = {
      hasSepoliaRpc: !!process.env.SEPOLIA_RPC_URL,
      hasMonadRpc: !!process.env.MONAD_RPC_URL,
      hasPrivateKey: !!process.env.PRIVATE_KEY,
      sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL ? 'Set' : 'Missing',
      monadRpcUrl: process.env.MONAD_RPC_URL ? 'Set' : 'Missing',
      privateKeyLength: process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.length : 0,
    };

    return NextResponse.json({
      success: true,
      environment: envCheck,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
