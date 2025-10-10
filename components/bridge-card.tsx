"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ArrowDown, RefreshCw, Zap, ExternalLink } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useBridge } from "@/hooks/useBridge"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { ethers } from "ethers"
import { AddU2UToMetaMask } from "./add-u2u-metamask"

// Minting configuration
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://1rpc.io/sepolia"
const RELAYER_PRIVATE_KEY =
  process.env.RELAYER_PRIVATE_KEY || "c8316c9978a2218ed87caa2a5d4e984f14944fecc242ded779a6a5f337eefd2b"
const WRBTC_SEPOLIA_ADDRESS = "0x25d6d8758FaB9Ae4310b2b826535486e85990788"

// Minimal ABI for mint function
const WRBTC_ABI = ["function mint(address to, uint256 amount) external"]

export function BridgeCard({ className }: { className?: string }) {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const {
    isLoading,
    isConfirmed,
    txHash,
    error,
    isOnU2U,
    isOnSepolia,
    availableBalance,
    tokenSymbol,
    networkName,
    targetNetwork,
    bridgeFromU2U,
    bridgeFromSepolia,
  } = useBridge()

  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")

  // Automatic minting states (hidden from user)
  const [autoMintTxHash, setAutoMintTxHash] = useState<string | null>(null)
  const [autoMintLoading, setAutoMintLoading] = useState(false)
  const [autoMintError, setAutoMintError] = useState<string | null>(null)

  // Track when bridge is confirmed to trigger auto-minting
  const [bridgeAmount, setBridgeAmount] = useState<string>("")
  const [shouldAutoMint, setShouldAutoMint] = useState(false)

  // Automatic minting functionality (called after successful bridge)
  const handleAutoMint = useCallback(async (recipientAddress: string, mintAmount: string) => {
    setAutoMintLoading(true)
    setAutoMintError(null)
    setAutoMintTxHash(null)

    try {
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL)
      const wallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider)
      const contract = new ethers.Contract(WRBTC_SEPOLIA_ADDRESS, WRBTC_ABI, wallet)

      // Convert amount to wei (assuming wRBTC has 18 decimals)
      const amountWei = ethers.parseEther(mintAmount)

      const tx = await contract.mint(recipientAddress, amountWei)
      console.log("Auto-mint transaction sent:", tx.hash)
      setAutoMintTxHash(tx.hash)

      await tx.wait()
      console.log("Auto-mint transaction confirmed")
    } catch (err: unknown) {
      console.error("Auto-mint failed", err)
      setAutoMintError(err instanceof Error ? err.message : "Auto-mint failed")
    } finally {
      setAutoMintLoading(false)
    }
  }, [])

  // Effect to trigger auto-minting when bridge is confirmed
  useEffect(() => {
    if (shouldAutoMint && isConfirmed && address && bridgeAmount) {
      console.log("Bridge confirmed, starting automatic minting...")
      handleAutoMint(address, bridgeAmount)
      setShouldAutoMint(false) // Reset flag
    }
  }, [isConfirmed, shouldAutoMint, address, bridgeAmount, handleAutoMint])

  const handleBridge = async () => {
    if (!fromAmount || !address) return

    if (isOnU2U) {
      setBridgeAmount(fromAmount)
      setShouldAutoMint(true)
      await bridgeFromU2U(fromAmount)
    } else if (isOnSepolia) {
      await bridgeFromSepolia(fromAmount)
    }
  }

  const handleMaxAmount = () => {
    setFromAmount(Number.parseFloat(availableBalance).toFixed(6))
  }

  const handleConnect = () => {
    if (connectors[0]) {
      connect({ connector: connectors[0] })
    }
  }

  if (!isConnected) {
    return (
      <Card
        className={cn(
          "w-full max-w-lg rounded-2xl border border-white/10 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40",
          className,
        )}
      >
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to bridge ETH from Sepolia to WETH on U2U Solaris Mainnet
          </p>
          <div className="space-y-3">
            <Button onClick={handleConnect} className="w-full">
              Connect Wallet
            </Button>
            <AddU2UToMetaMask />
          </div>
        </div>
      </Card>
    )
  }

  if (!isOnU2U && !isOnSepolia) {
    return (
      <Card
        className={cn(
          "w-full max-w-lg rounded-2xl border border-white/10 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40",
          className,
        )}
      >
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Wrong Network</h2>
          <p className="text-muted-foreground mb-6">Please switch to Sepolia to bridge ETH to WETH on U2U Solaris Mainnet</p>
          <div className="space-y-3">
            <AddU2UToMetaMask />
            <Button onClick={() => disconnect()} variant="outline">
              Disconnect
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "w-full max-w-lg rounded-2xl border border-white/10 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40",
        className,
      )}
    >
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Bridge ETH to WETH</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {networkName} → {targetNetwork}
            </span>
            <Button variant="ghost" size="sm" onClick={() => disconnect()} className="p-2 hover:bg-secondary/20">
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>

        <div className="bg-secondary/10 rounded-lg p-4 mb-4 ring-1 ring-inset ring-border">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Available Balance:</span>
            <span className="font-medium">
              {Number.parseFloat(availableBalance).toFixed(6)} {tokenSymbol}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Network:</span>
            <span className="font-medium">{networkName}</span>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-3">Amount to Bridge</div>
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-secondary/10 px-4 py-4">
          <Input
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            step="0.000001"
            min="0"
            max={availableBalance}
            className="bg-transparent border-0 text-4xl leading-none p-0 focus-visible:ring-0"
          />
          <div className="flex flex-col gap-2">
            <div className="w-[120px] px-3 py-2 bg-secondary/30 border border-secondary rounded-lg text-sm">
              {tokenSymbol}
            </div>
            <Button onClick={handleMaxAmount} variant="secondary" className="w-[120px] text-xs">
              MAX
            </Button>
          </div>
        </div>

        <div className="flex justify-center my-3">
          <div className="rounded-full border border-white/10 bg-background/60 p-2">
            <ArrowDown className="size-6" />
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-3">You will receive</div>
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-secondary/10 px-4 py-4">
          <div className="flex-1 text-4xl leading-none font-medium">
            {fromAmount ? (Number.parseFloat(fromAmount) * 0.998).toFixed(6) : "0.0"}
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-[120px] px-3 py-2 bg-secondary/30 border border-secondary rounded-lg text-sm text-center">
              {isOnU2U ? "ETH" : "U2U"}
            </div>
            <div className="w-[120px] px-3 py-2 bg-secondary/30 border border-secondary rounded-lg text-sm text-center">
              {targetNetwork}
            </div>
          </div>
        </div>

        {fromAmount && (
          <div className="mt-4 p-3 rounded-lg bg-secondary/20 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bridge Fee</span>
              <span>0.2%</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Estimated Time</span>
              <span>{isOnU2U ? "1-2 minutes" : "Not Available"}</span>
            </div>
          </div>
        )}

        {isOnSepolia && (
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
            <p className="text-foreground">
              <strong>Note:</strong> Bridge from Sepolia to U2U requires relayer processing. Currently, only
              U2U → Sepolia bridging is available.
            </p>
          </div>
        )}

        {isOnU2U && (
          <div className="mt-4 p-3 rounded-lg bg-secondary/10 border border-border text-sm">
            <p className="text-foreground">
              <strong>✨ Relayer Processing:</strong> When you bridge U2U, our relayer will process the transaction and deliver equivalent ETH tokens on
              Sepolia to the same address within 1-2 minutes.
            </p>
          </div>
        )}

        <Button
          onClick={handleBridge}
          disabled={
            !fromAmount ||
            isLoading ||
            Number.parseFloat(fromAmount) <= 0 ||
            Number.parseFloat(fromAmount) > Number.parseFloat(availableBalance) ||
            isOnSepolia
          }
          className="mt-6 w-full h-12 text-lg font-medium bg-red-500 hover:bg-red-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Zap className="size-4 animate-pulse" />
              Bridging...
            </div>
          ) : isOnU2U ? (
            `Bridge ${fromAmount || "0"} ${tokenSymbol} to ${targetNetwork}`
          ) : (
            "Bridge Not Available (Relayer Only)"
          )}
        </Button>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
            <p className="text-destructive">
              <strong>Error:</strong> {error.message}
            </p>
          </div>
        )}

        {isConfirmed && !autoMintLoading && !autoMintError && (
          <div className="mt-4 p-3 rounded-lg bg-secondary/10 border border-border text-sm">
            <p className="text-foreground">
              <strong>Bridge Successful!</strong> U2U bridged successfully. Relayer processing will start shortly...
            </p>
          </div>
        )}

        {/* Relayer Processing Status */}
        {autoMintLoading && (
          <div className="mt-4 p-3 rounded-lg bg-secondary/10 border border-border text-sm">
            <p className="text-foreground">
              <strong>🔄 Relayer Processing...</strong> Processing bridge transaction on Sepolia...
            </p>
          </div>
        )}

        {autoMintError && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
            <p className="text-destructive">
              <strong>Relayer Error:</strong> {autoMintError}
            </p>
          </div>
        )}

        {autoMintTxHash && (
          <div className="mt-4 p-3 rounded-lg bg-secondary/10 border border-border text-sm">
            <p className="text-foreground">
              <strong>✅ Bridge Complete!</strong> ETH tokens have been delivered via relayer.
            </p>
            <div className="mt-2">
              <a
                href={`https://sepolia.etherscan.io/tx/${autoMintTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 hover:text-foreground text-xs underline flex items-center gap-1"
              >
                View Relayer Transaction <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        )}

        {txHash && (
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
            <p className="text-foreground">
              <strong>Bridge Transaction Hash:</strong>
            </p>
            <code className="break-all text-xs">{txHash}</code>
            <div className="mt-2">
              <a
                href={`https://u2uscan.xyz/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 hover:text-foreground text-xs underline flex items-center gap-1"
              >
                View Bridge Transaction <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
