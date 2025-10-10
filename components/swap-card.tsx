"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ChevronDown, ArrowDown, RefreshCw, ExternalLink, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useAccount, useChainId, useBalance, useReadContract } from "wagmi"
import { useCrossChainSwap } from "@/hooks/useCrossChainSwap"
import { useRelayerStatus } from "@/hooks/useRelayerStatus"
import { getChainNativeToken, getChainName } from "@/lib/priceApi"
import { formatEther } from "viem"
import { U2U_SEPOLIA_ADDRESS, WRBTC_ABI } from "@/lib/contracts"

export function SwapCard({ className }: { className?: string }) {
  const { address, chainId } = useAccount()
  const { getQuote, executeSwap, quote, isLoadingQuote, isPending, isConfirming, isSuccess, error, bridgeStatus } = useCrossChainSwap()
  const { relayerStatus } = useRelayerStatus()
  
  const [sellToken, setSellToken] = useState("ETH")
  const [buyToken, setBuyToken] = useState<string | null>(null)
  const [sellAmount, setSellAmount] = useState("")
  const [buyAmount, setBuyAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [swapError, setSwapError] = useState<string | null>(null)
  const [swapResult, setSwapResult] = useState<{u2uTx: string, sepoliaTx: string} | null>(null)
  const [showTxPopup, setShowTxPopup] = useState(false)

  // Fetch balances
  const { data: nativeBalance } = useBalance({
    address,
  })

  const { data: wRBTCBalance } = useReadContract({
    address: U2U_SEPOLIA_ADDRESS,
    abi: WRBTC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 11155111, // Sepolia
  })

  // Get available balance for the selected sell token
  const getAvailableBalance = () => {
    if (sellToken === "ETH" && chainId === 11155111) {
      return nativeBalance ? formatEther(nativeBalance.value) : "0"
    } else if (sellToken === "U2U" && chainId === 39) {
      return nativeBalance ? formatEther(nativeBalance.value) : "0"
    } else if (sellToken === "wRBTC" && chainId === 11155111) {
      return wRBTCBalance ? formatEther(wRBTCBalance as bigint) : "0"
    }
    return "0"
  }

  // Check if there's sufficient liquidity for the swap
  const checkLiquidity = () => {
    if (!relayerStatus || !sellAmount || !buyToken || !buyAmount) return { sufficient: true, message: "" }
    
    const receiveAmount = parseFloat(buyAmount)
    if (isNaN(receiveAmount) || receiveAmount <= 0) return { sufficient: true, message: "" }

    // Determine which chain's liquidity to check based on the buyToken (what user will receive)
    let targetChain;
    if (buyToken === 'U2U') {
      targetChain = relayerStatus.chains.u2u; // Check U2U Solaris balance
    } else if (buyToken === 'ETH') {
      targetChain = relayerStatus.chains.sepolia; // Check Sepolia balance
    } else {
      return { sufficient: true, message: "" }
    }
    
    console.log('Liquidity check:', {
      buyToken,
      receiveAmount,
      targetChainName: targetChain.name,
      targetChainSymbol: targetChain.symbol,
      availableBalance: targetChain.balance,
      requiredLiquidity: receiveAmount * 1.1,
      sufficient: targetChain.balance >= (receiveAmount * 1.1)
    })
    
    // Check if the relayer has at least the receive amount (with a small buffer)
    const requiredLiquidity = receiveAmount * 1.1
    
    if (targetChain.balance < requiredLiquidity) {
      const maxPossible = targetChain.balance / 1.1; // Maximum amount user can receive
      return {
        sufficient: false,
        message: `Insufficient liquidity. Available: ${targetChain.balance.toFixed(6)} ${targetChain.symbol}. Try ${maxPossible.toFixed(6)} ${targetChain.symbol} or less.`
      }
    }
    
    return { sufficient: true, message: "" }
  }

  const liquidityCheck = checkLiquidity()

  // Check if user is on the correct chain for the swap
  const getChainValidation = () => {
    if (!sellToken || !chainId) return { isValid: true, message: "" }
    
    const requiredChainId = sellToken === 'ETH' ? 11155111 : 39; // Sepolia for ETH, U2U for U2U
    const requiredChainName = sellToken === 'ETH' ? 'Sepolia Testnet' : 'U2U Solaris Mainnet';
    
    if (chainId !== requiredChainId) {
      return {
        isValid: false,
        message: `Please switch to ${requiredChainName} to send ${sellToken}`
      }
    }
    
    return { isValid: true, message: "" }
  }

  const chainValidation = getChainValidation()

  // Handle Max button click
  const handleMaxAmount = () => {
    const balance = getAvailableBalance()
    setSellAmount(balance)
  }

  // Show transaction popup for 5 seconds
  useEffect(() => {
    if (swapResult) {
      setShowTxPopup(true)
      const timer = setTimeout(() => {
        setShowTxPopup(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [swapResult])

  // Update token options based on current chain
  useEffect(() => {
    const nativeToken = getChainNativeToken(chainId)
    if (chainId === 39) { // U2U Solaris
      setSellToken(nativeToken)
      setBuyToken("ETH") // Default to ETH for Sepolia
    } else if (chainId === 11155111) { // Sepolia
      setSellToken(nativeToken)
      setBuyToken("U2U") // Default to U2U for U2U Solaris
    }
  }, [chainId])

  // Fetch quote when amount or tokens change
  useEffect(() => {
    if (sellToken && buyToken && sellAmount && parseFloat(sellAmount) > 0) {
      const fromChainId = chainId
      const toChainId = chainId === 39 ? 11155111 : 39 // Opposite chain
      
      getQuote({
        fromToken: sellToken,
        toToken: buyToken,
        fromAmount: sellAmount,
        fromChainId,
        toChainId
      }).then((quote) => {
        setBuyAmount(quote.toAmount)
        setSwapError(null)
      }).catch((err) => {
        setSwapError(err.message)
        setBuyAmount("")
      })
    } else {
      setBuyAmount("")
      setSwapError(null)
    }
  }, [sellToken, buyToken, sellAmount, chainId, getQuote])

  const handleSwap = async () => {
    if (!address) {
      setSwapError("Please connect your wallet")
      return
    }

    if (sellToken && buyToken && sellAmount) {
      setIsLoading(true)
      setSwapError(null)
      setSwapResult(null)
      
      try {
        const fromChainId = chainId
        const toChainId = chainId === 39 ? 11155111 : 39
        
        const result = await executeSwap({
          fromToken: sellToken,
          toToken: buyToken,
          fromAmount: sellAmount,
          fromChainId,
          toChainId,
          recipient: address
        })
        
        console.log('Swap result:', result);
        
        if (result) {
          setSwapResult(result)
        }
      } catch (err: any) {
        setSwapError(err.message || "Swap failed")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleReverse = () => {
    const tempToken = sellToken
    const tempAmount = sellAmount
    setSellToken(buyToken || "")
    setBuyToken(tempToken)
    setSellAmount(buyAmount)
    setBuyAmount(tempAmount)
  }

  return (
    <>
      {/* Transaction Explorer Popup */}
      {showTxPopup && swapResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative bg-card border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTxPopup(false)}
              className="absolute top-4 right-4 p-1 h-auto hover:bg-secondary/20"
            >
              <X className="size-4" />
            </Button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-400 mb-2">Swap Successful!</h3>
              <p className="text-sm text-muted-foreground">Your cross-chain swap has been completed</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium">U2U Transaction</span>
                </div>
                <a
                  href={`https://u2uscan.xyz/tx/${swapResult.u2uTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  View <ExternalLink className="size-3" />
                </a>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">Sepolia Transaction</span>
                </div>
                <a
                  href={`https://sepolia.etherscan.io/tx/${swapResult.sepoliaTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  View <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            <div className="mt-4 text-xs text-muted-foreground text-center">
              This popup will close automatically in a few seconds
            </div>
          </div>
        </div>
      )}

      <Card
        className={cn(
          "w-full max-w-lg rounded-2xl border border-white/10 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40",
          className,
        )}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Cross-Chain Swap</h2>
              <p className="text-sm text-muted-foreground">
                {getChainName(chainId)} → {getChainName(chainId === 39 ? 11155111 : 39)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReverse}
              className="p-2 hover:bg-secondary/20"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mb-3">You pay</div>
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-secondary/10 px-4 py-4">
            <Input
              type="number"
              placeholder="0"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="bg-transparent border-0 text-4xl leading-none p-0 focus-visible:ring-0"
            />
            <div className="flex flex-col gap-2">
              <Select value={sellToken} onValueChange={setSellToken}>
                <SelectTrigger className="w-[140px] justify-between bg-secondary/30 border-secondary rounded-lg">
                  <SelectValue placeholder="Token" />
                  <ChevronDown className="size-4 opacity-70" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="U2U">U2U (U2U Solaris)</SelectItem>
                  <SelectItem value="ETH">ETH (Sepolia)</SelectItem>
                  <SelectItem value="wRBTC">wRBTC (Sepolia)</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleMaxAmount} 
                variant="secondary" 
                className="w-[140px] text-xs"
                disabled={!address}
              >
                MAX
              </Button>
            </div>
          </div>

          <div className="flex justify-center my-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReverse}
              className="rounded-full border border-white/10 bg-background/60 p-2 hover:bg-background/80"
            >
              <ArrowDown className="size-6" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mb-3">You receive</div>
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-secondary/10 px-4 py-4">
            <Input
              type="number"
              placeholder="0"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="bg-transparent border-0 text-4xl leading-none p-0 focus-visible:ring-0"
            />
            <Select value={buyToken ?? ""} onValueChange={setBuyToken}>
              <SelectTrigger className="w-[180px] justify-between bg-secondary/30 border-secondary rounded-lg">
                <SelectValue placeholder="Select token" />
                <ChevronDown className="size-4 opacity-70" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="U2U">U2U (U2U Solaris)</SelectItem>
                <SelectItem value="ETH">ETH (Sepolia)</SelectItem>
                <SelectItem value="wRBTC">wRBTC (Sepolia)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sellAmount && buyToken && quote && (
            <div className="mt-4 p-3 rounded-lg bg-secondary/20 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span>1 {sellToken} = {quote.rate.toFixed(6)} {buyToken}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Fee</span>
                <span>{quote.fee}%</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Estimated Gas</span>
                <span>{quote.estimatedGas} ETH</span>
              </div>
            </div>
          )}

          {!chainValidation.isValid && (
            <div className="mt-4 p-3 rounded-lg bg-orange-500/20 text-orange-400 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="font-medium">Chain Mismatch</span>
              </div>
              <p className="mt-1 text-xs">{chainValidation.message}</p>
            </div>
          )}

          {!liquidityCheck.sufficient && chainValidation.isValid && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="font-medium">Low Liquidity Warning</span>
              </div>
              <p className="mt-1 text-xs">{liquidityCheck.message}</p>
            </div>
          )}

          {swapError && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
              <div className="font-medium mb-1">Swap Failed</div>
              <div className="text-xs">{swapError}</div>
              {swapError.includes('insufficient funds') && (
                <div className="mt-2 text-xs text-yellow-400">
                  💡 Try a smaller amount or check relayer liquidity above
                </div>
              )}
            </div>
          )}

          {isSuccess && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/20 text-green-400 text-sm">
              Swap completed successfully! Check your wallet for the transaction.
            </div>
          )}

          {/* Bridge Status Display */}
          {bridgeStatus.step !== 'idle' && (
            <div className="mt-4 p-3 rounded-lg bg-blue-500/20 text-blue-400 text-sm">
              <div className="font-semibold mb-2">Bridge Status</div>
              <div className="space-y-2">
                {bridgeStatus.step === 'source-pending' && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span>
                      {bridgeStatus.direction === 'u2u-to-sepolia' 
                        ? '⏳ Waiting for U2U confirmation...' 
                        : '⏳ Waiting for ETH confirmation...'}
                    </span>
                  </div>
                )}
                {bridgeStatus.step === 'source-confirmed' && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>
                      {bridgeStatus.direction === 'u2u-to-sepolia' 
                        ? '✅ U2U transaction confirmed' 
                        : '✅ ETH transaction confirmed'}
                    </span>
                    {bridgeStatus.sourceTxHash && (
                      <a 
                        href={bridgeStatus.direction === 'u2u-to-sepolia' 
                          ? `https://u2uscan.xyz/tx/${bridgeStatus.sourceTxHash}`
                          : `https://sepolia.etherscan.io/tx/${bridgeStatus.sourceTxHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="underline text-xs"
                      >
                        View TX
                      </a>
                    )}
                  </div>
                )}
                {bridgeStatus.step === 'target-pending' && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span>
                      {bridgeStatus.direction === 'u2u-to-sepolia' 
                        ? '⏳ Relayer sending ETH...' 
                        : '⏳ Relayer sending U2U...'}
                    </span>
                  </div>
                )}
                {bridgeStatus.step === 'target-confirmed' && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>
                      {bridgeStatus.direction === 'u2u-to-sepolia' 
                        ? '✅ ETH successfully bridged' 
                        : '✅ U2U successfully bridged'}
                    </span>
                    {bridgeStatus.targetTxHash && (
                      <a 
                        href={bridgeStatus.direction === 'u2u-to-sepolia' 
                          ? `https://sepolia.etherscan.io/tx/${bridgeStatus.targetTxHash}`
                          : `https://u2uscan.xyz/tx/${bridgeStatus.targetTxHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="underline text-xs"
                      >
                        View TX
                      </a>
                    )}
                  </div>
                )}
                {bridgeStatus.step === 'error' && (
                  <div className="flex items-center gap-2 text-red-400">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>❌ {bridgeStatus.error}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {swapResult && (
            <div className="mt-4 p-3 rounded-lg bg-blue-500/20 text-blue-400 text-sm">
              <div className="font-semibold mb-2">Cross-Chain Swap Complete!</div>
              <div className="space-y-1 text-xs">
                {bridgeStatus.direction === 'u2u-to-sepolia' ? (
                  <>
                    <div>U2U TX: <a href={`https://u2uscan.xyz/tx/${swapResult.u2uTx}`} target="_blank" rel="noopener noreferrer" className="underline">{swapResult.u2uTx ? swapResult.u2uTx.slice(0, 10) + '...' : 'Pending'}</a></div>
                    <div>Sepolia TX: <a href={`https://sepolia.etherscan.io/tx/${swapResult.sepoliaTx}`} target="_blank" rel="noopener noreferrer" className="underline">{swapResult.sepoliaTx ? swapResult.sepoliaTx.slice(0, 10) + '...' : 'Pending'}</a></div>
                  </>
                ) : (
                  <>
                    <div>Sepolia TX: <a href={`https://sepolia.etherscan.io/tx/${swapResult.u2uTx}`} target="_blank" rel="noopener noreferrer" className="underline">{swapResult.u2uTx ? swapResult.u2uTx.slice(0, 10) + '...' : 'Pending'}</a></div>
                    <div>U2U TX: <a href={`https://u2uscan.xyz/tx/${swapResult.sepoliaTx}`} target="_blank" rel="noopener noreferrer" className="underline">{swapResult.sepoliaTx ? swapResult.sepoliaTx.slice(0, 10) + '...' : 'Pending'}</a></div>
                  </>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleSwap}
            disabled={!sellToken || !buyToken || !sellAmount || isLoading || isLoadingQuote || isPending || isConfirming || !address || !liquidityCheck.sufficient || !chainValidation.isValid}
            className="mt-6 w-full h-12 text-lg font-medium bg-red-500 hover:bg-red-600 text-white rounded-4xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
      {isLoadingQuote ? "Getting quote..." : 
       isPending ? "Confirming..." : 
       isConfirming ? "Processing..." : 
       isLoading ? "Calculating..." : 
       !address ? "Connect Wallet" : 
       !chainValidation.isValid ? "Switch Network" :
       !liquidityCheck.sufficient ? "Insufficient Liquidity" :
       bridgeStatus.step === 'source-pending' ? 
         (bridgeStatus.direction === 'u2u-to-sepolia' ? "Waiting for U2U..." : "Waiting for ETH...") :
       bridgeStatus.step === 'source-confirmed' ? 
         (bridgeStatus.direction === 'u2u-to-sepolia' ? "U2U Confirmed" : "ETH Confirmed") :
       bridgeStatus.step === 'target-pending' ? 
         (bridgeStatus.direction === 'u2u-to-sepolia' ? "Sending ETH..." : "Sending U2U...") :
       bridgeStatus.step === 'target-confirmed' ? "Bridge Complete!" :
       "Cross-Chain Swap"}
          </Button>
        </div>
      </Card>
    </>
  )
}