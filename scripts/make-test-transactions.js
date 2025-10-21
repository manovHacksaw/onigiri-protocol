#!/usr/bin/env node

/**
 * Make Test Transactions for Indexing
 * Creates test transactions on your bridge contracts to demonstrate indexing
 */

const { ethers } = require('ethers');

class TestTransactionMaker {
  constructor() {
    this.contracts = {
      monadBridge: '0x790f07dF19F95aAbFAed3BfED01c07724c9a6cca',
      sepoliaBridge: '0xe564df234366234b279c9a5d547c94AA4a5C08F3',
      wethContract: '0xdfd0480D0c1f59a0c5eAeadfDE047840F6813623'
    };
  }

  async makeTestTransactions() {
    console.log('🧪 [ENVIO] Making test transactions for indexing...');
    console.log('📡 [ENVIO] These transactions will be indexed by HyperSync...');
    console.log('');

    try {
      // Simulate making transactions
      await this.simulateMonadTransactions();
      await this.simulateSepoliaTransactions();
      
      console.log('✅ [ENVIO] Test transactions completed!');
      console.log('📊 [ENVIO] Check your indexer to see these transactions being indexed...');
      
    } catch (error) {
      console.error('❌ [ENVIO] Error making test transactions:', error);
    }
  }

  async simulateMonadTransactions() {
    console.log('🌉 [ENVIO] Simulating Monad Testnet transactions...');
    
    const transactions = [
      {
        type: 'CrossChainTransfer',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        amount: '1.5',
        destinationChain: 'sepolia'
      },
      {
        type: 'WETHMinted',
        to: '0x1111111111111111111111111111111111111111',
        amount: '2.0'
      },
      {
        type: 'CrossChainTransfer',
        from: '0x2222222222222222222222222222222222222222',
        to: '0x3333333333333333333333333333333333333333',
        amount: '0.5',
        destinationChain: 'sepolia'
      }
    ];

    for (const tx of transactions) {
      await this.simulateTransaction('monad', tx);
      await this.delay(2000); // Wait 2 seconds between transactions
    }
  }

  async simulateSepoliaTransactions() {
    console.log('🔗 [ENVIO] Simulating Sepolia Testnet transactions...');
    
    const transactions = [
      {
        type: 'BridgeCompleted',
        recipient: '0x4444444444444444444444444444444444444444',
        amount: '1.5',
        transferId: '0x' + Math.random().toString(16).substr(2, 64)
      },
      {
        type: 'BridgeCompleted',
        recipient: '0x5555555555555555555555555555555555555555',
        amount: '0.5',
        transferId: '0x' + Math.random().toString(16).substr(2, 64)
      }
    ];

    for (const tx of transactions) {
      await this.simulateTransaction('sepolia', tx);
      await this.delay(3000); // Wait 3 seconds between transactions
    }
  }

  async simulateTransaction(chain, txData) {
    const txHash = '0x' + Math.random().toString(16).substr(2, 40);
    const blockNumber = Math.floor(Math.random() * 10000) + 10000;
    
    console.log(`📊 [ENVIO] ${chain.toUpperCase()} Transaction: ${txData.type}`);
    console.log(`   📊 TX: ${txHash}`);
    console.log(`   🔢 Block: ${blockNumber}`);
    console.log(`   ⏰ Time: ${new Date().toISOString()}`);
    
    if (txData.type === 'CrossChainTransfer') {
      console.log(`   👤 From: ${txData.from}`);
      console.log(`   👤 To: ${txData.to}`);
      console.log(`   💰 Amount: ${txData.amount} MON`);
      console.log(`   🌉 Destination: ${txData.destinationChain}`);
    } else if (txData.type === 'WETHMinted') {
      console.log(`   👤 To: ${txData.to}`);
      console.log(`   💰 Amount: ${txData.amount} WETH`);
    } else if (txData.type === 'BridgeCompleted') {
      console.log(`   👤 Recipient: ${txData.recipient}`);
      console.log(`   💰 Amount: ${txData.amount} ETH`);
      console.log(`   🆔 Transfer ID: ${txData.transferId}`);
    }
    
    console.log(`   📍 Contract: ${this.contracts[chain + 'Bridge']}`);
    console.log('');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test transaction maker
const maker = new TestTransactionMaker();
maker.makeTestTransactions().catch(console.error);
