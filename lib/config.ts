import { defineChain } from 'viem'
import { sepolia } from 'viem/chains'

// U2U Solaris Mainnet configuration
export const u2uSolaris = defineChain({
  id: 39,
  name: 'U2U Solaris Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'U2U',
    symbol: 'U2U',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-mainnet.u2u.xyz'],
    },
    public: {
      http: ['https://rpc-mainnet.u2u.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'U2U Explorer',
      url: 'https://u2uscan.xyz',
    },
  },
  testnet: false,
})

export { sepolia }
