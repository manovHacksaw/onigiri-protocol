"use client"

import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config, rainbowKitConfig } from '@/lib/wagmi'
import { ReactNode } from 'react'

const queryClient = new QueryClient()

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider config={rainbowKitConfig}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
