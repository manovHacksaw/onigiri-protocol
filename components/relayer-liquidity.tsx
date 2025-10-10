"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRelayerStatus } from "@/hooks/useRelayerStatus"
import { RefreshCw, DollarSign, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface RelayerLiquidityProps {
  className?: string
}

export function RelayerLiquidity({ className }: RelayerLiquidityProps) {
  const { relayerStatus, isLoading, error, refetch } = useRelayerStatus()

  // Loading shimmer component for values
  const LoadingShimmer = ({ className }: { className?: string }) => (
    <div className={cn("animate-pulse bg-secondary/30 rounded", className)}>
      <div className="h-4 bg-transparent"></div>
    </div>
  )

  if (error || !relayerStatus) {
    return (
      <Card className={cn("p-4 border border-red-500/20 bg-red-500/5 backdrop-blur", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm text-red-400">Relayer Offline</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            className="h-6 w-6 p-0 hover:bg-red-500/10"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        {error && (
          <p className="text-xs text-red-400/70 mt-1">{error}</p>
        )}
        {!relayerStatus && !error && (
          <p className="text-xs text-red-400/70 mt-1">Unable to fetch relayer status</p>
        )}
      </Card>
    )
  }

  const totalLiquidityUSD = relayerStatus.chains.u2u.balanceUSD + relayerStatus.chains.sepolia.balanceUSD

  return (
    <Card className={cn("p-4 border border-white/10 bg-card/50 backdrop-blur", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Available Liquidity</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetch}
          disabled={isLoading}
          className="h-6 w-6 p-0 hover:bg-secondary/20 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
        </Button>
      </div>

      <div className="space-y-3">
        {/* Total Liquidity */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium">Total Liquidity</span>
          </div>
          <div className="text-right">
            {isLoading ? (
              <LoadingShimmer className="w-16 h-4 mb-1" />
            ) : (
              <div className="text-sm font-semibold">${totalLiquidityUSD.toFixed(2)}</div>
            )}
            <div className="text-xs text-muted-foreground">USD Value</div>
          </div>
        </div>

        {/* U2U Liquidity */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/10">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm font-medium">U2U Solaris</span>
          </div>
          <div className="text-right">
            {isLoading ? (
              <LoadingShimmer className="w-20 h-4 mb-1" />
            ) : (
              <div className="text-sm font-semibold">
                {relayerStatus.chains.u2u.balance.toFixed(4)} {relayerStatus.chains.u2u.symbol}
              </div>
            )}
            {isLoading ? (
              <LoadingShimmer className="w-12 h-3" />
            ) : (
              <div className="text-xs text-muted-foreground">
                ${relayerStatus.chains.u2u.balanceUSD.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Sepolia Liquidity */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/10">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium">Sepolia</span>
          </div>
          <div className="text-right">
            {isLoading ? (
              <LoadingShimmer className="w-20 h-4 mb-1" />
            ) : (
              <div className="text-sm font-semibold">
                {relayerStatus.chains.sepolia.balance.toFixed(4)} {relayerStatus.chains.sepolia.symbol}
              </div>
            )}
            {isLoading ? (
              <LoadingShimmer className="w-12 h-3" />
            ) : (
              <div className="text-xs text-muted-foreground">
                ${relayerStatus.chains.sepolia.balanceUSD.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <Zap className="h-3 w-3 text-green-400" />
            <span className="text-xs text-muted-foreground">Status</span>
          </div>
          <span className="text-xs font-medium text-green-400 capitalize">
            {relayerStatus.status}
          </span>
        </div>
      </div>
    </Card>
  )
}
