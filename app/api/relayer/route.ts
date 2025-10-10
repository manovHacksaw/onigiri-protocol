import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseEther, formatEther, keccak256, encodePacked } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { u2uSolaris } from "@/lib/config";
import { POCKET_PROTOCOL_SEPOLIA, POCKET_PROTOCOL_ABI, SEPOLIA_POOL, SEPOLIA_POOL_ABI } from "@/lib/contracts";
import U2U_BRIDGE_ABI from "@/artifacts/contracts/U2UBridge.sol/U2UBridge.json";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL!;
const U2U_RPC_URL = process.env.U2U_RPC_URL || "https://rpc-mainnet.u2u.xyz";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "a1f488592e4701289c173203d6d4b1f7583d3be37d08bf39a58f2875d167e5e6";

if (!SEPOLIA_RPC_URL || !PRIVATE_KEY) {
  throw new Error("Missing .env configuration for relayer");
}

// Price fetching function with fallbacks
async function fetchTokenPrices() {
  try {
    // Try to fetch U2U price from CoinGecko or similar API
    const u2uResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=u2u&vs_currencies=usd');
    const u2uData = await u2uResponse.json();
    const u2uPrice = u2uData.u2u?.usd || 0.006144; // Fallback price

    // Try to fetch ETH price
    const ethResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const ethData = await ethResponse.json();
    const ethPrice = ethData.ethereum?.usd || 4327.95; // Fallback price

    return { u2uPrice, ethPrice };
  } catch (error) {
    console.warn('Failed to fetch prices, using fallbacks:', error);
    return { u2uPrice: 0.006144, ethPrice: 4327.95 };
  }
}

