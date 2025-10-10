# U2U Bridge Deployment Guide

This guide explains how to deploy and configure the U2U Solaris Mainnet ↔ Sepolia bridge system.

## Prerequisites

1. **Environment Setup**
   - Node.js 18+ installed
   - MetaMask or compatible wallet
   - U2U tokens on U2U Solaris Mainnet
   - ETH on Sepolia Testnet

2. **Required Environment Variables**
   ```bash
   # Copy from env.example
   cp env.example .env
   
   # Update .env with your values:
   PRIVATE_KEY=your-relayer-private-key
   U2U_RPC_URL=https://rpc-mainnet.u2u.xyz
   SEPOLIA_RPC_URL=https://1rpc.io/sepolia
   ```

## Deployment Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Contracts
```bash
npm run compile
```

### 3. Deploy Contracts

#### Deploy to U2U Solaris Mainnet
```bash
npm run deploy:u2u
```

#### Deploy to Sepolia Testnet
```bash
npm run deploy:sepolia
```

#### Deploy to Both Networks
```bash
npm run deploy:all
```

### 4. Update Contract Addresses

After deployment, update the contract addresses in `lib/addresses.ts`:

```typescript
// Replace the placeholder addresses with actual deployed addresses
export const U2U_BRIDGE_ADDRESS = "0x..."; // From U2U deployment
export const SEPOLIA_BRIDGE_ADDRESS = "0x..."; // From Sepolia deployment
```

### 5. Fund the Sepolia Bridge Contract

The Sepolia bridge contract needs ETH liquidity to process bridge transactions:

```bash
# Send ETH to the Sepolia bridge contract address
# This can be done through MetaMask or any wallet
```

### 6. Test the Bridge

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the relayer:**
   ```bash
   # Test relayer status
   curl http://localhost:3000/api/relayer
   
   # Test bridge functionality (with mock data)
   curl -X POST http://localhost:3000/api/test-relayer \
     -H "Content-Type: application/json" \
     -d '{"testType": "bridge", "amount": "1.0", "recipient": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"}'
   ```

## Bridge Flow

### U2U → Sepolia Bridge Process

1. **User initiates bridge on U2U:**
   - User connects wallet to U2U Solaris Mainnet
   - User calls `bridge()` function on U2U bridge contract
   - Contract emits `BridgeInitiated` event

2. **Relayer processes transaction:**
   - Relayer monitors U2U blockchain for bridge events
   - Relayer validates the U2U transaction
   - Relayer fetches current U2U and ETH prices
   - Relayer calculates equivalent ETH amount
   - Relayer checks liquidity on both chains

3. **ETH delivery on Sepolia:**
   - Relayer calls `completeBridge()` on Sepolia bridge contract
   - Contract sends equivalent ETH to user's address
   - Bridge transaction is marked as completed

## Configuration

### Chain Configuration
- **U2U Solaris Mainnet:** Chain ID 39, RPC: https://rpc-mainnet.u2u.xyz
- **Sepolia Testnet:** Chain ID 11155111, RPC: https://1rpc.io/sepolia

### Pricing
- U2U price: Fetched from CoinGecko API (fallback: $0.006144)
- ETH price: Fetched from CoinGecko API (fallback: $4,327.95)
- Bridge fee: 0.2%

### Liquidity Requirements
The relayer account must have:
- U2U tokens on U2U Solaris Mainnet (for gas fees)
- ETH on Sepolia Testnet (for bridge liquidity)

## Error Handling

The system includes comprehensive error handling:

- **Insufficient U2U liquidity:** "Bridge temporarily unavailable: insufficient liquidity on U2U."
- **Insufficient ETH liquidity:** "Bridge temporarily unavailable: insufficient liquidity on Sepolia."
- **Transaction validation failures:** Detailed error messages for debugging

## Security Considerations

1. **Private Key Security:** Keep the relayer private key secure
2. **Liquidity Management:** Monitor and maintain adequate liquidity
3. **Price Oracle:** Consider implementing multiple price sources
4. **Rate Limiting:** Implement rate limiting for API endpoints
5. **Monitoring:** Set up monitoring for bridge transactions

## Troubleshooting

### Common Issues

1. **"Missing .env configuration"**
   - Ensure all required environment variables are set
   - Check that PRIVATE_KEY is properly formatted

2. **"Insufficient liquidity"**
   - Fund the relayer account with U2U and ETH
   - Check contract balances

3. **"U2U transaction not confirmed"**
   - Wait for U2U transaction confirmation
   - Verify transaction hash is correct

4. **MetaMask connection issues**
   - Use the "Add U2U to MetaMask" button
   - Ensure you're on the correct network

### Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure contracts are deployed and funded
4. Test with small amounts first

## Production Deployment

For production deployment:

1. **Use production RPC URLs**
2. **Implement proper monitoring and alerting**
3. **Set up automated liquidity management**
4. **Implement rate limiting and security measures**
5. **Use multiple price oracles for better accuracy**
6. **Set up proper logging and analytics**
