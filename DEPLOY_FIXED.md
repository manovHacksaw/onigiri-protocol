# Fixed Deployment Commands

## ✅ ESM Issue Fixed

I've updated the project to use ESM modules as required by Hardhat v6:

- ✅ Added `"type": "module"` to package.json
- ✅ Converted deploy.js to ESM format (`import` instead of `require`)
- ✅ Updated hardhat.config.js to ESM format

## 🚀 Run These Commands

```bash
cd /home/manov/Desktop/code/pocket-protocol

# 1. Compile contracts
bun run compile

# 2. Deploy to U2U Solaris Mainnet
bun run deploy:u2u

# 3. Deploy to Sepolia Testnet
bun run deploy:sepolia
```

## 📊 Expected Output

You should see:
```
Starting deployment...
Deploying contracts with account: 0x...
Account balance: ...

=== Deploying U2U Bridge ===
U2U Bridge deployed to: 0x...

=== Deploying Sepolia Bridge ===
Sepolia Bridge deployed to: 0x...

=== Deployment Summary ===
{
  "networks": {
    "u2u": {
      "chainId": 39,
      "name": "U2U Solaris Mainnet",
      "bridgeAddress": "0x...",
      "rpcUrl": "https://rpc-mainnet.u2u.xyz",
      "blockExplorer": "https://u2uscan.xyz"
    },
    "sepolia": {
      "chainId": 11155111,
      "name": "Sepolia Testnet",
      "bridgeAddress": "0x...",
      "rpcUrl": "https://1rpc.io/sepolia",
      "blockExplorer": "https://sepolia.etherscan.io"
    }
  },
  "deployer": "0x...",
  "timestamp": "2024-..."
}
```

## 🔄 After Deployment

1. **Copy the bridge addresses** from the output above
2. **Paste them here** and I'll:
   - Update `lib/addresses.ts` with the new addresses
   - Configure the relayer
   - Test the bridge functionality

## 🛠️ If You Still Get Errors

If you get "no space left on device":
```bash
# Free up space
sudo apt clean
sudo apt autoremove
df -h
```

If you get module errors:
```bash
# Clear cache and reinstall
rm -rf node_modules
bun install
```

The ESM issue is now fixed! Try running the deployment commands above.
