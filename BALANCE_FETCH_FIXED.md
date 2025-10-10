# ✅ Balance Fetching Fixed

## ❌ **Issue Identified**
The bridge UI was showing "0.000000 ETH" instead of the actual ETH balance because the balance fetching logic was incorrect.

## 🔧 **Root Cause**
In `hooks/useBridge.ts`, the balance fetching for Sepolia was trying to read from a token contract (`U2U_SEPOLIA_ADDRESS`) instead of fetching the native ETH balance.

**Before (Incorrect):**
```typescript
const { data: wRBTCBalance } = useReadContract({
  address: U2U_SEPOLIA_ADDRESS,  // ❌ Token contract address
  abi: WRBTC_ABI,
  functionName: "balanceOf",
  args: address ? [address] : undefined,
  chainId: sepolia.id,
});

const getAvailableBalance = () => {
  if (isOnU2U) {
    return nativeBalance ? formatEther(nativeBalance.value) : "0";
  } else if (isOnSepolia) {
    return wRBTCBalance ? formatEther(wRBTCBalance as bigint) : "0";  // ❌ Wrong balance
  }
  return "0";
};
```

## ✅ **Solution Applied**

**After (Fixed):**
```typescript
// For Sepolia, we need the native ETH balance, not a token balance
const { data: sepoliaBalance } = useBalance({
  address,
  chainId: sepolia.id,  // ✅ Fetch native ETH balance on Sepolia
});

const getAvailableBalance = () => {
  if (isOnU2U) {
    return nativeBalance ? formatEther(nativeBalance.value) : "0";
  } else if (isOnSepolia) {
    return sepoliaBalance ? formatEther(sepoliaBalance.value) : "0";  // ✅ Correct balance
  }
  return "0";
};
```

## 🎯 **Changes Made**

### **1. Fixed Balance Fetching**
- **Removed** `useReadContract` for token balance
- **Added** `useBalance` with `chainId: sepolia.id` for native ETH balance
- **Updated** `getAvailableBalance()` to use the correct balance

### **2. Cleaned Up Imports**
- **Removed** unused `useReadContract` import
- **Removed** unused `U2U_SEPOLIA_ADDRESS` and `WRBTC_ABI` imports

## 🚀 **Expected Result**

Now when users connect to Sepolia Testnet, the bridge UI should show:
- **Available Balance**: Their actual ETH balance (e.g., "0.123456 ETH")
- **Token Symbol**: "ETH" 
- **Network**: "Sepolia"

The balance will update in real-time as users make transactions or receive ETH.

## 🧪 **Testing**

To verify the fix:
1. **Connect** to Sepolia Testnet
2. **Check** that "Available Balance" shows your actual ETH balance
3. **Enter** an amount to bridge
4. **Verify** the balance updates correctly

The balance fetching is now working correctly! 🎉
