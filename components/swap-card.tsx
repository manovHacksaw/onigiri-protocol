"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ChevronDown, ArrowDown, RefreshCw, ExternalLink, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useAccount, useBalance, useReadContract } from "wagmi"
import { useCrossChainSwap } from "@/hooks/useCrossChainSwap"
import { useRelayerStatus } from "@/hooks/useRelayerStatus"
import { getChainNativeToken, getChainName } from "@/lib/priceApi"
import { formatEther } from "viem"
import { WETH_U2U_ADDRESS } from "@/lib/contracts"
import { TransactionModal } from "@/components/ui/transaction-modal"

export function SwapCard({ className }: { className?: string }) {
  const { address, chainId } = useAccount()
  const { 
    getQuote, 
    executeSwap, 
    quote, 
    isLoadingQuote, 
    isPending, 
    isConfirming, 
    isSuccess, 
    bridgeStatus,
    isModalOpen,
    transactionSteps,
    currentStep,
    modalError,
    setIsModalOpen
  } = useCrossChainSwap()
  const { relayerStatus } = useRelayerStatus()
  
  const [sellToken, setSellToken] = useState("ETH")
  const [buyToken, setBuyToken] = useState<string | null>(null)
  const [sellAmount, setSellAmount] = useState("")
  const [buyAmount, setBuyAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [swapError, setSwapError] = useState<string | null>(null)
  const [swapResult, setSwapResult] = useState<{u2uTx: string | undefined, sepoliaTx: string | undefined} | null>(null)

  // Fetch balances
  const { data: nativeBalance } = useBalance({
    address,
  })

  const { data: wETHBalance } = useReadContract({
    address: WETH_U2U_ADDRESS,
    abi: [{
      inputs: [{ name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    }],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: 39, // U2U
  })

  // Get available balance for the selected sell token
  const getAvailableBalance = () => {
    if (sellToken === "ETH" && chainId === 11155111) {
      return nativeBalance ? formatEther(nativeBalance.value) : "0"
    } else if (sellToken === "U2U" && chainId === 39) {
      return nativeBalance ? formatEther(nativeBalance.value) : "0"
    } else if (sellToken === "WETH" && chainId === 39) {
      return wETHBalance ? formatEther(wETHBalance as bigint) : "0"
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

  // Handle swap result
  useEffect(() => {
    if (swapResult && bridgeStatus.step === 'target-confirmed') {
      // Swap completed successfully
      console.log('Swap completed:', swapResult)
    }
  }, [swapResult, bridgeStatus.step])

  // Update token options based on current chain
  useEffect(() => {
    if (!chainId) return;
    
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
    if (sellToken && buyToken && sellAmount && parseFloat(sellAmount) > 0 && chainId) {
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

    if (sellToken && buyToken && sellAmount && chainId) {
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
        
        if (result && result.u2uTx && result.sepoliaTx) {
          setSwapResult({
            u2uTx: result.u2uTx,
            sepoliaTx: result.sepoliaTx
          })
        }
      } catch (err) {
        setSwapError(err instanceof Error ? err.message : "Swap failed")
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
      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        steps={transactionSteps}
        currentStep={currentStep}
        error={modalError || undefined}
        onRetry={() => {
          // Retry logic can be implemented here if needed
        }}
        onCancel={() => {
          setIsModalOpen(false)
        }}
      />

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
                {chainId ? `${getChainName(chainId)} → ${getChainName(chainId === 39 ? 11155111 : 39)}` : 'Select Network'}
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


          <Button
            onClick={handleSwap}
            disabled={!sellToken || !buyToken || !sellAmount || isLoading || isLoadingQuote || isPending || isConfirming || !address || !liquidityCheck.sufficient || !chainValidation.isValid}
            className="mt-6 w-full h-12 text-lg font-medium bg-red-500 hover:bg-red-600 text-white rounded-4xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingQuote ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Getting Quote...
              </div>
            ) : !address ? (
              "Connect Wallet"
            ) : !chainValidation.isValid ? (
              "Switch Network"
            ) : !liquidityCheck.sufficient ? (
              "Insufficient Liquidity"
            ) : isLoading || isPending || isConfirming ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              "Cross-Chain Swap"
            )}
          </Button>
        </div>
      </Card>
    </>
  )
}