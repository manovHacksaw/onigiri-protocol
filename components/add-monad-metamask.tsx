"use client"

import { Button } from "@/components/ui/button"
import { monadTestnet } from "@/lib/config"

export function AddMonadToMetaMask() {
  const addMonadToMetaMask = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
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
      } catch (error) {
        console.error('Failed to add Monad to MetaMask:', error);
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask to add the Monad network.');
    }
  };

  return (
    <Button 
      onClick={addMonadToMetaMask}
      variant="outline"
      size="sm"
      className="text-xs"
    >
      Add Monad to MetaMask
    </Button>
  );
}
