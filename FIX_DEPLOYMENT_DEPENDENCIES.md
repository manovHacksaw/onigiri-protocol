# 🔧 Fix Deployment Dependencies

## ❌ **Error Encountered**
```
Error HH411: The library @openzeppelin/contracts, imported from contracts/U2UBridge.sol, is not installed. Try installing it using npm.
```

## ✅ **Solution**

### **Step 1: Install OpenZeppelin Contracts**
```bash
bun add @openzeppelin/contracts
```

**Or if using npm:**
```bash
npm install @openzeppelin/contracts
```

### **Step 2: Verify Installation**
```bash
bun list | grep openzeppelin
```

### **Step 3: Re-run Deployment**
```bash
# Deploy to U2U Solaris Mainnet
npx --yes hardhat run scripts/deploy.js --network u2u

# Deploy to Sepolia Testnet
npx --yes hardhat run scripts/deploy.js --network sepolia
```

## 📋 **Alternative: Manual Installation**

If the above doesn't work, try:

```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm package-lock.json  # or bun.lockb
bun install
bun add @openzeppelin/contracts
```

## 🎯 **Expected Result**

After installing the dependency, deployment should proceed successfully:

```
Starting deployment...
Deploying contracts with account: 0x[your-address]
Account balance: [balance] U2U

=== Deploying WETH Contract ===
WETH deployed to: 0x[weth-address]

=== Deploying U2U Bridge ===
U2U Bridge deployed to: 0x[u2u-bridge-address]

=== Setting Bridge in WETH Contract ===
Bridge set in WETH contract

=== Deployment Summary ===
{
  "networks": {
    "u2u": {
      "chainId": 39,
      "name": "U2U Solaris Mainnet",
      "bridgeAddress": "0x[u2u-bridge-address]",
      "wethAddress": "0x[weth-address]",
      "rpcUrl": "https://rpc-mainnet.u2u.xyz",
      "blockExplorer": "https://u2uscan.xyz"
    }
  }
}
```

## 🚀 **Quick Fix Command**

Run this single command to fix and deploy:

```bash
bun add @openzeppelin/contracts && npx --yes hardhat run scripts/deploy.js --network u2u
```

The OpenZeppelin contracts library is required for the ERC20 functionality in our WETH contract! 🔧
