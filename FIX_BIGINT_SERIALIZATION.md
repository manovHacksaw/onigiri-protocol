# 🔧 Fix BigInt Serialization Error

## 🐛 Issue Identified

**Error**: "Relayer failed: JSON.stringify cannot serialize BigInt."

This happens when the relayer tries to return transaction receipts containing BigInt values in the JSON response.

## ✅ Fix Applied

**Problem**: Transaction receipts contain BigInt values (blockNumber, gasUsed, etc.) that can't be serialized to JSON.

**Solution**: Convert BigInt values to strings before returning in the response.

### **Before (Broken):**
```typescript
return NextResponse.json({
  success: true,
  txHash,
  receipt, // ❌ Contains BigInt values
  message: "Swap processed"
});
```

### **After (Fixed):**
```typescript
return NextResponse.json({
  success: true,
  txHash,
  receipt: {
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber.toString(), // ✅ Convert to string
    gasUsed: receipt.gasUsed.toString(),         // ✅ Convert to string
    status: receipt.status,
  },
  message: "Swap processed"
});
```

## 🚀 Test Now

Try your 0.8 U2U swap again. You should now see:

**✅ Expected Result:**
- No more "JSON.stringify cannot serialize BigInt" error
- Swap should complete successfully
- Green "Swap completed successfully!" message
- Transaction hash in the success popup

## 📊 What Was Fixed

1. **Bridge Action**: Fixed receipt serialization
2. **Stake Action**: Fixed receipt and mintReceipt serialization  
3. **Swap Action**: Fixed receipt serialization
4. **Default Action**: Fixed receipt serialization

All BigInt values (blockNumber, gasUsed) are now converted to strings before being returned in the JSON response.

## 🔍 Expected Console Output

You should see:
```
✅ Processing swap: 0.8 U2U for 0x[recipient], transferId: 0x[tx-hash]
Current prices - U2U: $0.006144, ETH: $4327.95
Converting 0.8 U2U ($0.005) to 0.000001 ETH
Sepolia ETH minted for swap: 0x[tx-hash]
```

The swap should now complete without the BigInt serialization error! 🎉
