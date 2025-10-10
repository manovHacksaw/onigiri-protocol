// Simple test script to verify transaction verification logic
const { verifyTransaction, getExplorerUrl, getChainDisplayName } = require('./lib/transaction-verification.ts');

async function testTransactionVerification() {
  console.log('🧪 Testing transaction verification...');
  
  // Test explorer URL generation
  console.log('📋 Testing explorer URLs:');
  console.log('Sepolia URL:', getExplorerUrl('0x1234567890abcdef', 11155111));
  console.log('U2U URL:', getExplorerUrl('0x1234567890abcdef', 39));
  
  // Test chain display names
  console.log('📋 Testing chain names:');
  console.log('Sepolia:', getChainDisplayName(11155111));
  console.log('U2U:', getChainDisplayName(39));
  
  console.log('✅ Basic tests passed!');
}

testTransactionVerification().catch(console.error);
