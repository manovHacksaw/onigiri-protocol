import { SwapCard } from '@/components/swap-card'
import { RelayerLiquidity } from '@/components/relayer-liquidity'
import { DelegationToggle } from '@/components/delegation-toggle'
import { Navbar } from '@/components/navbar'
import { BokehBackground } from '@/components/ui/bokeh-background'
import React from 'react'

const SwapPage = () => {
  return (
    <main className="min-h-[100svh] relative">
      <Navbar />
      
      <BokehBackground />
      
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 md:pt-28">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-pretty text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-8">
            Swap Tokens
          </h1>
          
          <div className="mt-8 w-full max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Main Swap Card */}
              <div className="lg:col-span-2">
                <SwapCard />
              </div>
              
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Delegation Toggle */}
                <DelegationToggle />
                
                {/* Relayer Liquidity */}
                <RelayerLiquidity />
              </div>
            </div>
          </div>
          
          <p className="mt-6 max-w-xl text-center text-muted-foreground">
            Exchange crypto tokens instantly with low fees and high security. Real-time liquidity monitoring ensures smooth cross-chain swaps.
          </p>
        </div>
      </section>
    </main>
  )
}

export default SwapPage
