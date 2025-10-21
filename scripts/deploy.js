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

  // Deploy WETH Contract on Monad Testnet
  console.log("\n=== Deploying WETH Contract ===");
  const WETH = await ethers.getContractFactory("WETH");
  const weth = await WETH.deploy();
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("WETH deployed to:", wethAddress);

  // Deploy Monad Bridge on Monad Testnet
  console.log("\n=== Deploying Monad Bridge ===");
  const MonadBridge = await ethers.getContractFactory("U2UBridge");
  const monadBridge = await MonadBridge.deploy(wethAddress, relayerAddress);
  await monadBridge.waitForDeployment();
  const monadBridgeAddress = await monadBridge.getAddress();
  console.log("Monad Bridge deployed to:", monadBridgeAddress);

  // Set bridge in WETH contract
  console.log("\n=== Setting Bridge in WETH Contract ===");
  const setBridgeTx = await weth.setBridge(monadBridgeAddress);
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
      monad: {
        chainId: 10143,
        name: "Monad Testnet",
        bridgeAddress: monadBridgeAddress,
        wethAddress: wethAddress,
        rpcUrl: "https://testnet-rpc.monad.xyz",
        blockExplorer: "https://testnet.monadexplorer.com"
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
  console.log(`npx hardhat verify --network monad ${wethAddress}`);
  console.log(`npx hardhat verify --network monad ${monadBridgeAddress} "${wethAddress}" "${relayerAddress}"`);
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
