#!/usr/bin/env node

/**
 * HyperSync Sepolia Testnet Indexer
 * Streams bridge events from Sepolia Testnet using Envio HyperSync
 */

const { HypersyncClient } = require('hypersync-client');

async function streamSepoliaEvents() {
  console.log('🚀 Starting HyperSync Sepolia Testnet indexer...');
  
  // Initialize HyperSync client for Sepolia Testnet
  const client = HypersyncClient.new({
    url: "https://1rpc.io/sepolia",
  });

  // Define query for bridge events
  const query = {
    fromBlock: 0,
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

  console.log('📡 Streaming Sepolia Testnet bridge events...');
  console.log('🔍 Monitoring address: 0xe564df234366234b279c9a5d547c94AA4a5C08F3');
  console.log('');

  let totalEvents = 0;
  let bridgeCompletions = 0;

  try {
    const stream = await client.stream(query, {});
    
    while (true) {
      const res = await stream.recv();
      
      if (res.data && res.data.logs) {
        totalEvents += res.data.logs.length;
        
        res.data.logs.forEach((log) => {
          const eventSignature = log.topics[0];
          
          if (eventSignature === "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925") {
            bridgeCompletions++;
            console.log(`✅ BridgeCompleted: ${log.transactionHash} (Block: ${log.blockNumber})`);
          }
        });
        
        console.log(`📊 Total events processed: ${totalEvents}`);
        console.log(`   - BridgeCompletions: ${bridgeCompletions}`);
        console.log('');
      }
      
      if (res.nextBlock) {
        query.fromBlock = res.nextBlock;
      }
    }
  } catch (error) {
    console.error('❌ Error streaming Sepolia events:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down HyperSync Sepolia indexer...');
  process.exit(0);
});

// Start the indexer
streamSepoliaEvents().catch(console.error);
