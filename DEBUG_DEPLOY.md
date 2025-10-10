# Debug and Deploy Guide

## 🐛 Shell Environment Issue

The shell environment has a persistent issue with bash configuration. Here's how to debug and deploy manually:

## 🔧 Debug Steps

### 1. Check Shell Environment
```bash
# Open a fresh terminal
cd /home/manov/Desktop/code/pocket-protocol

# Check if bun is installed
bun --version

# Check if hardhat is available
npx hardhat --version

# Check disk space
df -h
```

### 2. Fix Shell Issues (if needed)
```bash
# Reset bash configuration
cp ~/.bashrc ~/.bashrc.backup
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 3. Clean and Install
```bash
# Clean everything
rm -rf node_modules .next cache artifacts
rm -rf ~/.npm/_npx ~/.npm/_cacache

# Install with bun
bun install
```

## 🚀 Manual Deployment Commands

### Step 1: Compile
```bash
bun run compile
```

**Expected output:**
```
Compiling 2 files with 0.8.19
Compilation finished successfully
```

### Step 2: Deploy to U2U
```bash
bun run deploy:u2u
```

**Expected output:**
```
Starting deployment...
Deploying contracts with account: 0x...
Account balance: ...

=== Deploying U2U Bridge ===
U2U Bridge deployed to: 0x...
```

### Step 3: Deploy to Sepolia
```bash
bun run deploy:sepolia
```

**Expected output:**
```
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

## 🐛 Common Issues & Solutions

### Issue 1: "No space left on device"
```bash
# Free up space
sudo apt clean
sudo apt autoremove
sudo apt autoclean
df -h
```

### Issue 2: "Hardhat only supports ESM projects"
✅ **Already fixed** - Added `"type": "module"` to package.json

### Issue 3: "Cannot find module"
```bash
# Clear cache and reinstall
rm -rf node_modules
bun install
```

### Issue 4: "Network not found"
```bash
# Check .env file exists and has correct values
cat .env
```

### Issue 5: "Insufficient funds"
- Make sure the deployer account has U2U tokens on U2U Solaris
- Make sure the deployer account has ETH on Sepolia

## 🔄 After Successful Deployment

1. **Copy the bridge addresses** from the deployment output
2. **Paste them here** and I'll:
   - Update `lib/addresses.ts` with the new addresses
   - Configure the relayer
   - Test the bridge functionality

## 📋 Quick Test Commands

After deployment, test with:
```bash
# Test relayer status
curl http://localhost:3000/api/relayer

# Test bridge functionality
bun run test:bridge
```

## 🆘 If All Else Fails

If you continue having issues, try:
```bash
# Use npm instead of bun
npm install
npm run compile
npm run deploy:u2u
npm run deploy:sepolia
```

The deployment should work now with the ESM fixes I made!
