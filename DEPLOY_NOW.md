# Deploy Contracts Now

## Quick Deployment Commands

Since the shell environment has issues, run these commands manually in your terminal:

### 1. Clean and Install Dependencies
```bash
cd /home/manov/Desktop/code/pocket-protocol
rm -rf node_modules .next cache artifacts
bun install
```

### 2. Compile Contracts
```bash
bun run compile
```

### 3. Deploy to U2U Solaris Mainnet
```bash
bun run deploy:u2u
```

### 4. Deploy to Sepolia Testnet
```bash
bun run deploy:sepolia
```

## Expected Output

After deployment, you should see output like:
```
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

## After Deployment

1. **Copy the bridge addresses** from the deployment output
2. **Paste them here** and I'll update `lib/addresses.ts` automatically
3. **Fund the Sepolia bridge** with ETH for liquidity
4. **Test the bridge** functionality

## Environment Setup

The `.env` file is already created with:
- `PRIVATE_KEY=a1f488592e4701289c173203d6d4b1f7583d3be37d08bf39a58f2875d167e5e6`
- `U2U_RPC_URL=https://rpc-mainnet.u2u.xyz`
- `SEPOLIA_RPC_URL=https://1rpc.io/sepolia`

## Troubleshooting

If you get "no space left on device":
```bash
# Free up space
sudo apt clean
sudo apt autoremove
df -h  # Check available space
```

If bun is not installed:
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

## Next Steps

Once deployed, I'll:
1. Update contract addresses in the codebase
2. Configure the relayer with new addresses
3. Test the bridge functionality
4. Provide verification commands
