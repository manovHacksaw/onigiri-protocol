const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Get the relayer address from environment or use deployer
  const relayerAddress = process.env.RELAYER_ADDRESS || deployer.address;
  console.log("Using relayer address:", relayerAddress);

  // Deploy WETH Contract on U2U Solaris Mainnet
  console.log("\n=== Deploying WETH Contract ===");
  const WETH = await ethers.getContractFactory("WETH");
  const weth = await WETH.deploy();
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("WETH deployed to:", wethAddress);

  // Deploy U2U Bridge on U2U Solaris Mainnet
  console.log("\n=== Deploying U2U Bridge ===");
  const U2UBridge = await ethers.getContractFactory("U2UBridge");
  const u2uBridge = await U2UBridge.deploy(wethAddress, relayerAddress);
  await u2uBridge.waitForDeployment();
  const u2uBridgeAddress = await u2uBridge.getAddress();
  console.log("U2U Bridge deployed to:", u2uBridgeAddress);

  // Set bridge in WETH contract
  console.log("\n=== Setting Bridge in WETH Contract ===");
  const setBridgeTx = await weth.setBridge(u2uBridgeAddress);
  await setBridgeTx.wait();
  console.log("Bridge set in WETH contract");

  // Deploy Sepolia Bridge on Sepolia Testnet
  console.log("\n=== Deploying Sepolia Bridge ===");
  const SepoliaBridge = await ethers.getContractFactory("SepoliaBridge");
  const sepoliaBridge = await SepoliaBridge.deploy(relayerAddress);
  await sepoliaBridge.waitForDeployment();
  const sepoliaBridgeAddress = await sepoliaBridge.getAddress();
  console.log("Sepolia Bridge deployed to:", sepoliaBridgeAddress);

  // Save deployment info
  const deploymentInfo = {
    networks: {
      u2u: {
        chainId: 39,
        name: "U2U Solaris Mainnet",
        bridgeAddress: u2uBridgeAddress,
        wethAddress: wethAddress,
        rpcUrl: "https://rpc-mainnet.u2u.xyz",
        blockExplorer: "https://u2uscan.xyz"
      },
      sepolia: {
        chainId: 11155111,
        name: "Sepolia Testnet",
        bridgeAddress: sepoliaBridgeAddress,
        rpcUrl: "https://1rpc.io/sepolia",
        blockExplorer: "https://sepolia.etherscan.io"
      }
    },
    relayer: relayerAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verify contracts (if on supported networks)
  console.log("\n=== Verification Instructions ===");
  console.log("To verify contracts, run:");
  console.log(`npx hardhat verify --network u2u ${wethAddress}`);
  console.log(`npx hardhat verify --network u2u ${u2uBridgeAddress} "${wethAddress}" "${relayerAddress}"`);
  console.log(`npx hardhat verify --network sepolia ${sepoliaBridgeAddress} "${relayerAddress}"`);

  console.log("\n=== Next Steps ===");
  console.log("1. Update the contract addresses in lib/addresses.ts");
  console.log("2. Fund the Sepolia bridge contract with ETH for liquidity");
  console.log("3. Test the bridge functionality");
  console.log("4. Update the relayer with the new contract addresses");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
