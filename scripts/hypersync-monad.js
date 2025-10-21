#!/usr/bin/env node

/**
 * HyperSync Monad Testnet Indexer
 * Streams bridge events from Monad Testnet using Envio HyperSync
 */

const { HypersyncClient } = require('hypersync-client');

async function streamMonadEvents() {
  console.log('🚀 Starting HyperSync Monad Testnet indexer...');
  
  // Initialize HyperSync client for Monad Testnet
  const client = HypersyncClient.new({
    url: "https://testnet-rpc.monad.xyz",
  });

  // Define query for bridge events
  const query = {
    fromBlock: 0,
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

  console.log('📡 Streaming Monad Testnet bridge events...');
  console.log('🔍 Monitoring addresses:');
  console.log('  - Bridge: 0x790f07dF19F95aAbFAed3BfED01c07724c9a6cca');
  console.log('  - WETH: 0xdfd0480D0c1f59a0c5eAeadfDE047840F6813623');
  console.log('');

  let totalEvents = 0;
  let crossChainTransfers = 0;
  let wethMints = 0;
  let transfers = 0;

  try {
    const stream = await client.stream(query, {});
    
    while (true) {
      const res = await stream.recv();
      
      if (res.data && res.data.logs) {
        totalEvents += res.data.logs.length;
        
        res.data.logs.forEach((log) => {
          const eventSignature = log.topics[0];
          
          if (eventSignature === "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925") {
            crossChainTransfers++;
            console.log(`🌉 CrossChainTransfer: ${log.transactionHash} (Block: ${log.blockNumber})`);
          } else if (eventSignature === "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0") {
            wethMints++;
            console.log(`🪙 WETHMinted: ${log.transactionHash} (Block: ${log.blockNumber})`);
          } else if (eventSignature === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
            transfers++;
            console.log(`💸 Transfer: ${log.transactionHash} (Block: ${log.blockNumber})`);
          }
        });
        
        console.log(`📊 Total events processed: ${totalEvents}`);
        console.log(`   - CrossChainTransfers: ${crossChainTransfers}`);
        console.log(`   - WETHMints: ${wethMints}`);
        console.log(`   - Transfers: ${transfers}`);
        console.log('');
      }
      
      if (res.nextBlock) {
        query.fromBlock = res.nextBlock;
      }
    }
  } catch (error) {
    console.error('❌ Error streaming Monad events:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down HyperSync Monad indexer...');
  process.exit(0);
});

// Start the indexer
streamMonadEvents().catch(console.error);
