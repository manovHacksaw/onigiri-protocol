import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [RELAYER-STATUS] Status check API called');
    
    // Mock relayer status - in production, check actual relayer health
    const status = {
      success: true,
      relayerAddress: "0x1234567890123456789012345678901234567890",
      isOnline: true,
      lastActivity: new Date().toISOString(),
      chains: {
        monad: {
          chainId: 10143,
          name: "Monad Testnet",
          balance: 15.75,
          balanceUSD: 125.50,
          symbol: "MON",
          isHealthy: true
        },
        sepolia: {
          chainId: 11155111,
          name: "Sepolia Testnet",
          balance: 2.45,
          balanceUSD: 195.20,
          symbol: "ETH",
          isHealthy: true
        }
      },
      prices: {
        monad: 7.95,
        eth: 79.65
      },
      status: "active",
      uptime: "99.9%",
      totalTransactions: 1247,
      lastTransaction: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
    };
    
    console.log('📊 [RELAYER-STATUS] Relayer is online and healthy');
    console.log('💰 [RELAYER-STATUS] Total balance:', 
      status.chains.monad.balanceUSD + status.chains.sepolia.balanceUSD, 'USD');
    
    return NextResponse.json(status);
    
  } catch (error) {
    console.error('❌ [RELAYER-STATUS] Error checking relayer status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}