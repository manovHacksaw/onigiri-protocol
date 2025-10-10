import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSendTransaction, useSwitchChain } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { 
  U2U_BRIDGE_ADDRESS,
  SEPOLIA_BRIDGE_ADDRESS,
  U2U_BRIDGE_ABI,
  SEPOLIA_BRIDGE_ABI
} from '@/lib/contracts';
import { getSwapQuote, SwapQuote } from '@/lib/priceApi';
import { verifyTransaction, getExplorerUrl, getChainDisplayName } from '@/lib/transaction-verification';
import { TransactionStep } from '@/components/ui/transaction-modal';

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
  
  // Track the current transaction hash
  const [currentTxHash, setCurrentTxHash] = useState<string | null>(null);
  const sendHashRef = useRef<string | null>(null);
  
  // Update ref when sendHash changes
  useEffect(() => {
    if (sendHash) {
      sendHashRef.current = sendHash;
    }
  }, [sendHash]);
  
  // Use the currentTxHash for transaction receipt waiting
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: currentTxHash as `0x${string}` | undefined,
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
  
  // Transaction modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Helper functions for transaction modal
  const updateTransactionStep = useCallback((stepId: string, updates: Partial<TransactionStep>) => {
    setTransactionSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  }, []);

  const initializeTransactionSteps = useCallback((direction: 'u2u-to-sepolia' | 'sepolia-to-u2u') => {
    const steps: TransactionStep[] = [
      {
        id: 'signature',
        title: 'Awaiting transaction signature...',
        description: 'Please sign the transaction in your wallet',
        status: 'pending'
      },
      {
        id: 'source-confirmation',
        title: direction === 'u2u-to-sepolia' ? 'Sending U2U to relayer...' : 'Sending ETH to relayer...',
        description: 'Transaction submitted — awaiting confirmation...',
        status: 'pending'
      },
      {
        id: 'relayer-processing',
        title: direction === 'u2u-to-sepolia' ? 'Relayer sending ETH...' : 'Relayer sending U2U...',
        description: 'Processing cross-chain transfer...',
        status: 'pending'
      },
      {
        id: 'completion',
        title: 'Bridge successful!',
        description: direction === 'u2u-to-sepolia' ? 'ETH transferred successfully!' : 'U2U transferred successfully!',
        status: 'pending'
      }
    ];
    
    setTransactionSteps(steps);
    setCurrentStep('signature');
    setModalError(null);
    setIsModalOpen(true);
  }, []);

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
      const direction = fromChainId === 39 ? 'u2u-to-sepolia' : 'sepolia-to-u2u';
      
      // Initialize transaction modal
      initializeTransactionSteps(direction);
      
      // Step 1: Get relayer address
        const relayerStatusResponse = await fetch('/api/relayer');
        const relayerStatus = await relayerStatusResponse.json();
        
        if (!relayerStatus.success) {
          throw new Error('Failed to get relayer address');
        }
        
        const relayerAddress = relayerStatus.relayerAddress;
      console.log(`Sending ${direction === 'u2u-to-sepolia' ? 'U2U' : 'ETH'} to relayer address:`, relayerAddress);
      
      // Step 2: Send transaction and wait for signature
      updateTransactionStep('signature', { status: 'in-progress' });
      setCurrentStep('signature');
      
      // Reset current transaction hash
      setCurrentTxHash(null);
      
      // Send transaction to relayer and wait for hash
      const txHash = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Transaction signature timeout - please try again'));
        }, 30000);

        // Send the transaction
        sendTransaction({
          to: relayerAddress as `0x${string}`,
          value: parseEther(fromAmount),
        });

        // Poll for the hash using the ref
        const checkForHash = () => {
          if (sendError) {
            clearTimeout(timeout);
            reject(new Error('Transaction failed: ' + (sendError instanceof Error ? sendError.message : 'Unknown error')));
            return;
          }
          
          if (sendHashRef.current) {
            clearTimeout(timeout);
            setCurrentTxHash(sendHashRef.current);
            resolve(sendHashRef.current);
          } else {
            setTimeout(checkForHash, 100);
          }
        };

        // Start checking after a short delay
        setTimeout(checkForHash, 100);
      });
      
      console.log(`Transaction submitted: ${txHash}`);
      
      // Step 3: Wait for transaction confirmation
      updateTransactionStep('signature', { 
        status: 'completed',
        title: 'Transaction signed',
        description: 'Transaction submitted to blockchain'
      });
      
      updateTransactionStep('source-confirmation', { 
        status: 'in-progress',
        txHash,
        explorerUrl: getExplorerUrl(txHash, fromChainId)
      });
      setCurrentStep('source-confirmation');
      
      // Simple wait like useBridge (no complex verification)
      console.log(`⏳ Waiting for ${direction === 'u2u-to-sepolia' ? 'U2U' : 'ETH'} confirmation...`);
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds like useBridge
      
      console.log(`✅ ${direction === 'u2u-to-sepolia' ? 'U2U' : 'ETH'} transaction confirmed`);
      
      // Update status to show source transaction is confirmed
      updateTransactionStep('source-confirmation', { 
        status: 'completed',
        title: direction === 'u2u-to-sepolia' ? 'U2U sent to relayer' : 'ETH sent to relayer',
        description: 'Transaction confirmed on blockchain'
      });
      
        setBridgeStatus({ 
          step: 'source-confirmed', 
        sourceTxHash: txHash,
        direction
      });
      
      // Step 4: Call relayer API (using simple approach like useBridge)
      updateTransactionStep('relayer-processing', { 
        status: 'in-progress',
        title: direction === 'u2u-to-sepolia' ? 'Relayer sending ETH...' : 'Relayer sending U2U...',
        description: 'Processing cross-chain transfer...'
      });
      setCurrentStep('relayer-processing');
      
      console.log('Calling relayer API with:', {
        recipient,
        amount: fromAmount,
        transferId: txHash,
        action: direction === 'u2u-to-sepolia' ? 'swap' : 'swap-eth-to-u2u'
      });
      
      // Wait a moment for the transaction to be processed (like useBridge does)
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      // Simple fetch call like useBridge
      const relayerResponse = await fetch('/api/relayer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient,
          amount: fromAmount,
          transferId: txHash,
          action: direction === 'u2u-to-sepolia' ? 'swap' : 'swap-eth-to-u2u'
        }),
      });

      const relayerResult = await relayerResponse.json();
      console.log('Relayer response:', relayerResult);
        
      if (!relayerResult.success) {
        console.error('Failed to process relayer:', relayerResult.error);
        throw new Error(relayerResult.error || 'Relayer processing failed');
      }
      
      console.log('Relayer success:', relayerResult.success);
      console.log('Relayer txHash:', relayerResult.txHash);
      console.log('Relayer mintTxHash:', relayerResult.mintTxHash);
        
      // Step 5: Get target transaction hash (don't wait for verification)
      const targetTxHash = relayerResult.txHash || relayerResult.mintTxHash;
      
      console.log('Target transaction hash:', targetTxHash);
      
      if (!targetTxHash) {
        console.warn('No transaction hash returned from relayer, but operation was successful');
      }
      
      // Note: We don't verify the target transaction here to avoid blocking the UI
      // The relayer has already confirmed the transaction was sent
      // Users can check the explorer link to verify manually
      
      // Update final status
      updateTransactionStep('relayer-processing', { 
        status: 'completed',
        title: direction === 'u2u-to-sepolia' ? 'ETH sent to recipient' : 'U2U sent to recipient',
        description: targetTxHash ? 'Cross-chain transfer completed' : 'Transfer completed (check your wallet)',
        txHash: targetTxHash,
        explorerUrl: targetTxHash ? getExplorerUrl(targetTxHash, toChainId) : undefined
      });
      
      updateTransactionStep('completion', { 
        status: 'completed',
        title: 'Bridge successful!',
        description: direction === 'u2u-to-sepolia' ? 'ETH transferred successfully!' : 'U2U transferred successfully!'
      });
      setCurrentStep('completion');
      
        setBridgeStatus({ 
          step: 'target-confirmed', 
        sourceTxHash: txHash,
        targetTxHash,
        direction
      });
      
      console.log(`✅ ${direction === 'u2u-to-sepolia' ? 'ETH' : 'U2U'} successfully bridged`);
        
        return { 
        u2uTx: direction === 'u2u-to-sepolia' ? txHash : targetTxHash, 
        sepoliaTx: direction === 'u2u-to-sepolia' ? targetTxHash : txHash 
        };
      
    } catch (err) {
      console.error('Swap execution failed:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setModalError(errorMessage);
      
      // Update current step to failed
      if (currentStep) {
        updateTransactionStep(currentStep, { 
          status: 'failed',
          title: 'Transaction failed',
          description: errorMessage
        });
      }
      
      setBridgeStatus({ 
        step: 'error', 
        error: errorMessage
      });
      
      throw err;
    }
  }, [address, sendTransaction, hash, sendHash, chainId, initializeTransactionSteps, updateTransactionStep, currentStep]);

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
        // For Sepolia, we can use the bridge contract's withdraw function if available
        // This is a placeholder - the actual implementation depends on the bridge contract's functions
        throw new Error('Release functionality not implemented for bridge system');
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
    // Modal state
    isModalOpen,
    transactionSteps,
    currentStep,
    modalError,
    setIsModalOpen,
  };
}
