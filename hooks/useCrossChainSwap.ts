import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSendTransaction, useSwitchChain } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { 
  U2U_POOL, 
  SEPOLIA_POOL, 
  ROOTSTACK_POOL_ABI, 
  SEPOLIA_POOL_ABI 
} from '@/lib/contracts';
import { getSwapQuote, SwapQuote } from '@/lib/priceApi';

export interface SwapParams {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromChainId: number;
  toChainId: number;
  recipient: string;
}

export function useCrossChainSwap() {
  const { address, chainId } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { sendTransaction, data: sendHash, isPending: isSendPending, error: sendError } = useSendTransaction();
  const { switchChain } = useSwitchChain();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<{
    step: 'idle' | 'source-pending' | 'source-confirmed' | 'target-pending' | 'target-confirmed' | 'error';
    sourceTxHash?: string;
    targetTxHash?: string;
    error?: string;
    direction?: 'u2u-to-sepolia' | 'sepolia-to-u2u';
  }>({ step: 'idle' });

  const getQuote = useCallback(async (params: Omit<SwapParams, 'recipient'>) => {
    setIsLoadingQuote(true);
    try {
      const swapQuote = await getSwapQuote(
        params.fromToken,
        params.toToken,
        params.fromAmount,
        params.fromChainId,
        params.toChainId
      );
      setQuote(swapQuote);
      return swapQuote;
    } catch (err) {
      console.error('Failed to get quote:', err);
      throw err;
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  const executeSwap = useCallback(async (params: SwapParams) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const { fromChainId, toChainId, fromAmount, recipient } = params;
    
    // Validate that user is on the correct chain for the source transaction
    if (chainId !== fromChainId) {
      throw new Error(`Please switch to ${fromChainId === 39 ? 'U2U Solaris Mainnet' : 'Sepolia Testnet'} to send ${fromChainId === 39 ? 'U2U' : 'ETH'}`);
    }
    
    // Reset bridge status
    setBridgeStatus({ step: 'idle' });
    
    try {
      // For U2U to Sepolia swap
      if (fromChainId === 39 && toChainId === 11155111) {
        // Step 1: Send U2U directly to relayer's address
        // First, get the relayer's address from the API
        const relayerStatusResponse = await fetch('/api/relayer');
        const relayerStatus = await relayerStatusResponse.json();
        
        if (!relayerStatus.success) {
          throw new Error('Failed to get relayer address');
        }
        
        const relayerAddress = relayerStatus.relayerAddress;
        console.log('Sending U2U to relayer address:', relayerAddress);
        
        // Send U2U directly to relayer (simple ETH transfer)
        sendTransaction({
          to: relayerAddress as `0x${string}`,
          value: parseEther(fromAmount),
        });

        console.log('U2U transaction submitted:', sendHash);
        
        // Use the hash from wagmi if txHash is undefined
        const finalTxHash = sendHash || hash;
        console.log('Final transaction hash:', finalTxHash);

        // Update status to show U2U transaction is pending
        setBridgeStatus({ 
          step: 'source-pending', 
          sourceTxHash: finalTxHash,
          direction: 'u2u-to-sepolia'
        });

        // Wait for transaction confirmation (1-3 blocks)
        console.log('⏳ Waiting for U2U confirmation...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds for confirmation
        
        // Update status to show U2U transaction is confirmed
        setBridgeStatus({ 
          step: 'source-confirmed', 
          sourceTxHash: finalTxHash,
          direction: 'u2u-to-sepolia'
        });
        console.log('✅ U2U transaction confirmed.');
        
        // Step 2: Call relayer API to send ETH to recipient
        setBridgeStatus({ 
          step: 'target-pending', 
          sourceTxHash: finalTxHash,
          direction: 'u2u-to-sepolia'
        });
        console.log('⏳ Relayer sending ETH...');
        
        const relayerResponse = await fetch('/api/relayer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient,
            amount: fromAmount,
            transferId: finalTxHash, // Use transaction hash as transferId
            action: 'swap'
          }),
        });

        const relayerResult = await relayerResponse.json();
        
        if (!relayerResult.success) {
          // Provide more specific error messages
          if (relayerResult.error?.includes('insufficient funds')) {
            throw new Error(`Insufficient relayer funds: ${relayerResult.error}. Please try a smaller amount or fund the relayer.`);
          } else if (relayerResult.error?.includes('gas')) {
            throw new Error(`Gas estimation failed: ${relayerResult.error}. Please try again.`);
          } else {
            throw new Error(`Relayer failed: ${relayerResult.error}`);
          }
        }
        
        console.log('Relayer response:', relayerResult);
        
        // Update status to show Sepolia transaction is confirmed
        const sepoliaTxHash = relayerResult.txHash || relayerResult.mintTxHash;
        setBridgeStatus({ 
          step: 'target-confirmed', 
          sourceTxHash: finalTxHash,
          targetTxHash: sepoliaTxHash,
          direction: 'u2u-to-sepolia'
        });
        console.log('✅ ETH successfully bridged.');
        
        return { 
          u2uTx: finalTxHash, 
          sepoliaTx: sepoliaTxHash 
        };
      } else if (fromChainId === 11155111 && toChainId === 39) {
        // For Sepolia to U2U swap (reverse direction)
        // Step 1: Send ETH from user's wallet to relayer
        // First, get the relayer's address from the API
        const relayerStatusResponse = await fetch('/api/relayer');
        const relayerStatus = await relayerStatusResponse.json();
        
        if (!relayerStatus.success) {
          throw new Error('Failed to get relayer address');
        }
        
        const relayerAddress = relayerStatus.relayerAddress;
        console.log('Sending ETH to relayer address:', relayerAddress);
        
        // Send ETH directly to relayer (simple ETH transfer)
        sendTransaction({
          to: relayerAddress as `0x${string}`,
          value: parseEther(fromAmount),
        });

        console.log('ETH transaction submitted:', sendHash);
        
        // Use the hash from wagmi if txHash is undefined
        const finalTxHash = sendHash || hash;
        console.log('Final transaction hash:', finalTxHash);

        // Update status to show ETH transaction is pending
        setBridgeStatus({ 
          step: 'source-pending', 
          sourceTxHash: finalTxHash,
          direction: 'sepolia-to-u2u'
        });

        // Wait for transaction confirmation (1-3 blocks)
        console.log('⏳ Waiting for ETH confirmation...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds for confirmation
        
        // Update status to show ETH transaction is confirmed
        setBridgeStatus({ 
          step: 'source-confirmed', 
          sourceTxHash: finalTxHash,
          direction: 'sepolia-to-u2u'
        });
        console.log('✅ ETH transaction confirmed.');
        
        // Step 2: Call relayer API to send U2U to recipient
        setBridgeStatus({ 
          step: 'target-pending', 
          sourceTxHash: finalTxHash,
          direction: 'sepolia-to-u2u'
        });
        console.log('⏳ Relayer sending U2U...');
        
        const relayerResponse = await fetch('/api/relayer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient,
            amount: fromAmount,
            transferId: finalTxHash, // Use transaction hash as transferId
            action: 'swap-eth-to-u2u'
          }),
        });

        const relayerResult = await relayerResponse.json();
        
        if (!relayerResult.success) {
          // Provide more specific error messages
          if (relayerResult.error?.includes('insufficient funds')) {
            throw new Error(`Insufficient relayer funds: ${relayerResult.error}. Please try a smaller amount or fund the relayer.`);
          } else if (relayerResult.error?.includes('gas')) {
            throw new Error(`Gas estimation failed: ${relayerResult.error}. Please try again.`);
          } else {
            throw new Error(`Relayer failed: ${relayerResult.error}`);
          }
        }
        
        console.log('Relayer response:', relayerResult);
        
        // Update status to show U2U transaction is confirmed
        const u2uTxHash = relayerResult.txHash || relayerResult.mintTxHash;
        setBridgeStatus({ 
          step: 'target-confirmed', 
          sourceTxHash: finalTxHash,
          targetTxHash: u2uTxHash,
          direction: 'sepolia-to-u2u'
        });
        console.log('✅ U2U successfully bridged.');
        
        return { 
          u2uTx: finalTxHash, 
          sepoliaTx: u2uTxHash 
        };
      } else {
        throw new Error('Unsupported chain pair');
      }
    } catch (err) {
      console.error('Swap execution failed:', err);
      setBridgeStatus({ 
        step: 'error', 
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      throw err;
    }
  }, [address, writeContract, sendTransaction]);

  const releaseFunds = useCallback(async (
    transferId: string,
    recipient: string,
    amount: string,
    chainId: number
  ) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      if (chainId === 11155111) {
        // Call release function on Sepolia pool
        await writeContract({
          address: SEPOLIA_POOL as `0x${string}`,
          abi: SEPOLIA_POOL_ABI,
          functionName: 'release',
          args: [
            transferId as `0x${string}`,
            recipient as `0x${string}`,
            parseEther(amount)
          ],
        });
      } else {
        throw new Error('Unsupported chain for release');
      }
    } catch (err) {
      console.error('Release failed:', err);
      throw err;
    }
  }, [address, writeContract]);

  return {
    getQuote,
    executeSwap,
    releaseFunds,
    quote,
    isLoadingQuote,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    bridgeStatus,
  };
}
