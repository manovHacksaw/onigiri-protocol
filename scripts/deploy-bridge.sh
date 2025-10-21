#!/bin/bash

echo "🚀 Deploying Bridge Contracts for ETH → WETH"
echo "=============================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with:"
    echo "MONAD_RPC_URL=https://testnet-rpc.monad.xyz"
    echo "SEPOLIA_RPC_URL=https://1rpc.io/sepolia"
    echo "PRIVATE_KEY=your-relayer-private-key"
    exit 1
fi

# Install required dependencies
echo "📦 Installing OpenZeppelin contracts..."
bun add @openzeppelin/contracts

echo "📋 Deploying to Monad Testnet..."
echo "--------------------------------"
npx --yes hardhat run scripts/deploy.js --network monad

echo ""
echo "📋 Deploying to Sepolia Testnet..."
echo "----------------------------------"
npx --yes hardhat run scripts/deploy.js --network sepolia

echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo ""
echo "Next Steps:"
echo "1. Update lib/addresses.ts with deployed addresses"
echo "2. Update app/api/relayer/route.ts with bridge address"
echo "3. Fund the Sepolia bridge contract with ETH"
echo "4. Test the ETH → WETH bridge functionality"
echo ""
echo "🎉 Bridge infrastructure is ready!"
