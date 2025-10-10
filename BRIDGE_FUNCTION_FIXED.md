# ✅ Bridge Function Error Fixed

## ❌ **Error Encountered**
```
Error: Function "bridge" not found on ABI. Make sure you are using the correct ABI and that the function exists on it.
```

## 🔍 **Root Cause**
The bridge hook was trying to call a "bridge" function that doesn't exist on our deployed SepoliaBridge contract. The old ABI file was from the RootStock implementation and didn't match our new contract.

## 🔧 **Solution Applied**

### **1. Updated Bridge Function Call**
**Before (Incorrect):**
```typescript
writeContract({
  address: SEPOLIA_BRIDGE_ADDRESS,
  abi: SEPOLIA_BRIDGE_ABI,
  functionName: "bridge",  // ❌ Function doesn't exist
  args: [BigInt(39), address],
  chainId: sepolia.id,
  value: parseEther(amount),
});
```

**After (Fixed):**
```typescript
writeContract({
  address: SEPOLIA_BRIDGE_ADDRESS,
  abi: SEPOLIA_BRIDGE_ABI,
  functionName: "deposit",  // ✅ Correct function
  args: [],  // ✅ No arguments needed
  chainId: sepolia.id,
  value: parseEther(amount),
});
```

### **2. Created Correct ABI**
- **Created** `SepoliaBridgeNew.json` with the correct ABI for our deployed contract
- **Updated** `contracts.ts` to import the new ABI
- **Functions available**: `deposit()`, `completeBridge()`, `getBalance()`, etc.

### **3. Bridge Flow Clarification**
Our SepoliaBridge contract works as follows:
1. **User calls `deposit()`** - Sends ETH to the contract
2. **Relayer monitors** - Watches for deposits
3. **Relayer calls `completeBridge()`** - Sends ETH to recipients (for U2U → Sepolia)
4. **For ETH → WETH**: Relayer mints WETH on U2U after detecting deposit

## 🎯 **Changes Made**

### **1. Fixed Function Call**
- **Changed** `functionName` from "bridge" to "deposit"
- **Removed** unnecessary arguments
- **Kept** `value: parseEther(amount)` to send ETH

### **2. Updated ABI**
- **Created** new ABI file with correct function signatures
- **Updated** import in contracts.ts
- **Verified** all functions match deployed contract

## 🚀 **Expected Result**

Now when users try to bridge ETH from Sepolia:
1. **ETH sent** to SepoliaBridge contract via `deposit()` function
2. **Transaction confirmed** on Sepolia
3. **Relayer detects** the deposit
4. **Relayer mints** WETH on U2U Solaris
5. **User receives** WETH tokens on U2U

## 🧪 **Testing**

To verify the fix:
1. **Connect** to Sepolia Testnet
2. **Enter** ETH amount to bridge
3. **Click** "Bridge ETH to WETH"
4. **Transaction** should succeed (no more ABI error)
5. **Wait** for relayer to mint WETH on U2U

The bridge function error is now fixed! 🎉
