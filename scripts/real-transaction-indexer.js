#!/usr/bin/env node

/**
 * Real Transaction Indexer for Pocket Swap
 * Indexes actual swap and bridge transactions from your contracts
 */

const { HypersyncClient } = require('@envio-dev/hypersync-client');
const { ethers } = require('ethers');

class RealTransactionIndexer {
  constructor() {
    this.isRunning = false;
    this.stats = {
      totalTransactions: 0,
      swapTransactions: 0,
      bridgeTransactions: 0,
      monadTransactions: 0,
      sepoliaTransactions: 0,
      realEvents: 0,
      indexedBlocks: 0
    };
    
    // Your actual contract addresses
    this.contracts = {
      monadBridge: '0x790f07dF19F95aAbFAed3BfED01c07724c9a6cca',
      sepoliaBridge: '0xe564df234366234b279c9a5d547c94AA4a5C08F3',
      wethContract: '0xdfd0480D0c1f59a0c5eAeadfDE047840F6813623'
    };
    
    this.lastProcessedBlocks = {
      monad: 0,
      sepolia: 0
    };
  }

  async start() {
    console.log('🚀 [ENVIO] Starting REAL Transaction Indexer for Pocket Swap...');
    console.log('📡 [ENVIO] Monitoring your actual bridge contracts...');
    console.log('');

    this.isRunning = true;
    
    try {
      // Initialize HyperSync clients
      await this.initializeClients();
      
      // Start real-time indexing
      this.startRealTimeIndexing();
      
    } catch (error) {
      console.error('❌ [ENVIO] Failed to start indexer:', error);
      this.startFallbackMode();
    }
  }

  async initializeClients() {
    console.log('🔗 [ENVIO] Initializing HyperSync clients...');
    
    // Monad Testnet client
    this.monadClient = HypersyncClient.new({
      url: "https://testnet-rpc.monad.xyz",
    });
    console.log('✅ [ENVIO] Monad Testnet client ready');
    
    // Sepolia Testnet client  
    this.sepoliaClient = HypersyncClient.new({
      url: "https://1rpc.io/sepolia",
    });
    console.log('✅ [ENVIO] Sepolia Testnet client ready');
    
    console.log('📊 [ENVIO] Contract addresses:');
    console.log(`   🌉 Monad Bridge: ${this.contracts.monadBridge}`);
    console.log(`   🔗 Sepolia Bridge: ${this.contracts.sepoliaBridge}`);
    console.log(`   🪙 WETH Contract: ${this.contracts.wethContract}`);
    console.log('');
  }

  startRealTimeIndexing() {
    console.log('📡 [ENVIO] Starting real-time transaction indexing...');
    console.log('🔍 [ENVIO] Monitoring for your actual transactions...');
    console.log('');

    // Index Monad transactions every 10 seconds
    setInterval(async () => {
      if (this.isRunning) {
        await this.indexMonadTransactions();
      }
    }, 10000);

    // Index Sepolia transactions every 12 seconds
    setInterval(async () => {
      if (this.isRunning) {
        await this.indexSepoliaTransactions();
      }
    }, 12000);

    // Log statistics every 30 seconds
    setInterval(() => {
      if (this.isRunning) {
        this.logIndexingStats();
      }
    }, 30000);
  }

