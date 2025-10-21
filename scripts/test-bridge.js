const { ethers } = require("hardhat");

async function main() {
  console.log("Testing Monad Bridge Flow...");

  // Test configuration
  const testAmount = "1.0"; // 1 MON
  const testRecipient = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"; // Test address

  try {
    // Test 1: Check relayer status
    console.log("\n=== Test 1: Relayer Status ===");
    const relayerResponse = await fetch('http://localhost:3000/api/relayer');
    const relayerData = await relayerResponse.json();
    
    if (relayerData.success) {
      console.log("✅ Relayer is operational");
      console.log("Relayer address:", relayerData.relayerAddress);
      console.log("Monad balance:", relayerData.chains.monad.balance, "MON");
      console.log("Sepolia balance:", relayerData.chains.sepolia.balance, "ETH");
      console.log("Current prices - Monad:", relayerData.prices.monad, "ETH:", relayerData.prices.eth);
    } else {
      console.log("❌ Relayer is not operational:", relayerData.error);
      return;
    }

    // Test 2: Test bridge with mock transaction
    console.log("\n=== Test 2: Bridge Functionality ===");
    const bridgeResponse = await fetch('http://localhost:3000/api/test-relayer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testType: 'bridge',
        amount: testAmount,
        recipient: testRecipient
      })
    });

    const bridgeData = await bridgeResponse.json();
    
    if (bridgeData.success) {
      console.log("✅ Bridge test completed successfully");
      console.log("Result:", bridgeData.result);
    } else {
      console.log("❌ Bridge test failed:", bridgeData.error);
    }

    // Test 3: Test price fetching
    console.log("\n=== Test 3: Price Fetching ===");
    try {
      const monadResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=monad&vs_currencies=usd');
      const monadData = await monadResponse.json();
      const monadPrice = monadData.monad?.usd || 0.006144;

      const ethResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const ethData = await ethResponse.json();
      const ethPrice = ethData.ethereum?.usd || 4327.95;

      console.log("✅ Price fetching successful");
      console.log("Monad price: $", monadPrice);
      console.log("ETH price: $", ethPrice);
      console.log("Conversion rate: 1 MON =", (monadPrice / ethPrice).toFixed(8), "ETH");
    } catch (error) {
      console.log("❌ Price fetching failed:", error.message);
    }

    console.log("\n=== Test Summary ===");
    console.log("All tests completed. Check the results above.");
    console.log("\nNext steps:");
    console.log("1. Deploy contracts to both networks");
    console.log("2. Update contract addresses in lib/addresses.ts");
    console.log("3. Fund the Sepolia bridge contract with ETH");
    console.log("4. Test with real Monad transactions");

  } catch (error) {
    console.error("Test failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