// Check liquidity on both chains
async function checkLiquidity(account: any, u2uAmount: bigint, ethAmount: bigint) {
  try {
    // Check U2U balance
    const u2uClient = createPublicClient({
      chain: u2uSolaris,
      transport: http(U2U_RPC_URL),
    });
    const u2uBalance = await u2uClient.getBalance({ address: account.address });
    
    // Check Sepolia ETH balance
    const sepoliaClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC_URL),
    });
    const ethBalance = await sepoliaClient.getBalance({ address: account.address });

    const insufficientU2U = u2uBalance < u2uAmount;
    const insufficientETH = ethBalance < ethAmount;

    return {
      insufficientU2U,
      insufficientETH,
      u2uBalance: u2uBalance.toString(),
      ethBalance: ethBalance.toString(),
    };
  } catch (error) {
    console.error('Error checking liquidity:', error);
    return {
      insufficientU2U: true,
      insufficientETH: true,
      u2uBalance: '0',
      ethBalance: '0',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { recipient, amount, transferId, action, u2uTxHash, sepoliaTxHash } = await request.json();
    console.log('Relayer API called with:', { recipient, amount, action, u2uTxHash, sepoliaTxHash, transferId });

    if (!recipient || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing recipient or amount" },
        { status: 400 }
      );
    }

    // Create relayer account & wallet clients
    const privateKey = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    
    // U2U wallet client
    const u2uWalletClient = createWalletClient({
      account,
      chain: u2uSolaris,
      transport: http(U2U_RPC_URL),
    });

    // Sepolia wallet client
    const sepoliaWalletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(SEPOLIA_RPC_URL),
    });

    // Create public clients for waiting for receipts
    const u2uPublicClient = createPublicClient({
      chain: u2uSolaris,
      transport: http(U2U_RPC_URL),
    });

    const sepoliaPublicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC_URL),
    });

    // Handle U2U bridge transaction
    if (action === 'bridge' && u2uTxHash) {
      console.log(`Processing U2U bridge: ${amount} U2U for ${recipient}, U2U tx: ${u2uTxHash}`);
      
      // Validate U2U transaction first
      try {
        const u2uReceipt = await u2uPublicClient.getTransactionReceipt({ hash: u2uTxHash as `0x${string}` });
        if (!u2uReceipt || u2uReceipt.status !== 'success') {
          return NextResponse.json(
            { success: false, error: "U2U transaction not confirmed or failed" },
            { status: 400 }
          );
        }
        console.log(`U2U transaction confirmed: ${u2uTxHash}`);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: "Failed to validate U2U transaction" },
          { status: 400 }
        );
      }

      // Fetch current prices
      const { u2uPrice, ethPrice } = await fetchTokenPrices();
      console.log(`Current prices - U2U: $${u2uPrice}, ETH: $${ethPrice}`);

      // Calculate equivalent ETH amount based on current market value
      const u2uAmountUSD = parseFloat(amount) * u2uPrice;
      const equivalentEthAmount = u2uAmountUSD / ethPrice;
      
      // Ensure the amount is in proper decimal format (not scientific notation)
      const ethAmountString = equivalentEthAmount.toFixed(18); // Use 18 decimals for precision
      const ethAmountWei = parseEther(ethAmountString);

      console.log(`Converting ${amount} U2U ($${u2uAmountUSD.toFixed(2)}) to ${ethAmountString} ETH`);

      // Check liquidity before proceeding
      // Note: amount is in U2U units, so we need to convert it to wei for U2U
      const u2uAmountWei = parseEther(amount); // This is correct for U2U amount
      const liquidityCheck = await checkLiquidity(account, u2uAmountWei, ethAmountWei);
      
      if (liquidityCheck.insufficientU2U) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Bridge temporarily unavailable: insufficient liquidity on U2U.",
            details: {
              required: amount,
              available: liquidityCheck.u2uBalance,
              chain: "U2U"
            }
          },
          { status: 503 }
        );
      }

      if (liquidityCheck.insufficientETH) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Bridge temporarily unavailable: insufficient liquidity on Sepolia.",
            details: {
              required: equivalentEthAmount.toString(),
              available: liquidityCheck.ethBalance,
              chain: "Sepolia"
            }
          },
          { status: 503 }
        );
      }

      // Send equivalent ETH to recipient on Sepolia
      const txHash = await sepoliaWalletClient.sendTransaction({
        to: recipient as `0x${string}`,
        value: ethAmountWei,
      });

      const receipt = await sepoliaPublicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
      
      console.log(`Bridge completed: ${equivalentEthAmount} ETH sent to ${recipient} on Sepolia`);

      return NextResponse.json({
        success: true,
        txHash,
        receipt: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status,
        },
        u2uTxHash,
        u2uAmount: amount,
        ethAmount: equivalentEthAmount.toString(),
        u2uPrice,
        ethPrice,
        message: `Bridge successful: ${amount} U2U → ${ethAmountString} ETH`,
      });
    }

    // Legacy actions for backward compatibility
    if (action === 'stake' && transferId) {
      // Handle staking: Release ETH from pool and mint equivalent Sepolia ETH
      console.log(`Processing stake: ${amount} ETH for ${recipient}, transferId: ${transferId}`);
      
      // First, release ETH from the Sepolia pool
      const txHash = await sepoliaWalletClient.writeContract({
        address: SEPOLIA_POOL as `0x${string}`,
        abi: SEPOLIA_POOL_ABI,
        functionName: 'release',
        args: [
          transferId as `0x${string}`,
          recipient as `0x${string}`,
          parseEther(amount.toString())
        ],
      });

      const receipt = await sepoliaPublicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
      
      console.log(`ETH released from pool: ${txHash}`);

      // Send additional Sepolia ETH to the recipient (simulating minting)
      const mintTxHash = await sepoliaWalletClient.sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther(amount.toString()),
      });

      const mintReceipt = await sepoliaPublicClient.waitForTransactionReceipt({ hash: mintTxHash as `0x${string}` });
      
      console.log(`Sepolia ETH minted: ${mintTxHash}`);

      return NextResponse.json({
        success: true,
        txHash,
        mintTxHash,
        receipt: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status,
        },
        mintReceipt: {
          transactionHash: mintReceipt.transactionHash,
          blockNumber: mintReceipt.blockNumber.toString(),
          gasUsed: mintReceipt.gasUsed.toString(),
          status: mintReceipt.status,
        },
        message: `Stake processed: ${amount} ETH released and minted for ${recipient}`,
      });
    } else if (action === 'swap') {
      // Handle swap: Convert U2U to ETH and send to recipient
      console.log(`✅ Processing swap: ${amount} U2U for ${recipient}, transferId: ${transferId}`);
      
      // Ensure recipient is not the relayer's own address
      if (recipient.toLowerCase() === account.address.toLowerCase()) {
        return NextResponse.json(
          { success: false, error: "Cannot send to relayer's own address" },
          { status: 400 }
        );
      }
      
      // Fetch current prices and convert U2U to ETH
      const { u2uPrice, ethPrice } = await fetchTokenPrices();
      console.log(`Current prices - U2U: $${u2uPrice}, ETH: $${ethPrice}`);
      
      const u2uAmountUSD = parseFloat(amount) * u2uPrice;
      const equivalentEthAmount = u2uAmountUSD / ethPrice;
      
      // Ensure the amount is in proper decimal format (not scientific notation)
      const ethAmountString = equivalentEthAmount.toFixed(18); // Use 18 decimals for precision
      const ethAmountWei = parseEther(ethAmountString);
      
      console.log(`Converting ${amount} U2U ($${u2uAmountUSD.toFixed(2)}) to ${ethAmountString} ETH`);
      
      // Check liquidity before proceeding
      const liquidityCheck = await checkLiquidity(account, parseEther(amount), ethAmountWei);
      
      if (liquidityCheck.insufficientETH) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Swap temporarily unavailable: insufficient liquidity on Sepolia.",
            details: {
              required: equivalentEthAmount.toString(),
              available: liquidityCheck.ethBalance,
              chain: "Sepolia"
            }
          },
          { status: 503 }
        );
      }
      
      // Send equivalent ETH to the recipient
      const txHash = await sepoliaWalletClient.sendTransaction({
        to: recipient as `0x${string}`,
        value: ethAmountWei,
      });

      const receipt = await sepoliaPublicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
      
      console.log(`Sepolia ETH minted for swap: ${txHash}`);

      return NextResponse.json({
        success: true,
        txHash,
        receipt: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status,
        },
        message: `Swap processed: ${ethAmountString} ETH minted for ${recipient} (from ${amount} U2U)`,
      });
    } else if (action === 'swap-eth-to-u2u') {
      // Handle reverse swap: Convert ETH to U2U and send to recipient
      console.log(`✅ Processing reverse swap: ${amount} ETH for ${recipient}, transferId: ${transferId}`);
      
      // Ensure recipient is not the relayer's own address
      if (recipient.toLowerCase() === account.address.toLowerCase()) {
        return NextResponse.json(
          { success: false, error: "Cannot send to relayer's own address" },
          { status: 400 }
        );
      }
      
      // Fetch current prices and convert ETH to U2U
      const { u2uPrice, ethPrice } = await fetchTokenPrices();
      console.log(`Current prices - U2U: $${u2uPrice}, ETH: $${ethPrice}`);
      
      const ethAmountUSD = parseFloat(amount) * ethPrice;
      const equivalentU2UAmount = ethAmountUSD / u2uPrice;
      
      // Ensure the amount is in proper decimal format (not scientific notation)
      const u2uAmountString = equivalentU2UAmount.toFixed(18); // Use 18 decimals for precision
      const u2uAmountWei = parseEther(u2uAmountString);
      
      console.log(`Converting ${amount} ETH ($${ethAmountUSD.toFixed(2)}) to ${u2uAmountString} U2U`);
      
      // Check liquidity before proceeding
      const liquidityCheck = await checkLiquidity(account, u2uAmountWei, parseEther(amount));
      
      if (liquidityCheck.insufficientU2U) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Swap temporarily unavailable: insufficient liquidity on U2U.",
            details: {
              required: equivalentU2UAmount.toString(),
              available: liquidityCheck.u2uBalance,
              chain: "U2U"
            }
          },
          { status: 503 }
        );
      }
      
      // Send equivalent U2U to the recipient
      const txHash = await u2uWalletClient.sendTransaction({
        to: recipient as `0x${string}`,
        value: u2uAmountWei,
      });

      const receipt = await u2uPublicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
      
      console.log(`U2U sent for reverse swap: ${txHash}`);

      return NextResponse.json({
        success: true,
        txHash,
        receipt: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status,
        },
        message: `Reverse swap processed: ${u2uAmountString} U2U sent to ${recipient} (from ${amount} ETH)`,
      });
    } else if (action === 'bridge-eth-to-weth') {
      // Handle bridge: ETH (Sepolia) → WETH (U2U)
      console.log(`✅ Processing bridge: ${amount} ETH to WETH for ${recipient}, transferId: ${transferId}`);
      
      // Note: Allow relayer to bridge for itself (valid use case)
      
      // Validate Sepolia transaction if provided
      if (sepoliaTxHash) {
        try {
          const sepoliaReceipt = await sepoliaPublicClient.getTransactionReceipt({ hash: sepoliaTxHash as `0x${string}` });
          if (!sepoliaReceipt || sepoliaReceipt.status !== 'success') {
            return NextResponse.json(
              { success: false, error: "Sepolia transaction not confirmed or failed" },
              { status: 400 }
            );
          }
          console.log(`✅ Sepolia transaction confirmed: ${sepoliaTxHash}`);
        } catch (error) {
          return NextResponse.json(
            { success: false, error: "Failed to validate Sepolia transaction" },
            { status: 400 }
          );
        }
      }
      
      // Generate a transferId if not provided
      const finalTransferId = transferId || `0x${Buffer.from(`${recipient}-${amount}-${Date.now()}`).toString('hex').padStart(64, '0')}`;
      
      // Ensure transferId is exactly 32 bytes (64 hex characters + 0x prefix)
      const cleanTransferId = finalTransferId.startsWith('0x') ? finalTransferId.slice(2) : finalTransferId;
      const paddedTransferId = `0x${cleanTransferId.padStart(64, '0').slice(0, 64)}`;
      
      console.log(`Using transferId: ${paddedTransferId}`);
      
      // For ETH → WETH bridge, we mint WETH on U2U
      // The amount is already in ETH, so we mint the same amount as WETH
      const wethAmount = parseEther(amount);
      
      console.log(`Minting ${amount} WETH for ${recipient}`);
      
      // Check if we have enough U2U for gas fees
      const u2uBalance = await u2uPublicClient.getBalance({ address: account.address });
      const minU2UForGas = parseEther("0.01"); // Minimum U2U for gas
      
      if (u2uBalance < minU2UForGas) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Bridge temporarily unavailable: insufficient U2U for gas fees.",
            details: {
              required: formatEther(minU2UForGas),
              available: formatEther(u2uBalance),
              chain: "U2U"
            }
          },
          { status: 503 }
        );
      }
      
      // Call the U2U bridge contract to mint WETH
      const bridgeAddress = "0x20c452438968C942729D70035fF2dD86481F6EaB"; // Deployed U2U Bridge address
      
      try {
        const txHash = await u2uWalletClient.writeContract({
          address: bridgeAddress as `0x${string}`,
          abi: U2U_BRIDGE_ABI.abi,
          functionName: "mintWETH",
          args: [recipient as `0x${string}`, wethAmount, paddedTransferId as `0x${string}`],
        });

        const receipt = await u2uPublicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
        
        console.log(`WETH minted for bridge: ${txHash}`);

        return NextResponse.json({
          success: true,
          txHash,
          receipt: {
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber.toString(),
            gasUsed: receipt.gasUsed.toString(),
            status: receipt.status,
          },
          message: `Bridge processed: ${amount} WETH minted for ${recipient} (from ${amount} ETH)`,
        });
      } catch (error) {
        console.error("Bridge minting failed:", error);
        return NextResponse.json(
          { 
            success: false, 
            error: `Bridge minting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: {
              bridgeAddress,
              recipient,
              amount,
              transferId
            }
          },
          { status: 500 }
        );
      }
    } else {
      // Default behavior: send ETH directly to recipient
      console.log(`❌ Using default behavior - action: ${action}, transferId: ${transferId}`);
      const txHash = await sepoliaWalletClient.sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther(amount.toString()),
      });

      const receipt = await sepoliaPublicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

      return NextResponse.json({
        success: true,
        txHash,
        receipt: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status,
        },
        message: `ETH released successfully to ${recipient}`,
      });
    }
  } catch (error) {
    console.error("Relayer API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for relayer status on both chains
export async function GET() {
  try {
    console.log('Relayer GET endpoint called');
    console.log('Environment check:', { 
      hasSepoliaRpc: !!SEPOLIA_RPC_URL, 
      hasU2URpc: !!U2U_RPC_URL, 
      hasPrivateKey: !!PRIVATE_KEY 
    });
    
    const privateKey = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log('Relayer account:', account.address);

    // Check U2U balance
    const u2uClient = createPublicClient({
      chain: u2uSolaris,
      transport: http(U2U_RPC_URL),
    });
    const u2uBalance = await u2uClient.getBalance({ address: account.address });

    // Check Sepolia balance
    const sepoliaClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC_URL),
    });
    const sepoliaBalance = await sepoliaClient.getBalance({ address: account.address });

    // Fetch current prices
    const { u2uPrice, ethPrice } = await fetchTokenPrices();

    return NextResponse.json({
      success: true,
      relayerAddress: account.address,
      chains: {
        u2u: {
          chainId: u2uSolaris.id,
          name: u2uSolaris.name,
          balance: parseFloat(u2uBalance.toString()) / 1e18,
          balanceUSD: (parseFloat(u2uBalance.toString()) / 1e18) * u2uPrice,
          symbol: u2uSolaris.nativeCurrency.symbol,
        },
        sepolia: {
          chainId: sepolia.id,
          name: sepolia.name,
          balance: parseFloat(sepoliaBalance.toString()) / 1e18,
          balanceUSD: (parseFloat(sepoliaBalance.toString()) / 1e18) * ethPrice,
          symbol: sepolia.nativeCurrency.symbol,
        },
      },
      prices: {
        u2u: u2uPrice,
        eth: ethPrice,
      },
      status: "operational",
    });
  } catch (error) {
    console.error("Relayer status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