  async indexMonadTransactions() {
    try {
      console.log('🌉 [ENVIO] Indexing Monad Testnet transactions...');
      
      // Get latest block
      const latestBlock = await this.monadClient.getHeight();
      const fromBlock = this.lastProcessedBlocks.monad || Math.max(0, latestBlock - 100);
      
      if (fromBlock >= latestBlock) {
        console.log('🔍 [ENVIO] No new Monad blocks to index');
        return;
      }

      // Query for bridge events
      const query = {
        fromBlock: fromBlock,
        toBlock: latestBlock,
        fieldSelection: {
          block: ["number", "timestamp"],
          log: ["address", "topics", "data", "transactionHash", "blockNumber"],
          transaction: ["hash", "from", "to", "value"]
        },
        logs: [
          {
            address: [this.contracts.monadBridge, this.contracts.wethContract],
            topics: [
              ["0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"], // CrossChainTransfer
              ["0x707f7203c46e3610b2091337b7d4d058897f1a9d8365a1695f64891a70c7c7b7"], // WETHMinted
              ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]  // Transfer
            ]
          }
        ]
      };

      const stream = await this.monadClient.stream(query, {});
      
      let eventCount = 0;
      for await (const res of stream) {
        if (res.data && res.data.logs) {
          for (const log of res.data.logs) {
            await this.processMonadEvent(log);
            eventCount++;
          }
        }
        if (res.nextBlock) {
          this.lastProcessedBlocks.monad = Number(res.nextBlock) - 1;
        }
      }
      
      if (eventCount > 0) {
        console.log(`✅ [ENVIO] Indexed ${eventCount} Monad events`);
      }
      
    } catch (error) {
      console.log('⚠️ [ENVIO] Monad indexing error:', error.message);
    }
  }

  async indexSepoliaTransactions() {
    try {
      console.log('🔗 [ENVIO] Indexing Sepolia Testnet transactions...');
      
      // Get latest block
      const latestBlock = await this.sepoliaClient.getHeight();
      const fromBlock = this.lastProcessedBlocks.sepolia || Math.max(0, latestBlock - 100);
      
      if (fromBlock >= latestBlock) {
        console.log('🔍 [ENVIO] No new Sepolia blocks to index');
        return;
      }

      // Query for bridge events
      const query = {
        fromBlock: fromBlock,
        toBlock: latestBlock,
        fieldSelection: {
          block: ["number", "timestamp"],
          log: ["address", "topics", "data", "transactionHash", "blockNumber"],
          transaction: ["hash", "from", "to", "value"]
        },
        logs: [
          {
            address: [this.contracts.sepoliaBridge],
            topics: [
              ["0x4c20d24b0229211d322222222222222222222222222222222222222222222222"] // BridgeCompleted (placeholder)
            ]
          }
        ]
      };

      const stream = await this.sepoliaClient.stream(query, {});
      
      let eventCount = 0;
      for await (const res of stream) {
        if (res.data && res.data.logs) {
          for (const log of res.data.logs) {
            await this.processSepoliaEvent(log);
            eventCount++;
          }
        }
        if (res.nextBlock) {
          this.lastProcessedBlocks.sepolia = Number(res.nextBlock) - 1;
        }
      }
      
      if (eventCount > 0) {
        console.log(`✅ [ENVIO] Indexed ${eventCount} Sepolia events`);
      }
      
    } catch (error) {
      console.log('⚠️ [ENVIO] Sepolia indexing error:', error.message);
    }
  }

  async processMonadEvent(log) {
    this.stats.totalTransactions++;
    this.stats.monadTransactions++;
    this.stats.realEvents++;
    
    const eventType = this.getEventType(log.topics[0]);
    const txHash = log.transactionHash;
    const blockNumber = log.blockNumber;
    const timestamp = new Date().toISOString();
    
    console.log(`🎯 [ENVIO] REAL Monad Event: ${eventType}`);
    console.log(`   📊 TX: ${txHash}`);
    console.log(`   🔢 Block: ${blockNumber}`);
    console.log(`   ⏰ Time: ${timestamp}`);
    console.log(`   📍 Contract: ${log.address}`);
    console.log(`   ✅ Source: Live Blockchain`);
    console.log('');
    
    // Categorize transaction type
    if (eventType === 'CrossChainTransfer') {
      this.stats.bridgeTransactions++;
    } else if (eventType === 'WETHMinted') {
      this.stats.swapTransactions++;
    }
  }

  async processSepoliaEvent(log) {
    this.stats.totalTransactions++;
    this.stats.sepoliaTransactions++;
    this.stats.realEvents++;
    
    const eventType = 'BridgeCompleted';
    const txHash = log.transactionHash;
    const blockNumber = log.blockNumber;
    const timestamp = new Date().toISOString();
    
    console.log(`🎯 [ENVIO] REAL Sepolia Event: ${eventType}`);
    console.log(`   📊 TX: ${txHash}`);
    console.log(`   🔢 Block: ${blockNumber}`);
    console.log(`   ⏰ Time: ${timestamp}`);
    console.log(`   📍 Contract: ${log.address}`);
    console.log(`   ✅ Source: Live Blockchain`);
    console.log('');
    
    this.stats.bridgeTransactions++;
  }

  getEventType(topic) {
    const eventSignatures = {
      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': 'CrossChainTransfer',
      '0x707f7203c46e3610b2091337b7d4d058897f1a9d8365a1695f64891a70c7c7b7': 'WETHMinted',
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer'
    };
    return eventSignatures[topic] || 'Unknown';
  }

  logIndexingStats() {
    console.log('📊 [ENVIO] Real Transaction Indexing Statistics:');
    console.log(`   🔄 Total Transactions: ${this.stats.totalTransactions}`);
    console.log(`   🎯 Real Events: ${this.stats.realEvents}`);
    console.log(`   🌉 Monad Transactions: ${this.stats.monadTransactions}`);
    console.log(`   🔗 Sepolia Transactions: ${this.stats.sepoliaTransactions}`);
    console.log(`   🌉 Bridge Transactions: ${this.stats.bridgeTransactions}`);
    console.log(`   🔄 Swap Transactions: ${this.stats.swapTransactions}`);
    console.log(`   📦 Indexed Blocks: ${this.stats.indexedBlocks}`);
    console.log('📡 [ENVIO] Real-time indexing active...');
    console.log('');
  }

  startFallbackMode() {
    console.log('🔄 [ENVIO] Starting fallback simulation mode...');
    console.log('📝 [ENVIO] This will show simulated events until real transactions occur');
    console.log('');

    // Simulate events every 8-15 seconds
    setInterval(() => {
      if (this.isRunning) {
        this.simulateTransaction();
      }
    }, Math.random() * 7000 + 8000);
  }

  simulateTransaction() {
    const events = ['CrossChainTransfer', 'WETHMinted', 'BridgeCompleted'];
    const event = events[Math.floor(Math.random() * events.length)];
    const txHash = '0x' + Math.random().toString(16).substr(2, 40);
    const blockNumber = Math.floor(Math.random() * 10000) + 10000;
    
    this.stats.totalTransactions++;
    
    if (event === 'CrossChainTransfer' || event === 'WETHMinted') {
      this.stats.monadTransactions++;
    } else {
      this.stats.sepoliaTransactions++;
    }
    
    console.log(`🔄 [ENVIO] Simulated Event: ${event}`);
    console.log(`   📊 TX: ${txHash}`);
    console.log(`   🔢 Block: ${blockNumber}`);
    console.log(`   ⏰ Time: ${new Date().toISOString()}`);
    console.log(`   📝 Source: Simulation (waiting for real transactions)`);
    console.log('');
  }

  stop() {
    console.log('🛑 [ENVIO] Stopping real transaction indexer...');
    this.isRunning = false;
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 [ENVIO] Shutting down real transaction indexer...');
  process.exit(0);
});

// Start the real indexer
const indexer = new RealTransactionIndexer();
indexer.start().catch(console.error);
