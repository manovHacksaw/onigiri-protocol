"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  MONAD_BRIDGE_ADDRESS,
  SEPOLIA_BRIDGE_ADDRESS,
  MONAD_BRIDGE_ABI,
  SEPOLIA_BRIDGE_ABI,
} from "@/lib/contracts";
import { monadTestnet, sepolia } from "@/lib/config";

export function useBridge() {
  const { address, chainId } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [relayerError, setRelayerError] = useState<string | null>(null);
  const [pendingBridgeAmount, setPendingBridgeAmount] = useState<string | null>(null);
  const [relayerProcessing, setRelayerProcessing] = useState<boolean>(false);
  
  // Delegation state
  const [isDelegationEnabled, setIsDelegationEnabled] = useState(false);
  const [delegationStatus, setDelegationStatus] = useState<{
    isEnabled: boolean;
    isActive: boolean;
    expiresAt?: string;
  }>({ isEnabled: false, isActive: false });

  const { data: nativeBalance } = useBalance({
    address,
  });

  // For Sepolia, we need the native ETH balance, not a token balance
  const { data: sepoliaBalance } = useBalance({
    address,
    chainId: sepolia.id,
  });

  const { writeContract, data: hash, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Effect to trigger relayer call after Sepolia transaction is confirmed
  useEffect(() => {
    const triggerRelayerMinting = async () => {
      if (isConfirmed && pendingBridgeAmount && address && hash && !relayerProcessing) {
        console.log("Sepolia transaction confirmed, triggering WETH minting");
        setRelayerProcessing(true);
        
        try {
          // Use the actual transaction hash as transferId to ensure uniqueness
          const transferId = hash;

          // Call relayer to mint WETH on Monad
          const response = await fetch("/api/relayer", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              recipient: address,
              amount: pendingBridgeAmount,
              action: "bridge-eth-to-weth",
              transferId: transferId,
              sepoliaTxHash: hash, // Include the confirmed Sepolia transaction hash
            }),
          });

          const bridgeResult = await response.json();

          if (bridgeResult.success) {
            console.log("WETH bridge processed successfully");
            setMintTxHash(bridgeResult.txHash);
            setRelayerError(null);
          } else {
            console.error("Failed to process WETH bridge:", bridgeResult.error);
            setRelayerError(bridgeResult.error || "WETH bridge processing failed");
          }
        } catch (err) {
          console.error("Relayer call failed:", err);
          setRelayerError("Failed to call relayer for WETH minting");
        } finally {
          // Clear the pending bridge amount and reset processing flag
          setPendingBridgeAmount(null);
          setRelayerProcessing(false);
        }
      }
    };

    triggerRelayerMinting();
  }, [isConfirmed, pendingBridgeAmount, address, hash, relayerProcessing]);

  // Check delegation status
  const checkDelegationStatus = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/delegation?userAddress=${address}`);
      const data = await response.json();
      
      if (data.success) {
        setDelegationStatus({
          isEnabled: true,
          isActive: data.delegation.isActive,
          expiresAt: data.delegation.expiresAt
        });
        setIsDelegationEnabled(data.delegation.isActive);
      } else {
        setDelegationStatus({ isEnabled: false, isActive: false });
        setIsDelegationEnabled(false);
      }
    } catch (error) {
      console.error('Error checking delegation status:', error);
      setDelegationStatus({ isEnabled: false, isActive: false });
      setIsDelegationEnabled(false);
    }
  };

  // Check delegation status on mount
  useEffect(() => {
    if (address) {
      checkDelegationStatus();
    }
  }, [address]);

  const isOnMonad = chainId === monadTestnet.id;
  const isOnSepolia = chainId === sepolia.id;

  const bridgeFromMonad = async (amount: string) => {
    if (!amount || !address) return;

    setIsLoading(true);
    setTxHash(null);
    setMintTxHash(null);

    try {
      // Check if delegation is enabled and use delegated bridge
      if (isDelegationEnabled && delegationStatus.isActive) {
        console.log('🚀 [DELEGATED-BRIDGE] Using delegated transaction for gasless bridge');
        
        // Call the delegated bridge API
        const response = await fetch('/api/delegated-swap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAddress: address,
            fromToken: 'MON',
            toToken: 'ETH',
            fromAmount: amount,
            fromChainId: monadTestnet.id,
            toChainId: sepolia.id,
            recipient: address
          }),
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Delegated bridge failed');
        }
        
        console.log('✅ [DELEGATED-BRIDGE] Delegated bridge successful:', result.transactionHash);
        setTxHash(result.transactionHash);
        setMintTxHash(result.transactionHash);
        return;
      }
      
      // Fallback to regular bridge flow
      console.log('🔄 [REGULAR-BRIDGE] Using regular bridge flow');
      
      // First, send MON to the bridge contract on Monad Testnet
      writeContract({
        address: MONAD_BRIDGE_ADDRESS,
        abi: MONAD_BRIDGE_ABI.abi,
        functionName: "bridge",
        args: [11155111, address], // destinationChainId (Sepolia = 11155111), recipient
        chainId: monadTestnet.id,
        value: parseEther(amount), // Send native MON as msg.value
      });

      // Wait a moment for the transaction to be mined
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Then call the relayer API to process the bridge
      const response = await fetch("/api/relayer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: address,
          amount: amount,
          action: "bridge",
          monadTxHash: hash, // The transaction hash from the Monad bridge
        }),
      });

      const bridgeResult = await response.json();

      if (bridgeResult.success) {
        console.log("Bridge processed successfully");
        setMintTxHash(bridgeResult.txHash);
        setRelayerError(null);
      } else {
        console.error("Failed to process bridge:", bridgeResult.error);
        setRelayerError(bridgeResult.error || "Bridge processing failed");
      }
    } catch (err) {
      console.error("Bridge transaction failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const bridgeFromSepolia = async (amount: string) => {
    if (!amount || !address) return;

    setIsLoading(true);
    setTxHash(null);
    setMintTxHash(null);
    setRelayerError(null);
    setRelayerProcessing(false);
    setPendingBridgeAmount(amount); // Store the amount for later relayer call

    try {
      // Send ETH to Sepolia bridge contract using deposit function
      writeContract({
        address: SEPOLIA_BRIDGE_ADDRESS,
        abi: SEPOLIA_BRIDGE_ABI,
        functionName: "deposit",
        args: [], // deposit function takes no arguments, ETH is sent as msg.value
        chainId: sepolia.id,
        value: parseEther(amount),
      });

      // The useEffect will handle the relayer call after transaction confirmation
      console.log("ETH sent to Sepolia bridge, waiting for confirmation");
    } catch (err) {
      console.error("WETH bridge transaction failed:", err);
      setPendingBridgeAmount(null); // Clear pending amount on error
      setIsLoading(false);
    }
  };

  const getAvailableBalance = () => {
    if (isOnMonad) {
      return nativeBalance ? formatEther(nativeBalance.value) : "0";
    } else if (isOnSepolia) {
      return sepoliaBalance ? formatEther(sepoliaBalance.value) : "0";
    }
    return "0";
  };

  const getTokenSymbol = () => {
    if (isOnMonad) return "MON";
    if (isOnSepolia) return "ETH";
    return "";
  };

  const getNetworkName = () => {
    if (isOnMonad) return "Monad Testnet";
    if (isOnSepolia) return "Sepolia Testnet";
    return "Unknown";
  };

  const getTargetNetwork = () => {
    if (isOnMonad) return "Sepolia Testnet";
    if (isOnSepolia) return "Monad Testnet";
    return "";
  };

  return {
    address,
    chainId,
    isLoading: isLoading || isConfirming,
    isConfirmed,
    txHash: hash,
    mintTxHash,
    error: error || relayerError,
    isOnMonad,
    isOnSepolia,
    availableBalance: getAvailableBalance(),
    tokenSymbol: getTokenSymbol(),
    networkName: getNetworkName(),
    targetNetwork: getTargetNetwork(),
    bridgeFromMonad,
    bridgeFromSepolia,
    // Delegation state
    isDelegationEnabled,
    delegationStatus,
    checkDelegationStatus,
  };
}
