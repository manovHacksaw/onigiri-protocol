# 💰 Fund Relayer Account Guide

## 🐛 Issue Identified

The relayer account `0x7532Ff2586E7dAc95946A66134d669C4cAf8FD7D` has insufficient ETH on Sepolia:

- **Current Balance**: 0.22 ETH
- **Required for 0.5 ETH swap**: 0.5 ETH + gas fees
- **Shortfall**: ~0.28 ETH + gas

## 🚀 Solutions

### **Option 1: Fund the Relayer Account (Recommended)**

1. **Get Sepolia ETH from a faucet:**
   - Visit: https://sepoliafaucet.com/
   - Enter address: `0x7532Ff2586E7dAc95946A66134d669C4cAf8FD7D`
   - Request 1-2 ETH for testing

2. **Alternative faucets:**
   - https://faucet.sepolia.dev/
   - https://sepolia-faucet.pk910.de/
   - https://www.alchemy.com/faucets/ethereum-sepolia

### **Option 2: Reduce Swap Amount**

Test with smaller amounts:
- Try 0.1 ETH instead of 0.5 ETH
- This should work with current balance

### **Option 3: Check Current Balance**

You can check the relayer balance at:
- **Sepolia**: https://sepolia.etherscan.io/address/0x7532Ff2586E7dAc95946A66134d669C4cAf8FD7D
- **U2U**: https://u2uscan.xyz/address/0x7532Ff2586E7dAc95946A66134d669C4cAf8FD7D

## 🔧 Quick Fix

**For immediate testing, try a smaller swap amount:**

1. Go to `/swap` page
2. Enter `0.1` instead of `0.5` ETH
3. This should work with current balance

## 📊 Expected Balances After Funding

**Target balances for smooth operation:**
- **Sepolia**: 2-3 ETH (for multiple swaps + gas)
- **U2U**: 1000+ U2U (for receiving swaps)

## 🛠️ Verification

After funding, the relayer status should show:
```
🟢 Available Liquidity
💰 Total Liquidity: $X,XXX.XX USD
🟠 U2U Solaris: XXXX.XXXX U2U
🔵 Sepolia: X.XXXX ETH
⚡ Status: operational
```

## 🚨 Important Notes

- **Sepolia ETH is free** - use faucets for testing
- **Keep some buffer** for gas fees
- **Monitor balances** via the liquidity display
- **Fund both chains** for bidirectional swaps

The relayer needs sufficient funds on both chains to execute cross-chain swaps!
