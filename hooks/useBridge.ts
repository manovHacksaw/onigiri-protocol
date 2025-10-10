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
  U2U_BRIDGE_ADDRESS,
  SEPOLIA_BRIDGE_ADDRESS,
  ROOTSTOCK_BRIDGE_ABI,
  SEPOLIA_BRIDGE_ABI,
} from "@/lib/contracts";
import { u2uSolaris, sepolia } from "@/lib/config";

export function useBridge() {
  const { address, chainId } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [relayerError, setRelayerError] = useState<string | null>(null);
  const [pendingBridgeAmount, setPendingBridgeAmount] = useState<string | null>(null);

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
      if (isConfirmed && pendingBridgeAmount && address && hash) {
        console.log("Sepolia transaction confirmed, triggering WETH minting...");
        
        try {
          // Generate a transferId based on the confirmed transaction
          const transferId = `0x${Buffer.from(`${address}-${pendingBridgeAmount}-${Date.now()}`).toString('hex').padStart(64, '0')}`;

          // Call relayer to mint WETH on U2U
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
            console.log("WETH bridge processed successfully:", bridgeResult.txHash);
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
          // Clear the pending bridge amount
          setPendingBridgeAmount(null);
        }
      }
    };

    triggerRelayerMinting();
  }, [isConfirmed, pendingBridgeAmount, address, hash]);

  const isOnU2U = chainId === u2uSolaris.id;
  const isOnSepolia = chainId === sepolia.id;

  const bridgeFromU2U = async (amount: string) => {
    if (!amount || !address) return;

    setIsLoading(true);
    setTxHash(null);
    setMintTxHash(null);

    try {
      // First, send U2U to the bridge contract on U2U Solaris
      writeContract({
        address: U2U_BRIDGE_ADDRESS,
        abi: ROOTSTOCK_BRIDGE_ABI, // Using same ABI for now
        functionName: "bridge",
        args: [],
        chainId: u2uSolaris.id,
        value: parseEther(amount), // Send native U2U as msg.value
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
          u2uTxHash: hash, // The transaction hash from the U2U bridge
        }),
      });

      const bridgeResult = await response.json();

      if (bridgeResult.success) {
        console.log("Bridge processed successfully:", bridgeResult.txHash);
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
      console.log("ETH sent to Sepolia bridge, waiting for confirmation...");
    } catch (err) {
      console.error("WETH bridge transaction failed:", err);
      setPendingBridgeAmount(null); // Clear pending amount on error
      setIsLoading(false);
    }
  };

  const getAvailableBalance = () => {
    if (isOnU2U) {
      return nativeBalance ? formatEther(nativeBalance.value) : "0";
    } else if (isOnSepolia) {
      return sepoliaBalance ? formatEther(sepoliaBalance.value) : "0";
    }
    return "0";
  };

  const getTokenSymbol = () => {
    if (isOnU2U) return "U2U";
    if (isOnSepolia) return "ETH";
    return "";
  };

  const getNetworkName = () => {
    if (isOnU2U) return "U2U Solaris Mainnet";
    if (isOnSepolia) return "Sepolia";
    return "Unknown";
  };

  const getTargetNetwork = () => {
    if (isOnU2U) return "Sepolia";
    if (isOnSepolia) return "U2U";
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
    isOnU2U,
    isOnSepolia,
    availableBalance: getAvailableBalance(),
    tokenSymbol: getTokenSymbol(),
    networkName: getNetworkName(),
    targetNetwork: getTargetNetwork(),
    bridgeFromU2U,
    bridgeFromSepolia,
  };
}
