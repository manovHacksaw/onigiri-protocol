import { HypersyncClient } from '@envio-dev/hypersync-client';

// HyperSync client configuration for cross-chain bridge indexing
export class BridgeHyperSync {
  private monadClient: any;
  private sepoliaClient: any;

  constructor() {
    // Initialize HyperSync clients for both networks
    this.monadClient = HypersyncClient.new({
      url: "https://testnet-rpc.monad.xyz", // Monad Testnet
    });

    this.sepoliaClient = HypersyncClient.new({
      url: "https://1rpc.io/sepolia", // Sepolia Testnet
    });
  }

  // Index bridge events from Monad Testnet
  async indexMonadBridgeEvents(fromBlock?: number) {
    const query = {
      fromBlock: fromBlock || 0,
      toBlock: null, // Stream to latest
      logs: [
        {
          address: "0x790f07dF19F95aAbFAed3BfED01c07724c9a6cca", // MONAD_BRIDGE_ADDRESS
          topics: [
            "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925", // CrossChainTransfer event
            "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0", // WETHMinted event
          ],
        },
        {
          address: "0xdfd0480D0c1f59a0c5eAeadfDE047840F6813623", // WETH_MONAD_ADDRESS
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Transfer event
          ],
        },
      ],
    };

    return this.monadClient.stream(query, {});
  }

  // Index bridge events from Sepolia
  async indexSepoliaBridgeEvents(fromBlock?: number) {
    const query = {
      fromBlock: fromBlock || 0,
      toBlock: null, // Stream to latest
      logs: [
        {
          address: "0xe564df234366234b279c9a5d547c94AA4a5C08F3", // SEPOLIA_BRIDGE_ADDRESS
          topics: [
            "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925", // BridgeCompleted event
          ],
        },
      ],
    };

    return this.sepoliaClient.stream(query, {});
  }

  // Get bridge transaction by hash across both chains
  async getBridgeTransaction(monadTxHash: string, sepoliaTxHash?: string) {
    const monadTx = await this.monadClient.getTransaction(monadTxHash);
    const sepoliaTx = sepoliaTxHash ? await this.sepoliaClient.getTransaction(sepoliaTxHash) : null;
    
    return {
      monad: monadTx,
      sepolia: sepoliaTx,
      correlation: {
        isCrossChain: !!sepoliaTx,
        direction: sepoliaTx ? 'monad-to-sepolia' : 'sepolia-to-monad',
      }
    };
  }

  // Get bridge statistics
  async getBridgeStats() {
    const monadStream = await this.indexMonadBridgeEvents();
    const sepoliaStream = await this.indexSepoliaBridgeEvents();
    
    let totalVolume = 0;
    let totalTransactions = 0;
    let successRate = 0;
    
    // Process Monad events
    while (true) {
      const monadRes = await monadStream.recv();
      if (monadRes.data && monadRes.data.logs) {
        totalTransactions += monadRes.data.logs.length;
        // Calculate volume from event data
        monadRes.data.logs.forEach((log: any) => {
          if (log.topics[0] === "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925") {
            // CrossChainTransfer event - extract amount
            const amount = BigInt(log.data);
            totalVolume += Number(amount) / 1e18; // Convert from wei
          }
        });
      }
      if (monadRes.nextBlock) break;
    }
    
    // Process Sepolia events
    while (true) {
      const sepoliaRes = await sepoliaStream.recv();
      if (sepoliaRes.data && sepoliaRes.data.logs) {
        totalTransactions += sepoliaRes.data.logs.length;
      }
      if (sepoliaRes.nextBlock) break;
    }
    
    return {
      totalVolume,
      totalTransactions,
      successRate: totalTransactions > 0 ? (totalTransactions / totalTransactions) * 100 : 0,
      chains: {
        monad: { events: totalTransactions / 2 },
        sepolia: { events: totalTransactions / 2 }
      }
    };
  }
}

// Export singleton instance
export const bridgeHyperSync = new BridgeHyperSync();
