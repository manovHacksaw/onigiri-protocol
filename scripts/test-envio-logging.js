#!/usr/bin/env node

/**
 * Test Envio Terminal Logging
 * Makes API calls to demonstrate terminal logging
 */

const http = require('http');

async function makeAPICall(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: endpoint,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testEnvioLogging() {
  console.log('🧪 [ENVIO] Testing HyperSync Terminal Logging...');
  console.log('📡 [ENVIO] Making API calls to demonstrate logging...');
  console.log('');

  try {
    // Test 1: Basic analytics
    console.log('🔍 [ENVIO] Test 1: Basic Analytics API');
    await makeAPICall('/api/analytics');
    console.log('✅ [ENVIO] Basic analytics logged to terminal');
    console.log('');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Analytics with transactions
    console.log('🔍 [ENVIO] Test 2: Analytics with Transactions');
    await makeAPICall('/api/analytics?includeTransactions=true');
    console.log('✅ [ENVIO] Transaction data logged to terminal');
    console.log('');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Transaction correlation
    console.log('🔍 [ENVIO] Test 3: Transaction Correlation');
    const correlationData = {
      monadTxHash: '0x1234567890abcdef1234567890abcdef12345678',
      sepoliaTxHash: '0xabcdef1234567890abcdef1234567890abcdef12'
    };

    const postData = JSON.stringify(correlationData);
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/analytics',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('✅ [ENVIO] Transaction correlation logged to terminal');
        console.log('');
        console.log('🎉 [ENVIO] All tests completed - check terminal for Envio logs!');
      });
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error('❌ [ENVIO] Error testing logging:', error);
  }
}

// Run the test
testEnvioLogging().catch(console.error);
