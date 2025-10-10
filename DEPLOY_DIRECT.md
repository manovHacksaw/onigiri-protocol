# 🚀 Direct Deployment Command

## 🐛 Issue Identified

The shell environment has permission issues with stdin. The `--yes` flag should fix the Hardhat prompt issue.

## 🎯 Run This Command

**Open a fresh terminal** and run this exact command:

```bash
cd /home/manov/Desktop/code/pocket-protocol && hardhat run scripts/deploy.js --network u2u --yes
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

1. **Copy the bridge addresses** from the JSON output
2. **Paste them here** and I'll:
   - Update `lib/addresses.ts` with the new addresses
   - Configure the relayer
   - Test the bridge functionality

## 🛠️ What's Fixed

- ✅ **Compilation**: Contracts compile successfully
- ✅ **Environment**: .env file loaded correctly
- ✅ **Account**: Deployer account detected
- ✅ **Script**: Fixed ethers v5 syntax
- ✅ **Prompt**: Added `--yes` flag to skip Hardhat analytics prompt

The deployment should work now! Try the direct command above.
