# 🚀 Deploy Now - Fixed Script

## ✅ Issue Fixed

The deployment script had a small ethers v5 syntax issue. I've fixed it:
- Changed `deployer.getBalance()` to `deployer.provider.getBalance(deployer.address)`

## 🎯 Run These Commands

Open a **fresh terminal** and run:

```bash
cd /home/manov/Desktop/code/pocket-protocol

# Deploy to U2U Solaris Mainnet
bun run deploy:u2u
```

## 📊 Expected Output

You should see:
```
Starting deployment...
Deploying contracts with account: 0x7532Ff2586E7dAc95946A66134d669C4cAf8FD7D
Account balance: [your balance in wei]

=== Deploying U2U Bridge ===
U2U Bridge deployed to: 0x[contract address]

=== Deploying Sepolia Bridge ===
Sepolia Bridge deployed to: 0x[contract address]

=== Deployment Summary ===
{
  "networks": {
    "u2u": {
      "chainId": 39,
      "name": "U2U Solaris Mainnet",
      "bridgeAddress": "0x[U2U bridge address]",
      "rpcUrl": "https://rpc-mainnet.u2u.xyz",
      "blockExplorer": "https://u2uscan.xyz"
    },
    "sepolia": {
      "chainId": 11155111,
      "name": "Sepolia Testnet", 
      "bridgeAddress": "0x[Sepolia bridge address]",
      "rpcUrl": "https://1rpc.io/sepolia",
      "blockExplorer": "https://sepolia.etherscan.io"
    }
  },
  "deployer": "0x7532Ff2586E7dAc95946A66134d669C4cAf8FD7D",
  "timestamp": "2024-..."
}
```

## 🔄 After Deployment

1. **Copy the bridge addresses** from the output
2. **Paste them here** and I'll:
   - Update `lib/addresses.ts` with the new addresses
   - Configure the relayer
   - Test the bridge functionality

## 🛠️ What's Fixed

- ✅ **Compilation**: Contracts compile successfully
- ✅ **Environment**: .env file loaded correctly
- ✅ **Account**: Deployer account detected (0x7532Ff2586E7dAc95946A66134d669C4cAf8FD7D)
- ✅ **Script**: Fixed ethers v5 syntax issue

The deployment should work now! Try running `bun run deploy:u2u` in a fresh terminal.
