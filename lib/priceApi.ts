// Price fetching utilities for cross-chain swaps

export interface TokenPrice {
  symbol: string;
  price: number;
  chainId: number;
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  rate: number;
  fee: number;
  estimatedGas: string;
}

// Mock price data - in production, you would fetch from a real API like CoinGecko, 1inch, etc.
const MOCK_PRICES: Record<string, number> = {
  'MON': 0.006144, // Monad native token
  'ETH': 4327.95,  // Ethereum
  'USDC': 1,       // USD Coin
  'USDT': 1,       // Tether
  'WBTC': 65000,   // Wrapped Bitcoin
};

export async function fetchTokenPrice(symbol: string): Promise<number> {
  try {
    // Try to fetch real prices from CoinGecko API
    let coinId = '';
    switch (symbol) {
      case 'ETH':
        coinId = 'ethereum';
        break;
      case 'MON':
        // Monad might not be on CoinGecko yet, use fallback
        return MOCK_PRICES[symbol] || 0.006144;
      case 'USDC':
        coinId = 'usd-coin';
        break;
      case 'USDT':
        coinId = 'tether';
        break;
      case 'WBTC':
        coinId = 'wrapped-bitcoin';
        break;
      default:
        return MOCK_PRICES[symbol] || 1;
    }
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      const price = data[coinId]?.usd;
      if (price) {
        console.log(`✅ Real price for ${symbol}: $${price}`);
        return price;
      }
    }
    
    console.log(`⚠️ Failed to fetch real price for ${symbol}, using fallback`);
    return MOCK_PRICES[symbol] || 1;
    
  } catch (error) {
    console.log(`⚠️ Error fetching price for ${symbol}:`, error);
    return MOCK_PRICES[symbol] || 1;
  }
}

export async function getSwapQuote(
  fromToken: string,
  toToken: string,
  fromAmount: string,
  _fromChainId: number,
  _toChainId: number
): Promise<SwapQuote> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const fromPrice = await fetchTokenPrice(fromToken);
  const toPrice = await fetchTokenPrice(toToken);
  
  console.log(`Quote calculation: ${fromAmount} ${fromToken} @ $${fromPrice} → ${toToken} @ $${toPrice}`);
  
  const fromAmountNum = parseFloat(fromAmount);
  const rate = fromPrice / toPrice;
  const toAmount = (fromAmountNum * rate * 0.995).toFixed(6); // 0.5% fee
  
  console.log(`Rate: ${rate}, To Amount: ${toAmount}`);
  
  return {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    rate: rate * 0.995,
    fee: 0.5,
    estimatedGas: "0.001", // Mock gas estimate
  };
}

export function getChainNativeToken(chainId: number): string {
  switch (chainId) {
    case 10143: // Monad Testnet
      return 'MON';
    case 11155111: // Sepolia
      return 'ETH';
    default:
      return 'ETH';
  }
}

export function getChainName(chainId: number): string {
  switch (chainId) {
    case 10143:
      return 'Monad Testnet';
    case 11155111:
      return 'Sepolia';
    default:
      return 'Unknown';
  }
}
