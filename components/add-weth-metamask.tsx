"use client"
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { WETH_MONAD_ADDRESS } from "@/lib/addresses";
import { monadTestnet } from "@/lib/config";

export function AddWETHToMetaMask() {
  const addWETHToken = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    try {
      // First, switch to Monad Testnet if not already on it
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${monadTestnet.id.toString(16)}` }],
        });
      } catch (switchError: any) {
        // If the network doesn't exist, add it first
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${monadTestnet.id.toString(16)}`,
              chainName: monadTestnet.name,
              nativeCurrency: {
                name: monadTestnet.nativeCurrency.name,
                symbol: monadTestnet.nativeCurrency.symbol,
                decimals: monadTestnet.nativeCurrency.decimals,
              },
              rpcUrls: monadTestnet.rpcUrls.default.http,
              blockExplorerUrls: [monadTestnet.blockExplorers.default.url],
            }],
          });
        } else {
          throw switchError;
        }
      }

      // Now add the WETH token to Monad Testnet
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: WETH_MONAD_ADDRESS, // WETH contract address on Monad Testnet
            symbol: "WETH",
            decimals: 18,
            image: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png", // WETH logo
          },
        },
      });
    } catch (error) {
      console.error("Failed to add WETH to MetaMask", error);
      alert("Failed to add WETH to MetaMask. Please try again or add manually.");
    }
  };

  return (
    <Button onClick={addWETHToken} variant="outline" className="w-full">
      <PlusCircle className="mr-2 h-4 w-4" /> Add WETH to MetaMask (Monad)
    </Button>
  );
}
