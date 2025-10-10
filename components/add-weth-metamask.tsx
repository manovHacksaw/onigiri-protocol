"use client"
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { WETH_U2U_ADDRESS } from "@/lib/addresses";

export function AddWETHToMetaMask() {
  const addWETHToken = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: WETH_U2U_ADDRESS, // WETH contract address on U2U
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
      <PlusCircle className="mr-2 h-4 w-4" /> Add WETH to MetaMask
    </Button>
  );
}
