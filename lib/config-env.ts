// Environment Configuration
// Centralized configuration for all environment variables

export const ENV_CONFIG = {
  // Pimlico Configuration
  PIMLICO_API_KEY: process.env.NEXT_PUBLIC_PIMLICO_API_KEY || "pim_Q4eNC7jUqJX851hdnJVrs5",
  
  // Private Keys (same for consistency)
  RELAYER_PRIVATE_KEY: process.env.PRIVATE_KEY || "a1f488592e4701289c173203d6d4b1f7583d3be37d08bf39a58f2875d167e5e6",
  DELEGATE_PRIVATE_KEY: process.env.DELEGATE_PRIVATE_KEY || "a1f488592e4701289c173203d6d4b1f7583d3be37d08bf39a58f2875d167e5e6",
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || "mongodb+srv://manovmandal:qwerty123@test.kcd3ksw.mongodb.net/?retryWrites=true&w=majority&appName=test",
  
  // Smart Account Configuration
  ENTRYPOINT_ADDRESS: process.env.NEXT_PUBLIC_ENTRYPOINT_ADDRESS || "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  FACTORY_ADDRESS: process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x9406Cc6185a346906296840746125a0E44976454",
  
  // Bridge Contract Addresses
  MONAD_BRIDGE_ADDRESS: process.env.NEXT_PUBLIC_MONAD_BRIDGE_ADDRESS || "0x790f07dF19F95aAbFAed3BfED01c07724c9a6cca",
  SEPOLIA_BRIDGE_ADDRESS: process.env.NEXT_PUBLIC_SEPOLIA_BRIDGE_ADDRESS || "0xe564df234366234b279c9a5d547c94AA4a5C08F3",
  WETH_ADDRESS: process.env.NEXT_PUBLIC_WETH_ADDRESS || "0xdfd0480D0c1f59a0c5eAeadfDE047840F6813623",
  
  // Chain IDs
  MONAD_CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID || "10143"),
  SEPOLIA_CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_SEPOLIA_CHAIN_ID || "11155111"),
  
  // RPC URLs
  MONAD_RPC_URL: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz",
  SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL || "https://1rpc.io/sepolia",
  U2U_RPC_URL: process.env.U2U_RPC_URL || "https://rpc-mainnet.u2u.xyz",
  
  // Base URL
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  
  // Session Management
  SESSION_PASSWORD: process.env.SESSION_PASSWORD || "your-super-secret-session-password-change-this-in-production",
  CRON_SECRET: process.env.CRON_SECRET || "your-secure-cron-secret-for-automation",
  
  // WalletConnect
  WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "your-walletconnect-project-id"
};

// Validation function
export function validateEnvironment() {
  const required = [
    'PIMLICO_API_KEY',
    'MONGODB_URI',
    'RELAYER_PRIVATE_KEY',
    'DELEGATE_PRIVATE_KEY'
  ];
  
  const missing = required.filter(key => !ENV_CONFIG[key as keyof typeof ENV_CONFIG]);
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing environment variables:', missing);
  }
  
  return missing.length === 0;
}

// Log configuration (for debugging)
export function logConfiguration() {
  console.log('🔧 [CONFIG] Environment Configuration:');
  console.log('📦 [CONFIG] Pimlico API Key:', ENV_CONFIG.PIMLICO_API_KEY.slice(0, 10) + '...');
  console.log('🗄️ [CONFIG] MongoDB URI:', ENV_CONFIG.MONGODB_URI.slice(0, 30) + '...');
  console.log('🔑 [CONFIG] Private Key:', ENV_CONFIG.RELAYER_PRIVATE_KEY.slice(0, 10) + '...');
  console.log('🌉 [CONFIG] Monad Bridge:', ENV_CONFIG.MONAD_BRIDGE_ADDRESS);
  console.log('🔗 [CONFIG] Sepolia Bridge:', ENV_CONFIG.SEPOLIA_BRIDGE_ADDRESS);
  console.log('🏭 [CONFIG] Factory Address:', ENV_CONFIG.FACTORY_ADDRESS);
  console.log('📍 [CONFIG] EntryPoint Address:', ENV_CONFIG.ENTRYPOINT_ADDRESS);
}
