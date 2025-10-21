import { useState, useEffect, useCallback } from 'react';
import { bridgeHyperSync } from '@/lib/hypersync';

export interface BridgeTransaction {
  chain: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  event: string;
  data: string;
}

export interface BridgeStats {
  totalVolume: number;
  totalTransactions: number;
  successRate: number;
  chains: {
    monad: { events: number };
    sepolia: { events: number };
  };
}

export function useHyperSync() {
  const [stats, setStats] = useState<BridgeStats | null>(null);
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const stats = await bridgeHyperSync.getBridgeStats();
      setStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (limit = 50) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const monadStream = await bridgeHyperSync.indexMonadBridgeEvents();
      const sepoliaStream = await bridgeHyperSync.indexSepoliaBridgeEvents();
      
      const allTransactions: BridgeTransaction[] = [];
      let count = 0;
      
      // Process Monad transactions
      while (count < limit / 2) {
        const monadRes = await monadStream.recv();
        if (monadRes.data && monadRes.data.logs) {
          monadRes.data.logs.forEach((log: any) => {
            if (count < limit / 2) {
              allTransactions.push({
                chain: 'monad',
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date().toISOString(),
                event: 'CrossChainTransfer',
                data: log.data
              });
              count++;
            }
          });
        }
        if (monadRes.nextBlock) break;
      }
      
      // Process Sepolia transactions
      while (count < limit) {
        const sepoliaRes = await sepoliaStream.recv();
        if (sepoliaRes.data && sepoliaRes.data.logs) {
          sepoliaRes.data.logs.forEach((log: any) => {
            if (count < limit) {
              allTransactions.push({
                chain: 'sepolia',
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date().toISOString(),
                event: 'BridgeCompleted',
                data: log.data
              });
              count++;
            }
          });
        }
        if (sepoliaRes.nextBlock) break;
      }
      
      setTransactions(allTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTransactionDetails = useCallback(async (monadTxHash: string, sepoliaTxHash?: string) => {
    try {
      const details = await bridgeHyperSync.getBridgeTransaction(monadTxHash, sepoliaTxHash);
      return details;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction details');
      return null;
    }
  }, []);

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    transactions,
    isLoading,
    error,
    fetchStats,
    fetchTransactions,
    getTransactionDetails,
  };
}
