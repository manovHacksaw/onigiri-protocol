#!/bin/bash

echo "🚀 Starting U2U Bridge Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

echo "✅ Environment check passed"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Compile contracts
echo "🔨 Compiling contracts..."
bun run compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

echo "✅ Compilation successful"

# Deploy to U2U
echo "🌉 Deploying to U2U Solaris Mainnet..."
bun run deploy:u2u

if [ $? -ne 0 ]; then
    echo "❌ U2U deployment failed"
    exit 1
fi

echo "✅ U2U deployment successful"

# Deploy to Sepolia
echo "🔗 Deploying to Sepolia Testnet..."
bun run deploy:sepolia

if [ $? -ne 0 ]; then
    echo "❌ Sepolia deployment failed"
    exit 1
fi

echo "✅ Sepolia deployment successful"
echo "🎉 All deployments completed!"
