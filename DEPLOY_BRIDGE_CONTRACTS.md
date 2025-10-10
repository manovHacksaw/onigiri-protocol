# 🚀 Deploy Bridge Contracts

## 📋 Prerequisites

1. **Environment Variables**: Make sure you have `.env` file with:
   ```
   U2U_RPC_URL=https://rpc-mainnet.u2u.xyz
   SEPOLIA_RPC_URL=https://1rpc.io/sepolia
   PRIVATE_KEY=your-relayer-private-key
   RELAYER_ADDRESS=your-relayer-address (optional, defaults to deployer)
   ```

2. **U2U Balance**: Ensure your deployer account has U2U for gas fees
3. **Sepolia ETH**: Ensure your deployer account has Sepolia ETH for gas fees

## 🏗️ Deployment Commands

### **Step 1: Deploy to U2U Solaris Mainnet**
```bash
npx --yes hardhat run scripts/deploy.js --network u2u
```

**Expected Output:**
```
Starting deployment...
Deploying contracts with account: 0x[your-address]
Account balance: [balance] U2U
Using relayer address: 0x[relayer-address]

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
  },
  "relayer": "0x[relayer-address]",
  "deployer": "0x[deployer-address]",
  "timestamp": "[timestamp]"
}
```

### **Step 2: Deploy to Sepolia Testnet**
```bash
npx --yes hardhat run scripts/deploy.js --network sepolia
```

**Expected Output:**
```
Starting deployment...
Deploying contracts with account: 0x[your-address]
Account balance: [balance] ETH
Using relayer address: 0x[relayer-address]

=== Deploying WETH Contract ===
WETH deployed to: 0x[weth-address]

=== Deploying U2U Bridge ===
U2U Bridge deployed to: 0x[u2u-bridge-address]

=== Setting Bridge in WETH Contract ===
Bridge set in WETH contract

=== Deploying Sepolia Bridge ===
Sepolia Bridge deployed to: 0x[sepolia-bridge-address]

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
    },
    "sepolia": {
      "chainId": 11155111,
      "name": "Sepolia Testnet",
      "bridgeAddress": "0x[sepolia-bridge-address]",
      "rpcUrl": "https://1rpc.io/sepolia",
      "blockExplorer": "https://sepolia.etherscan.io"
    }
  },
  "relayer": "0x[relayer-address]",
  "deployer": "0x[deployer-address]",
  "timestamp": "[timestamp]"
}
```

## 🔍 Verification Commands

After deployment, verify the contracts:

```bash
# Verify WETH on U2U
npx hardhat verify --network u2u 0x[weth-address]

# Verify U2U Bridge on U2U
npx hardhat verify --network u2u 0x[u2u-bridge-address] "0x[weth-address]" "0x[relayer-address]"

# Verify Sepolia Bridge on Sepolia
npx hardhat verify --network sepolia 0x[sepolia-bridge-address] "0x[relayer-address]"
```

## 📝 Update Configuration

After successful deployment, update these files:

### **1. lib/addresses.ts**
```typescript
// U2U Solaris Mainnet
export const U2U_BRIDGE_ADDRESS = "0x[u2u-bridge-address]";
export const WETH_U2U_ADDRESS = "0x[weth-address]";

// Sepolia Testnet
export const SEPOLIA_BRIDGE_ADDRESS = "0x[sepolia-bridge-address]";
```

### **2. app/api/relayer/route.ts**
Update the bridge address in the relayer:
```typescript
const bridgeAddress = "0x[u2u-bridge-address]"; // Replace placeholder
```

## 🧪 Test the Bridge

1. **Fund Sepolia Bridge**: Send some ETH to the Sepolia bridge contract for liquidity
2. **Test Bridge**: Try bridging ETH from Sepolia to WETH on U2U
3. **Check WETH Balance**: Verify WETH tokens are minted on U2U

## 🎯 Expected Results

- ✅ WETH contract deployed on U2U
- ✅ U2U Bridge deployed with WETH integration
- ✅ Sepolia Bridge deployed with relayer support
- ✅ All contracts verified on block explorers
- ✅ Bridge ready for ETH → WETH transfers

Run these commands in your terminal to deploy the complete bridge infrastructure! 🚀
