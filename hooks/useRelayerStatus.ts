"use client"
import { useState, useEffect } from 'react'

interface RelayerStatus {
  success: boolean
  relayerAddress: string
  chains: {
    monad: {
      chainId: number
      name: string
      balance: number
      balanceUSD: number
      symbol: string
    }
    sepolia: {
      chainId: number
      name: string
      balance: number
      balanceUSD: number
      symbol: string
    }
  }
  prices: {
    monad: number
    eth: number
  }
  status: string
}

export function useRelayerStatus() {
  const [relayerStatus, setRelayerStatus] = useState<RelayerStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRelayerStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/relayer')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Relayer status response:', data)
      
      if (data.success && data.chains && data.chains.monad && data.chains.sepolia) {
        setRelayerStatus(data)
      } else {
        console.error('Invalid relayer response format:', data)
        setError(data.error || 'Invalid relayer response format')
      }
    } catch (err) {
      console.error('Relayer status fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRelayerStatus()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchRelayerStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    relayerStatus,
    isLoading,
    error,
    refetch: fetchRelayerStatus
  }
}
