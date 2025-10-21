import { NextResponse } from 'next/server'

// Mock token data - in production, you would fetch from Pyth Network API
const MOCK_TOKENS = [
  {
    rank: 1,
    market: "BTC/USD",
    name: "Bitcoin",
    symbol: "BTC",
    price: 43250.50,
    change24h: 2.45,
    volume: 28500000000
  },
  {
    rank: 2,
    market: "ETH/USD", 
    name: "Ethereum",
    symbol: "ETH",
    price: 2650.75,
    change24h: -1.23,
    volume: 15200000000
  },
  {
    rank: 3,
    market: "SOL/USD",
    name: "Solana", 
    symbol: "SOL",
    price: 98.45,
    change24h: 5.67,
    volume: 3200000000
  },
  {
    rank: 4,
    market: "MON/USD",
    name: "Monad",
    symbol: "MON", 
    price: 0.006144,
    change24h: 12.34,
    volume: 1500000
  },
  {
    rank: 5,
    market: "USDC/USD",
    name: "USD Coin",
    symbol: "USDC",
    price: 1.00,
    change24h: 0.01,
    volume: 8500000000
  },
  {
    rank: 6,
    market: "USDT/USD",
    name: "Tether",
    symbol: "USDT", 
    price: 1.00,
    change24h: -0.02,
    volume: 42000000000
  },
  {
    rank: 7,
    market: "WBTC/USD",
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    price: 43280.25,
    change24h: 2.41,
    volume: 1800000000
  },
  {
    rank: 8,
    market: "U2U/USD",
    name: "U2U Network",
    symbol: "U2U",
    price: 0.000123,
    change24h: 8.45,
    volume: 2500000
  }
]

export async function GET() {
  try {
    // In production, you would fetch real data from Pyth Network API
    // const response = await fetch('https://hermes.pyth.network/v2/updates/price/latest')
    // const data = await response.json()
    
    // For now, return mock data with some randomization to simulate real price changes
    const tokensWithVariation = MOCK_TOKENS.map(token => ({
      ...token,
      price: token.price * (0.98 + Math.random() * 0.04), // ±2% variation
      change24h: token.change24h + (Math.random() - 0.5) * 2, // ±1% variation
      volume: token.volume * (0.9 + Math.random() * 0.2) // ±10% variation
    }))

    return NextResponse.json(tokensWithVariation)
  } catch (error) {
    console.error('Error fetching token data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch token data' },
      { status: 500 }
    )
  }
}
