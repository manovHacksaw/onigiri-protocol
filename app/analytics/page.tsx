"use client"

import { Navbar } from "@/components/navbar";
import { BokehBackground } from "@/components/ui/bokeh-background";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Activity, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState, useEffect } from "react";

interface BridgeStats {
  totalVolume: number;
  totalTransactions: number;
  successRate: number;
  chains: {
    monad: { events: number };
    sepolia: { events: number };
  };
}

interface Transaction {
  chain: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  event: string;
  data: string;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<BridgeStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/analytics?includeTransactions=true&includeVolume=true');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setTransactions(data.transactions || []);
      } else {
        setError(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchAnalytics();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (error) {
    return (
      <main className="min-h-[100svh] relative">
        <Navbar />
        <BokehBackground />
        <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 md:pt-28">
          <div className="text-center">
            <div className="text-sm text-destructive mb-4">Failed to load analytics</div>
            <div className="text-xs text-muted-foreground mb-4">Error: {error}</div>
            <Button onClick={fetchAnalytics} className="mr-2">
              Retry
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Pause Auto-refresh' : 'Resume Auto-refresh'}
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] relative">
      <Navbar />
      <BokehBackground />

      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 md:pt-28">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Bridge Analytics</h1>
              <p className="text-muted-foreground mt-2">
                Real-time cross-chain bridge metrics powered by Envio HyperSync
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-500/20 text-green-400' : ''}
              >
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </Button>
              <Button onClick={fetchAnalytics} disabled={isLoading}>
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 border border-white/10 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Volume</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalVolume)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <div className="flex items-center mt-2 text-green-400">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  <span className="text-sm">+12.5%</span>
                </div>
              </Card>

              <Card className="p-6 border border-white/10 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold">{formatNumber(stats.totalTransactions)}</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-400" />
                </div>
                <div className="flex items-center mt-2 text-blue-400">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  <span className="text-sm">+8.2%</span>
                </div>
              </Card>

              <Card className="p-6 border border-white/10 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
                <div className="flex items-center mt-2 text-green-400">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  <span className="text-sm">+2.1%</span>
                </div>
              </Card>

              <Card className="p-6 border border-white/10 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Chains</p>
                    <p className="text-2xl font-bold">2</p>
                  </div>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white border-2 border-background">
                      MON
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-xs font-semibold text-white border-2 border-background">
                      ETH
                    </div>
                  </div>
                </div>
                <div className="flex items-center mt-2 text-muted-foreground">
                  <span className="text-sm">Monad + Sepolia</span>
                </div>
              </Card>
            </div>
          )}

          {/* Chain Breakdown */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border border-white/10 bg-card/50 backdrop-blur">
                <h3 className="text-lg font-semibold mb-4">Chain Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white">
                        MON
                      </div>
                      <span className="font-medium">Monad Testnet</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stats.chains.monad.events} events
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-xs font-semibold text-white">
                        ETH
                      </div>
                      <span className="font-medium">Sepolia Testnet</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stats.chains.sepolia.events} events
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-white/10 bg-card/50 backdrop-blur">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          tx.chain === 'monad' ? 'bg-blue-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{tx.event}</p>
                          <p className="text-xs text-muted-foreground">
                            {tx.chain} • Block {tx.blockNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </p>
                        <p className="text-xs font-mono">
                          {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-8)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Envio Integration Info */}
          <Card className="p-6 border border-white/10 bg-card/50 backdrop-blur">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-semibold text-white">
                E
              </div>
              <h3 className="text-lg font-semibold">Envio HyperSync Integration</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-2">Real-time Data Streaming</p>
                <p className="text-xs">Indexing bridge events across Monad and Sepolia networks</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Cross-chain Correlation</p>
                <p className="text-xs">Tracking transaction pairs and bridge completion status</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Analytics Dashboard</p>
                <p className="text-xs">Live metrics powered by HyperSync data streams</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Event Monitoring</p>
                <p className="text-xs">CrossChainTransfer, WETHMinted, BridgeCompleted events</p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
