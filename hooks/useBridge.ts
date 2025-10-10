"use client";

import { useState } from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  U2U_SEPOLIA_ADDRESS,
  U2U_BRIDGE_ADDRESS,
  SEPOLIA_BRIDGE_ADDRESS,
  WRBTC_ABI,
  ROOTSTOCK_BRIDGE_ABI,
  SEPOLIA_BRIDGE_ABI,
} from "@/lib/contracts";
import { u2uSolaris, sepolia } from "@/lib/config";

export function useBridge() {
  const { address, chainId } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);

  const { data: nativeBalance } = useBalance({
    address,
  });

  const { data: wRBTCBalance } = useReadContract({
    address: U2U_SEPOLIA_ADDRESS,
    abi: WRBTC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: sepolia.id,
  });

  const { writeContract, data: hash, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

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
      } else {
        console.error("Failed to process bridge:", bridgeResult.error);
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

    try {
      // Send ETH to Sepolia bridge contract
      writeContract({
        address: SEPOLIA_BRIDGE_ADDRESS,
        abi: SEPOLIA_BRIDGE_ABI,
        functionName: "bridge",
        args: [BigInt(39), address], // destinationChainId = 39 (U2U), recipient = user address
        chainId: sepolia.id,
        value: parseEther(amount),
      });

      // Wait a moment for the transaction to be mined
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Call relayer to mint WETH on U2U
      const response = await fetch("/api/relayer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: address,
          amount: amount,
          action: "bridge-eth-to-weth",
          transferId: hash,
        }),
      });

      const bridgeResult = await response.json();

      if (bridgeResult.success) {
        console.log("WETH bridge processed successfully:", bridgeResult.txHash);
        setMintTxHash(bridgeResult.txHash);
      } else {
        console.error("Failed to process WETH bridge:", bridgeResult.error);
      }
    } catch (err) {
      console.error("WETH bridge transaction failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableBalance = () => {
    if (isOnU2U) {
      return nativeBalance ? formatEther(nativeBalance.value) : "0";
    } else if (isOnSepolia) {
      return wRBTCBalance ? formatEther(wRBTCBalance as bigint) : "0";
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
    error,
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
