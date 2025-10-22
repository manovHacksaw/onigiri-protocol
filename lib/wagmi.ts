import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig, http } from 'wagmi';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';
import { monadTestnet, sepolia } from './config'

// RainbowKit config
export const rainbowKitConfig = getDefaultConfig({
  appName: "Onigiri Protocol",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  chains: [monadTestnet, sepolia],
  ssr: true,
});

// Wagmi config with standard connectors
export const config = createConfig({
  chains: [monadTestnet, sepolia],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    }),
  ],
  transports: {
    [monadTestnet.id]: http(),
    [sepolia.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
