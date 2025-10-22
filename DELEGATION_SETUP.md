# MetaMask Delegation Setup

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# WalletConnect Project ID (optional - get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id

# Pimlico Configuration
PIMLICO_API_KEY=pim_Q4eNC7jUqJX851hdnJVrs5
NEXT_PUBLIC_PIMLICO_API_KEY=pim_Q4eNC7jUqJX851hdnJVrs5

# Smart Account Configuration
NEXT_PUBLIC_ENTRYPOINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
NEXT_PUBLIC_FACTORY_ADDRESS=0x9406Cc6185a346906296840746125a0E44976454

# Bridge Contract Addresses
NEXT_PUBLIC_MONAD_BRIDGE_ADDRESS=0x790f07dF19F95aAbFAed3BfED01c07724c9a6cca
NEXT_PUBLIC_SEPOLIA_BRIDGE_ADDRESS=0xe564df234366234b279c9a5d547c94AA4a5C08F3
NEXT_PUBLIC_WETH_ADDRESS=0xdfd0480D0c1f59a0c5eAeadfDE047840F6813623

# Chain IDs
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_SEPOLIA_CHAIN_ID=11155111

# RPC URLs
U2U_RPC_URL=https://rpc-mainnet.u2u.xyz
SEPOLIA_RPC_URL=https://1rpc.io/sepolia
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_U2U_RPC_URL=https://rpc-mainnet.u2u.xyz
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://1rpc.io/sepolia

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Relayer private key for automatic bridging (keep this secure!)
PRIVATE_KEY=a1f488592e4701289c173203d6d4b1f7583d3be37d08bf39a58f2875d167e5e6

# Delegator private key (same as relayer for consistency)
DELEGATE_PRIVATE_KEY=a1f488592e4701289c173203d6d4b1f7583d3be37d08bf39a58f2875d167e5e6

# Database/Storage (for delegation storage)
MONGODB_URI=mongodb+srv://manovmandal:qwerty123@test.kcd3ksw.mongodb.net/?retryWrites=true&w=majority&appName=test

# Session Management
SESSION_PASSWORD=your-super-secret-session-password-change-this-in-production

# Cron Jobs (for automation)
CRON_SECRET=your-secure-cron-secret-for-automation
```

## Getting API Keys

1. **Pimlico API Key**: `pim_Q4eNC7jUqJX851hdnJVrs5` (already configured)
2. **WalletConnect Project ID**: Create a project at https://cloud.walletconnect.com
3. **MongoDB URI**: `mongodb+srv://manovmandal:qwerty123@test.kcd3ksw.mongodb.net/...` (already configured)

## Installation

Run the following command to install the new dependencies:

```bash
bun install
```

## Key Configuration Notes

- **Delegator Private Key**: Same as relayer key for consistency (`a1f488592e4701289c173203d6d4b1f7583d3be37d08bf39a58f2875d167e5e6`)
- **Pimlico API Key**: `pim_Q4eNC7jUqJX851hdnJVrs5` (for gasless transactions)
- **MongoDB URI**: Your existing database connection
- **Session Password**: Change in production for security
- **Cron Secret**: For automated keeper services

## Security Considerations

- **Private Keys**: Keep secure and never expose in client-side code
- **Session Password**: Use a strong, random password in production
- **Database**: Ensure MongoDB connection is secure
- **API Keys**: Rotate regularly for security