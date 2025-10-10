"use client"

import { Button } from "@/components/ui/button"
import { u2uSolaris } from "@/lib/config"

export function AddU2UToMetaMask() {
  const addU2UToMetaMask = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${u2uSolaris.id.toString(16)}`,
            chainName: u2uSolaris.name,
            nativeCurrency: {
              name: u2uSolaris.nativeCurrency.name,
              symbol: u2uSolaris.nativeCurrency.symbol,
              decimals: u2uSolaris.nativeCurrency.decimals,
            },
            rpcUrls: u2uSolaris.rpcUrls.default.http,
            blockExplorerUrls: [u2uSolaris.blockExplorers.default.url],
          }],
        });
      } catch (error) {
        console.error('Failed to add U2U to MetaMask:', error);
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask to add the U2U network.');
    }
  };

  return (
    <Button 
      onClick={addU2UToMetaMask}
      variant="outline"
      size="sm"
      className="text-xs"
    >
      Add U2U to MetaMask
    </Button>
  );
}
