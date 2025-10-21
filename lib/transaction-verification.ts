import { createPublicClient, http, parseEther } from 'viem'
import { sepolia } from 'viem/chains'

// Monad Testnet chain configuration
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
}

export interface TransactionVerificationResult {
  success: boolean
  receipt?: any
  error?: string
  confirmations?: number
}

export interface TransactionVerificationOptions {
  hash: string
  chainId: number
  requiredConfirmations?: number
  timeoutMs?: number
}

/**
 * Verifies a transaction by checking its status and confirmations
 */
export async function verifyTransaction({
  hash,
  chainId,
  requiredConfirmations = 1,
  timeoutMs = 60000 // 60 seconds timeout
}: TransactionVerificationOptions): Promise<TransactionVerificationResult> {
  try {
    // Create the appropriate client based on chain
    const client = createPublicClient({
      chain: chainId === 11155111 ? sepolia : monadTestnet,
      transport: http()
    })

    console.log(`🔍 Verifying transaction ${hash} on chain ${chainId}...`)

    // Wait for transaction receipt with timeout
    const receipt = await Promise.race([
      client.waitForTransactionReceipt({
        hash: hash as `0x${string}`,
        confirmations: requiredConfirmations,
        timeout: timeoutMs
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction verification timeout')), timeoutMs)
      )
    ]) as any

    if (!receipt) {
      return {
        success: false,
        error: 'No receipt received'
      }
    }

    // Check if transaction was successful
    if (receipt.status !== 'success') {
      return {
        success: false,
        error: 'Transaction failed on-chain',
        receipt
      }
    }

    console.log(`✅ Transaction ${hash} verified successfully with ${receipt.confirmations || 1} confirmations`)

    return {
      success: true,
      receipt,
      confirmations: receipt.confirmations || 1
    }

  } catch (error) {
    console.error(`❌ Transaction verification failed for ${hash}:`, error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown verification error'
    }
  }
}

/**
 * Gets transaction details from blockchain
 */
export async function getTransactionDetails(hash: string, chainId: number) {
  try {
    const client = createPublicClient({
      chain: chainId === 11155111 ? sepolia : monadTestnet,
      transport: http()
    })

    const tx = await client.getTransaction({
      hash: hash as `0x${string}`
    })

    return {
      success: true,
      transaction: tx
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get transaction details'
    }
  }
}

/**
 * Gets the explorer URL for a transaction
 */
export function getExplorerUrl(hash: string, chainId: number): string {
  if (chainId === 11155111) {
    return `https://sepolia.etherscan.io/tx/${hash}`
  } else if (chainId === 10143) {
    return `https://testnet.monadexplorer.com/tx/${hash}`
  }
  return ''
}

/**
 * Gets the chain name for display
 */
export function getChainDisplayName(chainId: number): string {
  if (chainId === 11155111) {
    return 'Sepolia Testnet'
  } else if (chainId === 10143) {
    return 'Monad Testnet'
  }
  return `Chain ${chainId}`
}
